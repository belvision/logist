/*
 * Функции для работы с API, связанные с грузами и подбором автомобилей.
 *
 * Предполагается, что на сервере настроены соответствующие маршруты:
 *  - GET    /api/company/{companyId}/cargo        — получить список грузов компании
 *  - DELETE /api/cargo/{id}                       — удалить груз
 *  - GET    /api/car-search/{cargoId}?radius=...  — найти подходящие автомобили для груза
 *
 * В случае необходимости эти функции можно дополнить параметрами авторизации
 * (например, добавляя заголовок Authorization с токеном).
 */

import type { Cargo, Car } from './types';
import { getCookie } from 'cookies-next';
import { clientAuth } from '../../shared/api';

/**
 * Получить список грузов для указанной компании.
 *
 * @param companyId Идентификатор компании
 */
export async function getCargos(companyId: string | number): Promise<Cargo[]> {
  // Используем общий клиент с подстановкой Authorization и базового URL
  const token = getCookie('access_token');
  const resp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'}/api/cargo/by-company/${companyId}`,
    {
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    }
  );
  if (!resp.ok) {
    throw new Error('Не удалось получить список грузов');
  }
  const data = await resp.json();
  return data.items ?? [];
}

/**
 * Удалить груз по идентификатору.
 *
 * @param id Идентификатор груза
 */
export async function deleteCargo(id: number): Promise<void> {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
  const token = getCookie('access_token');
  const headers: HeadersInit = { Accept: 'application/json' };
  if (token) {
    (headers as any).Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE}/api/cargo/${id}`, { 
    method: 'DELETE',
    headers,
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Не удалось удалить груз');
  }
}

/**
 * Найти подходящие автомобили для груза.
 *
 * @param cargoId Идентификатор груза
 * @param radius Радиус поиска (км). Если не указан, используется значение по умолчанию на сервере.
 */
export async function searchCarsForCargo(cargoId: number, radius?: number): Promise<Car[]> {
  // Сформировать URL с опциональным query-параметром radius
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
  const url = new URL(`${API_BASE}/api/car-search/${cargoId}`);
  if (radius) {
    url.searchParams.set('radius', radius.toString());
  }
  const token = getCookie('access_token');
  const headers: HeadersInit = { Accept: 'application/json' };
  if (token) {
    (headers as any).Authorization = `Bearer ${token}`;
  }
  const response = await fetch(url.toString(), { headers, credentials: 'include' });
  if (!response.ok) {
    throw new Error('Не удалось найти автомобили для груза');
  }
  const data = await response.json();
  return data.items ?? [];
}