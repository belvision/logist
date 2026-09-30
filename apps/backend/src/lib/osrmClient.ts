// apps/backend/src/lib/osrmClient.ts
//
// Унифицированный клиент для запросов к OSRM с поддержкой:
// - ENV-переменных OSRM_URL, OSRM_PROXY_URL, OSRM_REQUEST_TIMEOUT_MS, OSRM_MAX_RETRIES
// - таймаута запросов (AbortController)
// - ретраев на сетевых/5xx ошибках
// - работы через форвард-прокси (undici ProxyAgent)
//
// Использование:
//   import { osrmFetch, osrmJson } from '../../lib/osrmClient';
//   const resp = await osrmFetch(`/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`);
//   const data = await osrmJson(resp);

import { ProxyAgent, type Dispatcher } from 'undici';

// === ENV ===
const OSRM_URL = (process.env.OSRM_URL || 'http://10.1.1.215:5000').replace(/\/+$/, '');
const PROXY_URL = process.env.OSRM_PROXY_URL?.trim();
const TIMEOUT_MS = Number.isFinite(Number(process.env.OSRM_REQUEST_TIMEOUT_MS))
  ? Number(process.env.OSRM_REQUEST_TIMEOUT_MS)
  : 8000;
const MAX_RETRIES = Number.isFinite(Number(process.env.OSRM_MAX_RETRIES))
  ? Math.max(0, Number(process.env.OSRM_MAX_RETRIES))
  : 2;

// === Proxy dispatcher (ленивая инициализация) ===
let _dispatcher: Dispatcher | undefined;
function getDispatcher(): Dispatcher | undefined {
  if (!PROXY_URL) return undefined;
  if (!_dispatcher) {
    _dispatcher = new ProxyAgent(PROXY_URL);
  }
  return _dispatcher;
}

// === Вспомогательный таймаут ===
function withAbortTimeout(ms: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  const clear = () => clearTimeout(timeout);
  return { signal: controller.signal, clear };
}

// Собрать абсолютный URL к OSRM из относительного пути/квери
function buildOsrmUrl(pathAndQuery: string): string {
  const p = pathAndQuery.startsWith('/') ? pathAndQuery : `/${pathAndQuery}`;
  return `${OSRM_URL}${p}`;
}

/**
 * Универсальный fetch к OSRM с таймаутом и ретраями.
 * @param pathAndQuery относительный путь, например: `/route/v1/driving/27.56,53.90;30.73,46.48?overview=full&geometries=geojson`
 * @param init RequestInit (headers, method, body и т.д.)
 * @returns Response
 * @throws Error при исчерпании ретраев или не-5xx ошибке
 */
export async function osrmFetch(pathAndQuery: string, init?: RequestInit): Promise<Response> {
  const url = buildOsrmUrl(pathAndQuery);
  const dispatcher = getDispatcher();
  let attempt = 0;
  let lastErr: unknown;

  while (attempt <= MAX_RETRIES) {
    const { signal, clear } = withAbortTimeout(TIMEOUT_MS);
    try {
      const resp = await fetch(url, {
        ...init,
        // поддержка undici proxy per-request
        ...(dispatcher ? { dispatcher } : {}),
        signal,
      });

      clear();

      if (!resp.ok) {
        // 5xx — попробуем ретрайнуть
        if (resp.status >= 500 && attempt < MAX_RETRIES) {
          attempt++;
          continue;
        }

        // иначе — пробуем прочитать текст ошибки и выбрасываем
        let text = '';
        try { text = await resp.text(); } catch {/* ignore */}
        const msg = text || `OSRM HTTP ${resp.status}`;
        throw new Error(msg);
      }

      return resp;
    } catch (e) {
      clear();
      lastErr = e;
      // На сетевых/abort ошибках — ретрай, если есть попытки
      if (attempt < MAX_RETRIES) {
        attempt++;
        continue;
      }
      break;
    }
  }

  // Если дошли сюда — ретраи не помогли
  if (lastErr instanceof Error) throw lastErr;
  throw new Error('OSRM request failed');
}

/**
 * Удобный helper для чтения JSON из ответа OSRM
 * (с более явным сообщением об ошибке).
 */
export async function osrmJson<T = any>(resp: Response): Promise<T> {
  try {
    return (await resp.json()) as T;
  } catch (e) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Failed to parse OSRM JSON. Raw: ${text || '<empty>'}`);
  }
}

/** Экспортируем базовый URL — полезно для логирования/диагностики */
export function getOsrmBaseUrl() {
  return OSRM_URL;
}
