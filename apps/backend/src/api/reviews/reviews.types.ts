// Types for reviews API

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
}

export interface ReviewWithReviewer extends Review {
  reviewer: {
    id_user: string;
    firstName: string | null;
    lastName: string | null;
    username: string;
  };
  reviewer_company: {
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

export interface CreateReviewInput {
  id_reviewed_company: string;
  rating: number;
  review_text?: string;
  related_cargo_id?: number;
  related_route_id?: number;
}

export interface UpdateReviewInput {
  rating?: number;
  review_text?: string;
}

export interface ModerateReviewInput {
  status: 'Одобрен' | 'Отклонен' | 'Скрыт';
  moderation_comment?: string;
}

export interface ReviewFilters {
  id_reviewed_company?: string;
  id_reviewer?: string;
  status?: 'Ожидает модерации' | 'Одобрен' | 'Отклонен' | 'Скрыт';
  min_rating?: number;
  max_rating?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'rating' | 'helpful_count';
  sort_order?: 'asc' | 'desc';
}

