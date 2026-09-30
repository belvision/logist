"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { getCookie } from 'cookies-next';

type CarItem = {
  id_cars?: number;
  id?: number;
  tonn_min?: number;
  tonn_max?: number;
  m3_min?: number;
  m3_max?: number;
  title?: string;
};

export default function CarSearchPage() {
  const params = useParams();
  const search = useSearchParams();
  const router = useRouter();

  const companyId = params?.company_id as string;
  const cargoId = params?.cargo_id as string;

  const initialTonn = search?.get('tonn');
  const initialM3 = search?.get('m3');

  const [radiusKm, setRadiusKm] = useState<number>(50);
  const [tonn, setTonn] = useState<number | undefined>(initialTonn ? Number(initialTonn) : undefined);
  const [m3, setM3] = useState<number | undefined>(initialM3 ? Number(initialM3) : undefined);
  const [cars, setCars] = useState<CarItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080',
    []
  );

  useEffect(() => {
    if (!cargoId) return;
    const doSearch = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getCookie('access_token');
        const url = new URL(`${API_BASE}/api/car-search/${cargoId}`);
        url.searchParams.set('radius', String(radiusKm));
        const resp = await fetch(url.toString(), {
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
        });
        if (!resp.ok) {
          throw new Error('Не удалось получить список автомобилей');
        }
        const data = await resp.json();
        setCars(data.items ?? []);
      } catch (e: any) {
        setError(e?.message || 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    };
    doSearch();
  }, [cargoId, radiusKm, API_BASE]);

  return (
    <AppLayout>
      <div className="text-white">
        <h2 className="text-xl font-semibold mb-4">Подбор машин для груза</h2>

        <div className="mb-4 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm text-gray-200">Вес груза (т)</label>
            <input
              type="number"
              className="bg-gray-800 text-white rounded px-3 py-2"
              value={tonn ?? ''}
              onChange={(e) => setTonn(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="напр. 10"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-200">Объём груза (м³)</label>
            <input
              type="number"
              className="bg-gray-800 text-white rounded px-3 py-2"
              value={m3 ?? ''}
              onChange={(e) => setM3(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="напр. 30"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-200">Радиус поиска (км)</label>
            <input
              type="number"
              className="bg-gray-800 text-white rounded px-3 py-2"
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value || 50))}
              min={1}
            />
          </div>
        </div>

        {loading && <div>Загрузка...</div>}
        {error && <div className="text-red-300">{error}</div>}

        {!loading && !error && (
          <table className="min-w-full border-separate border-spacing-y-1">
            <thead>
              <tr>
                <th className="text-left py-2">ID</th>
                <th className="text-left py-2">Название</th>
                <th className="text-left py-2">Вес (мин-макс)</th>
                <th className="text-left py-2">Объём (мин-макс)</th>
              </tr>
            </thead>
            <tbody>
              {cars.map((car, idx) => (
                <tr key={car.id ?? car.id_cars ?? idx}>
                  <td className="py-2">{car.id ?? car.id_cars}</td>
                  <td className="py-2">{car.title ?? '-'}</td>
                  <td className="py-2">{car.tonn_min ?? '-'} — {car.tonn_max ?? '-'}</td>
                  <td className="py-2">{car.m3_min ?? '-'} — {car.m3_max ?? '-'}</td>
                </tr>
              ))}
              {cars.length === 0 && (
                <tr>
                  <td className="py-3 text-gray-300" colSpan={4}>Нет подходящих автомобилей</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </AppLayout>
  );
}


