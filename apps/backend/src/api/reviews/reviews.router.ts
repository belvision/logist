import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import {
  createReviewHandler,
  getReviewByIdHandler,
  getReviewsHandler,
  getCompanyRatingStatsHandler,
  updateReviewHandler,
  moderateReviewHandler,
  markReviewAsHelpfulHandler,
  reportReviewHandler,
  deleteReviewHandler,
  getPendingReviewsHandler,
} from './reviews.controller';

const reviewsRouter = new Hono();

// Публичные маршруты (без авторизации)
reviewsRouter.get('/', getReviewsHandler); // Получить отзывы с фильтрами
reviewsRouter.get('/:id', getReviewByIdHandler); // Получить отзыв по ID
reviewsRouter.get('/company/:companyId/stats', getCompanyRatingStatsHandler); // Получить статистику рейтинга компании

// Защищенные маршруты (требуют авторизации)
reviewsRouter.post('/', authenticate, createReviewHandler); // Создать отзыв
reviewsRouter.put('/:id', authenticate, updateReviewHandler); // Обновить отзыв
reviewsRouter.delete('/:id', authenticate, deleteReviewHandler); // Удалить отзыв

// Действия с отзывами
reviewsRouter.post('/:id/helpful', markReviewAsHelpfulHandler); // Отметить отзыв как полезный (публичное)
reviewsRouter.post('/report', authenticate, reportReviewHandler); // Пожаловаться на отзыв

// Модерация (только для администраторов)
reviewsRouter.get('/moderation/pending', authenticate, getPendingReviewsHandler); // Получить отзывы на модерации
reviewsRouter.post('/:id/moderate', authenticate, moderateReviewHandler); // Модерировать отзыв

export default reviewsRouter;

