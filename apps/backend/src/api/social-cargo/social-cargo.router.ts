import { Hono } from 'hono';
import { SocialCargoService } from './social-cargo.service';
import { getSocialCargoSchema } from './social-cargo.schema';
import { authenticate } from '../middleware/auth';

const app = new Hono();
const service = new SocialCargoService();

/**
 * @route GET /api/social-cargo
 * @desc Получить список грузов из социальных сетей (публичный доступ)
 * @access Public
 * @query {number} limit - Количество грузов (по умолчанию 20, максимум 250)
 * @query {number} offset - Смещение для пагинации
 * @query {string} contains - Фильтр: объявление содержит
 * @query {string} notContains - Фильтр: объявление не содержит
 */
app.get('/', async (c: any) => {
  try {
    const query = c.req.query();
    
    // Валидация query параметров
    const validated = getSocialCargoSchema.safeParse(query);

    if (!validated.success) {
      return c.json({
        success: false,
        error: 'Invalid query parameters',
        details: validated.error.errors,
      }, 400);
    }

    const { limit, offset, contains, notContains } = validated.data;

    // Пытаемся получить userId из токена (если пользователь авторизован)
    let userId: string | undefined;
    try {
      const userCtx = c.get('user');
      userId = userCtx?.id_user ?? userCtx?.id;
    } catch {
      // Пользователь не авторизован, это нормально для публичного endpoint
    }

    const result = await service.getSocialCargos({
      limit,
      offset,
      contains,
      notContains,
    }, userId);

    return c.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.offset + result.limit < result.total,
      },
    });
  } catch (error) {
    console.error('❌ [SOCIAL CARGO] Error fetching social cargos:', error);
    console.error('❌ [SOCIAL CARGO] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('❌ [SOCIAL CARGO] Error message:', error instanceof Error ? error.message : String(error));
    return c.json({
      success: false,
      error: 'Failed to fetch social cargos',
      details: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});

/**
 * @route POST /api/social-cargo/:id/irrelevant
 * @desc Отметить груз как неактуальный
 * @access Private (требуется авторизация)
 * @param {number} id - ID груза
 */
app.post('/:id/irrelevant', authenticate, async (c: any) => {
  try {
    const cargoId = parseInt(c.req.param('id'), 10);
    
    if (isNaN(cargoId)) {
      console.error('❌ [SOCIAL CARGO ROUTER] Invalid cargo ID:', c.req.param('id'));
      return c.json({
        success: false,
        error: 'Invalid cargo ID',
      }, 400);
    }

    // Получаем userId из контекста (установлен middleware authenticate)
    const userCtx = c.get('user');
    
    const userId: string | undefined = userCtx?.id_user ?? userCtx?.id;

    if (!userId) {
      console.error('❌ [SOCIAL CARGO ROUTER] User not authenticated, userCtx:', userCtx);
      return c.json({
        success: false,
        error: 'User not authenticated',
      }, 401);
    }

    const result = await service.markAsIrrelevant(cargoId, userId);

    if (!result.success) {
      return c.json(result, 400);
    }

    return c.json(result, 200);
  } catch (error) {
    console.error('❌ [SOCIAL CARGO ROUTER] Error marking cargo as irrelevant:', error);
    console.error('❌ [SOCIAL CARGO ROUTER] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return c.json({
      success: false,
      error: 'Failed to mark cargo as irrelevant',
      details: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});

export const socialCargoRouter = app;
