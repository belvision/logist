import { z } from 'zod';

// Schema for creating a review
export const createReviewSchema = z.object({
  id_reviewed_company: z.string().uuid('ID компании должно быть валидным UUID'),
  rating: z.number().int().min(1, 'Рейтинг должен быть от 1 до 5').max(5, 'Рейтинг должен быть от 1 до 5'),
  review_text: z.string().max(2000, 'Отзыв не должен превышать 2000 символов').optional(),
  related_cargo_id: z.number().int().positive().optional(),
  related_route_id: z.number().int().positive().optional(),
});

// Schema for updating a review
export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  review_text: z.string().max(2000).optional(),
}).refine(data => data.rating !== undefined || data.review_text !== undefined, {
  message: 'Необходимо указать хотя бы одно поле для обновления',
});

// Schema for moderating a review
export const moderateReviewSchema = z.object({
  status: z.enum(['Одобрен', 'Отклонен', 'Скрыт']),
  moderation_comment: z.string().max(500).optional(),
});

// Schema for marking review as helpful
export const markHelpfulSchema = z.object({
  id_review: z.string().uuid(),
});

// Schema for getting reviews with filters
export const getReviewsQuerySchema = z.object({
  id_reviewed_company: z.string().uuid().optional(),
  id_reviewer: z.string().uuid().optional(),
  status: z.enum(['Ожидает модерации', 'Одобрен', 'Отклонен', 'Скрыт']).optional(),
  min_rating: z.coerce.number().int().min(1).max(5).optional(),
  max_rating: z.coerce.number().int().min(1).max(5).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sort_by: z.enum(['created_at', 'rating', 'helpful_count']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// Schema for reporting a review
export const reportReviewSchema = z.object({
  id_review: z.string().uuid(),
  reason: z.string().min(10, 'Причина жалобы должна содержать минимум 10 символов').max(500),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type ModerateReviewInput = z.infer<typeof moderateReviewSchema>;
export type GetReviewsQuery = z.infer<typeof getReviewsQuerySchema>;
export type ReportReviewInput = z.infer<typeof reportReviewSchema>;

