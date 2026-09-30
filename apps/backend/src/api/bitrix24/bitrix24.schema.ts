import { z } from 'zod';

export const SupportRequestSchema = z.object({
  firstName: z.string().min(1, 'Имя обязательно'),
  lastName: z.string().min(1, 'Фамилия обязательна'),
  companyId: z.string().uuid('Некорректный ID компании'),
  subject: z.string().min(1, 'Тема обязательна'),
  message: z.string().min(10, 'Сообщение должно содержать минимум 10 символов'),
});

export type SupportRequestDto = z.infer<typeof SupportRequestSchema>;

export function sanitizeSupportRequestDto(dto: SupportRequestDto): SupportRequestDto {
  return {
    ...dto,
    firstName: dto.firstName.trim(),
    lastName: dto.lastName.trim(),
    subject: dto.subject.trim(),
    message: dto.message.trim(),
  };
}
