'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingDistributionProps {
  ratingBreakdown: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  totalReviews: number;
  className?: string;
}

export function RatingDistribution({
  ratingBreakdown,
  totalReviews,
  className,
}: RatingDistributionProps) {
  const ratings = [5, 4, 3, 2, 1];

  return (
    <div className={cn('space-y-2', className)}>
      {ratings.map((rating) => {
        const count = ratingBreakdown[rating as keyof typeof ratingBreakdown] || 0;
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

        return (
          <div key={rating} className="flex items-center gap-2">
            <div className="flex items-center gap-1 w-12">
              <span className="text-sm font-medium text-gray-700">{rating}</span>
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            </div>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-sm text-gray-600 w-12 text-right">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

