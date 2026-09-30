"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car } from '@/shared/api/cars';

interface CarCardProps {
  car: Car;
  carType?: string;
  loadType?: string;
  onEdit?: (car: Car) => void;
  onDelete?: (car: Car) => void;
  onToggleFlags?: (carId: string, flags: { subscription?: boolean; search?: boolean }) => void;
}

export function CarCard({ car, carType, loadType, onEdit, onDelete, onToggleFlags }: CarCardProps) {
  return (
    <Card className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col hover:scale-[1.02]">
      {/* Декоративный градиент */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="p-4 sm:p-6 flex-1 flex flex-col">
        {/* Заголовок с иконкой */}
        <div className="flex items-start justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            {/* Иконка автомобиля */}
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              {/* Индикатор поиска/подписки */}
              {(car.search || car.subscription) && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white bg-green-500"></div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                {car.title}
              </h3>
              <p className="text-sm text-gray-600 truncate">
                {carType} • {loadType}
              </p>
            </div>
          </div>
        </div>

        {/* Основная информация */}
        <div className="space-y-4 mb-6 flex-1">
          {/* Грузоподъемность */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Грузоподъемность</span>
            </div>
            <span className="text-sm text-gray-600">
              {car.tonn_min} - {car.tonn_max} т
            </span>
          </div>
          
          {/* Объем */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Объем</span>
            </div>
            <span className="text-sm text-gray-600">
              {car.m3_min} - {car.m3_max} м³
            </span>
          </div>

          {/* Цена */}
          {(car.price !== undefined && car.price !== null) && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Цена</span>
              </div>
              <span className="text-sm text-gray-600">{car.price} ₽</span>
            </div>
          )}

          {/* Переключатели */}
          <div className="flex gap-2">
            <Button
              variant={car.subscription ? "default" : "outline"}
              size="sm"
              onClick={() => onToggleFlags?.(car.id_cars.toString(), { subscription: !car.subscription })}
              className={`flex-1 ${
                car.subscription 
                  ? "bg-green-500 hover:bg-green-600 text-white border-green-500" 
                  : "text-gray-500 hover:bg-gray-100 border-gray-200"
              }`}
            >
              <svg className={`w-4 h-4 mr-2 ${car.subscription ? "text-white" : "text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className={car.subscription ? "font-medium" : ""}>Подписка</span>
            </Button>
            <Button
              variant={car.search ? "default" : "outline"}
              size="sm"
              onClick={() => onToggleFlags?.(car.id_cars.toString(), { search: !car.search })}
              className={`flex-1 ${
                car.search 
                  ? "bg-blue-500 hover:bg-blue-600 text-white border-blue-500" 
                  : "text-gray-500 hover:bg-gray-100 border-gray-200"
              }`}
            >
              <svg className={`w-4 h-4 mr-2 ${car.search ? "text-white" : "text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className={car.search ? "font-medium" : ""}>Поиск</span>
            </Button>
          </div>
        </div>

        {/* Действия */}
        {(onEdit || onDelete) && (
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t border-gray-200 mt-auto">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(car)}
                className="!w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="hidden sm:inline">Редактировать</span>
                <span className="sm:hidden">Изменить</span>
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(car)}
                className="!w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700 text-red-600 border-red-200 text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="hidden sm:inline">Удалить</span>
                <span className="sm:hidden">Удалить</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}