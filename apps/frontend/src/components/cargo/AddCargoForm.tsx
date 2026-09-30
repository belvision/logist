"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { showToast, handleApiError } from '@/lib/toast';

interface CargoFormData {
  name: string;
  weight: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
  };
  sender: {
    name: string;
    address: string;
    phone: string;
  };
  recipient: {
    name: string;
    address: string;
    phone: string;
  };
  description: string;
}

export function AddCargoForm() {
  const [formData, setFormData] = useState<CargoFormData>({
    name: '',
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: ''
    },
    sender: {
      name: '',
      address: '',
      phone: ''
    },
    recipient: {
      name: '',
      address: '',
      phone: ''
    },
    description: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof CargoFormData],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Здесь будет логика отправки данных на сервер
      console.log('Данные груза:', formData);
      
      // Имитация задержки
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Сброс формы после успешной отправки
      setFormData({
        name: '',
        weight: '',
        dimensions: { length: '', width: '', height: '' },
        sender: { name: '', address: '', phone: '' },
        recipient: { name: '', address: '', phone: '' },
        description: ''
      });
      
      showToast.success('Груз успешно добавлен!');
    } catch (error) {
      handleApiError(error, 'Ошибка при добавлении груза');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Добавить новый груз</h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Основная информация о грузе */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Название груза *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Введите название груза"
              required
            />
          </div>
          <div>
            <Label htmlFor="weight">Вес (кг) *</Label>
            <Input
              id="weight"
              type="number"
              value={formData.weight}
              onChange={(e) => handleInputChange('weight', e.target.value)}
              placeholder="Введите вес в килограммах"
              required
            />
          </div>
        </div>

        {/* Размеры груза */}
        <div>
          <Label className="text-base font-medium">Размеры (см)</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <div>
              <Label htmlFor="length">Длина</Label>
              <Input
                id="length"
                type="number"
                value={formData.dimensions.length}
                onChange={(e) => handleInputChange('dimensions.length', e.target.value)}
                placeholder="Длина"
              />
            </div>
            <div>
              <Label htmlFor="width">Ширина</Label>
              <Input
                id="width"
                type="number"
                value={formData.dimensions.width}
                onChange={(e) => handleInputChange('dimensions.width', e.target.value)}
                placeholder="Ширина"
              />
            </div>
            <div>
              <Label htmlFor="height">Высота</Label>
              <Input
                id="height"
                type="number"
                value={formData.dimensions.height}
                onChange={(e) => handleInputChange('dimensions.height', e.target.value)}
                placeholder="Высота"
              />
            </div>
          </div>
        </div>

        {/* Информация об отправителе */}
        <div>
          <Label className="text-base font-medium">Отправитель</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <div>
              <Label htmlFor="senderName">Имя/Название *</Label>
              <Input
                id="senderName"
                value={formData.sender.name}
                onChange={(e) => handleInputChange('sender.name', e.target.value)}
                placeholder="Имя отправителя"
                required
              />
            </div>
            <div>
              <Label htmlFor="senderAddress">Адрес *</Label>
              <Input
                id="senderAddress"
                value={formData.sender.address}
                onChange={(e) => handleInputChange('sender.address', e.target.value)}
                placeholder="Адрес отправителя"
                required
              />
            </div>
            <div>
              <Label htmlFor="senderPhone">Телефон *</Label>
              <Input
                id="senderPhone"
                value={formData.sender.phone}
                onChange={(e) => handleInputChange('sender.phone', e.target.value)}
                placeholder="Телефон отправителя"
                required
              />
            </div>
          </div>
        </div>

        {/* Информация о получателе */}
        <div>
          <Label className="text-base font-medium">Получатель</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <div>
              <Label htmlFor="recipientName">Имя/Название *</Label>
              <Input
                id="recipientName"
                value={formData.recipient.name}
                onChange={(e) => handleInputChange('recipient.name', e.target.value)}
                placeholder="Имя получателя"
                required
              />
            </div>
            <div>
              <Label htmlFor="recipientAddress">Адрес *</Label>
              <Input
                id="recipientAddress"
                value={formData.recipient.address}
                onChange={(e) => handleInputChange('recipient.address', e.target.value)}
                placeholder="Адрес получателя"
                required
              />
            </div>
            <div>
              <Label htmlFor="recipientPhone">Телефон *</Label>
              <Input
                id="recipientPhone"
                value={formData.recipient.phone}
                onChange={(e) => handleInputChange('recipient.phone', e.target.value)}
                placeholder="Телефон получателя"
                required
              />
            </div>
          </div>
        </div>

        {/* Описание */}
        <div>
          <Label htmlFor="description">Описание груза</Label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Дополнительная информация о грузе"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>

        {/* Кнопки */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData({
                name: '',
                weight: '',
                dimensions: { length: '', width: '', height: '' },
                sender: { name: '', address: '', phone: '' },
                recipient: { name: '', address: '', phone: '' },
                description: ''
              });
            }}
          >
            Очистить
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Добавление...' : 'Добавить груз'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
