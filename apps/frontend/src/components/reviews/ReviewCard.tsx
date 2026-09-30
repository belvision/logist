'use client';

import { useState } from 'react';
import { ThumbsUp, Flag, MoreVertical, Trash2 } from 'lucide-react';
import { StarRating } from './StarRating';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Review } from '@/shared/api/reviewsApi';

interface ReviewCardProps {
  review: Review;
  onMarkHelpful?: (reviewId: string) => void;
  onReport?: (reviewId: string) => void;
  onDelete?: (reviewId: string) => void;
  canDelete?: boolean;
  className?: string;
}

export function ReviewCard({
  review,
  onMarkHelpful,
  onReport,
  onDelete,
  canDelete = false,
  className,
}: ReviewCardProps) {
  const [isMarkedHelpful, setIsMarkedHelpful] = useState(false);

  const handleMarkHelpful = async () => {
    if (isMarkedHelpful || !onMarkHelpful) return;
    
    try {
      await onMarkHelpful(review.id_review);
      setIsMarkedHelpful(true);
    } catch (error) {
      console.error('Failed to mark as helpful:', error);
    }
  };

  const getReviewerName = () => {
    if (review.reviewer) {
      if (review.reviewer.firstName && review.reviewer.lastName) {
        return `${review.reviewer.firstName} ${review.reviewer.lastName}`;
      }
      return review.reviewer.username;
    }
    return 'Аноним';
  };

  const getTimeAgo = () => {
    try {
      return formatDistanceToNow(new Date(review.created_at), {
        addSuffix: true,
        locale: ru,
      });
    } catch (error) {
      return '';
    }
  };

  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg p-4 space-y-3', className)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900">{getReviewerName()}</h4>
            {review.reviewer_company && (
              <span className="text-sm text-gray-600">
                • {review.reviewer_company.name_company}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <StarRating rating={review.rating} size="sm" />
            <span className="text-xs text-gray-500">{getTimeAgo()}</span>
          </div>
        </div>

        {/* Actions menu */}
        {(canDelete || onReport) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onReport && (
                <DropdownMenuItem onClick={() => onReport(review.id_review)}>
                  <Flag className="mr-2 h-4 w-4" />
                  Пожаловаться
                </DropdownMenuItem>
              )}
              {canDelete && onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(review.id_review)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Удалить
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Review text */}
      {review.review_text && (
        <p className="text-gray-700 text-sm leading-relaxed">{review.review_text}</p>
      )}

      {/* Moderation status */}
      {review.status !== 'Одобрен' && (
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
              review.status === 'Ожидает модерации' && 'bg-yellow-100 text-yellow-800',
              review.status === 'Отклонен' && 'bg-red-100 text-red-800',
              review.status === 'Скрыт' && 'bg-gray-100 text-gray-800'
            )}
          >
            {review.status}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMarkHelpful}
          disabled={isMarkedHelpful}
          className="text-gray-600 hover:text-blue-600"
        >
          <ThumbsUp className={cn('h-4 w-4 mr-1', isMarkedHelpful && 'fill-blue-600')} />
          Полезно {review.helpful_count > 0 && `(${review.helpful_count})`}
        </Button>
      </div>
    </div>
  );
}

