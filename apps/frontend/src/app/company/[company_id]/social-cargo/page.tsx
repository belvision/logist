'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { getSocialCargos, markCargoAsIrrelevant } from '@/shared/api/social-cargo';
import type { SocialCargo } from '@/types/social-cargo';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Package, Truck, Calendar, AlertCircle, Grid3x3, List, Phone, XCircle } from 'lucide-react';
import { useAuth } from '@/shared/context/auth-context';
import { Virtuoso, VirtuosoGrid } from 'react-virtuoso';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { usePageHeader } from '@/shared/context/page-header-context';
import { handleApiError } from '@/lib/toast';

function SocialCargoPageHeader() {
  const { setHeader } = usePageHeader();

  useEffect(() => {
    setHeader(
      'Грузы из социальных сетей',
      'Актуальные объявления о грузах, собранные из различных источников',
      undefined,
      undefined
    );

    return () => {
      setHeader('Обзор компании', 'Статистика и управление вашей логистической компанией');
    };
  }, [setHeader]);

  return null;
}

export default function CompanySocialCargoPage() {
  const { user, loading: authLoading } = useAuth();
  const [cargos, setCargos] = useState<SocialCargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 20;
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  // auto-refresh removed
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  // Фильтры
  const [contains, setContains] = useState('');
  const [notContains, setNotContains] = useState('');
  const [appliedContains, setAppliedContains] = useState('');
  const [appliedNotContains, setAppliedNotContains] = useState('');
  
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
      handleApiError(err, 'Ошибка загрузки грузов');
      setError('Произошла ошибка при загрузке грузов');
    } finally {
      setLoading(false);
    }
  }, [pageSize, appliedContains, appliedNotContains]);

  // Загрузка при монтировании и изменении фильтров
  // Ждем завершения загрузки авторизации перед загрузкой грузов
  useEffect(() => {
    if (!authLoading) {
      // Небольшая задержка для обеспечения инициализации всех модулей
      const timer = setTimeout(() => {
        fetchCargos();
      }, 50);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [authLoading]);

  // Auto-refresh removed

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
      handleApiError(err, 'Ошибка загрузки дополнительных грузов');
    } finally {
      setIsLoadingMore(false);
    }
    return undefined;
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
    } catch {
    }
  };

  // Показываем загрузку, пока проверяется авторизация
  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <SocialCargoPageHeader />
      <div className="space-y-6">

        {/* Filters */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="contains" className="text-sm font-medium text-foreground mb-2 block">
                  Объявление содержит
                </Label>
                <Input
                  id="contains"
                  type="text"
                  value={contains}
                  onChange={(e) => setContains(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
                  placeholder="Москва, срочно, попутный (через запятую)"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Можно вводить несколько слов через запятую
                </p>
              </div>

              <div className="flex-1">
                <Label htmlFor="notContains" className="text-sm font-medium text-foreground mb-2 block">
                  Объявление НЕ содержит
                </Label>
                <Input
                  id="notContains"
                  type="text"
                  value={notContains}
                  onChange={(e) => setNotContains(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
                  placeholder="срочно, попутный, хрупкое (через запятую)"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Можно вводить несколько слов через запятую
                </p>
              </div>

              <div className="flex items-end md:pb-6">
                <Button
                  onClick={handleApplyFilters}
                  className="w-full md:w-auto px-8"
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
                    <span key={`contains-${idx}`} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-700">
                      ✓ <strong className="ml-1">{trimmed}</strong>
                    </span>
                  );
                })}
                {appliedNotContains && appliedNotContains.split(',').map((word, idx) => {
                  const trimmed = word.trim();
                  if (!trimmed) return null;
                  return (
                    <span key={`not-contains-${idx}`} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-700">
                      ✗ <strong className="ml-1">{trimmed}</strong>
                    </span>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats and View Toggle */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Показано <strong className="text-foreground">{cargos.length}</strong> из <strong className="text-foreground">{total}</strong> грузов
          </p>
          <div className="flex items-center gap-4">
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                Обновление...
              </div>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-muted p-1 rounded-lg border border-border">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-all ${
                  viewMode === 'list'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Список"
              >
                <List className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-all ${
                  viewMode === 'grid'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
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
          <Card className="bg-destructive/10 border-destructive/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cargos List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : cargos.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground">Грузы не найдены</h3>
              <p className="text-muted-foreground">
                Попробуйте изменить фильтры поиска
              </p>
            </div>
          </div>
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
                  <div className="py-6 text-center text-muted-foreground">
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
                        <p className="text-sm text-foreground line-clamp-3">{cargo.opisanie}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-wrap">
                        {cargo.tel_1 && cargo.tel_1 !== '0' && cargo.tel_1.trim() !== '' && (
                          <a
                            href={`tel:${cargo.tel_1}`}
                            className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                          >
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span>{cargo.tel_1}</span>
                          </a>
                        )}
                        {cargo.tel_2 && cargo.tel_2 !== '0' && cargo.tel_2.trim() !== '' && (
                          <a
                            href={`tel:${cargo.tel_2}`}
                            className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                          >
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span>{cargo.tel_2}</span>
                          </a>
                        )}
                      </div>
                      {user && !markedAsIrrelevant.has(cargo.id_cargo) && !removingCargos.has(cargo.id_cargo) && (
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
            listClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            itemClassName="p-0"
            computeItemKey={(_index: number, cargo: SocialCargo) => cargo.id_cargo}
            components={{
              Footer: () => (
                hasMore ? (
                  <div className="py-6 col-span-full text-center text-muted-foreground">
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
                        <h3 className="font-semibold text-foreground line-clamp-1">
                          {cargo.departure_point} → {cargo.arrival_point}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground">#{cargo.id_cargo}</p>
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
                      <p className="text-muted-foreground ">{cargo.opisanie}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm mt-auto">
                    {cargo.tel_1 && cargo.tel_1 !== '0' && cargo.tel_1.trim() !== '' && (
                      <a
                        href={`tel:${cargo.tel_1}`}
                        className="flex items-center gap-2 font-medium text-foreground hover:text-primary transition-colors"
                      >
                        <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{cargo.tel_1}</span>
                      </a>
                    )}
                    {cargo.tel_2 && cargo.tel_2 !== '0' && cargo.tel_2.trim() !== '' && (
                      <a
                        href={`tel:${cargo.tel_2}`}
                        className="flex items-center gap-2 font-medium text-foreground hover:text-primary transition-colors"
                      >
                        <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{cargo.tel_2}</span>
                      </a>
                    )}
                  </div>

                  {user && !markedAsIrrelevant.has(cargo.id_cargo) && !removingCargos.has(cargo.id_cargo) && (
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
      </div>
    </AppLayout>
  );
}

