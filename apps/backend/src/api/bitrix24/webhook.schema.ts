import { z } from 'zod';

// Схема для данных от Bitrix24 в формате form-urlencoded
// Делаем схему максимально гибкой - принимаем любые поля
export const WebhookSchema = z.object({
  // Массивные ключи для document_id
  'document_id[0]': z.string().optional(),
  'document_id[1]': z.string().optional(),
  'document_id[2]': z.string().optional(), // Здесь ID смарт-процесса
  // Данные авторизации
  'auth[domain]': z.string().optional(),
  'auth[client_endpoint]': z.string().optional(),
  'auth[server_endpoint]': z.string().optional(),
  'auth[member_id]': z.string().optional(), // Токен приложения
  // Дополнительные поля, которые могут прийти
  event: z.string().optional(),
  data: z.any().optional(),
  ts: z.string().optional(),
}).passthrough(); // 👈 Принимаем любые дополнительные поля

export type WebhookDto = z.infer<typeof WebhookSchema>;

// Тип для sanitized данных с дополнительными полями
export type SanitizedWebhookDto = WebhookDto & {
  smartProcessId?: string;
  memberId?: string;
};

export function sanitizeWebhookDto(dto: WebhookDto): SanitizedWebhookDto {
  // Извлекаем ID записи из document_id[2] независимо от ID смарт-процесса
  // Формат: DYNAMIC_XXXX_YYY где XXXX - ID процесса, YYY - ID записи
  const documentId = String(dto['document_id[2]'] || '');
  const smartProcessId = documentId.match(/DYNAMIC_\d+_(.+)$/)?.[1] || '';
  // auth[member_id] - это токен приложения Bitrix24, который может использоваться для дополнительной проверки
  const memberId = String(dto['auth[member_id]'] || '');
  
  return {
    ...dto,
    smartProcessId: smartProcessId.trim(),
    memberId: memberId.trim(), // Сохраняем для логирования и отладки
    // Оставляем оригинальные данные для совместимости
    event: dto.event ? String(dto.event).trim() : undefined,
    data: dto.data,
    ts: dto.ts ? String(dto.ts).trim() : undefined,
  };
}
