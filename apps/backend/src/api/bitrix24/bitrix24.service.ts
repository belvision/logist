import { SupportRequestDto } from './bitrix24.schema';
import { createSupportTicket } from './bitrix24.repository';

export async function createSupportRequestService(dto: SupportRequestDto) {
  try {
    // TODO: Реализовать логику создания запроса в поддержку
    const result = await createSupportTicket();
    
    if (result.success) {
      return { ok: true as const, status: 200, message: 'Запрос в поддержку отправлен успешно' };
    } else {
      return { ok: false as const, status: 500, error: 'Ошибка при отправке запроса в поддержку' };
    }
  } catch (error: any) {
    console.error('Error in createSupportRequestService:', error);
    return { ok: false as const, status: 500, error: 'Внутренняя ошибка сервера' };
  }
}
