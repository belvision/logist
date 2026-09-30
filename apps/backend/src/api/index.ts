// apps/backend/src/api/index.ts
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { serve } from '@hono/node-server';
import http from 'http';
import { attachNotificationsWSS } from '../ws/notifications';
import { swaggerUI } from '@hono/swagger-ui';

import { config } from '../db/config.ts';
import { openapi } from './openapi';
import { authRouter } from './auth/auth.router.ts';
import { companyRouter } from './company/company.router.ts';
import { carsRouter } from './cars/cars.router.ts';
import { cargoRouter } from './cargo/cargo.router.ts';
import { routesRouter } from './routes/routes.router.ts';
import { userRouter } from './user/user.router.ts';
import { nominatimRouter } from './nominatim/nominatim.router.ts';
import { cargoSearchRouter } from './cargo_search/cargo_search.router.ts';
import { carSearchRouter } from './car_search/car_search.router.ts'; // новый импорт
import { carSearchPublicRouter } from './car_search_public/car_search_public.router.ts';
import { bitrix24Router } from './bitrix24/bitrix24.router.ts';
import { webhookRouter } from './bitrix24/webhook.router.ts';
import { supportRouter } from './support/support.router.ts';
import { companionCargoRouter } from './companion_cargo/companion_cargo.router.ts';
import { osrmRouter } from './osrm/osrm.router.ts';
import { nominatimProxyRouter } from './osrm/nominatim-proxy.router.ts';
import { cargoRouteRouter } from './cargo-route/cargo-route.router.ts';
import { statsRouter } from './stats/stats.router.ts';
import notificationsRouter from './notifications/notifications.router.ts';
import reviewsRouter from './reviews/reviews.router.ts';
import messengerRouter from './messenger/messenger.router.ts';
import { documentsRouter } from './documents/documents.router.ts';
import { websocketManager } from '../lib/websocket.ts';
import { getWebSocketStats, closeUserConnections } from '../ws/notifications.ts';

const app = new Hono();

/** Простая CORS-прослойка */
app.use('*', async (c, next) => {
  const origin = c.req.header('Origin');
  const corsOrigin = config.cors.origin;

  // Разрешаем множественные origins через запятую
  const allowedOrigins = corsOrigin.includes(',')
    ? corsOrigin.split(',').map(o => o.trim())
    : [corsOrigin, 'http://localhost:3000', 'http://0.0.0.0:3000', 'http://0.0.0.0:5173', 'https://logistgo.pro'];

  if (origin && allowedOrigins.includes(origin)) {
    c.header('Access-Control-Allow-Origin', origin);
  } else if (config.app.env === 'development') {
    // В режиме разработки разрешаем любой origin
    c.header('Access-Control-Allow-Origin', origin || '*');
  }

  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  c.header('Access-Control-Allow-Credentials', 'true');

  if (c.req.method === 'OPTIONS') {
    return c.text('', 200);
  }
  return await next();
});

/** Health-check endpoints */
app.get('/', (c) => {
  const isProduction = process.env.NODE_ENV === 'production';

  return c.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    environment: isProduction ? 'production' : 'development',
    websocket: {
      enabled: isProduction,
      running: websocketManager.isRunning(),
      connections: websocketManager.getTotalConnectionCount()
    }
  });
});

// Простой health endpoint
app.get('/health', (c) => {
  c.header('Cache-Control', 'no-store');
  c.header('Content-Type', 'text/plain');
  return c.text('OK');
});

// Health endpoint под API префиксом (для nginx прокси)
app.get('/api/health', (c) => {
  c.header('Cache-Control', 'no-store');
  c.header('Content-Type', 'text/plain');
  return c.text('OK');
});

