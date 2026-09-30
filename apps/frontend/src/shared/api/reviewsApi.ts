import { client, clientAuth } from './api';

export interface Review {
  id_review: string;
  id_reviewer: string;
  reviewer_company_id: string | null;
  id_reviewed_company: string;
  rating: number;
  review_text: string | null;
  status: 'Ожидает модерации' | 'Одобрен' | 'Отклонен' | 'Скрыт';
  id_support_ticket: string | null;
  moderated_by: string | null;
  moderated_at: Date | null;
  moderation_comment: string | null;
  related_cargo_id: number | null;
  related_route_id: number | null;
  helpful_count: number;
  created_at: Date;
  updated_at: Date;
  reviewer?: {
    id_user: string;
    firstName: string | null;
    lastName: string | null;
    username: string;
  };
  reviewer_company?: {
    id_company: string;
    name_company: string;
  } | null;
}

export interface CompanyRatingStats {
  id_company: string;
  total_reviews: number;
  average_rating: number;
  rating_breakdown: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  approved_reviews: number;
  pending_reviews: number;
}

export interface CreateReviewData {
  id_reviewed_company: string;
  rating: number;
  review_text?: string;
  related_cargo_id?: number;
  related_route_id?: number;
}

export interface GetReviewsParams {
  id_reviewed_company?: string;
  id_reviewer?: string;
  status?: 'Ожидает модерации' | 'Одобрен' | 'Отклонен' | 'Скрыт';
  min_rating?: number;
  max_rating?: number;
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'rating' | 'helpful_count';
  sort_order?: 'asc' | 'desc';
}

// Создать отзыв
export async function createReview(data: CreateReviewData) {
  try {
    if (!clientAuth['reviews']) {
      throw new Error('Reviews API not available');
    }
    const response = await (clientAuth['reviews'] as any).$post({
      json: data,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create review');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
}

// Получить отзывы с фильтрами
export async function getReviews(params: GetReviewsParams = {}) {
  try {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    if (!client['reviews']) {
      throw new Error('Reviews API not available');
    }
    const response = await (client['reviews'] as any).$get({
      query: Object.fromEntries(queryParams),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch reviews');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching reviews:', error);
    throw error;
  }
}

// Получить статистику рейтинга компании
export async function getCompanyRatingStats(companyId: string): Promise<{ stats: CompanyRatingStats }> {
  try {
    if (!client['reviews']?.['company']?.[companyId]?.['stats']) {
      throw new Error('Company stats API not available');
    }
    const response = await (client['reviews']['company'][companyId]['stats'] as any).$get();

    if (!response.ok) {
      throw new Error('Failed to fetch company rating stats');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching company rating stats:', error);
    throw error;
  }
}

// Обновить отзыв
export async function updateReview(reviewId: string, data: { rating?: number; review_text?: string }) {
  try {
    if (!clientAuth['reviews']?.[reviewId]) {
      throw new Error('Reviews API not available');
    }
    const response = await (clientAuth['reviews'][reviewId] as any).$put({
      json: data,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update review');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating review:', error);
    throw error;
  }
}

// Отметить отзыв как полезный
export async function markReviewAsHelpful(reviewId: string) {
  try {
    if (!client['reviews']?.[reviewId]?.['helpful']) {
      throw new Error('Helpful API not available');
    }
    const response = await (client['reviews'][reviewId]['helpful'] as any).$post();

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to mark review as helpful');
    }

    return await response.json();
  } catch (error) {
    console.error('Error marking review as helpful:', error);
    throw error;
  }
}

// Пожаловаться на отзыв
export async function reportReview(reviewId: string, reason: string) {
  try {
    if (!clientAuth['reviews']?.['report']) {
      throw new Error('Report API not available');
    }
    const response = await (clientAuth['reviews']['report'] as any).$post({
      json: { id_review: reviewId, reason },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to report review');
    }

    return await response.json();
  } catch (error) {
    console.error('Error reporting review:', error);
    throw error;
  }
}

// Удалить отзыв
export async function deleteReview(reviewId: string) {
  try {
    if (!clientAuth['reviews']?.[reviewId]) {
      throw new Error('Reviews API not available');
    }
    const response = await (clientAuth['reviews'][reviewId] as any).$delete();

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete review');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
}

