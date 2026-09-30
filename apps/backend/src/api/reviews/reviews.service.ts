import { ReviewsRepository } from './reviews.repository';
import { SupportRepository } from '../support/support.repository';
import type { 
  Review, 
  ReviewWithReviewer, 
  CreateReviewInput, 
  UpdateReviewInput,
  ModerateReviewInput,
  ReviewFilters,
  PaginationParams,
  CompanyRatingStats
} from './reviews.types';

export class ReviewsService {
  private reviewsRepository = new ReviewsRepository();
  private supportRepository = new SupportRepository();

  // Создать отзыв
  async createReview(
    userId: string,
    userCompanyId: string | null,
    data: CreateReviewInput
  ): Promise<{ success: boolean; review?: Review; error?: string }> {
    try {
      // Проверить, что пользователь не оставляет отзыв на свою компанию
      if (userCompanyId && userCompanyId === data.id_reviewed_company) {
        return {
          success: false,
          error: 'Вы не можете оставить отзыв на свою компанию',
        };
      }

      // Проверить, не оставлял ли пользователь уже отзыв на эту компанию
      const hasReviewed = await this.reviewsRepository.hasUserReviewedCompany(
        userId,
        data.id_reviewed_company
      );

      if (hasReviewed) {
        return {
          success: false,
          error: 'Вы уже оставляли отзыв на эту компанию',
        };
      }

      const review = await this.reviewsRepository.createReview(userId, userCompanyId, data);

      return {
        success: true,
        review,
      };
    } catch (error) {
      console.error('Error creating review:', error);
      return {
        success: false,
        error: 'Ошибка при создании отзыва',
      };
    }
  }

  // Получить отзыв по ID
  async getReviewById(reviewId: string, includeReviewer: boolean = false): Promise<Review | ReviewWithReviewer | null> {
    try {
      if (includeReviewer) {
        return await this.reviewsRepository.getReviewWithReviewer(reviewId);
      }
      return await this.reviewsRepository.getReviewById(reviewId);
    } catch (error) {
      console.error('Error getting review:', error);
      return null;
    }
  }

  // Получить отзывы с фильтрами
  async getReviews(
    filters: ReviewFilters,
    pagination: PaginationParams
  ): Promise<{ reviews: ReviewWithReviewer[]; total: number; pages: number }> {
    try {
      const result = await this.reviewsRepository.getReviews(filters, pagination);
      const limit = pagination.limit || 10;
      const pages = Math.ceil(result.total / limit);

      return {
        reviews: result.reviews,
        total: result.total,
        pages,
      };
    } catch (error) {
      console.error('Error getting reviews:', error);
      return { reviews: [], total: 0, pages: 0 };
    }
  }

  // Получить статистику рейтинга компании
  async getCompanyRatingStats(companyId: string): Promise<CompanyRatingStats | null> {
    try {
      return await this.reviewsRepository.getCompanyRatingStats(companyId);
    } catch (error) {
      console.error('Error getting company rating stats:', error);
      return null;
    }
  }

  // Обновить отзыв
  async updateReview(
    reviewId: string,
    userId: string,
    data: UpdateReviewInput
  ): Promise<{ success: boolean; review?: Review; error?: string }> {
    try {
      const review = await this.reviewsRepository.getReviewById(reviewId);

      if (!review) {
        return {
          success: false,
          error: 'Отзыв не найден',
        };
      }

      // Проверить, что пользователь является автором отзыва
      if (review.id_reviewer !== userId) {
        return {
          success: false,
          error: 'Вы не можете редактировать чужой отзыв',
        };
      }

      // Проверить, что отзыв еще не прошел модерацию
      if (review.status !== 'Ожидает модерации') {
        return {
          success: false,
          error: 'Вы можете редактировать только отзывы ожидающие модерации',
        };
      }

      const updated = await this.reviewsRepository.updateReview(reviewId, data);

      return {
        success: true,
        review: updated || undefined,
      };
    } catch (error) {
      console.error('Error updating review:', error);
      return {
        success: false,
        error: 'Ошибка при обновлении отзыва',
      };
    }
  }