// Readiness endpoint с проверкой БД
app.get('/ready', async (c) => {
  c.header('Cache-Control', 'no-store');
  c.header('Content-Type', 'application/json');

  try {
    // Импортируем db клиент
    const db = (await import('../db/client')).default;
    const { sql } = await import('drizzle-orm');

    // Проверяем подключение к БД
    await db.execute(sql`select 1`);

    return c.json({
      status: 'ok',
      deps: { db: 'up' },
      version: process.env.APP_VERSION || 'unknown',
      startedAt: Math.floor(process.uptime()),
      websocket: {
        running: websocketManager.isRunning(),
        connections: websocketManager.getTotalConnectionCount()
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return c.json({
      status: 'down',
      deps: { db: 'error' },
      error: (error as Error).message
    }, 503);
  }
});

// Readiness endpoint под API префиксом
app.get('/api/ready', async (c) => {
  c.header('Cache-Control', 'no-store');
  c.header('Content-Type', 'application/json');
  
  try {
    // Импортируем db клиент
    const db = (await import('../db/client')).default;
    const { sql } = await import('drizzle-orm');
    
    // Проверяем подключение к БД
    await db.execute(sql`select 1`);
    
    return c.json({
      status: 'ok',
      deps: { db: 'up' },
      version: process.env.APP_VERSION || 'unknown',
      startedAt: Math.floor(process.uptime()),
      websocket: {
        running: websocketManager.isRunning(),
        connections: websocketManager.getTotalConnectionCount()
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return c.json({ 
      status: 'down', 
      deps: { db: 'error' },
      error: (error as Error).message 
    }, 503);
  }
});

// WebSocket monitoring endpoint
app.get('/api/websocket/stats', (c) => {
  c.header('Cache-Control', 'no-store');
  c.header('Content-Type', 'application/json');
  
  try {
    const stats = getWebSocketStats();
    return c.json({
      status: 'ok',
      websocket: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('WebSocket stats error:', error);
    return c.json({ 
      status: 'error',
      error: (error as Error).message 
    }, 500);
  }
});

// WebSocket force close endpoint
app.post('/api/websocket/close-user/:userId', (c) => {
  c.header('Cache-Control', 'no-store');
  c.header('Content-Type', 'application/json');
  
  try {
    const userId = c.req.param('userId');
    if (!userId) {
      return c.json({ 
        status: 'error',
        error: 'User ID is required' 
      }, 400);
    }
    
    const closedCount = closeUserConnections(userId);
    return c.json({
      status: 'ok',
      message: `Closed ${closedCount} connections for user ${userId}`,
      closedCount,
      userId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('WebSocket force close error:', error);
    return c.json({ 
      status: 'error',
      error: (error as Error).message 
    }, 500);
  }
});

/** Bitrix24 Webhook (БЕЗ аутентификации) */
app.route('/api/bitrix24/webhook', webhookRouter);

/** Авторизация */
app.route('/api/auth', authRouter);

/** Компании */
app.route('/api/company', companyRouter);

/** Автомобили */
app.route('/api/cars', carsRouter);

/** Грузы */
app.route('/api/cargo', cargoRouter);

/** Маршруты */
app.route('/api/routes', routesRouter);

/** Пользователь */
app.route('/api/user', userRouter);

/** Nominatim (поиск населённых пунктов) */
app.route('/api/nominatim', nominatimRouter);

/** Поиск грузов для автомобилей */
app.route('/api/cargo-search', cargoSearchRouter);

/** Поиск автомобилей */
app.route('/api/car-search', carSearchRouter);

/** Публичный поиск автомобилей (без авторизации) */
app.route('/api/car-search-public', carSearchPublicRouter);

/** Поиск попутных грузов */
app.route('/api/companion-cargo', companionCargoRouter);

/** OSRM маршрутизация */
app.route('/api/osrm', osrmRouter);

/** Nominatim прокси */
app.route('/api/nominatim-proxy', nominatimProxyRouter);

/** Маршруты для грузов (с авторизацией) */
app.route('/api/cargo-route', cargoRouteRouter);

/** Bitrix24 (поддержка) */
app.route('/api/bitrix24', bitrix24Router);

/** Поддержка (тикеты) */
app.route('/api/support', supportRouter);

/** Статистика */
app.route('/api/stats', statsRouter);

/** Уведомления */
app.route('/api/notifications', notificationsRouter);

/** Отзывы и рейтинги */
app.route('/api/reviews', reviewsRouter);

/** Мессенджер */
app.route('/api/messenger', messengerRouter);

/** Электронный документооборот */
app.route('/api/documents', documentsRouter);

/** Swagger UI + OpenAPI on /docs (Safari-compatible CDN bundle) */
app.get('/docs', (c) =>
  c.html(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Logistic Pro API</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui.css" />
    <style>html, body { margin: 0; padding: 0; height: 100%; } #swagger-ui { height: 100%; }</style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui-standalone-preset.js"></script>
    <script>
      window.onload = function () {
        window.ui = SwaggerUIBundle({
          url: '/openapi.json',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
          layout: 'StandaloneLayout'
        });
      };
    </script>
  </body>
  </html>`),
);
app.get('/openapi.json', (c) => c.json(openapi));

/** Единая обработка ошибок */
app.onError((err, c) => {
  // Подробный лог ошибок в консоль
  console.error('Unhandled error:', {
    name: (err as any)?.name,
    message: (err as any)?.message,
    stack: (err as any)?.stack,
    cause: (err as any)?.cause,
  });
  if (err instanceof HTTPException) {
    const status = err.status;
    const message = err.message || 'Server Error';
    const cause = (err as any).cause;
    if (status === 400 && cause) {
      return c.json({ message, errors: cause }, status);
    }
    return c.json({ message }, status);
  }
  return c.json({ message: 'Internal Server Error', error: { message: (err as any)?.message } }, 500);
});

/** Старт сервера */
const port = config.app.port;
const hostname = '0.0.0.0'; // Используем 0.0.0.0 для доступа извне

console.log(`🚀 [SERVER] Starting backend server...`);
console.log(`📡 [SERVER] Host: ${hostname}`);
console.log(`🔌 [SERVER] Port: ${port}`);
console.log(`🌍 [SERVER] Environment: ${config.app.env}`);
console.log(`🔗 [SERVER] API URL: http://${hostname}:${port}`);

// Создаем HTTP сервер
const server = http.createServer(async (req, res) => {
  try {
    // Собираем тело запроса для POST/PUT/PATCH запросов
    let body: any = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const chunks: Buffer[] = [];
      req.on('data', (chunk) => chunks.push(chunk));
      await new Promise((resolve) => req.on('end', resolve));
      body = Buffer.concat(chunks);
    }

    // Обрабатываем HTTP запросы через Hono
    const response = await app.fetch(new Request(`http://${req.headers.host}${req.url}`, {
      method: req.method,
      headers: req.headers as any,
      body: body,
    }));
    
    res.statusCode = response.status;
    response.headers.forEach((value: string, key: string) => {
      res.setHeader(key, value);
    });
    
    const text = await response.text();
    res.end(text);
  } catch (err: any) {
    console.error('Server error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 
      error: 'Internal Server Error',
      message: err.message || 'An unexpected error occurred'
    }));
  }
});

// Подключаем WebSocket сервер
attachNotificationsWSS(server);

// Проверяем конфигурацию окружения
console.log('🔧 [ENV CHECK] Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  MINIO_ENDPOINT: process.env.MINIO_ENDPOINT || 'localhost (default)',
  MINIO_PORT: process.env.MINIO_PORT || '9000 (default)',
  MINIO_USE_SSL: process.env.MINIO_USE_SSL || 'false (default)',
});

// Предупреждение, если используются настройки по умолчанию в продакшене
if (process.env.NODE_ENV === 'production' && !process.env.MINIO_ENDPOINT) {
  console.warn('⚠️  [WARNING] Production mode but MINIO_ENDPOINT not set!');
  console.warn('⚠️  [WARNING] Using default localhost - this is likely wrong!');
  console.warn('⚠️  [WARNING] Please create .env file with production MinIO settings');
}

// Инициализируем MinIO при старте сервера
(async () => {
  try {
    const { initializeBucket } = await import('../lib/minioClient');
    await initializeBucket();
    console.log('✅ [MINIO] MinIO initialized successfully');
  } catch (error) {
    console.error('❌ [MINIO] Failed to initialize MinIO:', error);
    console.warn('⚠️  [MINIO] File uploads will not work until MinIO is configured');
    
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ [CRITICAL] MinIO failed in production! Check configuration!');
    }
  }
})();

server.listen(port, hostname, () => {
  console.log(`✅ [SERVER] HTTP/WS server listening on http://${hostname}:${port}`);
  console.log(`🔌 [WEBSOCKET] WebSocket available at ws://${hostname}:${port}/notifications`);
});
