import { z } from 'zod';

// Схема для создания тикета
export const CreateSupportTicketSchema = z.object({
  subject: z.string().min(1, 'Тема обязательна').max(255, 'Тема слишком длинная'),
  message: z.string().min(1, 'Сообщение обязательно').max(5000, 'Сообщение слишком длинное'),
  priority: z.number().int().min(1).max(3).optional().default(1),
  companyId: z.string().uuid().optional().nullable(),
});

// Схема для добавления сообщения в тикет
export const AddMessageSchema = z.object({
  message: z.string().min(1, 'Сообщение обязательно').max(5000, 'Сообщение слишком длинное'),
});

// Схема для обновления статуса тикета
export const UpdateTicketStatusSchema = z.object({
  status: z.enum(['Открыто', 'Закрыто', 'В обработке']),
});

// Схема для фильтрации тикетов
export const GetTicketsSchema = z.object({
  status: z.enum(['Открыто', 'Закрыто', 'В обработке']).optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(10),
});

export type CreateSupportTicketDto = z.infer<typeof CreateSupportTicketSchema>;
export type AddMessageDto = z.infer<typeof AddMessageSchema>;
export type UpdateTicketStatusDto = z.infer<typeof UpdateTicketStatusSchema>;
export type GetTicketsDto = z.infer<typeof GetTicketsSchema>;
