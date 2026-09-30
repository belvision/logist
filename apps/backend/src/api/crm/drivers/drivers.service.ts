// apps/backend/src/api/crm/drivers/drivers.service.ts
import type {
  CreateCrmDriverDto,
} from '../crm.schema';
import {
  createCrmDriver,
  getCrmDrivers,
  getCrmDriverById,
  attachDriverToCompany,
  detachDriverFromCompany,
  getCrmCompanyDrivers,
} from './drivers.repository';
import { getCrmCompanyById } from '../companies/companies.repository';
import { getWorkspaceCompanyId, checkWorkspaceMembership } from '../crm.utils';

// === Водители ===

export async function createCrmDriverService(payload: CreateCrmDriverDto, userId: string) {
  const workspaceRes = await getWorkspaceCompanyId(userId);
  if (!workspaceRes.ok) {
    return workspaceRes;
  }
  const workspace_company_id = workspaceRes.workspace_company_id;

  const isMember = await checkWorkspaceMembership(userId, workspace_company_id);
  if (!isMember) {
    return { ok: false as const, status: 403, error: 'У вас нет доступа к этому workspace' };
  }

  try {
    const created = await createCrmDriver({
      ...payload,
      workspace_company_id,
      created_by: userId,
    });
    return { ok: true as const, status: 201, driver: created };
  } catch (e) {
    console.error('Error creating CRM driver:', e);
    return { ok: false as const, status: 500, error: 'Не удалось создать водителя' };
  }
}

export async function getCrmDriversService(userId: string) {
  const workspaceRes = await getWorkspaceCompanyId(userId);
  if (!workspaceRes.ok) {
    return workspaceRes;
  }
  const workspace_company_id = workspaceRes.workspace_company_id;

  const isMember = await checkWorkspaceMembership(userId, workspace_company_id);
  if (!isMember) {
    return { ok: false as const, status: 403, error: 'У вас нет доступа к этому workspace' };
  }

  const drivers = await getCrmDrivers(workspace_company_id);
  return { ok: true as const, status: 200, drivers };
}

// === Company Drivers ===

export async function attachDriverToCompanyService(id_crm_company: string, id_driver: string, userId: string) {
  const workspaceRes = await getWorkspaceCompanyId(userId);
  if (!workspaceRes.ok) {
    return workspaceRes;
  }
  const workspace_company_id = workspaceRes.workspace_company_id;

  const isMember = await checkWorkspaceMembership(userId, workspace_company_id);
  if (!isMember) {
    return { ok: false as const, status: 403, error: 'У вас нет доступа к этому workspace' };
  }

  const company = await getCrmCompanyById(id_crm_company, workspace_company_id);
  if (!company) {
    return { ok: false as const, status: 404, error: 'Контрагент не найден' };
  }

  const driver = await getCrmDriverById(id_driver, workspace_company_id);
  if (!driver) {
    return { ok: false as const, status: 404, error: 'Водитель не найден' };
  }

  const linked = await attachDriverToCompany({
    workspace_company_id,
    id_crm_company,
    id_driver,
  });
  if (!linked) {
    return { ok: false as const, status: 409, error: 'Водитель уже привязан к этому контрагенту' };
  }

  return { ok: true as const, status: 200, message: 'Водитель успешно привязан к контрагенту' };
}

export async function detachDriverFromCompanyService(id_crm_company: string, id_driver: string, userId: string) {
  const workspaceRes = await getWorkspaceCompanyId(userId);
  if (!workspaceRes.ok) {
    return workspaceRes;
  }
  const workspace_company_id = workspaceRes.workspace_company_id;

  const isMember = await checkWorkspaceMembership(userId, workspace_company_id);
  if (!isMember) {
    return { ok: false as const, status: 403, error: 'У вас нет доступа к этому workspace' };
  }

  const deleted = await detachDriverFromCompany(id_crm_company, id_driver);
  if (!deleted) {
    return { ok: false as const, status: 404, error: 'Связь не найдена' };
  }

  return { ok: true as const, status: 200, message: 'Водитель успешно отвязан от контрагента' };
}

export async function getCrmCompanyDriversService(id_crm_company: string, userId: string) {
  const workspaceRes = await getWorkspaceCompanyId(userId);
  if (!workspaceRes.ok) {
    return workspaceRes;
  }
  const workspace_company_id = workspaceRes.workspace_company_id;

  const isMember = await checkWorkspaceMembership(userId, workspace_company_id);
  if (!isMember) {
    return { ok: false as const, status: 403, error: 'У вас нет доступа к этому workspace' };
  }

  const company = await getCrmCompanyById(id_crm_company, workspace_company_id);
  if (!company) {
    return { ok: false as const, status: 404, error: 'Контрагент не найден' };
  }

  const drivers = await getCrmCompanyDrivers(id_crm_company);
  return { ok: true as const, status: 200, drivers };
}

