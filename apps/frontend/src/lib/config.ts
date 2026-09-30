// apps/frontend/src/lib/config.ts
export const API_BASE =
  process.env.AUTH_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8080"; // локальный fallback, если ENV не задан (не меняет логику бекенда)

export const JWT_COOKIE_NAME =
  process.env.NEXT_PUBLIC_JWT_COOKIE_NAME || "lg_jwt";

export const isProd = process.env.NODE_ENV === "production";
