'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CompanyRating, 
  ReviewsList, 
  AddReviewForm 
} from '@/components/reviews';
import { Star, MessageSquare, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface CompanyReviewsSectionProps {
  companyId: string;
  companyName?: string;
  currentUserId?: string;
  canLeaveReview?: boolean;
}

export function CompanyReviewsSection({
  companyId,
  companyName,
  currentUserId,
  canLeaveReview = true,
}: CompanyReviewsSectionProps) {
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleReviewSuccess = () => {
    setReviewDialogOpen(false);
    setRefreshKey((prev) => prev + 1); // Trigger refresh
  };

  return (
    <div className="space-y-6">
      {/* Rating Overview and Add Review Button */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Rating Stats */}
        <div className="lg:w-1/3">
          <CompanyRating companyId={companyId} showDistribution />
        </div>

        {/* Reviews List */}
        <div className="lg:w-2/3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Отзывы клиентов
                </CardTitle>
                {canLeaveReview && (
                  <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Оставить отзыв
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Оставить отзыв</DialogTitle>
                        <DialogDescription>
                          Поделитесь своим опытом работы с компанией
                        </DialogDescription>
                      </DialogHeader>
                      <AddReviewForm
                        companyId={companyId}
                        companyName={companyName}
                        onSuccess={handleReviewSuccess}
                        onCancel={() => setReviewDialogOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="all">Все отзывы</TabsTrigger>
                  {currentUserId && (
                    <TabsTrigger value="my">Мои отзывы</TabsTrigger>
                  )}
                </TabsList>
                
                <TabsContent value="all" className="mt-4">
                  <ReviewsList
                    key={`all-${refreshKey}`}
                    companyId={companyId}
                    status="Одобрен"
                    limit={10}
                    currentUserId={currentUserId}
                    onReviewDeleted={() => setRefreshKey((prev) => prev + 1)}
                  />
                </TabsContent>
                
                {currentUserId && (
                  <TabsContent value="my" className="mt-4">
                    <ReviewsList
                      key={`my-${refreshKey}`}
                      userId={currentUserId}
                      limit={10}
                      currentUserId={currentUserId}
                      onReviewDeleted={() => setRefreshKey((prev) => prev + 1)}
                    />
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

