"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { getCookie } from 'cookies-next';

type CargoItem = any;

export default function CargoSearchForCarPage() {
  const params = useParams();
  const search = useSearchParams();
  const carId = params?.car_id as string;
  const [radiusKm, setRadiusKm] = useState<number>(Number(search?.get('radius') || 20));
  const [items, setItems] = useState<CargoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL || 'http://0.0.0.0:5555',
    []
  );

  useEffect(() => {
    if (!carId) return;
    const searchCargo = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getCookie('access_token');
        const url = new URL(`${API_BASE}/api/cargo-search/${carId}`);
        url.searchParams.set('radius', String(radiusKm));
        const resp = await fetch(url.toString(), {
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
        });
        if (!resp.ok) {
          throw new Error('Не удалось получить список грузов');
        }
        const data = await resp.json();
        setItems(data.items ?? []);
      } catch (e: any) {
        setError(e?.message || 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    };
    searchCargo();
  }, [carId, radiusKm, API_BASE]);

  return (
    <AppLayout>
      <div className="text-white">
        <h2 className="text-xl font-semibold mb-4">Подбор грузов для автомобиля #{carId}</h2>

        <div className="mb-4">
          <label className="block text-sm text-gray-200">Радиус поиска (км)</label>
          <input
            type="number"
            className="bg-gray-800 text-white rounded px-3 py-2"
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value || 20))}
            min={1}
          />
        </div>

        {loading && <div>Загрузка...</div>}
        {error && <div className="text-red-300">{error}</div>}

        {!loading && !error && (
          <table className="min-w-full border-separate border-spacing-y-1">
            <thead>
              <tr>
                <th className="text-left py-2">ID</th>
                <th className="text-left py-2">Маршрут</th>
                <th className="text-left py-2">Вес</th>
                <th className="text-left py-2">Объём</th>
              </tr>
            </thead>
            <tbody>
              {items.map((cg: any, idx: number) => (
                <tr key={cg.id ?? cg.id_cargo ?? idx}>
                  <td className="py-2">{cg.id ?? cg.id_cargo}</td>
                  <td className="py-2">{cg.departure_point} → {cg.arrival_point}</td>
                  <td className="py-2">{cg.tonn}</td>
                  <td className="py-2">{cg.m3}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td className="py-3 text-gray-300" colSpan={4}>Нет подходящих грузов</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </AppLayout>
  );
}


