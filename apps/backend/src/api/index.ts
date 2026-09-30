// apps/backend/src/api/index.ts
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { serve } from '@hono/node-server';
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

const app = new Hono();

/** Простая CORS-прослойка */
app.use('*', async (c, next) => {
  const origin = c.req.header('Origin');
  const corsOrigin = config.cors.origin;
  
  // Разрешаем множественные origins через запятую
  const allowedOrigins = corsOrigin.includes(',') 
    ? corsOrigin.split(',').map(o => o.trim())
    : [corsOrigin, 'http://0.0.0.0:3000', 'http://0.0.0.0:5173'];

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
  await next();
});

/** Health-check */
app.get('/', (c) => c.text('Hello, i am alive!'));

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
serve({
  fetch: app.fetch,
  port: config.app.port,
});
