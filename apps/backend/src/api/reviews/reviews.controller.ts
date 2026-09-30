import { Context } from 'hono';
import { reviewsService } from './reviews.service';
import { 
  createReviewSchema, 
  updateReviewSchema, 
  moderateReviewSchema,
  getReviewsQuerySchema,
  reportReviewSchema
} from './reviews.schema';

// Создать отзыв
export async function createReviewHandler(c: Context) {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const validatedData = createReviewSchema.parse(body);

    const result = await reviewsService.createReview(
      user.id_user,
      user.id_company || null,
      validatedData
    );

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({ 
      message: 'Отзыв создан и отправлен на модерацию',
      review: result.review 
    }, 201);
  } catch (error: any) {
    console.error('Error in createReviewHandler:', error);
    if (error.name === 'ZodError') {
      return c.json({ error: 'Validation error', details: error.errors }, 400);
    }
    return c.json({ error: 'Failed to create review' }, 500);
  }
}

// Получить отзыв по ID
export async function getReviewByIdHandler(c: Context) {
  try {
    const reviewId = c.req.param('id');
    const includeReviewer = c.req.query('include_reviewer') === 'true';

    const review = await reviewsService.getReviewById(reviewId, includeReviewer);

    if (!review) {
      return c.json({ error: 'Review not found' }, 404);
    }

    return c.json({ review });
  } catch (error) {
    console.error('Error in getReviewByIdHandler:', error);
    return c.json({ error: 'Failed to get review' }, 500);
  }
}

// Получить отзывы с фильтрацией и пагинацией
export async function getReviewsHandler(c: Context) {
  try {
    const query = c.req.query();
    const validatedQuery = getReviewsQuerySchema.parse(query);

    const { page, limit, sort_by, sort_order, ...filters } = validatedQuery;

    const result = await reviewsService.getReviews(
      filters,
      { page, limit, sort_by, sort_order }
    );

    return c.json({
      reviews: result.reviews,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: result.pages,
      },
    });
  } catch (error: any) {
    console.error('Error in getReviewsHandler:', error);
    if (error.name === 'ZodError') {
      return c.json({ error: 'Validation error', details: error.errors }, 400);
    }
    return c.json({ error: 'Failed to get reviews' }, 500);
  }
}

// Получить статистику рейтинга компании
export async function getCompanyRatingStatsHandler(c: Context) {
  try {
    const companyId = c.req.param('companyId');

    const stats = await reviewsService.getCompanyRatingStats(companyId);

    if (!stats) {
      return c.json({ error: 'Failed to get rating stats' }, 500);
    }

    return c.json({ stats });
  } catch (error) {
    console.error('Error in getCompanyRatingStatsHandler:', error);
    return c.json({ error: 'Failed to get company rating stats' }, 500);
  }
}

// Обновить отзыв
export async function updateReviewHandler(c: Context) {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const reviewId = c.req.param('id');
    const body = await c.req.json();
    const validatedData = updateReviewSchema.parse(body);

    const result = await reviewsService.updateReview(
      reviewId,
      user.id_user,
      validatedData
    );

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({ 
      message: 'Отзыв обновлен',
      review: result.review 
    });
  } catch (error: any) {
    console.error('Error in updateReviewHandler:', error);
    if (error.name === 'ZodError') {
      return c.json({ error: 'Validation error', details: error.errors }, 400);
    }
    return c.json({ error: 'Failed to update review' }, 500);
  }
}

// Модерировать отзыв (только для администраторов)
export async function moderateReviewHandler(c: Context) {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // TODO: Проверить права администратора
    // if (user.role !== 'admin') {
    //   return c.json({ error: 'Forbidden' }, 403);
    // }

    const reviewId = c.req.param('id');
    const body = await c.req.json();
    const validatedData = moderateReviewSchema.parse(body);

    const result = await reviewsService.moderateReview(
      reviewId,
      user.id_user,
      validatedData
    );

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({ 
      message: 'Отзыв модерирован',
      review: result.review 
    });
  } catch (error: any) {
    console.error('Error in moderateReviewHandler:', error);
    if (error.name === 'ZodError') {
      return c.json({ error: 'Validation error', details: error.errors }, 400);
    }
    return c.json({ error: 'Failed to moderate review' }, 500);
  }
}

// Отметить отзыв как полезный
export async function markReviewAsHelpfulHandler(c: Context) {
  try {
    const reviewId = c.req.param('id');

    const result = await reviewsService.markReviewAsHelpful(reviewId);

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({ message: 'Отзыв отмечен как полезный' });
  } catch (error) {
    console.error('Error in markReviewAsHelpfulHandler:', error);
    return c.json({ error: 'Failed to mark review as helpful' }, 500);
  }
}

// Пожаловаться на отзыв
export async function reportReviewHandler(c: Context) {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const validatedData = reportReviewSchema.parse(body);

    const result = await reviewsService.reportReview(
      validatedData.id_review,
      user.id_user,
      user.id_company || null,
      validatedData.reason
    );

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({ 
      message: 'Жалоба отправлена',
      ticketId: result.ticketId 
    });
  } catch (error: any) {
    console.error('Error in reportReviewHandler:', error);
    if (error.name === 'ZodError') {
      return c.json({ error: 'Validation error', details: error.errors }, 400);
    }
    return c.json({ error: 'Failed to report review' }, 500);
  }
}

// Удалить отзыв
export async function deleteReviewHandler(c: Context) {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const reviewId = c.req.param('id');
    
    // TODO: Проверить права администратора
    const isAdmin = false; // user.role === 'admin'

    const result = await reviewsService.deleteReview(
      reviewId,
      user.id_user,
      isAdmin
    );

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({ message: 'Отзыв удален' });
  } catch (error) {
    console.error('Error in deleteReviewHandler:', error);
    return c.json({ error: 'Failed to delete review' }, 500);
  }
}

// Получить отзывы ожидающие модерации (только для администраторов)
export async function getPendingReviewsHandler(c: Context) {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // TODO: Проверить права администратора
    // if (user.role !== 'admin') {
    //   return c.json({ error: 'Forbidden' }, 403);
    // }

    const limit = parseInt(c.req.query('limit') || '50');

    const reviews = await reviewsService.getPendingReviews(limit);

    return c.json({ reviews, total: reviews.length });
  } catch (error) {
    console.error('Error in getPendingReviewsHandler:', error);
    return c.json({ error: 'Failed to get pending reviews' }, 500);
  }
}

