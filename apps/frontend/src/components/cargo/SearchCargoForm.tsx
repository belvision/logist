"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { handleApiError } from '@/lib/toast';

interface SearchFilters {
  query: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  sender: string;
  recipient: string;
}

interface CargoItem {
  id: string;
  name: string;
  weight: string;
  status: string;
  sender: string;
  recipient: string;
  createdAt: string;
  description: string;
}

export function SearchCargoForm() {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    sender: '',
    recipient: ''
  });

  const [searchResults, setSearchResults] = useState<CargoItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Моковые данные для демонстрации
  const mockCargoData: CargoItem[] = [
    {
      id: '1',
      name: 'Электроника',
      weight: '25',
      status: 'В пути',
      sender: 'ООО "ТехноМир"',
      recipient: 'ИП Иванов И.И.',
      createdAt: '2024-01-15',
      description: 'Компьютерная техника'
    },
    {
      id: '2',
      name: 'Одежда',
      weight: '15',
      status: 'Доставлено',
      sender: 'Магазин "Мода"',
      recipient: 'Петров П.П.',
      createdAt: '2024-01-14',
      description: 'Зимняя коллекция'
    },
    {
      id: '3',
      name: 'Мебель',
      weight: '120',
      status: 'Ожидает',
      sender: 'Мебельный салон',
      recipient: 'Сидоров С.С.',
      createdAt: '2024-01-16',
      description: 'Диван и кресла'
    }
  ];

  const handleFilterChange = (field: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = async () => {
    setIsSearching(true);
    
    try {
      // Имитация поиска
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Фильтрация данных по критериям
      let filteredResults = mockCargoData;
      
      if (filters.query) {
        filteredResults = filteredResults.filter(item =>
          item.name.toLowerCase().includes(filters.query.toLowerCase()) ||
          item.description.toLowerCase().includes(filters.query.toLowerCase())
        );
      }
      
      if (filters.status) {
        filteredResults = filteredResults.filter(item => item.status === filters.status);
      }
      
      if (filters.sender) {
        filteredResults = filteredResults.filter(item =>
          item.sender.toLowerCase().includes(filters.sender.toLowerCase())
        );
      }
      
      if (filters.recipient) {
        filteredResults = filteredResults.filter(item =>
          item.recipient.toLowerCase().includes(filters.recipient.toLowerCase())
        );
      }
      
      if (filters.dateFrom) {
        filteredResults = filteredResults.filter(item => item.createdAt >= filters.dateFrom);
      }
      
      if (filters.dateTo) {
        filteredResults = filteredResults.filter(item => item.createdAt <= filters.dateTo);
      }
      
      setSearchResults(filteredResults);
    } catch (error) {
      handleApiError(error, 'Ошибка при поиске');
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      query: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      sender: '',
      recipient: ''
    });
    setSearchResults([]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'В пути':
        return 'bg-blue-100 text-blue-800';
      case 'Доставлено':
        return 'bg-green-100 text-green-800';
      case 'Ожидает':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Поиск грузов</h3>
        <div className="space-y-4">
          {/* Основной поисковый запрос */}
          <div>
            <Label htmlFor="query">Поиск по названию или описанию</Label>
            <Input
              id="query"
              value={filters.query}
              onChange={(e) => handleFilterChange('query', e.target.value)}
              placeholder="Введите название груза или описание"
            />
          </div>

          {/* Фильтры */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="status">Статус</Label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Все статусы</option>
                <option value="В пути">В пути</option>
                <option value="Доставлено">Доставлено</option>
                <option value="Ожидает">Ожидает</option>
              </select>
            </div>

            <div>
              <Label htmlFor="sender">Отправитель</Label>
              <Input
                id="sender"
                value={filters.sender}
                onChange={(e) => handleFilterChange('sender', e.target.value)}
                placeholder="Название отправителя"
              />
            </div>

            <div>
              <Label htmlFor="recipient">Получатель</Label>
              <Input
                id="recipient"
                value={filters.recipient}
                onChange={(e) => handleFilterChange('recipient', e.target.value)}
                placeholder="Название получателя"
              />
            </div>

            <div>
              <Label htmlFor="dateFrom">Дата от</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="dateTo">Дата до</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>
          </div>

          {/* Кнопки поиска */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClearFilters}
            >
              Очистить
            </Button>
            <Button
              type="button"
              onClick={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? 'Поиск...' : 'Найти грузы'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Результаты поиска */}
      {searchResults.length > 0 && (
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4">
            Найдено грузов: {searchResults.length}
          </h4>
          <div className="space-y-4">
            {searchResults.map((cargo) => (
              <div
                key={cargo.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-medium text-lg">{cargo.name}</h5>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cargo.status)}`}>
                    {cargo.status}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Вес:</span> {cargo.weight} кг
                  </div>
                  <div>
                    <span className="font-medium">Дата создания:</span> {cargo.createdAt}
                  </div>
                  <div>
                    <span className="font-medium">Отправитель:</span> {cargo.sender}
                  </div>
                  <div>
                    <span className="font-medium">Получатель:</span> {cargo.recipient}
                  </div>
                </div>
                {cargo.description && (
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Описание:</span> {cargo.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {searchResults.length === 0 && filters.query && !isSearching && (
        <Card className="p-6">
          <p className="text-gray-500 text-center">По вашему запросу ничего не найдено</p>
        </Card>
      )}
    </div>
  );
}
