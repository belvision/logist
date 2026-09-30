import { CargoSearchDto } from './cargo_search.schema';
import { getCarParams, findMatchingCargo } from './cargo_search.repository';

/**
 * Поиск подходящих грузов для автомобиля
 */
export async function searchCargoForCarService(dto: CargoSearchDto) {
  try {
    // Получаем параметры автомобиля
    const carParams = await getCarParams(dto.id_cars);
    if (!carParams) {
      return { ok: false as const, status: 404, error: 'Автомобиль не найден' };
    }

    // Ищем подходящие грузы
    const matchingCargo = await findMatchingCargo(carParams);
    
    return { ok: true as const, status: 200, items: matchingCargo };
  } catch (error) {
    console.error('Search cargo for car service error:', error);
    return { ok: false as const, status: 500, error: 'Ошибка поиска грузов для автомобиля' };
  }
}
