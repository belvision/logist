'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Route, 
  MapPin, 
  Calendar, 
  Weight, 
  Package, 
  DollarSign, 
  Eye, 
  EyeOff,
  Truck,
  Percent
} from 'lucide-react';

interface CompanionCargo {
  id_cargo: number;
  departure_place_id: number;
  arrival_place_id: number;
  departure_point: string;
  arrival_point: string;
  tonn?: number;
  m3?: number;
  car_type?: string;
  price?: string;
  opisanie?: string;
  download?: string;
  period?: string;
  payment?: string;
  date_start?: string;
  date_end?: string;
  statuse: number;
  match_percent: number;
  route?: {
    distance: number;
    duration: number;
    geometry: Record<string, unknown>;
  };
  company?: {
    name: string;
    unp: string;
    entity_type: string;
    ur_address: string;
    tel_1: string;
    tel_2?: string;
    email?: string;
  };
}

interface SimilarListProps {
  items: CompanionCargo[];
  openId: string | null;
  onOpenChange: (id: string | null) => void;
  visibleIds: Set<string>;
  soloId: string | null;
  onSoloToggle: (id: string) => void;
  onFocus: (id: string) => void;
}

export function SimilarList({
  items,
  visibleIds,
  soloId,
  onSoloToggle,
  onFocus,
}: SimilarListProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Не указано';
    try {
      return new Date(dateString).toLocaleDateString('ru-RU');
    } catch {
      return dateString;
    }
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return 'Не указано';
    return `${Math.round(distance)} км`;
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return 'Не указано';
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    return `${hours}ч ${minutes}м`;
  };

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Попутные грузы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Начните поиск, чтобы увидеть попутные грузы</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="h-5 w-5" />
          Попутные грузы ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => {
          const itemId = String(item.id_cargo);
          const isVisible = visibleIds.has(itemId);
          const isSolo = soloId === itemId;
          const isExpanded = expandedItems.has(itemId);

          return (
            <Card key={item.id_cargo} className={`transition-all ${
              isVisible ? 'ring-2 ring-blue-200' : 'opacity-50'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Percent className="h-3 w-3" />
                      {item.match_percent}%
                    </Badge>
                    <span className="text-sm font-medium">Груз #{item.id_cargo}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onFocus(itemId)}
                      className="h-8 w-8 p-0"
                    >
                      {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSoloToggle(itemId)}
                      className={`h-8 px-2 ${isSolo ? 'bg-blue-100' : ''}`}
                    >
                      {isSolo ? 'Все' : 'Только'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{item.departure_point}</span>
                    <span className="text-gray-400">→</span>
                    <span className="font-medium">{item.arrival_point}</span>
                  </div>

                  {item.route && (
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span>Расстояние: {formatDistance(item.route.distance)}</span>
                      <span>Время: {formatDuration(item.route.duration)}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {item.tonn && (
                      <Badge variant="outline" className="text-xs">
                        <Weight className="h-3 w-3 mr-1" />
                        {item.tonn} т
                      </Badge>
                    )}
                    {item.m3 && (
                      <Badge variant="outline" className="text-xs">
                        <Package className="h-3 w-3 mr-1" />
                        {item.m3} м³
                      </Badge>
                    )}
                    {item.car_type && (
                      <Badge variant="outline" className="text-xs">
                        <Truck className="h-3 w-3 mr-1" />
                        {item.car_type}
                      </Badge>
                    )}
                  </div>

                  {(item.date_start || item.price) && (
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      {item.date_start && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(item.date_start)}
                        </div>
                      )}
                      {item.price && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {item.price}
                        </div>
                      )}
                    </div>
                  )}

                  {item.opisanie && (
                    <div className="text-xs text-gray-600">
                      <strong>Описание:</strong> {item.opisanie}
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(itemId)}
                    className="w-full text-xs"
                  >
                    {isExpanded ? 'Скрыть детали' : 'Показать детали'}
                  </Button>

                  {isExpanded && (
                    <div className="space-y-3 pt-2 border-t">
                      {/* Данные груза */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {item.download && (
                          <div>
                            <strong>Загрузка:</strong> {item.download}
                          </div>
                        )}
                        {item.period && (
                          <div>
                            <strong>Период:</strong> {item.period}
                          </div>
                        )}
                        {item.payment && (
                          <div>
                            <strong>Оплата:</strong> {item.payment}
                          </div>
                        )}
                        {item.date_end && (
                          <div>
                            <strong>До:</strong> {formatDate(item.date_end)}
                          </div>
                        )}
                      </div>

                      {/* Данные компании */}
                      {item.company && (
                        <div className="space-y-2">
                          <div className="text-sm font-semibold text-gray-700 border-b pb-1">
                            Данные компании
                          </div>
                          <div className="grid grid-cols-1 gap-2 text-xs">
                            <div>
                              <strong>Название:</strong> {item.company.name}
                            </div>
                            <div>
                              <strong>УНП:</strong> {item.company.unp}
                            </div>
                            <div>
                              <strong>Тип:</strong> {item.company.entity_type}
                            </div>
                            <div>
                              <strong>Адрес:</strong> {item.company.ur_address}
                            </div>
                            <div>
                              <strong>Телефон:</strong> {item.company.tel_1}
                            </div>
                            {item.company.tel_2 && (
                              <div>
                                <strong>Телефон 2:</strong> {item.company.tel_2}
                              </div>
                            )}
                            {item.company.email && (
                              <div>
                                <strong>Email:</strong> {item.company.email}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}
