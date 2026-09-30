// Token utilities: decoding, expiry checks, storage, and refresh flow

type DecodedJwt = { exp?: number; [k: string]: any };

const ACCESS_KEY = 'lg_token';
const REFRESH_KEY = 'lg_refresh';

export const getAccessToken = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  return localStorage.getItem(ACCESS_KEY) || undefined;
};

export const getRefreshToken = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  return localStorage.getItem(REFRESH_KEY) || undefined;
};

export const setTokens = (accessToken?: string, refreshToken?: string) => {
  if (typeof window === 'undefined') return;
  if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
};

export const clearTokens = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
};

export function decodeJwt(token?: string): DecodedJwt | undefined {
  if (!token) return undefined;
  const parts = token.split('.');
  if (parts.length !== 3) return undefined;
  try {
    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const json = typeof atob !== 'undefined' ? atob(payload) : Buffer.from(payload, 'base64').toString('utf-8');
    return JSON.parse(json);
  } catch {
    return undefined;
  }
}

export const getExp = (token?: string): number | undefined => decodeJwt(token)?.exp;

export const isExpired = (token?: string, skewSeconds = 0): boolean => {
  const exp = getExp(token);
  if (!exp) return false; // если нет exp — не считаем просроченным, полагаемся на сервер
  const now = Math.floor(Date.now() / 1000);
  return now >= exp - skewSeconds;
};

export const willExpireSoon = (token?: string, thresholdSeconds = 60): boolean => {
  const exp = getExp(token);
  if (!exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return exp - now <= thresholdSeconds;
};

// Refresh flow using fetch to avoid circular imports with the API client
export async function refreshTokens(apiBase: string): Promise<{ ok: boolean }> {
  const rt = getRefreshToken();
  if (!rt) return { ok: false };
  try {
    const resp = await fetch(`${apiBase}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!resp.ok) return { ok: false };
    const json: any = await resp.json().catch(() => ({}));
    const access = json?.accessToken || json?.token || json?.data?.accessToken;
    const refresh = json?.refreshToken || json?.data?.refreshToken;
    if (access) localStorage.setItem(ACCESS_KEY, String(access));
    if (refresh) localStorage.setItem(REFRESH_KEY, String(refresh));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}


