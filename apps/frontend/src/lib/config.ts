// apps/frontend/src/lib/config.ts
export const API_BASE = (() => {
  // В режиме разработки всегда используем localhost:5555
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5555';
  }
  
  // В продакшене используем переменные окружения или дефолтный URL
  return process.env["AUTH_API_BASE_URL"] ||
         process.env["NEXT_PUBLIC_API_BASE_URL"] ||
         'https://logistgo.pro';
})();

export const JWT_COOKIE_NAME =
  process.env["NEXT_PUBLIC_JWT_COOKIE_NAME"] || "lg_jwt";

export const isProd = process.env["NODE_ENV"] === "production";

// WebSocket configuration
export const WS_URL = (() => {
  // Если WebSocket отключен
  if (process.env.NEXT_PUBLIC_DISABLE_WEBSOCKET === 'true') {
    return null;
  }
  
  // Если задан явный URL
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  
  // В режиме разработки
  if (process.env.NODE_ENV === 'development') {
    return 'ws://localhost:5555/notifications';
  }
  
  // В продакшене (через nginx)
  return 'wss://logistgo.pro/ws/notifications';
})();