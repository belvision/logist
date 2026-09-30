'use client';

import { useState } from 'react';
import { StarRating } from './StarRating';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createReview } from '@/shared/api/reviewsApi';
import type { CreateReviewData } from '@/shared/api/reviewsApi';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AddReviewFormProps {
  companyId: string;
  companyName?: string;
  relatedCargoId?: number;
  relatedRouteId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AddReviewForm({
  companyId,
  companyName,
  relatedCargoId,
  relatedRouteId,
  onSuccess,
  onCancel,
}: AddReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating < 1 || rating > 5) {
      toast.error('Пожалуйста, выберите оценку от 1 до 5 звезд');
      return;
    }

    if (reviewText.length > 2000) {
      toast.error('Отзыв не должен превышать 2000 символов');
      return;
    }

    setIsSubmitting(true);

    try {
      const data: CreateReviewData = {
        id_reviewed_company: companyId,
        rating,
        review_text: reviewText.trim() || undefined,
        related_cargo_id: relatedCargoId,
        related_route_id: relatedRouteId,
      };

      await createReview(data);
      toast.success('Отзыв отправлен на модерацию');
      
      // Reset form
      setRating(5);
      setReviewText('');
      
      onSuccess?.();
    } catch (error: any) {
      console.error('Failed to create review:', error);
      toast.error(error.message || 'Не удалось создать отзыв');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Оставить отзыв</CardTitle>
        {companyName && (
          <CardDescription>О компании: {companyName}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating */}
          <div className="space-y-2">
            <Label htmlFor="rating">Оценка *</Label>
            <div className="flex items-center gap-2">
              <StarRating
                rating={rating}
                interactive
                onChange={setRating}
                size="lg"
              />
              <span className="text-sm text-gray-600">
                ({rating} из 5)
              </span>
            </div>
          </div>

          {/* Review text */}
          <div className="space-y-2">
            <Label htmlFor="review_text">
              Ваш отзыв (опционально)
            </Label>
            <Textarea
              id="review_text"
              placeholder="Расскажите о вашем опыте работы с компанией..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={5}
              maxLength={2000}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 text-right">
              {reviewText.length} / 2000
            </p>
          </div>

          {/* Info message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              Ваш отзыв будет отправлен на модерацию и опубликован после проверки.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Отмена
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Отправка...
                </>
              ) : (
                'Отправить отзыв'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

