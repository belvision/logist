// apps/backend/src/api/company/company.service.ts
import type { CreateCompanyDto, AddUserToCompanyDto, InviteUserToCompanyDto } from './company.schema';
import {
  createCompany,
  findCompanyByUnp,
  getCompanies,
  getCompaniesByUser,
  getCompaniesType,
  linkUserToCompany,
  findUserByEmail,
  isUserInCompany,
  getCompanyUsers,
  removeUserFromCompany,
  updateUserRoleInCompany,
  createInvitation,
  findInvitationByToken,
  markInvitationAsUsed,
  isInvitationExpired,
} from './company.repository';
import config from '../../db/config';
import { signInviteToken, verifyInviteToken } from '../../core/auth/jwt.service';
import nodemailer from 'nodemailer';

/**
 * Создание компании + привязка текущего пользователя как «Владельца».
 */
export async function addCompany(payload: CreateCompanyDto, userId: string) {
  const existing = await findCompanyByUnp(payload.unp);
  if (existing) {
    return { ok: false as const, status: 409, error: 'Компания с таким УНП уже существует' };
  }

  let created;
  try {
    created = await createCompany(payload);
  } catch (e: any) {
    const pgCode = e?.code ?? e?.original?.code;
    if (pgCode === '23505') {
      return { ok: false as const, status: 409, error: 'Компания с таким УНП уже существует' };
    }
    return { ok: false as const, status: 500, error: 'Не удалось создать компанию' };
  }

  try {
    await linkUserToCompany({
      id_user: userId,
      id_company: created.id_company,
      role: 'Владелец',
    });
  } catch (e: any) {
    const pgCode = e?.code ?? e?.original?.code;
    if (pgCode === '23505') {
      return {
        ok: false as const,
        status: 409,
        error: 'Конфликт ролей: у компании уже есть владелец или такая связь уже существует.',
      };
    }
    return { ok: false as const, status: 500, error: 'Не удалось привязать пользователя к компании.' };
  }
  return { ok: true as const, status: 201, company: created };
}

export async function getCompaniesService(currentUserId?: string) {
  try {
    const companies = currentUserId
      ? await getCompaniesByUser(currentUserId)
      : await getCompanies();
    return { ok: true as const, status: 200, companies };
  } catch {
    return { ok: false as const, status: 500, error: 'Не удалось получить список компаний' };
  }
}

export async function getCompaniesTypeService() {
  try {
    const companies = await getCompaniesType();
    return { ok: true as const, status: 200, companies };
  } catch {
    return { ok: false as const, status: 500, error: 'Не удалось получить типы компаний' };
  }
}

/**
 * Добавить существующего пользователя в компанию.
 */
export async function addUserToCompany(payload: AddUserToCompanyDto, currentUserId: string) {
  const currentUserInCompany = await isUserInCompany(currentUserId, payload.company_id);
  if (!currentUserInCompany) {
    return { ok: false as const, status: 403, error: 'У вас нет прав для добавления пользователей в эту компанию' };
  }

  if (!['Владелец', 'Администратор'].includes(currentUserInCompany.role)) {
    return { ok: false as const, status: 403, error: 'Недостаточно прав для добавления пользователей' };
  }

  const user = await findUserByEmail(payload.email);
  if (!user) {
    return {
      ok: false as const,
      status: 404,
      error: 'Пользователь с таким email не найден. Используйте приглашение по email.',
    };
  }

  const existingMembership = await isUserInCompany(user.id_user, payload.company_id);
  if (existingMembership) {
    return { ok: false as const, status: 409, error: 'Пользователь уже является участником этой компании' };
  }

  try {
    const linked = await linkUserToCompany({
      id_user: user.id_user,
      id_company: payload.company_id,
      role: payload.role,
    });
    return {
      ok: true as const,
      status: 200,
      message: 'Пользователь успешно добавлен в компанию',
      user: {
        id_user: user.id_user,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: linked.role,
      },
    };
  } catch (e: any) {
    const pgCode = e?.code ?? e?.original?.code;
    if (pgCode === '23505') {
      return { ok: false as const, status: 409, error: 'Пользователь уже является участником этой компании' };
    }
    return { ok: false as const, status: 500, error: 'Не удалось добавить пользователя в компанию' };
  }
}

/**
 * Пригласить пользователя в компанию по email:
 * генерируем JWT-приглашение (email + companyId + role), отправляем по SMTP (если настроен),
 * иначе логируем ссылку в консоль.
 */
