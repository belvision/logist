"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { searchCarsForCargo } from '@/shared/api/cargo';

type CargoItem = {
  id_cargo: number;
  departure_point: string;
  arrival_point: string;
  [key: string]: unknown;
};

export default function CargoSearchForCarPage() {
  const params = useParams();
  const search = useSearchParams();
  const carId = params?.['car_id'] as string;
  const [radiusKm, setRadiusKm] = useState<number>(Number(search?.get('radius') || 20));
  const [items, setItems] = useState<CargoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!carId) return;
    const searchCargo = async () => {
      setLoading(true);
      setError(null);
      try {
        const items = await searchCarsForCargo(Number(carId), radiusKm);
        setItems(items);
      } catch (e: unknown) {
        setError((e as Error)?.message || 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    };
    searchCargo();
  }, [carId, radiusKm]);

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
              {items.map((cg: CargoItem, idx: number) => (
                <tr key={String(cg['id'] ?? cg['id_cargo'] ?? idx)}>
                  <td className="py-2">{String(cg['id'] ?? cg['id_cargo'] ?? '')}</td>
                  <td className="py-2">{String(cg['departure_point'] ?? '')} → {String(cg['arrival_point'] ?? '')}</td>
                  <td className="py-2">{String(cg['tonn'] ?? '')}</td>
                  <td className="py-2">{String(cg['m3'] ?? '')}</td>
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


