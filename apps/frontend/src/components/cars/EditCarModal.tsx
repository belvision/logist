"use client";

import React, { useEffect, useState } from 'react';
import { X, MapPin, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Car, CarType, LoadType, getCarTypes, getLoadTypes, updateCar, uploadCarImages, deleteCarImage } from '@/shared/api/cars';
import { showToast, handleApiError } from '@/lib/toast';
import { searchPlaces } from '@/shared/api/nominatim';
import { CarImageUpload } from './CarImageUpload';

interface EditCarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  car: Car;
}

export function EditCarModal({ isOpen, onClose, onSuccess, car }: EditCarModalProps) {
  const [loading, setLoading] = useState(false);
  const [carTypes, setCarTypes] = useState<CarType[]>([]);
  const [loadTypes, setLoadTypes] = useState<LoadType[]>([]);
  
  const [formData, setFormData] = useState<Car>({ ...car, phone: car.phone ?? '', year: car.year ?? null });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(car.images || []);
  const [placeSearchQuery, setPlaceSearchQuery] = useState<string>("");
  const [placeSuggestions, setPlaceSuggestions] = useState<{ place?: Record<string, { lat: number; lon: number }>; label?: string }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [carTypesData, loadTypesData] = await Promise.all([
          getCarTypes(),
          getLoadTypes()
        ]);
        setCarTypes(carTypesData.data ?? []);
        setLoadTypes(loadTypesData.data ?? []);
      } catch (error) {
        handleApiError(error, 'Ошибка загрузки данных');
      }
    };
    if (isOpen) {
      fetchData();
      setFormData({ ...car, phone: car.phone ?? '', year: car.year ?? null });
      setExistingImages(car.images || []);
      setImageFiles([]);
    }
  }, [isOpen, car]);

  // Search places using Nominatim
  const searchPlacesHandler = async (query: string) => {
    const q = query.trim();
    if (q.length < 3) {
      setPlaceSuggestions([]);
      return;
    }
    try {
      const data = await searchPlaces(q, true);
      setPlaceSuggestions(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      console.error(err);
      setPlaceSuggestions([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    if (!formData.phone?.trim()) return;

    setLoading(true);
    try {
      const payload: Partial<Car> = {
        title: formData.title,
        id_car_type: formData.id_car_type,
        id_tip_zagryzki: formData.id_tip_zagryzki,
        tonn_min: formData.tonn_min,
        tonn_max: formData.tonn_max,
        m3_min: formData.m3_min,
        m3_max: formData.m3_max,
        price: formData.price,
        phone: formData.phone,
        year: formData.year,
        subscription: formData.subscription,
        search: formData.search,
        places: formData.places,
      };

      const response = await updateCar(car.id_cars.toString(), payload);
      if (response.ok) {
        let uploadFailed = false;

        if (imageFiles.length > 0) {
          const uploadResponse = await uploadCarImages(car.id_cars, imageFiles);
          if (!uploadResponse.ok) {
            uploadFailed = true;
            showToast.error(uploadResponse.error || 'Автомобиль обновлен, но изображения не загрузились');
          } else {
            if (uploadResponse.data) {
              setExistingImages(uploadResponse.data);
            }
          }
        }

        if (!uploadFailed) {
          showToast.success('Автомобиль успешно обновлен');
        }
        setImageFiles([]);
        onSuccess();
        onClose();
      } else {
        throw new Error(response.error || 'Ошибка при обновлении автомобиля');
      }
    } catch (error) {
      handleApiError(error, 'Ошибка обновления автомобиля');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleDeleteExistingImage = async (imageUrl: string) => {
    try {
      const response = await deleteCarImage(car.id_cars, imageUrl);
      if (!response.ok) {
        throw new Error(response.error || 'Ошибка удаления изображения');
      }
      setExistingImages(prev => prev.filter(img => img !== imageUrl));
      showToast.success('Изображение удалено');
    } catch (error) {
      handleApiError(error, 'Ошибка удаления изображения');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Редактировать автомобиль</h2>
            <p className="text-sm text-muted-foreground">Измените данные автомобиля</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" disabled={loading}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Изображения автомобилей */}
          <div>
            <CarImageUpload
              images={imageFiles}
              existingImages={existingImages}
              onImagesUpdate={setImageFiles}
              onDeleteExisting={handleDeleteExistingImage}
            />
          </div>

          {/* Города доступности */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Города доступности</label>
            
            {/* Поле поиска */}
            <div className="relative mb-3">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                type="text"
                value={placeSearchQuery}
                onChange={(e) => {
                  setPlaceSearchQuery(e.target.value);
                  searchPlacesHandler(e.target.value);
                }}
                placeholder="Введите город и выберите из списка"
                disabled={loading}
                className="pl-10"
              />
              {placeSuggestions.length > 0 && (
                <ul className="absolute z-10 w-full border border-border bg-card rounded-md shadow-lg max-h-56 overflow-y-auto mt-1">
                  {placeSuggestions.map((item: { place?: Record<string, { lat: number; lon: number }>; label?: string }, idx: number) => (
                    <li
                      key={idx}
                      className="px-3 py-2 hover:bg-muted cursor-pointer text-sm flex items-center gap-2"
                      onClick={() => {
                        const placeId = Object.keys(item.place || {})[0];
                        if (!placeId) return;
                        const coords = item.place?.[placeId];
                        if (!coords) return;
                        const next = { ...(formData.places || {}) } as Record<string, { lat: number; lon: number; label?: string; active?: boolean }>;
                        next[placeId] = { 
                          ...coords, 
                          ...(item.label ? { label: item.label } : {}),
                          active: true 
                        };
                        setFormData(prev => ({ ...prev, places: next }));
                        setPlaceSearchQuery('');
                        setPlaceSuggestions([]);
                      }}
                    >
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Выбранные города */}
            {Object.entries(formData.places || {}).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(formData.places || {}).map(([pid, place]) => (
                  <div 
                    key={pid} 
                    className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                      place.active !== false 
                        ? 'border-border bg-card hover:bg-muted/50' 
                        : 'border-border/50 bg-muted/30 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm text-foreground truncate font-medium">
                        {place.label || pid}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <label className="flex items-center gap-1.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={place.active !== false}
                          onChange={(e) => {
                            const next = { ...(formData.places || {}) } as Record<string, { lat: number; lon: number; label?: string; active?: boolean }>;
                            next[pid] = { ...place, active: e.target.checked };
                            setFormData(prev => ({ ...prev, places: next }));
                          }}
                          className="sr-only"
                        />
                        {place.active !== false ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 group-hover:text-green-700" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                        )}
                        <span className="text-xs text-muted-foreground group-hover:text-foreground hidden sm:inline">
                          {place.active !== false ? 'Активен' : 'Неактивен'}
                        </span>
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const next = { ...(formData.places || {}) } as Record<string, { lat: number; lon: number; label?: string; active?: boolean }>;
                          delete next[pid];
                          setFormData(prev => ({ ...prev, places: next }));
                        }}
                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-6 text-center">
                <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">Список городов пуст</p>
                <p className="text-xs text-muted-foreground mt-1">Добавьте города, в которых доступен автомобиль</p>
              </div>
            )}
          </div>

          {/* Название */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Название</label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Например: MAN TGX"
                required
                disabled={loading}
              />
          </div>

          {/* Тип автомобиля и тип загрузки */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Тип автомобиля</label>
              <Select
                value={formData.id_car_type.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, id_car_type: Number(value) }))}
                disabled={loading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Выберите тип" />
                </SelectTrigger>
                <SelectContent>
                  {carTypes.map(type => (
                    <SelectItem key={type.id_car_type} value={type.id_car_type.toString()}>
                      {type.car_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Тип загрузки</label>
              <Select
                value={formData.id_tip_zagryzki.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, id_tip_zagryzki: Number(value) }))}
                disabled={loading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Выберите тип" />
                </SelectTrigger>
                <SelectContent>
                  {loadTypes.map(type => (
                    <SelectItem key={type.id_tip_zagryzki} value={type.id_tip_zagryzki.toString()}>
                      {type.tip_zagryzki}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Грузоподъемность и объем */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Грузоподъемность (тонн)</label>
              <Input
                type="number"
                value={formData.tonn_max}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setFormData(prev => ({ ...prev, tonn_max: value, tonn_min: value }));
                }}
                placeholder="Введите грузоподъемность"
                required
                min="0"
                step="0.1"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Объем (м³)</label>
              <Input
                type="number"
                value={formData.m3_max}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setFormData(prev => ({ ...prev, m3_max: value, m3_min: value }));
                }}
                placeholder="Введите объем"
                required
                min="0"
                step="0.1"
                disabled={loading}
              />
            </div>
          </div>

          {/* Год выпуска */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Год выпуска</label>
            <Input
              type="number"
              value={formData.year ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                setFormData(prev => ({ ...prev, year: value === '' ? null : Number(value) }));
              }}
              placeholder="Введите год выпуска"
              min="1970"
              max={new Date().getFullYear()}
              disabled={loading}
            />
          </div>

          {/* Цена */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Цена</label>
            <Input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
              placeholder="Введите цену"
              min="0"
              disabled={loading}
            />
          </div>

          {/* Телефон */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Телефон для связи</label>
            <Input
              type="tel"
              value={formData.phone ?? ''}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+375 29 000 00 00"
              required
              disabled={loading}
            />
          </div>

          {/* Кнопки */}
          <div className="flex gap-3 mt-6">
            <Button variant="outline" type="button" onClick={onClose} className="flex-1 bg-transparent" disabled={loading}>
              Отмена
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
