'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Truck, 
  Package, 
  MapPin, 
  ArrowRight,
  Zap
} from 'lucide-react';

export function QuickSearch() {
  const router = useRouter();
  const params = useParams();
  const companyId = params?.['company_id'] as string;
  const [searchType, setSearchType] = useState<'cars' | 'cargo'>('cars');
  const [location, setLocation] = useState('');

  const handleQuickSearch = () => {
    if (!location.trim()) return;
    
    if (searchType === 'cars') {
      router.push(`/company/${companyId}/car-search?location=${encodeURIComponent(location)}`);
    } else {
      router.push(`/company/${companyId}/cargo-search?location=${encodeURIComponent(location)}`);
    }
  };

  const popularSearches = [
    { type: 'cars', text: 'Грузовики в Минске', icon: Truck },
    { type: 'cargo', text: 'Грузы Минск-Москва', icon: Package },
    { type: 'cars', text: 'Фуры в Москве', icon: Truck },
    { type: 'cargo', text: 'Грузы СПб-Минск', icon: Package },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Быстрый поиск
          </h2>
          <p className="text-xl text-gray-600">
            Найдите автомобили или грузы за несколько секунд
          </p>
        </div>

        <Card className="max-w-2xl mx-auto shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Zap className="h-6 w-6 text-blue-600" />
              Начните поиск прямо сейчас
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Переключатель типа поиска */}
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                <Button
                  variant={searchType === 'cars' ? 'default' : 'ghost'}
                  onClick={() => setSearchType('cars')}
                  className={`flex-1 ${
                    searchType === 'cars' 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'hover:bg-gray-200'
                  }`}
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Поиск автомобилей
                </Button>
                <Button
                  variant={searchType === 'cargo' ? 'default' : 'ghost'}
                  onClick={() => setSearchType('cargo')}
                  className={`flex-1 ${
                    searchType === 'cargo' 
                      ? 'bg-green-600 text-white shadow-md' 
                      : 'hover:bg-gray-200'
                  }`}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Поиск грузов
                </Button>
              </div>

              {/* Поле ввода */}
              <div className="space-y-2">
                <Label htmlFor="location">
                  {searchType === 'cars' ? 'Где искать автомобили?' : 'Откуда отправляется груз?'}
                </Label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder={searchType === 'cars' 
                        ? 'Введите город или адрес...' 
                        : 'Введите город отправления...'
                      }
                      className="pl-10"
                      onKeyPress={(e) => e.key === 'Enter' && handleQuickSearch()}
                    />
                  </div>
                  <Button 
                    onClick={handleQuickSearch}
                    disabled={!location.trim()}
                    className="px-6"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Найти
                  </Button>
                </div>
              </div>

              {/* Популярные поиски */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">
                  Популярные поиски:
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {popularSearches.map((search, index) => {
                    const Icon = search.icon;
                    return (
                      <Button
                        key={index}
                        variant="outline"
                        onClick={() => {
                          setSearchType(search.type as 'cars' | 'cargo');
                          setLocation(search.text.split(' ').slice(1).join(' '));
                        }}
                        className="justify-start text-left h-auto p-3 hover:bg-gray-50"
                      >
                        <Icon className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm">{search.text}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Кнопки быстрого доступа */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button
                  onClick={() => router.push('/car-search')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Расширенный поиск автомобилей
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button
                  onClick={() => router.push(`/company/${companyId}/cargo-search`)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Поиск попутных грузов
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
