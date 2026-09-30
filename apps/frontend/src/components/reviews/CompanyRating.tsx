'use client';

import { useEffect, useState } from 'react';
import { StarRating } from './StarRating';
import { RatingDistribution } from './RatingDistribution';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { getCompanyRatingStats } from '@/shared/api/reviewsApi';
import type { CompanyRatingStats } from '@/shared/api/reviewsApi';

interface CompanyRatingProps {
  companyId: string;
  showDistribution?: boolean;
  className?: string;
}

export function CompanyRating({
  companyId,
  showDistribution = true,
  className,
}: CompanyRatingProps) {
  const [stats, setStats] = useState<CompanyRatingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [companyId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await getCompanyRatingStats(companyId);
      setStats(response.stats);
    } catch (error) {
      console.error('Failed to load company rating stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.total_reviews === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Рейтинг компании</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-gray-500">Отзывов пока нет</p>
            <p className="text-sm text-gray-400 mt-1">
              Будьте первым, кто оставит отзыв!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Рейтинг компании</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Average rating */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900">
              {stats.average_rating.toFixed(1)}
            </div>
            <div className="mt-1">
              <StarRating rating={stats.average_rating} size="md" />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600">
              На основе {stats.total_reviews} отзыв
              {stats.total_reviews === 1
                ? 'а'
                : stats.total_reviews < 5
                ? 'ов'
                : 'ов'}
            </p>
            {stats.approved_reviews < stats.total_reviews && (
              <p className="text-xs text-gray-500 mt-1">
                Опубликовано: {stats.approved_reviews}
              </p>
            )}
          </div>
        </div>

        {/* Rating distribution */}
        {showDistribution && (
          <div className="pt-4 border-t border-gray-200">
            <RatingDistribution
              ratingBreakdown={stats.rating_breakdown}
              totalReviews={stats.total_reviews}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

