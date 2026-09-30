export function getAccessToken(): string | null {
  try {
    const fromLS = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (fromLS) return fromLS;

    if (typeof document !== 'undefined') {
      const m = document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/);
      if (m && m[1]) return decodeURIComponent(m[1]);
    }
  } catch {}
  return null;
}
