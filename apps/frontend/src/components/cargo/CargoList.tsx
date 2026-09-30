import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCargos, deleteCargo } from './cargoService';
import type { Cargo } from './types';
import { showToast, handleApiError } from '@/lib/toast';

/**
 * Компонент отображения списка грузов компании.
 * Показывает таблицу грузов с выпадающим списком для операций над каждым грузом.
 */
export const CargoList: React.FC = () => {
  // Идентификатор компании берётся из параметров маршрута
  const { id_company } = useParams<{ id_company: string }>();
  const navigate = useNavigate();
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);

  // Загрузка списка грузов при первом рендере
  useEffect(() => {
    async function load() {
      if (!id_company) return;
      try {
        // Передаём companyId как строку, новый эндпоинт принимает строковой идентификатор
        const list = await getCargos(id_company as string);
        setCargos(list);
      } catch (error) {
        handleApiError(error, 'Ошибка загрузки грузов');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id_company]);

  /**
   * Обработчик удаления груза. Запрашивает подтверждение у пользователя
   * и после успешного удаления удаляет элемент из списка в состоянии.
   */
  const handleDelete = async (id: number) => {
    if (!window.confirm('Вы действительно хотите удалить этот груз?')) return;
    try {
      await deleteCargo(id);
      showToast.success('Груз успешно удален');
      setCargos(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      handleApiError(error, 'Ошибка удаления груза');
    }
  };

  /**
   * Обработчик перехода на страницу поиска автомобилей для выбранного груза.
   */
  const handleSearchCars = (cargoId: number) => {
    if (!id_company) return;
    navigate(`/company/${id_company}/cargo/${cargoId}/car-search`);
  };

  /**
   * Обработчик редактирования — перенаправляет на страницу редактирования груза.
   */
  const handleEdit = (cargoId: number) => {
    navigate(`/cargo/${cargoId}/edit`);
  };

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div>
      <h2>Грузы компании</h2>
      {cargos.length === 0 ? (
        <p>Список грузов пуст</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Наименование</th>
              <th>Вес (т)</th>
              <th>Объём (м³)</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {cargos.map(cargo => (
              <tr key={cargo.id}>
                <td>{cargo.id}</td>
                <td>{cargo.name}</td>
                <td>{cargo.tonn}</td>
                <td>{cargo.m3}</td>
                <td>
                  <select
                    onChange={e => {
                      const action = e.target.value;
                      e.currentTarget.selectedIndex = 0; // сброс выбора
                      if (action === 'edit') handleEdit(cargo.id);
                      if (action === 'delete') handleDelete(cargo.id);
                      if (action === 'searchCars') handleSearchCars(cargo.id);
                    }}
                  >
                    <option value="">Выберите</option>
                    <option value="edit">Редактировать</option>
                    <option value="delete">Удалить</option>
                    <option value="searchCars">Подобрать машину</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
