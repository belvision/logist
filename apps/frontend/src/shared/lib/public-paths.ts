/**
 * Утилита для проверки, является ли путь публичным (не требует авторизации)
 */

const PUBLIC_PATHS = new Set<string>([
  "/",
  "/login",
  "/registry",
  "/invite/confirm",
  "/cargo-owners",
  "/carriers",
  "/carriers/7-steps",
  "/carriers/add-transport",
  "/carriers/licenses",
  "/team",
  "/api-docs",
  "/privacy-policy",
  "/offer-agreement",
  "/social-cargo",
  "/verify-email",
  "/cargo-search",
  "/car-search",
]);

/**
 * Проверяет, является ли путь публичным (не требует авторизации)
 * @param pathname - путь для проверки
 * @returns true, если путь публичный
 */
export function isPublicPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;

  // Проверяем точные совпадения
  if (PUBLIC_PATHS.has(pathname)) {
    return true;
  }

  // Проверяем динамические маршруты стран
  if (pathname.startsWith("/countries/")) {
    return true;
  }

  // Проверяем другие динамические маршруты
  if (pathname.startsWith("/invite/")) {
    return true;
  }

  // Проверяем подстраницы carriers
  if (pathname.startsWith("/carriers/")) {
    return true;
  }

  return false;
}

