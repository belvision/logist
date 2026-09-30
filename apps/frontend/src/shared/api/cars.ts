import { clientAuth } from ".";
import { handleApiError } from "@/lib/toast";

export interface Car {
    id_cars: number,
    tonn_min: number,
    m3_min: number,
    price: number,
    year: number | null,
    phone: string | null,
    status: number | null,
    id_company: string,
    subscription: boolean,
    search: boolean,
    places: Record<string, { lat: number; lon: number; label?: string; active?: boolean }>,
    tonn_max: number,
    m3_max: number,
    title: string,
    id_car_type: number,
    id_tip_zagryzki: number,
    images?: string[]
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
    const res = await (clientAuth as any)['cars']['by-company'].$get({
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
    const res = await (clientAuth as any)['cars']['types'].$get();
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
    const res = await (clientAuth as any)['cars']['load-types'].$get();
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
    const res = await (clientAuth as any)['cars'].$post({ json: car });
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
    const res = await (clientAuth as any)['cars'][carId].$patch({ json: car });
    const text = await res.text();

    if (!res.ok) {
      let errorMessage: string | undefined;
      try {
        const errorData = text ? JSON.parse(text) : {};
        if (typeof errorData?.error === 'string') {
          errorMessage = errorData.error;
        } else if (errorData?.error != null) {
          errorMessage = JSON.stringify(errorData.error);
        } else if (typeof errorData?.message === 'string') {
          errorMessage = errorData.message;
        } else if (errorData) {
          errorMessage = JSON.stringify(errorData);
        }
      } catch {
        errorMessage = text;
      }

      throw new Error(errorMessage || 'Ошибка обновления автомобиля');
    }

    let data: Car | undefined;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        // backend вернул не-JSON тело, игнорируем
      }
    }
    return {
      ok: true,
      ...(data !== undefined ? { data } : {})
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
    const res = await (clientAuth as any)['cars'][carId].$delete();
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
    const res = await (clientAuth as any)['cars'][carId]['toggles'].$patch({ json: flags });
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

export const uploadCarImages = async (carId: number, files: File[]): Promise<ApiResponse<string[]>> => {
  try {
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('images', file);
    });

    const res = await (clientAuth as any)['cars'][carId]['images'].$post({
      body: formData,
    });

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || 'Ошибка загрузки изображений');
    }

    return {
      ok: true,
      data: data.images
    };
  } catch (error) {
    handleApiError(error, 'Ошибка загрузки изображений');
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const deleteCarImage = async (carId: number, imageUrl: string): Promise<ApiResponse<void>> => {
  try {
    const res = await (clientAuth as any)['cars'][carId]['images'].$delete({
      query: { imageUrl }
    });

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || 'Ошибка удаления изображения');
    }

    return {
      ok: true
    };
  } catch (error) {
    handleApiError(error, 'Ошибка удаления изображения');
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Получить данные автомобиля по ID
 */
export const getCarById = async (carId: string): Promise<ApiResponse<Car>> => {
  try {
    const res = await (clientAuth as any)['cars'][carId].$get();
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error((data as any).error || 'Ошибка загрузки данных автомобиля');
    }

    return {
      ok: true,
      data: data
    };
  } catch (error) {
    handleApiError(error, 'Ошибка загрузки данных автомобиля');
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Интерфейсы для управления водителями
export interface CarDriver {
  id_user: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  id_cars_drivers: number;
  created_at: string;
}

export interface CompanyDriver {
  id_user: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
}

// API для управления водителями
export const getCarDrivers = async (carId: number): Promise<ApiResponse<CarDriver[]>> => {
  try {
    const res = await (clientAuth as any)['cars'][carId]['drivers'].$get();
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error((data as any).error || 'Ошибка загрузки водителей');
    }

    return {
      ok: true,
      data: data.drivers || []
    };
  } catch (error) {
    handleApiError(error, 'Ошибка загрузки водителей');
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const getCompanyDrivers = async (companyId: string): Promise<ApiResponse<CompanyDriver[]>> => {
  try {
    const res = await (clientAuth as any)['cars']['drivers']['by-company'].$get({
      query: { id_company: companyId }
    });
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error((data as any).error || 'Ошибка загрузки водителей компании');
    }

    return {
      ok: true,
      data: data.drivers || []
    };
  } catch (error) {
    handleApiError(error, 'Ошибка загрузки водителей компании');
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const addDriverToCar = async (carId: number, userId: string): Promise<ApiResponse<CarDriver>> => {
  try {
    const res = await (clientAuth as any)['cars'][carId]['drivers'].$post({
      json: { id_user: userId }
    });
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error((data as any).error || 'Ошибка добавления водителя');
    }

    return {
      ok: true,
      data: data.driver
    };
  } catch (error) {
    handleApiError(error, 'Ошибка добавления водителя');
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const removeDriverFromCar = async (carId: number, userId: string): Promise<ApiResponse<void>> => {
  try {
    const res = await (clientAuth as any)['cars'][carId]['drivers'].$delete({
      json: { id_user: userId }
    });
    
    if (!res.ok) {
      const data = await res.json();
      throw new Error((data as any).error || 'Ошибка удаления водителя');
    }

    return {
      ok: true
    };
  } catch (error) {
    handleApiError(error, 'Ошибка удаления водителя');
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