export async function inviteUserToCompany(payload: InviteUserToCompanyDto, currentUserId: string) {
  const currentUserInCompany = await isUserInCompany(currentUserId, payload.company_id);
  if (!currentUserInCompany) {
    return { ok: false as const, status: 403, error: 'У вас нет прав для приглашения пользователей в эту компанию' };
  }

  if (!['Владелец', 'Администратор'].includes(currentUserInCompany.role)) {
    return { ok: false as const, status: 403, error: 'Недостаточно прав для приглашения пользователей' };
  }

  const existingUser = await findUserByEmail(payload.email);
  if (existingUser) {
    return {
      ok: false as const,
      status: 409,
      error: 'Пользователь с таким email уже зарегистрирован. Используйте добавление пользователя.',
    };
  }

  const invitationToken = signInviteToken({
    email: payload.email,
    companyId: payload.company_id,
    role: payload.role,
  });

  // Сохраняем приглашение в БД
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 дней
  await createInvitation({
    token: invitationToken,
    email: payload.email,
    company_id: payload.company_id,
    role: payload.role,
    invited_by: currentUserId,
    message: payload.message,
    expires_at: expiresAt,
  });

  const frontendBase = config.app.frontendBaseUrl || 'http://localhost:3000';
  const invitationLink = `${frontendBase}/invite/confirm?token=${encodeURIComponent(invitationToken)}`;

  const smtpHost = (process.env.SMTP_HOST || '').trim();
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASSWORD || '').trim();
  const smtpFrom = (process.env.SMTP_FROM || '').trim();

  if (smtpHost && smtpUser && smtpPass && smtpFrom) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE || 'false') === 'true',
        auth: { user: smtpUser, pass: smtpPass },
      });

      await transporter.sendMail({
        from: smtpFrom,
        to: payload.email,
        subject: 'Приглашение в компанию Logistic Pro',
        html: `
          <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; line-height:1.5;">
            <h2>Вас пригласили в компанию</h2>
            <p>Роль: <b>${payload.role}</b></p>
            <p>Сообщение: ${payload.message || 'Без сообщения'}</p>
            <p>
              Перейдите по ссылке, чтобы завершить регистрацию и присоединиться:<br/>
              <a href="${invitationLink}">${invitationLink}</a>
            </p>
            <p>Ссылка действительна 7 дней.</p>
          </div>
        `,
      });
    } catch (err: any) {
      console.error('Ошибка отправки SMTP:', err?.message || err);
      console.log('Ссылка приглашения:', invitationLink);
      return {
        ok: true as const,
        status: 200,
        message: `SMTP ошибка. Ссылка сгенерирована.`,
        invitationToken,
        invitationLink,
        details: { email: payload.email, role: payload.role, companyId: payload.company_id },
      };
    }
  } else {
    console.log('📧 SMTP не настроен. Ссылка приглашения:', invitationLink);
  }

  return {
    ok: true as const,
    status: 200,
    message: `Приглашение отправлено на ${payload.email}. Проверьте почту.`,
    invitationToken,
    invitationLink,
    details: { email: payload.email, role: payload.role, companyId: payload.company_id },
  };
}

/**
 * Принять приглашение и связать пользователя с компанией.
 */
export async function acceptInvitationAndLinkUser(inviteToken: string, newUserId: string) {
  try {
    // Проверяем JWT токен
    const payload = verifyInviteToken(inviteToken) as any;
    const role = (payload.role as string) as 'Владелец' | 'Администратор' | 'Пользователь';
    const companyId = payload.companyId as string;

    // Проверяем приглашение в БД
    const invitation = await findInvitationByToken(inviteToken);
    if (!invitation) {
      return { ok: false as const, status: 400, error: 'Приглашение не найдено' };
    }

    // Проверяем, не использован ли уже токен
    if (invitation.is_used) {
      return { ok: false as const, status: 400, error: 'Приглашение уже было использовано' };
    }

    // Проверяем срок действия
    if (new Date() > invitation.expires_at) {
      return { ok: false as const, status: 400, error: 'Срок действия приглашения истёк' };
    }

    // Привязываем пользователя к компании
    await linkUserToCompany({ id_user: newUserId, id_company: companyId, role });
    
    // Отмечаем приглашение как использованное
    await markInvitationAsUsed(inviteToken, newUserId);
    
    return { ok: true as const, status: 200 };
  } catch {
    return { ok: false as const, status: 400, error: 'Неверная или истёкшая ссылка приглашения' };
  }
}

/**
 * Список пользователей компании.
 */
export async function getCompanyUsersService(companyId: string, currentUserId: string) {
  const currentUserInCompany = await isUserInCompany(currentUserId, companyId);
  if (!currentUserInCompany) {
    return { ok: false as const, status: 403, error: 'У вас нет доступа к этой компании' };
  }

  const users = await getCompanyUsers(companyId);
  return { ok: true as const, status: 200, users };
}

/**
 * Удалить пользователя из компании.
 */
export async function removeUserFromCompanyService(userId: string, companyId: string, currentUserId: string) {
  const currentUserInCompany = await isUserInCompany(currentUserId, companyId);
  if (!currentUserInCompany) {
    return { ok: false as const, status: 403, error: 'У вас нет прав для управления пользователями этой компании' };
  }

  if (userId === currentUserId && currentUserInCompany.role === 'Владелец') {
    return { ok: false as const, status: 400, error: 'Владелец не может удалить сам себя из компании' };
  }

  if (!['Владелец', 'Администратор'].includes(currentUserInCompany.role)) {
    return { ok: false as const, status: 403, error: 'Недостаточно прав для удаления пользователей' };
  }

  const removed = await removeUserFromCompany(userId, companyId);
  if (!removed) {
    return { ok: false as const, status: 404, error: 'Пользователь не найден в этой компании' };
  }

  return { ok: true as const, status: 200, message: 'Пользователь успешно удален из компании' };
}

/**
 * Изменить роль пользователя в компании.
 */
export async function updateUserRoleService(
  userId: string,
  companyId: string,
  newRole: 'Администратор' | 'Пользователь',
  currentUserId: string,
) {
  const currentUserInCompany = await isUserInCompany(currentUserId, companyId);
  if (!currentUserInCompany) {
    return { ok: false as const, status: 403, error: 'У вас нет прав для управления ролями в этой компании' };
  }

  if (currentUserInCompany.role !== 'Владелец') {
    return { ok: false as const, status: 403, error: 'Только владелец может изменять роли пользователей' };
  }

  if (userId === currentUserId) {
    return { ok: false as const, status: 400, error: 'Владелец не может изменить свою роль' };
  }

  const updated = await updateUserRoleInCompany(userId, companyId, newRole);
  if (!updated) {
    return { ok: false as const, status: 404, error: 'Пользователь не найден в этой компании' };
  }

  return {
    ok: true as const,
    status: 200,
    message: 'Роль пользователя успешно обновлена',
    user: {
      id_user: userId,
      role: updated.role,
    },
  };
}
