import { CreateCarDto, UpdateCarDto, ToggleCarFlagsDto, AddDriverToCarDto, RemoveDriverFromCarDto } from './cars.schema';
import { companyExists, insertCar, updateCarById, deleteCarById, selectCarsByCompany, selectCarById, addDriverToCar, removeDriverFromCar, getCarDrivers, isDriverAssignedToCar, isUserDriverInCompany, getCompanyDrivers } from './cars.repository';
import { uploadFile, deleteFile, generateFileName, extractFileNameFromUrl } from '../../lib/minioClient';
import { UploadedFile } from '../../lib/fileUpload';

export async function createCarService(dto: CreateCarDto) {
  const exists = await companyExists(dto.id_company);
  if (!exists) return { ok: false as const, status: 404, error: 'Компания не найдена' };

  const now = new Date();
  const car = await insertCar({
    id_company: dto.id_company as unknown as any,
    title: dto.title,
    id_car_type: dto.id_car_type,
    id_tip_zagryzki: dto.id_tip_zagryzki,
    phone: dto.phone,
    tonn_min: dto.tonn_min,
    tonn_max: dto.tonn_max,
    m3_min: dto.m3_min,
    m3_max: dto.m3_max,
    price: dto.price,
    year: dto.year ?? null,
    subscription: dto.subscription ?? false,
    search: dto.search ?? true,
    places: (dto.places ?? {}) as any,
    created_at: dto.created_at ? new Date(dto.created_at) : now,
    updated_at: dto.updated_at ? new Date(dto.updated_at) : now,
  });
  return { ok: true as const, status: 201, car };
}

export async function updateCarService(id: number, dto: UpdateCarDto) {
  if (dto.id_company) {
    const exists = await companyExists(dto.id_company);
    if (!exists) return { ok: false as const, status: 404, error: 'Компания не найдена' };
  }
  
  const updateData: any = { ...dto };
  // Всегда обновляем updated_at при изменении
  updateData.updated_at = new Date();
  
  const car = await updateCarById(id, updateData);
  if (!car) return { ok: false as const, status: 404, error: 'Автомобиль не найден' };
  return { ok: true as const, status: 200, car };
}

export async function deleteCarService(id: number) {
  try {
    const car = await deleteCarById(id);
    if (!car) return { ok: false as const, status: 404, error: 'Автомобиль не найден' };
    return { ok: true as const, status: 200 };
  } catch (error: any) {
    console.error('Error in deleteCarService:', error);
    // Если это ошибка о внешнем ключе, возвращаем понятное сообщение
    if (error.message?.includes('привязаны маршруты')) {
      return { ok: false as const, status: 400, error: error.message };
    }
    // Для других ошибок БД
    if (error.code === '23503' || error.message?.includes('foreign key')) {
      return { ok: false as const, status: 400, error: 'Нельзя удалить автомобиль: к нему привязаны маршруты. Сначала удалите все маршруты.' };
    }
    return { ok: false as const, status: 500, error: 'Ошибка при удалении автомобиля' };
  }
}

export async function toggleCarFlagsService(id: number, dto: ToggleCarFlagsDto) {
  const partial: any = {};
  if (dto.subscription !== undefined) partial.subscription = dto.subscription;
  if (dto.search !== undefined) partial.search = dto.search;
  // Обновляем время изменения
  partial.updated_at = new Date();
  
  const car = await updateCarById(id, partial);
  if (!car) return { ok: false as const, status: 404, error: 'Автомобиль не найден' };
  return { ok: true as const, status: 200, car };
}

export async function listCarsByCompanyService(companyId: string) {
  const exists = await companyExists(companyId);
  if (!exists) return { ok: false as const, status: 404, error: 'Компания не найдена' };
  const items = await selectCarsByCompany(companyId);
  return { ok: true as const, status: 200, items };
}

export async function getCarByIdService(id: number) {
  const car = await selectCarById(id);
  if (!car) return { ok: false as const, status: 404, error: 'Автомобиль не найден' };
  return { ok: true as const, status: 200, car };
}

export async function uploadCarImagesService(carId: number, files: UploadedFile[]) {
  // Проверяем, существует ли автомобиль
  const car = await selectCarById(carId);
  if (!car) return { ok: false as const, status: 404, error: 'Автомобиль не найден' };

  try {
    // Загружаем файлы в MinIO
    const uploadPromises = files.map(async (file) => {
      const fileName = generateFileName('cars', file.originalname);
      const url = await uploadFile(file.buffer, fileName, file.mimetype);
      return url;
    });

    const uploadedUrls = await Promise.all(uploadPromises);

    // Обновляем массив изображений в БД
    const existingImages = car.images || [];
    const newImages = [...existingImages, ...uploadedUrls];

    await updateCarById(carId, { 
      images: newImages as any,
      updated_at: new Date()
    });

    return { ok: true as const, status: 200, images: newImages };
  } catch (error: any) {
    console.error('Error uploading car images:', error);
    return { ok: false as const, status: 500, error: 'Ошибка при загрузке изображений' };
  }
}

