import { z } from 'zod';

export const SupportRequestSchema = z.object({
  firstName: z.string().min(1, 'Имя обязательно'),
  lastName: z.string().min(1, 'Фамилия обязательна'),
  companyId: z.string().uuid('Некорректный ID компании').optional(),
  subject: z.string().min(1, 'Тема обязательна'),
  message: z.string().min(10, 'Сообщение должно содержать минимум 10 символов'),
});

export const AddCommentSchema = z.object({
  ticketId: z.string().uuid('Некорректный ID тикета'),
  message: z.string().min(1, 'Сообщение обязательно')
});

export const CloseTicketSchema = z.object({
  ticketId: z.string().uuid('Некорректный ID тикета')
});

export const MarkViewedSchema = z.object({
  ticketId: z.string().uuid('Некорректный ID тикета')
});

export type SupportRequestDto = z.infer<typeof SupportRequestSchema>;
export type AddCommentDto = z.infer<typeof AddCommentSchema>;
export type CloseTicketDto = z.infer<typeof CloseTicketSchema>;
export type MarkViewedDto = z.infer<typeof MarkViewedSchema>;

export function sanitizeSupportRequestDto(dto: SupportRequestDto): SupportRequestDto {
  return {
    ...dto,
    firstName: dto.firstName.trim(),
    lastName: dto.lastName.trim(),
    companyId: dto.companyId?.trim(),
    subject: dto.subject.trim(),
    message: dto.message.trim(),
  };
}

export function sanitizeAddCommentDto(dto: AddCommentDto): AddCommentDto {
  return {
    ...dto,
    ticketId: dto.ticketId.trim(),
    message: dto.message.trim(),
  };
}

export function sanitizeCloseTicketDto(dto: CloseTicketDto): CloseTicketDto {
  return {
    ...dto,
    ticketId: dto.ticketId.trim(),
  };
}

export function sanitizeMarkViewedDto(dto: MarkViewedDto): MarkViewedDto {
  return {
    ...dto,
    ticketId: dto.ticketId.trim(),
  };
}
