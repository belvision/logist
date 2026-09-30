import db from '../../db/client';
import { reviews, users, company, support_tickets } from '../../db/schema/schema';
import { eq, and, desc, asc, sql, gte, lte, or } from 'drizzle-orm';
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

export class ReviewsRepository {
  // Создать отзыв
  async createReview(
    reviewerId: string, 
    reviewerCompanyId: string | null, 
    data: CreateReviewInput
  ): Promise<Review> {
    const [review] = await db
      .insert(reviews)
      .values({
        id_reviewer: reviewerId,
        reviewer_company_id: reviewerCompanyId,
        id_reviewed_company: data.id_reviewed_company,
        rating: data.rating,
        review_text: data.review_text || null,
        related_cargo_id: data.related_cargo_id || null,
        related_route_id: data.related_route_id || null,
        status: 'Ожидает модерации',
      })
      .returning();
    
    return review as Review;
  }

  // Получить отзыв по ID
  async getReviewById(reviewId: string): Promise<Review | null> {
    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id_review, reviewId));
    
    return (review as Review) || null;
  }

  // Получить отзыв с информацией об авторе
  async getReviewWithReviewer(reviewId: string): Promise<ReviewWithReviewer | null> {
    const [review] = await db
      .select({
        review: reviews,
        reviewer: {
          id_user: users.id_user,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
        },
        reviewer_company: {
          id_company: company.id_company,
          name_company: company.name_company,
        },
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.id_reviewer, users.id_user))
      .leftJoin(company, eq(reviews.reviewer_company_id, company.id_company))
      .where(eq(reviews.id_review, reviewId));
    
    if (!review) return null;

    return {
      ...review.review,
      reviewer: review.reviewer,
      reviewer_company: review.reviewer_company,
    } as ReviewWithReviewer;
  }

  // Проверить, оставлял ли пользователь отзыв на компанию
  async hasUserReviewedCompany(reviewerId: string, companyId: string): Promise<boolean> {
    const [existing] = await db
      .select({ id: reviews.id_review })
      .from(reviews)
      .where(
        and(
          eq(reviews.id_reviewer, reviewerId),
          eq(reviews.id_reviewed_company, companyId)
        )
      );
    
    return !!existing;
  }

  // Получить отзывы с фильтрацией и пагинацией
  async getReviews(
    filters: ReviewFilters, 
    pagination: PaginationParams
  ): Promise<{ reviews: ReviewWithReviewer[]; total: number }> {
    const conditions = [];
    
    if (filters.id_reviewed_company) {
      conditions.push(eq(reviews.id_reviewed_company, filters.id_reviewed_company));
    }
    if (filters.id_reviewer) {
      conditions.push(eq(reviews.id_reviewer, filters.id_reviewer));
    }
    if (filters.status) {
      conditions.push(eq(reviews.status, filters.status));
    }
    if (filters.min_rating) {
      conditions.push(gte(reviews.rating, filters.min_rating));
    }
    if (filters.max_rating) {
      conditions.push(lte(reviews.rating, filters.max_rating));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Получить общее количество
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(reviews)
      .where(whereClause);
    
    const total = Number(countResult?.count || 0);

    // Определить сортировку
    const sortColumn = {
      created_at: reviews.created_at,
      rating: reviews.rating,
      helpful_count: reviews.helpful_count,
    }[pagination.sort_by || 'created_at'];

    const sortFn = pagination.sort_order === 'asc' ? asc : desc;

    // Получить отзывы с пагинацией
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const offset = (page - 1) * limit;

    const reviewsList = await db
      .select({
        review: reviews,
        reviewer: {
          id_user: users.id_user,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
        },
        reviewer_company: {
          id_company: company.id_company,
          name_company: company.name_company,
        },
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.id_reviewer, users.id_user))
      .leftJoin(company, eq(reviews.reviewer_company_id, company.id_company))
      .where(whereClause)
      .orderBy(sortFn(sortColumn))
      .limit(limit)
      .offset(offset);

    const formattedReviews = reviewsList.map(r => ({
      ...r.review,
      reviewer: r.reviewer,
      reviewer_company: r.reviewer_company,
    })) as ReviewWithReviewer[];

    return { reviews: formattedReviews, total };
  }

  // Получить статистику рейтинга компании
  async getCompanyRatingStats(companyId: string): Promise<CompanyRatingStats> {
    const [stats] = await db
      .select({
        total_reviews: sql<number>`count(*)`,
        average_rating: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`,
        rating_1: sql<number>`COUNT(CASE WHEN ${reviews.rating} = 1 THEN 1 END)`,
        rating_2: sql<number>`COUNT(CASE WHEN ${reviews.rating} = 2 THEN 1 END)`,
        rating_3: sql<number>`COUNT(CASE WHEN ${reviews.rating} = 3 THEN 1 END)`,
        rating_4: sql<number>`COUNT(CASE WHEN ${reviews.rating} = 4 THEN 1 END)`,
        rating_5: sql<number>`COUNT(CASE WHEN ${reviews.rating} = 5 THEN 1 END)`,
        approved_reviews: sql<number>`COUNT(CASE WHEN ${reviews.status} = 'Одобрен' THEN 1 END)`,
        pending_reviews: sql<number>`COUNT(CASE WHEN ${reviews.status} = 'Ожидает модерации' THEN 1 END)`,
      })
      .from(reviews)
      .where(eq(reviews.id_reviewed_company, companyId));

    return {
      id_company: companyId,
      total_reviews: Number(stats?.total_reviews || 0),
      average_rating: Math.round((Number(stats?.average_rating || 0)) * 10) / 10,
      rating_breakdown: {
        1: Number(stats?.rating_1 || 0),
        2: Number(stats?.rating_2 || 0),
        3: Number(stats?.rating_3 || 0),
        4: Number(stats?.rating_4 || 0),
        5: Number(stats?.rating_5 || 0),
      },
      approved_reviews: Number(stats?.approved_reviews || 0),
      pending_reviews: Number(stats?.pending_reviews || 0),
    };
  }

  // Обновить отзыв
  async updateReview(reviewId: string, data: UpdateReviewInput): Promise<Review | null> {
    const [updated] = await db
      .update(reviews)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(reviews.id_review, reviewId))
      .returning();
    
    return (updated as Review) || null;
  }

  // Модерировать отзыв
  async moderateReview(
    reviewId: string, 
    moderatorId: string, 
    data: ModerateReviewInput
  ): Promise<Review | null> {
    const [moderated] = await db
      .update(reviews)
      .set({
        status: data.status,
        moderated_by: moderatorId,
        moderated_at: new Date(),
        moderation_comment: data.moderation_comment || null,
        updated_at: new Date(),
      })
      .where(eq(reviews.id_review, reviewId))
      .returning();
    
    return (moderated as Review) || null;
  }

  // Увеличить счетчик полезности отзыва
  async incrementHelpfulCount(reviewId: string): Promise<Review | null> {
    const [updated] = await db
      .update(reviews)
      .set({
        helpful_count: sql`${reviews.helpful_count} + 1`,
      })
      .where(eq(reviews.id_review, reviewId))
      .returning();
    
    return (updated as Review) || null;
  }

  // Связать отзыв с тикетом поддержки
  async linkToSupportTicket(reviewId: string, ticketId: string): Promise<Review | null> {
    const [updated] = await db
      .update(reviews)
      .set({
        id_support_ticket: ticketId,
        updated_at: new Date(),
      })
      .where(eq(reviews.id_review, reviewId))
      .returning();
    
    return (updated as Review) || null;
  }

  // Удалить отзыв
  async deleteReview(reviewId: string): Promise<boolean> {
    const result = await db
      .delete(reviews)
      .where(eq(reviews.id_review, reviewId));
    
    return result.length > 0;
  }

  // Получить отзывы ожидающие модерации
  async getPendingReviews(limit: number = 50): Promise<ReviewWithReviewer[]> {
    const reviewsList = await db
      .select({
        review: reviews,
        reviewer: {
          id_user: users.id_user,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
        },
        reviewer_company: {
          id_company: company.id_company,
          name_company: company.name_company,
        },
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.id_reviewer, users.id_user))
      .leftJoin(company, eq(reviews.reviewer_company_id, company.id_company))
      .where(eq(reviews.status, 'Ожидает модерации'))
      .orderBy(desc(reviews.created_at))
      .limit(limit);

    return reviewsList.map(r => ({
      ...r.review,
      reviewer: r.reviewer,
      reviewer_company: r.reviewer_company,
    })) as ReviewWithReviewer[];
  }
}

export const reviewsRepository = new ReviewsRepository();

