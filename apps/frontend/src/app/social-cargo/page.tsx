'use client';

import { useState, useEffect, useCallback } from 'react';
import { LandingLayout } from '@/components/layout/LandingLayout';
import { getSocialCargos, markCargoAsIrrelevant } from '@/shared/api/social-cargo';
import type { SocialCargo } from '@/types/social-cargo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Package, Truck, Calendar, AlertCircle, LogIn, Grid3x3, List, Key, ArrowRight, Phone, XCircle } from 'lucide-react';
import { Virtuoso, VirtuosoGrid } from 'react-virtuoso';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import Link from 'next/link';
import { useAuth } from '@/shared/context/auth-context';

export default function SocialCargoPage() {
  const { user } = useAuth();
  const [cargos, setCargos] = useState<SocialCargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 20;
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  // Фильтры
  const [contains, setContains] = useState('');
  const [notContains, setNotContains] = useState('');
  const [appliedContains, setAppliedContains] = useState('');
  const [appliedNotContains, setAppliedNotContains] = useState('');
  
  // Модальное окно для показа телефона
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedCargo, setSelectedCargo] = useState<SocialCargo | null>(null);
  
  // Отслеживаем грузы, отмеченные как неактуальные
  const [markedAsIrrelevant, setMarkedAsIrrelevant] = useState<Set<number>>(new Set());
  // Грузы, которые исчезают (для анимации)
  const [removingCargos, setRemovingCargos] = useState<Set<number>>(new Set());

  const fetchCargos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = { limit: pageSize, offset: 0 };
      if (appliedContains) params.contains = appliedContains;
      if (appliedNotContains) params.notContains = appliedNotContains;
      const response = await getSocialCargos(params);

      if (response.success) {
        setCargos(response.data);
        setTotal(response.pagination.total);
        setHasMore(response.pagination.hasMore);
        // lastUpdate removed
      } else {
        setError('Не удалось загрузить грузы');
      }
    } catch (err) {
      console.error('Error fetching cargos:', err);
      setError('Произошла ошибка при загрузке грузов');
    } finally {
      setLoading(false);
    }
  }, [pageSize, appliedContains, appliedNotContains]);

  // Загрузка при монтировании и изменении фильтров
  useEffect(() => {
    fetchCargos();
  }, [fetchCargos]);
  
  const handleApplyFilters = () => {
    setAppliedContains(contains);
    setAppliedNotContains(notContains);
  };

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    try {
      setIsLoadingMore(true);
      const params: any = { limit: pageSize, offset: cargos.length };
      if (appliedContains) params.contains = appliedContains;
      if (appliedNotContains) params.notContains = appliedNotContains;
      const response = await getSocialCargos(params);
      if (response.success) {
        setCargos(prev => [...prev, ...response.data]);
        setTotal(response.pagination.total);
        setHasMore(response.pagination.hasMore);
      }
    } catch (err) {
      console.error('Error loading more cargos:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, pageSize, cargos.length, appliedContains, appliedNotContains]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy', { locale: ru });
    } catch {
      return dateString;
    }
  };

  const handleMarkAsIrrelevant = async (cargoId: number) => {
    if (!user) {
      setSelectedCargo(cargos.find(c => c.id_cargo === cargoId) || null);
      setShowAuthModal(true);
      return;
    }

    if (markedAsIrrelevant.has(cargoId) || removingCargos.has(cargoId)) {
      return;
    }

    // Начинаем анимацию исчезновения
    setRemovingCargos(prev => new Set(prev).add(cargoId));
    setMarkedAsIrrelevant(prev => new Set(prev).add(cargoId));

    // Ждем завершения анимации перед удалением из списка
    setTimeout(() => {
      setCargos(prev => prev.filter(c => c.id_cargo !== cargoId));
      setTotal(prev => Math.max(0, prev - 1));
      setRemovingCargos(prev => {
        const newSet = new Set(prev);
        newSet.delete(cargoId);
        return newSet;
      });
    }, 300); // Длительность анимации

    // Асинхронно отправляем запрос на сервер (без показа ошибок пользователю)
    try {
      await markCargoAsIrrelevant(cargoId);
    } catch (error) {
      console.error('❌ [FRONTEND] Error marking cargo as irrelevant:', error);
    }
  };

  return (
    <LandingLayout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <Package className="h-16 w-16 mx-auto mb-4" />
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Грузы из социальных сетей
              </h1>
              <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                Актуальные объявления о грузах, собранные из различных источников.
              </p>
            </div>
          </div>
        </section>

        {/* Filters Section */}
        <section className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="contains" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Объявление содержит
                </Label>
                <Input
                  id="contains"
                  type="text"
                  value={contains}
                  onChange={(e) => setContains(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
                  placeholder="Москва, срочно, попутный (через запятую)"
                  className="w-full"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Можно вводить несколько слов через запятую
                </p>
              </div>
              
              <div className="flex-1">
                <Label htmlFor="notContains" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Объявление НЕ содержит
                </Label>
                <Input
                  id="notContains"
                  type="text"
                  value={notContains}
                  onChange={(e) => setNotContains(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
                  placeholder="срочно, попутный, хрупкое (через запятую)"
                  className="w-full"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Можно вводить несколько слов через запятую
                </p>
              </div>
              
              <div className="flex items-end md:pb-6">
                <Button
                  onClick={handleApplyFilters}
                  className="w-full md:w-auto px-8 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold shadow-md"
                >
                  Применить фильтры
                </Button>
              </div>
            </div>
            
            {(appliedContains || appliedNotContains) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {appliedContains && appliedContains.split(',').map((word, idx) => {
                  const trimmed = word.trim();
                  if (!trimmed) return null;
                  return (
                    <span key={`contains-${idx}`} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                      ✓ <strong className="ml-1">{trimmed}</strong>
                    </span>
                  );
                })}
                {appliedNotContains && appliedNotContains.split(',').map((word, idx) => {
                  const trimmed = word.trim();
                  if (!trimmed) return null;
                  return (
                    <span key={`not-contains-${idx}`} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                      ✗ <strong className="ml-1">{trimmed}</strong>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Content Section */}
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Stats and View Toggle */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Показано <strong>{cargos.length}</strong> из <strong>{total}</strong> грузов
              </p>
              <div className="flex items-center gap-4">
                {loading && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    Обновление...
                  </div>
                )}
                
                {/* View Mode Toggle */}
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded transition-all ${
                      viewMode === 'list'
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                    title="Список"
                  >
                    <List className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-all ${
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                    title="Сетка"
                  >
                    <Grid3x3 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Error State */}
            {error && (
              <Card className="mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="h-5 w-5" />
                    <span>{error}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cargos List */}
            {!loading && cargos.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Грузы не найдены
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Попробуйте изменить фильтры поиска
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div>
                {viewMode === 'list' ? (
                  <Virtuoso
                    data={cargos}
                    useWindowScroll={!((typeof window !== 'undefined') && document.getElementById('app-scroll'))}
                    customScrollParent={(typeof window !== 'undefined') ? (document.getElementById('app-scroll') as HTMLElement | null) || undefined : undefined}
                    overscan={200}
                    endReached={() => { if (hasMore) loadMore(); }}
                    components={{
                      Footer: () => (
                        hasMore ? (
                          <div className="py-6 text-center text-gray-600 dark:text-gray-300">
                            {isLoadingMore ? 'Загрузка...' : 'Прокрутите ниже для загрузки еще'}
                          </div>
                        ) : null
                      ),
                    }}
                    itemContent={(_index: number, cargo: SocialCargo) => (
                      <div
                        key={cargo.id_cargo}
                        className={`mb-4 bg-card border border-border rounded-lg p-4 space-y-4 hover:border-primary/50 transition-colors ${
                          removingCargos.has(cargo.id_cargo) ? 'opacity-0 scale-95 -translate-y-2' : 'opacity-100 scale-100 translate-y-0'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">📋</span>
                              <h3 className="font-semibold text-foreground">
                                {cargo.departure_point} → {cargo.arrival_point}
                              </h3>
                            </div>
                            <p className="text-xs text-muted-foreground">#{cargo.id_cargo}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-medium">Вес</p>
                            <p className="font-semibold">{cargo.tonn} т</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-medium">Дата периода</p>
                            <p className="font-semibold text-sm">
                              {formatDate(cargo.date_start)} - {formatDate(cargo.date_end)}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-medium">Тип транспорта</p>
                            <p className="font-semibold text-sm">{cargo.car_type_name || 'Не указан'}</p>
                          </div>
                        </div>

                        {cargo.opisanie && (
                          <div className="bg-muted p-3 rounded-lg border border-border">
                            <p className="text-sm text-foreground">{cargo.opisanie}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-wrap">
                            {user ? (
                              <>
                                {cargo.tel_1 && cargo.tel_1 !== '0' && cargo.tel_1.trim() !== '' ? (
                                  <a 
                                    href={`tel:${cargo.tel_1}`}
                                    className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                                  >
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                    <span>{cargo.tel_1}</span>
                                  </a>
                                ) : null}
                                {cargo.tel_2 && cargo.tel_2 !== '0' && cargo.tel_2.trim() !== '' && (
                                  <a 
                                    href={`tel:${cargo.tel_2}`}
                                    className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                                  >
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                    <span>{cargo.tel_2}</span>
                                  </a>
                                )}
                                {(!cargo.tel_1 || cargo.tel_1 === '0' || cargo.tel_1.trim() === '') && 
                                 (!cargo.tel_2 || cargo.tel_2 === '0' || cargo.tel_2.trim() === '') && (
                                  <Button
                                    onClick={() => {
                                      setSelectedCargo(cargo);
                                      setShowAuthModal(true);
                                    }}
                                    variant="outline"
                                    size="sm"
                                    className="border-primary/50 text-primary hover:bg-primary/10"
                                  >
                                    <Phone className="h-4 w-4 mr-2" />
                                    Показать контакты
                                  </Button>
                                )}
                              </>
                            ) : (
                              <Button
                                onClick={() => {
                                  setSelectedCargo(cargo);
                                  setShowAuthModal(true);
                                }}
                                variant="outline"
                                size="sm"
                                className="border-primary/50 text-primary hover:bg-primary/10"
                              >
                                <Phone className="h-4 w-4 mr-2" />
                                Показать контакты
                              </Button>
                            )}
                          </div>
                          {!markedAsIrrelevant.has(cargo.id_cargo) && !removingCargos.has(cargo.id_cargo) && (
                            <Button
                              onClick={() => handleMarkAsIrrelevant(cargo.id_cargo)}
                              disabled={removingCargos.has(cargo.id_cargo)}
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Отметить как неактуальный"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              <span className="text-xs">Не актуальный</span>
                            </Button>
                          )}
                          {markedAsIrrelevant.has(cargo.id_cargo) && (
                            <div className="flex items-center gap-1 text-xs text-red-500">
                              <AlertCircle className="w-4 h-4" />
                              <span>Не актуальный</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  />
                ) : (
                  <VirtuosoGrid
                    data={cargos}
                    useWindowScroll={!((typeof window !== 'undefined') && document.getElementById('app-scroll'))}
                    customScrollParent={(typeof window !== 'undefined') ? (document.getElementById('app-scroll') as HTMLElement | null) || undefined : undefined}
                    overscan={200}
                    endReached={() => { if (hasMore) loadMore(); }}
                    listClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full"
                    itemClassName="p-0"
                    computeItemKey={(_index: number, cargo: SocialCargo) => cargo.id_cargo}
                    components={{
                      Footer: () => (
                        hasMore ? (
                          <div className="py-6 col-span-full text-center text-gray-600 dark:text-gray-300">
                            {isLoadingMore ? 'Загрузка...' : 'Прокрутите ниже для загрузки еще'}
                          </div>
                        ) : null
                      ),
                    }}
                    itemContent={(_index: number, cargo: SocialCargo) => (
                      <div className="w-full h-full">
                        <div
                          key={cargo.id_cargo}
                          className={`bg-card border border-border rounded-lg p-5 space-y-4 hover:border-primary/50 transition-colors h-full flex flex-col ${
                            removingCargos.has(cargo.id_cargo) ? 'opacity-0 scale-95 -translate-y-2' : 'opacity-100 scale-100 translate-y-0'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">📋</span>
                                <h3 className="font-semibold text-foreground">
                                  {cargo.departure_point} → {cargo.arrival_point}
                                </h3>
                              </div>
                              <p className="text-xs text-muted-foreground ">#{cargo.id_cargo}</p>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Truck className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <span className="font-medium">{cargo.tonn}т</span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-muted-foreground">{cargo.car_type_name || 'Не указан'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-muted-foreground">
                                {formatDate(cargo.date_start)} - {formatDate(cargo.date_end)}
                              </span>
                            </div>
                            {cargo.opisanie && (
                              <p className="text-muted-foreground">{cargo.opisanie}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-sm mt-auto">
                            {user ? (
                              <>
                                {cargo.tel_1 && cargo.tel_1 !== '0' && cargo.tel_1.trim() !== '' ? (
                                  <a 
                                    href={`tel:${cargo.tel_1}`}
                                    className="flex items-center gap-2 font-medium text-foreground hover:text-primary transition-colors"
                                  >
                                    <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                    <span className="truncate">{cargo.tel_1}</span>
                                  </a>
                                ) : null}
                                {cargo.tel_2 && cargo.tel_2 !== '0' && cargo.tel_2.trim() !== '' && (
                                  <a 
                                    href={`tel:${cargo.tel_2}`}
                                    className="flex items-center gap-2 font-medium text-foreground hover:text-primary transition-colors"
                                  >
                                    <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                    <span className="truncate">{cargo.tel_2}</span>
                                  </a>
                                )}
                                {(!cargo.tel_1 || cargo.tel_1 === '0' || cargo.tel_1.trim() === '') && 
                                 (!cargo.tel_2 || cargo.tel_2 === '0' || cargo.tel_2.trim() === '') && (
                                  <Button
                                    onClick={() => {
                                      setSelectedCargo(cargo);
                                      setShowAuthModal(true);
                                    }}
                                    variant="outline"
                                    size="sm"
                                    className="border-primary/50 text-primary hover:bg-primary/10"
                                  >
                                    <Phone className="h-4 w-4 mr-2" />
                                    Контакты
                                  </Button>
                                )}
                              </>
                            ) : (
                              <Button
                                onClick={() => {
                                  setSelectedCargo(cargo);
                                  setShowAuthModal(true);
                                }}
                                variant="outline"
                                size="sm"
                                className="border-primary/50 text-primary hover:bg-primary/10"
                              >
                                <Phone className="h-4 w-4 mr-2" />
                                Контакты
                              </Button>
                            )}
                          </div>

                          {!markedAsIrrelevant.has(cargo.id_cargo) && !removingCargos.has(cargo.id_cargo) && (
                            <Button
                              onClick={() => handleMarkAsIrrelevant(cargo.id_cargo)}
                              disabled={removingCargos.has(cargo.id_cargo)}
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
                              title="Отметить как неактуальный"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              <span className="text-xs">Не актуальный</span>
                            </Button>
                          )}
                          {markedAsIrrelevant.has(cargo.id_cargo) && (
                            <div className="flex items-center gap-2 text-xs text-red-500">
                              <AlertCircle className="w-4 h-4 flex-shrink-0" />
                              <span>Не актуальный</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  />
                )}
              </div>
            )}

            {cargos.length >= 250 && (
              <Card className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                        <Key className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Достигнут лимит отображения (250 грузов)
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 mb-4">
                        Для доступа к полной базе данных и неограниченному количеству грузов получите API ключ. 
                        С API вы сможете интегрировать данные в свои системы и получать актуальную информацию в реальном времени.
                      </p>
                      <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                        <Link href="/registry">
                          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 shadow-md">
                            <Key className="h-4 w-4 mr-2" />
                            Получить API ключ
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                        <a 
                          href="https://api.logistgo.pro/docs" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex"
                        >
                          <Button variant="outline" className="border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                            Документация API
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Modal - показываем телефоны или регистрацию */}
        {showAuthModal && selectedCargo && (
          <div 
            className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" 
            onClick={() => {
              setShowAuthModal(false);
              setSelectedCargo(null);
            }}
          >
            <Card 
              className="w-full max-w-md bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-2xl" 
              onClick={(e) => e.stopPropagation()}
            >
              {user ? (
                // Для авторизованных - показываем телефоны
                <>
                  <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                    <CardTitle className="text-center text-2xl font-bold text-gray-900 dark:text-white">
                      Контактные данные
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500 rounded-full flex items-center justify-center">
                        <Phone className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    
                    <div className="text-center mb-6">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Груз #{selectedCargo.id_cargo}</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedCargo.departure_point} → {selectedCargo.arrival_point}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {selectedCargo.tel_1 && selectedCargo.tel_1 !== '0' && selectedCargo.tel_1.trim() !== '' && (
                        <a 
                          href={`tel:${selectedCargo.tel_1}`}
                          className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg border-2 border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700 transition-all"
                        >
                          <Phone className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Основной телефон</span>
                            <span className="text-lg text-gray-900 dark:text-white font-semibold">{selectedCargo.tel_1}</span>
                          </div>
                        </a>
                      )}
                      {selectedCargo.tel_2 && selectedCargo.tel_2 !== '0' && selectedCargo.tel_2.trim() !== '' && (
                        <a 
                          href={`tel:${selectedCargo.tel_2}`}
                          className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg border-2 border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700 transition-all"
                        >
                          <Phone className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Дополнительный телефон</span>
                            <span className="text-lg text-gray-900 dark:text-white font-semibold">{selectedCargo.tel_2}</span>
                          </div>
                        </a>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowAuthModal(false);
                        setSelectedCargo(null);
                      }}
                      className="w-full mt-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Закрыть
                    </Button>
                  </CardContent>
                </>
              ) : (
                // Для неавторизованных - окно регистрации
                <>
                  <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700/50 dark:to-gray-600/50">
                    <CardTitle className="text-center text-2xl font-bold text-gray-900 dark:text-white">
                      Требуется регистрация
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="flex items-center justify-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 rounded-full flex items-center justify-center">
                        <LogIn className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <p className="text-center text-gray-700 dark:text-gray-300 text-lg">
                      Чтобы увидеть контактные данные, необходимо зарегистрироваться на платформе
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link href="/registry" className="flex-1">
                        <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 text-white font-semibold shadow-lg">
                          Зарегистрироваться
                        </Button>
                      </Link>
                      <Link href="/login" className="flex-1">
                        <Button 
                          variant="outline" 
                          className="w-full border-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-semibold"
                        >
                          Войти
                        </Button>
                      </Link>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowAuthModal(false);
                        setSelectedCargo(null);
                      }}
                      className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Закрыть
                    </Button>
                  </CardContent>
                </>
              )}
            </Card>
          </div>
        )}
      </div>
    </LandingLayout>
  );
}
