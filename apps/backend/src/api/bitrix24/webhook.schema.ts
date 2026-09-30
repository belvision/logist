import { z } from 'zod';

export const WebhookSchema = z.object({
  event: z.string().min(1, 'Событие обязательно'),
  data: z.object({
    FIELDS: z.object({
      ID: z.string().min(1, 'ID смарт-процесса обязателен'),
    }).optional(),
    ITEM: z.object({
      ID: z.string().min(1, 'ID элемента обязателен'),
    }).optional(),
  }).optional(),
  ts: z.string().optional(),
});

export type WebhookDto = z.infer<typeof WebhookSchema>;

export function sanitizeWebhookDto(dto: WebhookDto): WebhookDto {
  return {
    ...dto,
    event: dto.event?.trim(),
    data: dto.data ? {
      ...dto.data,
      FIELDS: dto.data.FIELDS ? {
        ...dto.data.FIELDS,
        ID: dto.data.FIELDS.ID?.trim(),
      } : undefined,
      ITEM: dto.data.ITEM ? {
        ...dto.data.ITEM,
        ID: dto.data.ITEM.ID?.trim(),
      } : undefined,
    } : undefined,
    ts: dto.ts?.trim(),
  };
}
