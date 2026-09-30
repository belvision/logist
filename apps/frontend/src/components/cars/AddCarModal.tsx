"use client";

import React, { useEffect, useState } from 'react';
import { X, MapPin, CheckCircle2, Circle } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createCar, CarType, LoadType, getCarTypes, getLoadTypes, uploadCarImages } from '@/shared/api/cars';
import { showToast, handleApiError } from '@/lib/toast';
import { searchPlaces } from '@/shared/api/nominatim';
import { CarImageUpload } from './CarImageUpload';

interface AddCarModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  companyId?: string;
}

type CarFormState = {
  title: string;
  id_car_type: number;
  id_tip_zagryzki: number;
  tonn_max: number;
  m3_max: number;
  price: number;
  phone: string;
  year: number | null;
  subscription: boolean;
  search: boolean;
};

export function AddCarModal({ isOpen, onClose, onSuccess, companyId }: AddCarModalProps) {
  const [loading, setLoading] = useState(false);
  const [carTypes, setCarTypes] = useState<CarType[]>([]);
  const [loadTypes, setLoadTypes] = useState<LoadType[]>([]);
  const [formData, setFormData] = useState<CarFormState>({
    title: '',
    id_car_type: 0,
    id_tip_zagryzki: 0,
    tonn_max: 0,
    m3_max: 0,
    price: 0,
    phone: '',
    year: null,
    subscription: false,
    search: false,
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const [cityQuery, setCityQuery] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<Array<{ label: string; place: Record<string, { lat: number; lon: number }> }>>([]);
  const [selectedPlaces, setSelectedPlaces] = useState<Record<string, { lat: number; lon: number; label?: string; active?: boolean }>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [carTypesResponse, loadTypesResponse] = await Promise.all([
          getCarTypes(),
          getLoadTypes()
        ]);

        if (carTypesResponse.ok && Array.isArray(carTypesResponse.data)) {
          setCarTypes(carTypesResponse.data);
          if (carTypesResponse.data.length > 0) {
            setFormData(prev => ({ ...prev, id_car_type: carTypesResponse.data?.[0]?.id_car_type || 0 }));
          }
        }

        // Обрабатываем типы загрузки
        if (loadTypesResponse.ok && Array.isArray(loadTypesResponse.data)) {
          setLoadTypes(loadTypesResponse.data);
          if (loadTypesResponse.data.length > 0) {
            setFormData(prev => ({ ...prev, id_tip_zagryzki: loadTypesResponse.data?.[0]?.id_tip_zagryzki || 0 }));
          }
        }
      } catch (error) {
        handleApiError(error, 'Ошибка загрузки данных');
      }
    };
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    if (!formData.phone.trim()) return;

    setLoading(true);
    try {
      const response = await createCar({
        ...formData,
        tonn_min: formData.tonn_max,
        m3_min: formData.m3_max,
        id_company: companyId || '',
        status: null,
        places: selectedPlaces,
      });

      if (response.ok && response.data) {
        const newCarId = response.data.id_cars;
        let uploadFailed = false;

        if (newCarId && imageFiles.length > 0) {
          const uploadResponse = await uploadCarImages(newCarId, imageFiles);
          if (!uploadResponse.ok) {
            uploadFailed = true;
            showToast.error(uploadResponse.error || 'Автомобиль создан, но изображения не загрузились');
          }
        }

        if (!uploadFailed) {
          showToast.success('Автомобиль успешно добавлен');
        }
        onSuccess?.();
        onClose?.();
        setFormData({
          title: '',
          id_car_type: carTypes[0]?.id_car_type || 0,
          id_tip_zagryzki: loadTypes[0]?.id_tip_zagryzki || 0,
          tonn_max: 0,
          m3_max: 0,
          price: 0,
          phone: '',
          year: null,
          subscription: false,
          search: false,
        });
        setImageFiles([]);
        setSelectedPlaces({});
        setCityQuery('');
        setCitySuggestions([]);
      } else {
        throw new Error(response.error || 'Ошибка при добавлении автомобиля');
      }
    } catch (error) {
      handleApiError(error, 'Ошибка добавления автомобиля');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Добавить автомобиль</h2>
            <p className="text-sm text-muted-foreground">Добавьте новый автомобиль в автопарк</p>
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
                  onImagesUpdate={setImageFiles}
                />
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
                    {...(formData.id_car_type !== 0 && { value: formData.id_car_type.toString() })}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, id_car_type: Number(value) }))}
                    disabled={loading || (!Array.isArray(carTypes) || carTypes.length === 0)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={!Array.isArray(carTypes) || carTypes.length === 0 ? "Загрузка..." : "Выберите тип"} />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(carTypes) && carTypes.map(type => (
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
                    {...(formData.id_tip_zagryzki !== 0 && { value: formData.id_tip_zagryzki.toString() })}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, id_tip_zagryzki: Number(value) }))}
                    disabled={loading || (!Array.isArray(loadTypes) || loadTypes.length === 0)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={!Array.isArray(loadTypes) || loadTypes.length === 0 ? "Загрузка..." : "Выберите тип"} />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(loadTypes) && loadTypes.map(type => (
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
                    onChange={(e) => setFormData(prev => ({ ...prev, tonn_max: Number(e.target.value) }))}
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
                    onChange={(e) => setFormData(prev => ({ ...prev, m3_max: Number(e.target.value) }))}
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
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+375 29 000 00 00"
                  required
                  disabled={loading}
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
                    value={cityQuery}
                    onChange={async (e) => {
                      const v = e.target.value;
                      setCityQuery(v);
                      const q = v.trim();
                      if (q.length < 3) { setCitySuggestions([]); return; }
                      try {
                        const data = await searchPlaces(q, true);
                        setCitySuggestions(Array.isArray(data.items) ? data.items : []);
                      } catch {
                        setCitySuggestions([]);
                      }
                    }}
                    placeholder="Введите город и выберите из списка"
                    disabled={loading}
                    className="pl-10"
                  />
                  {citySuggestions.length > 0 && (
                    <ul className="absolute z-10 w-full border border-border bg-card rounded-md shadow-lg max-h-56 overflow-y-auto mt-1">
                      {citySuggestions.map((s, idx) => (
                        <li
                          key={idx}
                          className="px-3 py-2 hover:bg-muted cursor-pointer text-sm flex items-center gap-2"
                          onClick={() => {
                            const key = Object.keys(s.place || {})[0];
                            const coords = key ? s.place?.[key] : undefined;
                            setSelectedPlaces(prev => ({ ...prev, [key as string]: { ...coords, label: s.label, active: true } as any }));
                            setCityQuery('');
                            setCitySuggestions([]);
                          }}
                        >
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{s.label}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Выбранные города */}
                {Object.keys(selectedPlaces).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(selectedPlaces).map(([pid, p]) => (
                      <div 
                        key={pid} 
                        className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                          p.active !== false 
                            ? 'border-border bg-card hover:bg-muted/50' 
                            : 'border-border/50 bg-muted/30 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm text-foreground truncate font-medium">
                            {p.label || pid}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <label className="flex items-center gap-1.5 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={p.active !== false}
                              onChange={(e) => setSelectedPlaces(prev => ({ ...prev, [pid]: { ...p, active: e.target.checked } }))}
                              className="sr-only"
                            />
                            {p.active !== false ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600 group-hover:text-green-700" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                            )}
                            <span className="text-xs text-muted-foreground group-hover:text-foreground hidden sm:inline">
                              {p.active !== false ? 'Активен' : 'Неактивен'}
                            </span>
                          </label>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              setSelectedPlaces(prev => { const c = { ...prev }; delete c[pid]; return c; });
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

              {/* Кнопки */}
              <div className="flex gap-3 mt-6">
                <Button variant="outline" type="button" onClick={onClose} className="flex-1 bg-transparent" disabled={loading}>
                  Отмена
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Добавление...' : '+ Добавить'}
                </Button>
              </div>
            </form>
      </div>
    </div>
  );
}
