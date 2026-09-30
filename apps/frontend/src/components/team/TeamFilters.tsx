"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';

interface TeamFiltersProps {
  onFiltersChange: (filters: {
    search: string;
    role: string;
    status: string;
    sortBy: string;
    sortOrder: string;
  }) => void;
  onReset: () => void;
}

export default function TeamFilters({ onFiltersChange, onReset }: TeamFiltersProps) {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onFiltersChange({
      search: value,
      role,
      status,
      sortBy,
      sortOrder
    });
  };

  const handleRoleChange = (value: string) => {
    setRole(value);
    onFiltersChange({
      search,
      role: value,
      status,
      sortBy,
      sortOrder
    });
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    onFiltersChange({
      search,
      role,
      status: value,
      sortBy,
      sortOrder
    });
  };

  const handleSortChange = (field: string) => {
    const newSortBy = field;
    const newSortOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    
    onFiltersChange({
      search,
      role,
      status,
      sortBy: newSortBy,
      sortOrder: newSortOrder
    });
  };

  const handleReset = () => {
    setSearch('');
    setRole('');
    setStatus('');
    setSortBy('name');
    setSortOrder('asc');
    onReset();
  };

  const hasActiveFilters = search || role || status || sortBy !== 'name' || sortOrder !== 'asc';

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Основные фильтры */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Поиск */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Поиск по имени, email или username..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Кнопка расширенных фильтров */}
            <Button
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Фильтры
              {hasActiveFilters && (
                <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  !
                </span>
              )}
            </Button>

            {/* Сброс фильтров */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4" />
                Сбросить
              </Button>
            )}
          </div>

          {/* Расширенные фильтры */}
          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              {/* Фильтр по роли */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Роль
                </label>
                <select
                  value={role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Все роли</option>
                  <option value="Владелец">Владельцы</option>
                  <option value="Администратор">Администраторы</option>
                  <option value="Пользователь">Пользователи</option>
                </select>
              </div>

              {/* Фильтр по статусу */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Статус
                </label>
                <select
                  value={status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Все статусы</option>
                  <option value="active">Активные</option>
                  <option value="inactive">Неактивные</option>
                </select>
              </div>

              {/* Сортировка */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Сортировка
                </label>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="name">По имени</option>
                    <option value="email">По email</option>
                    <option value="role">По роли</option>
                    <option value="createdAt">По дате добавления</option>
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSortChange(sortBy)}
                    className="px-3"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
