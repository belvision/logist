import { clientAuth } from ".";
import { handleApiError } from "@/lib/toast";

export interface Car {
    id_cars: number,
    tonn_min: number,
    m3_min: number,
    price: number,
    status: number | null,
    id_company: string,
    subscription: boolean,
    search: boolean,
    places: Record<string, { lat: number; lon: number; label?: string; active?: boolean }>,
    tonn_max: number,
    m3_max: number,
    title: string,
    id_car_type: number,
    id_tip_zagryzki: number
}

export interface CarType {
  id_car_type: number;
  car_type: string;
  status: number;
}

export interface LoadType {
  id_tip_zagryzki: number;
  tip_zagryzki: string;
  status: number;
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export const getCompanyCars = async (companyId: string): Promise<ApiResponse<Car[]>> => {
  try {
    const res = await clientAuth.cars['by-company'].$get({
      query: { id_company: companyId }
    });
    const data = await res.json();
    return {
      ok: true,
      data: data.items
    };
  } catch (error) {
    handleApiError(error, 'Ошибка загрузки автомобилей компании');
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const getCarTypes = async (): Promise<ApiResponse<CarType[]>> => {
  try {
    const res = await clientAuth.cars.types.$get();
    const data = await res.json();
    return {
      ok: true,
      data: data.items
    };
  } catch (error) {
    handleApiError(error, 'Ошибка загрузки типов автомобилей');
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const getLoadTypes = async (): Promise<ApiResponse<LoadType[]>> => {
  try {
    const res = await clientAuth.cars['load-types'].$get();
    const data = await res.json();
    return {
      ok: true,
      data: data.items
    };
  } catch (error) {
    handleApiError(error, 'Ошибка загрузки типов грузов');
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const createCar = async (car: Omit<Car, 'id_cars'>): Promise<ApiResponse<Car>> => {
  try {
    const res = await clientAuth.cars.$post({ json: car });
    const data = await res.json();
    return {
      ok: true,
      data: data
    };
  } catch (error) {
    handleApiError(error, 'Ошибка создания автомобиля');
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const updateCar = async (carId: string, car: Partial<Car>): Promise<ApiResponse<Car>> => {
  try {
    const res = await clientAuth.cars[carId].$patch({ json: car });
    const data = await res.json();
    return {
      ok: true,
      data: data
    };
  } catch (error) {
    handleApiError(error, 'Ошибка обновления автомобиля');
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const deleteCar = async (carId: string): Promise<ApiResponse<void>> => {
  try {
    const res = await clientAuth.cars[carId].$delete();
    await res.json();
    return {
      ok: true
    };
  } catch (error) {
    handleApiError(error, 'Ошибка удаления автомобиля');
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const toggleCarFlags = async (carId: string, flags: { subscription?: boolean; search?: boolean }): Promise<ApiResponse<Car>> => {
  try {
    const res = await clientAuth.cars[carId].toggles.$patch({ json: flags });
    const data = await res.json();
    return {
      ok: true,
      data: data
    };
  } catch (error) {
    handleApiError(error, 'Ошибка изменения статуса автомобиля');
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};