  // Модерировать отзыв
  async moderateReview(
    reviewId: string,
    moderatorId: string,
    data: ModerateReviewInput
  ): Promise<{ success: boolean; review?: Review; error?: string }> {
    try {
      const review = await this.reviewsRepository.getReviewById(reviewId);

      if (!review) {
        return {
          success: false,
          error: 'Отзыв не найден',
        };
      }

      const moderated = await this.reviewsRepository.moderateReview(reviewId, moderatorId, data);

      return {
        success: true,
        review: moderated || undefined,
      };
    } catch (error) {
      console.error('Error moderating review:', error);
      return {
        success: false,
        error: 'Ошибка при модерации отзыва',
      };
    }
  }

  // Отметить отзыв как полезный
  async markReviewAsHelpful(reviewId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const review = await this.reviewsRepository.getReviewById(reviewId);

      if (!review) {
        return {
          success: false,
          error: 'Отзыв не найден',
        };
      }

      // Только одобренные отзывы можно отмечать как полезные
      if (review.status !== 'Одобрен') {
        return {
          success: false,
          error: 'Вы можете отмечать только одобренные отзывы',
        };
      }

      await this.reviewsRepository.incrementHelpfulCount(reviewId);

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error marking review as helpful:', error);
      return {
        success: false,
        error: 'Ошибка при отметке отзыва',
      };
    }
  }

  // Пожаловаться на отзыв
  async reportReview(
    reviewId: string,
    reporterId: string,
    reporterCompanyId: string | null,
    reason: string
  ): Promise<{ success: boolean; ticketId?: string; error?: string }> {
    try {
      const review = await this.reviewsRepository.getReviewWithReviewer(reviewId);

      if (!review) {
        return {
          success: false,
          error: 'Отзыв не найден',
        };
      }

      // Создать тикет поддержки
      const ticket = await this.supportRepository.createTicket({
        id_user: reporterId,
        id_company: reporterCompanyId || undefined,
        subject: `Жалоба на отзыв #${reviewId.substring(0, 8)}`,
        message: `Жалоба на отзыв от пользователя ${review.reviewer.username}.\n\nПричина: ${reason}\n\nОтзыв: ${review.review_text || 'Без текста'}\nРейтинг: ${review.rating}/5`,
        priority: 2, // средний приоритет
      });

      // Связать отзыв с тикетом
      await this.reviewsRepository.linkToSupportTicket(reviewId, ticket.id_ticket);

      return {
        success: true,
        ticketId: ticket.id_ticket,
      };
    } catch (error) {
      console.error('Error reporting review:', error);
      return {
        success: false,
        error: 'Ошибка при создании жалобы',
      };
    }
  }

  // Удалить отзыв (только автор или администратор)
  async deleteReview(
    reviewId: string,
    userId: string,
    isAdmin: boolean = false
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const review = await this.reviewsRepository.getReviewById(reviewId);

      if (!review) {
        return {
          success: false,
          error: 'Отзыв не найден',
        };
      }

      // Проверить права доступа
      if (!isAdmin && review.id_reviewer !== userId) {
        return {
          success: false,
          error: 'Вы не можете удалить чужой отзыв',
        };
      }

      const deleted = await this.reviewsRepository.deleteReview(reviewId);

      return {
        success: deleted,
        error: deleted ? undefined : 'Ошибка при удалении отзыва',
      };
    } catch (error) {
      console.error('Error deleting review:', error);
      return {
        success: false,
        error: 'Ошибка при удалении отзыва',
      };
    }
  }

  // Получить отзывы ожидающие модерации
  async getPendingReviews(limit: number = 50): Promise<ReviewWithReviewer[]> {
    try {
      return await this.reviewsRepository.getPendingReviews(limit);
    } catch (error) {
      console.error('Error getting pending reviews:', error);
      return [];
    }
  }
}

export const reviewsService = new ReviewsService();

