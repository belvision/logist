'use client';

import { useState, useEffect } from 'react';
import { ReviewCard } from './ReviewCard';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { getReviews, markReviewAsHelpful, reportReview, deleteReview } from '@/shared/api/reviewsApi';
import type { Review, GetReviewsParams } from '@/shared/api/reviewsApi';
import { toast } from 'sonner';

interface ReviewsListProps {
  companyId?: string;
  userId?: string;
  status?: 'Ожидает модерации' | 'Одобрен' | 'Отклонен' | 'Скрыт';
  limit?: number;
  currentUserId?: string;
  onReviewDeleted?: () => void;
}

export function ReviewsList({
  companyId,
  userId,
  status = 'Одобрен',
  limit = 10,
  currentUserId,
  onReviewDeleted,
}: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);

  useEffect(() => {
    loadReviews();
  }, [companyId, userId, status, page]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const params: GetReviewsParams = {
        id_reviewed_company: companyId,
        id_reviewer: userId,
        status,
        page,
        limit,
        sort_by: 'created_at',
        sort_order: 'desc',
      };

      const response = await getReviews(params);
      setReviews(response.reviews);
      setTotalPages(response.pagination.pages);
    } catch (error) {
      console.error('Failed to load reviews:', error);
      toast.error('Не удалось загрузить отзывы');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    try {
      await markReviewAsHelpful(reviewId);
      toast.success('Спасибо за вашу оценку!');
      await loadReviews(); // Reload to update helpful count
    } catch (error) {
      console.error('Failed to mark as helpful:', error);
      toast.error('Не удалось отметить отзыв');
    }
  };

  const handleReport = async (reviewId: string) => {
    setSelectedReviewId(reviewId);
    const reason = prompt('Укажите причину жалобы (минимум 10 символов):');
    
    if (!reason || reason.length < 10) {
      toast.error('Причина должна содержать минимум 10 символов');
      return;
    }

    try {
      await reportReview(reviewId, reason);
      toast.success('Жалоба отправлена на рассмотрение');
    } catch (error) {
      console.error('Failed to report review:', error);
      toast.error('Не удалось отправить жалобу');
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот отзыв?')) {
      return;
    }

    try {
      await deleteReview(reviewId);
      toast.success('Отзыв удален');
      await loadReviews();
      onReviewDeleted?.();
    } catch (error) {
      console.error('Failed to delete review:', error);
      toast.error('Не удалось удалить отзыв');
    }
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Отзывов пока нет</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id_review}
            review={review}
            onMarkHelpful={handleMarkHelpful}
            onReport={handleReport}
            onDelete={handleDelete}
            canDelete={currentUserId === review.id_reviewer}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            Назад
          </Button>
          <span className="text-sm text-gray-600">
            Страница {page} из {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
          >
            Вперед
          </Button>
        </div>
      )}
    </div>
  );
}