export async function deleteCarImageService(carId: number, imageUrl: string) {
  // Проверяем, существует ли автомобиль
  const car = await selectCarById(carId);
  if (!car) return { ok: false as const, status: 404, error: 'Автомобиль не найден' };

  try {
    const existingImages = car.images || [];
    
    if (!existingImages.includes(imageUrl)) {
      return { ok: false as const, status: 404, error: 'Изображение не найдено' };
    }

    // Удаляем файл из MinIO
    const fileName = extractFileNameFromUrl(imageUrl);
    if (fileName) {
      await deleteFile(fileName);
    }

    // Обновляем массив изображений в БД
    const newImages = existingImages.filter(url => url !== imageUrl);
    await updateCarById(carId, { 
      images: newImages as any,
      updated_at: new Date()
    });

    return { ok: true as const, status: 200 };
  } catch (error: any) {
    console.error('Error deleting car image:', error);
    return { ok: false as const, status: 500, error: 'Ошибка при удалении изображения' };
  }
}

// Сервисы для управления водителями
export async function addDriverToCarService(carId: number, dto: AddDriverToCarDto, companyId: string) {
  // Проверяем существование автомобиля
  const car = await selectCarById(carId);
  if (!car) return { ok: false as const, status: 404, error: 'Автомобиль не найден' };

  // Проверяем, что автомобиль принадлежит компании
  if (car.id_company !== companyId) {
    return { ok: false as const, status: 403, error: 'Автомобиль не принадлежит вашей компании' };
  }

  // Проверяем, что пользователь является водителем в компании
  const isDriver = await isUserDriverInCompany(dto.id_user, companyId);
  if (!isDriver) {
    return { ok: false as const, status: 400, error: 'Пользователь должен иметь роль "Водитель" в компании' };
  }

  // Проверяем, не привязан ли уже водитель к машине
  const alreadyAssigned = await isDriverAssignedToCar(carId, dto.id_user);
  if (alreadyAssigned) {
    return { ok: false as const, status: 409, error: 'Водитель уже привязан к этому автомобилю' };
  }

  try {
    const result = await addDriverToCar(carId, dto.id_user);
    return { ok: true as const, status: 201, driver: result };
  } catch (error: any) {
    console.error('Error adding driver to car:', error);
    return { ok: false as const, status: 500, error: 'Ошибка при добавлении водителя к автомобилю' };
  }
}

export async function removeDriverFromCarService(carId: number, dto: RemoveDriverFromCarDto, companyId: string) {
  // Проверяем существование автомобиля
  const car = await selectCarById(carId);
  if (!car) return { ok: false as const, status: 404, error: 'Автомобиль не найден' };

  // Проверяем, что автомобиль принадлежит компании
  if (car.id_company !== companyId) {
    return { ok: false as const, status: 403, error: 'Автомобиль не принадлежит вашей компании' };
  }

  // Проверяем, что водитель привязан к машине
  const isAssigned = await isDriverAssignedToCar(carId, dto.id_user);
  if (!isAssigned) {
    return { ok: false as const, status: 404, error: 'Водитель не привязан к этому автомобилю' };
  }

  try {
    await removeDriverFromCar(carId, dto.id_user);
    return { ok: true as const, status: 200 };
  } catch (error: any) {
    console.error('Error removing driver from car:', error);
    return { ok: false as const, status: 500, error: 'Ошибка при удалении водителя из автомобиля' };
  }
}

export async function getCarDriversService(carId: number, companyId: string) {
  // Проверяем существование автомобиля
  const car = await selectCarById(carId);
  if (!car) return { ok: false as const, status: 404, error: 'Автомобиль не найден' };

  // Проверяем, что автомобиль принадлежит компании
  if (car.id_company !== companyId) {
    return { ok: false as const, status: 403, error: 'Автомобиль не принадлежит вашей компании' };
  }

  try {
    const drivers = await getCarDrivers(carId);
    return { ok: true as const, status: 200, drivers };
  } catch (error: any) {
    console.error('Error getting car drivers:', error);
    return { ok: false as const, status: 500, error: 'Ошибка при получении списка водителей' };
  }
}

export async function getCompanyDriversService(companyId: string) {
  try {
    const drivers = await getCompanyDrivers(companyId);
    return { ok: true as const, status: 200, drivers };
  } catch (error: any) {
    console.error('Error getting company drivers:', error);
    return { ok: false as const, status: 500, error: 'Ошибка при получении списка водителей компании' };
  }
}


