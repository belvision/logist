import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { searchCarsForCargo } from './cargoService';
import type { Car } from './types';
import { handleApiError } from '@/lib/toast';

/**
 * Страница результатов поиска автомобилей для выбранного груза.
 * Автоматически запрашивает автомобили после монтирования компонента.
 */
export const CarSearchPage: React.FC = () => {
  const { id_cargo } = useParams<{ id_cargo: string }>();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id_cargo) return;
      try {
        const results = await searchCarsForCargo(Number(id_cargo));
        setCars(results);
      } catch (error) {
        handleApiError(error, 'Ошибка поиска автомобилей');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id_cargo]);

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div>
      <h2>Подходящие машины для груза {id_cargo}</h2>
      {cars.length === 0 ? (
        <p>Не найдено подходящих автомобилей.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Мин. масса (т)</th>
              <th>Макс. масса (т)</th>
              <th>Мин. объём (м³)</th>
              <th>Макс. объём (м³)</th>
            </tr>
          </thead>
          <tbody>
            {cars.map(car => (
              <tr key={car.id}>
                <td>{car.id}</td>
                <td>{car.tonn_min ?? '-'}</td>
                <td>{car.tonn_max ?? '-'}</td>
                <td>{car.m3_min ?? '-'}</td>
                <td>{car.m3_max ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};