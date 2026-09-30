# Система отзывов и рейтингов

## Описание

Полнофункциональная система отзывов и рейтингов для оценки компаний в логистической платформе LogisticPro. Система позволяет пользователям оставлять отзывы, просматривать рейтинги компаний и модерировать контент.

## Основные возможности

### 1. Создание отзывов
- ✅ Оценка от 1 до 5 звезд
- ✅ Текстовый отзыв (до 2000 символов)
- ✅ Связь с грузом или маршрутом (опционально)
- ✅ Проверка: один пользователь - один отзыв на компанию
- ✅ Запрет на отзывы о собственной компании
- ✅ Автоматическая отправка на модерацию

### 2. Просмотр отзывов
- ✅ Список отзывов с пагинацией (10 отзывов на страницу)
- ✅ Фильтрация по статусу (одобрен, ожидает модерации, отклонен, скрыт)
- ✅ Фильтрация по рейтингу (min/max)
- ✅ Сортировка (по дате, рейтингу, полезности)
- ✅ Информация об авторе и его компании
- ✅ Время публикации отзыва

### 3. Статистика рейтинга компании
- ✅ Средняя оценка (с точностью до десятых)
- ✅ Общее количество отзывов
- ✅ Распределение по звездам (1-5)
- ✅ Количество одобренных отзывов
- ✅ Количество отзывов на модерации
- ✅ Визуализация распределения рейтингов

### 4. Модерация отзывов
- ✅ Статусы: "Ожидает модерации", "Одобрен", "Отклонен", "Скрыт"
- ✅ Комментарий модератора
- ✅ Интеграция с системой поддержки (support tickets)
- ✅ Жалобы на отзывы через тикеты поддержки

### 5. Интерактивность
- ✅ Отметка отзыва как полезного (лайк)
- ✅ Счетчик полезности отзыва
- ✅ Жалоба на отзыв
- ✅ Удаление отзыва (автор или администратор)

### 6. Интеграция с аналитикой
- ✅ Отображение реального рейтинга в аналитике компании
- ✅ Замена расчетного рейтинга на реальные отзывы
- ✅ Статистика отзывов в dashboard компании

## Структура базы данных

### Таблица `reviews`

```sql
CREATE TABLE reviews (
  id_review UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Автор отзыва
  id_reviewer UUID NOT NULL REFERENCES users(id_user) ON DELETE CASCADE,
  reviewer_company_id UUID REFERENCES company(id_company) ON DELETE SET NULL,
  
  -- Компания, которую оценивают
  id_reviewed_company UUID NOT NULL REFERENCES company(id_company) ON DELETE CASCADE,
  
  -- Оценка и текст
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  
  -- Статус модерации
  status review_status NOT NULL DEFAULT 'Ожидает модерации',
  
  -- Модерация
  moderated_by UUID REFERENCES users(id_user) ON DELETE SET NULL,
  moderated_at TIMESTAMP,
  moderation_comment TEXT,
  
  -- Связь с тикетом поддержки
  id_support_ticket UUID REFERENCES support_tickets(id_ticket) ON DELETE SET NULL,
  
  -- Контекст сотрудничества
  related_cargo_id INTEGER REFERENCES cargo(id_cargo) ON DELETE SET NULL,
  related_route_id INTEGER REFERENCES routes(id_routes) ON DELETE SET NULL,
  
  -- Полезность
  helpful_count INTEGER DEFAULT 0,
  
  -- Временные метки
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ограничения
  CONSTRAINT reviews_reviewer_company_unique 
    UNIQUE (id_reviewer, id_reviewed_company)
);

-- Индексы
CREATE INDEX idx_reviews_reviewed_company ON reviews(id_reviewed_company);
CREATE INDEX idx_reviews_reviewer ON reviews(id_reviewer);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_rating ON reviews(rating);
```

### Enum типы

```sql
CREATE TYPE review_status AS ENUM (
  'Ожидает модерации',
  'Одобрен',
  'Отклонен',
  'Скрыт'
);
```

## Backend API

### Endpoints

#### 1. Создать отзыв
```http
POST /api/reviews
Authorization: Bearer {token}
Content-Type: application/json

{
  "id_reviewed_company": "uuid",
  "rating": 5,
  "review_text": "Отличная компания!",
  "related_cargo_id": 123,
  "related_route_id": 456
}
```

#### 2. Получить отзывы
```http
GET /api/reviews?id_reviewed_company={uuid}&status=Одобрен&page=1&limit=10&sort_by=created_at&sort_order=desc
```

#### 3. Получить статистику рейтинга компании
```http
GET /api/reviews/company/{companyId}/stats
```

#### 4. Обновить отзыв
```http
PUT /api/reviews/{reviewId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "rating": 4,
  "review_text": "Обновленный отзыв"
}
```

#### 5. Модерировать отзыв
```http
POST /api/reviews/{reviewId}/moderate
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "Одобрен",
  "moderation_comment": "Отзыв соответствует правилам"
}
```

#### 6. Отметить отзыв как полезный
```http
POST /api/reviews/{reviewId}/helpful
```

#### 7. Пожаловаться на отзыв
```http
POST /api/reviews/report
Authorization: Bearer {token}
Content-Type: application/json

{
  "id_review": "uuid",
  "reason": "Причина жалобы (минимум 10 символов)"
}
```

#### 8. Удалить отзыв
```http
DELETE /api/reviews/{reviewId}
Authorization: Bearer {token}
```

#### 9. Получить отзывы на модерации (админ)
```http
GET /api/reviews/moderation/pending?limit=50
Authorization: Bearer {token}
```

## Frontend компоненты

### 1. StarRating
Компонент отображения и выбора рейтинга в виде звезд.

**Props:**
- `rating: number` - текущий рейтинг
- `maxRating?: number` - максимальный рейтинг (по умолчанию 5)
- `size?: 'sm' | 'md' | 'lg'` - размер звезд
- `interactive?: boolean` - можно ли выбирать рейтинг
- `onChange?: (rating: number) => void` - callback при изменении
- `showNumber?: boolean` - показывать ли числовое значение

### 2. RatingDistribution
Визуализация распределения рейтингов.

**Props:**
- `ratingBreakdown: { 1-5: number }` - количество отзывов по каждой оценке
- `totalReviews: number` - общее количество отзывов

### 3. ReviewCard
Карточка отдельного отзыва.

**Props:**
- `review: Review` - данные отзыва
- `onMarkHelpful?: (reviewId: string) => void`
- `onReport?: (reviewId: string) => void`
- `onDelete?: (reviewId: string) => void`
- `canDelete?: boolean`

### 4. ReviewsList
Список отзывов с пагинацией.

**Props:**
- `companyId?: string` - фильтр по компании
- `userId?: string` - фильтр по пользователю
- `status?: ReviewStatus` - фильтр по статусу
- `limit?: number` - количество отзывов на странице
- `currentUserId?: string` - ID текущего пользователя

### 5. AddReviewForm
Форма создания отзыва.

**Props:**
- `companyId: string` - ID компании для отзыва
- `companyName?: string` - название компании
- `relatedCargoId?: number`
- `relatedRouteId?: number`
- `onSuccess?: () => void`
- `onCancel?: () => void`

### 6. CompanyRating
Отображение рейтинга компании с статистикой.

**Props:**
- `companyId: string`
- `showDistribution?: boolean` - показывать ли распределение рейтингов

### 7. CompanyReviewsSection
Полный раздел отзывов для страницы компании.

**Props:**
- `companyId: string`
- `companyName?: string`
- `currentUserId?: string`
- `canLeaveReview?: boolean`

## Использование

### 1. Интеграция в страницу компании

```tsx
import { CompanyReviewsSection } from '@/components/company/CompanyReviewsSection';

export default function CompanyPage({ companyId, userId, companyName }) {
  return (
    <div>
      {/* Другие секции страницы компании */}
      
      <CompanyReviewsSection 
        companyId={companyId}
        companyName={companyName}
        currentUserId={userId}
        canLeaveReview={true}
      />
    </div>
  );
}
```

### 2. Отображение рейтинга в карточке компании

```tsx
import { StarRating } from '@/components/reviews';
import { getCompanyRatingStats } from '@/shared/api/reviewsApi';

const stats = await getCompanyRatingStats(companyId);

<div>
  <StarRating rating={stats.average_rating} showNumber />
  <span>({stats.total_reviews} отзывов)</span>
</div>
```

### 3. Добавление отзыва после успешной сделки

```tsx
import { AddReviewForm } from '@/components/reviews';

<AddReviewForm
  companyId={companyId}
  companyName={companyName}
  relatedCargoId={cargoId}
  onSuccess={() => {
    toast.success('Спасибо за отзыв!');
    router.push('/');
  }}
/>
```

## Бизнес-логика

### Правила создания отзывов
1. Один пользователь может оставить только один отзыв на компанию
2. Нельзя оставлять отзыв на свою собственную компанию
3. Отзыв должен содержать оценку от 1 до 5 звезд
4. Текст отзыва ограничен 2000 символами
5. Все отзывы проходят модерацию перед публикацией

### Модерация
1. Новые отзывы имеют статус "Ожидает модерации"
2. Модератор может одобрить, отклонить или скрыть отзыв
3. При жалобе на отзыв создается тикет поддержки
4. Отзыв связывается с тикетом для отслеживания

### Рейтинг компании
1. Рассчитывается на основе одобренных отзывов
2. Средняя оценка округляется до десятых (например, 4.7)
3. Распределение показывает количество отзывов по каждой оценке
4. В аналитике компании отображается реальный рейтинг вместо расчетного

## Безопасность

### Валидация
- ✅ Проверка прав доступа на всех эндпоинтах
- ✅ Валидация входных данных с помощью Zod
- ✅ Защита от SQL-инъекций (Drizzle ORM)
- ✅ Проверка уникальности отзыва (один пользователь - один отзыв)

### Защита от злоупотреблений
- ✅ Модерация всех отзывов перед публикацией
- ✅ Возможность пожаловаться на отзыв
- ✅ Ограничение длины текста отзыва
- ✅ Rate limiting (через существующую систему)

## Миграция базы данных

Миграция находится в файле: `apps/backend/drizzle/0003_massive_dragon_man.sql`

Для применения миграции:
```bash
cd apps/backend
npx drizzle-kit push:pg
```

## Тестирование

### Тестовые сценарии

1. **Создание отзыва**
   - Создать отзыв с оценкой и текстом
   - Попытка создать второй отзыв (должна быть отклонена)
   - Попытка оставить отзыв на свою компанию (должна быть отклонена)

2. **Просмотр отзывов**
   - Просмотр всех одобренных отзывов компании
   - Фильтрация по рейтингу
   - Пагинация списка отзывов

3. **Модерация**
   - Одобрение отзыва
   - Отклонение отзыва с комментарием
   - Скрытие отзыва

4. **Статистика**
   - Получение рейтинга компании
   - Проверка корректности распределения по звездам
   - Интеграция с аналитикой компании

## TODO (будущие улучшения)

- [ ] Email уведомления при одобрении/отклонении отзыва
- [ ] Возможность ответа компании на отзыв
- [ ] Фотографии к отзывам
- [ ] Верифицированные отзывы (после подтвержденной сделки)
- [ ] Экспорт отзывов в PDF/Excel
- [ ] Виджет отзывов для внешних сайтов
- [ ] API для интеграции с внешними сервисами
- [ ] Расширенная аналитика отзывов
- [ ] Автоматическая модерация с помощью ML

## Зависимости

### Backend
- `drizzle-orm` - ORM для работы с базой данных
- `zod` - валидация схем данных
- `hono` - веб-фреймворк

### Frontend
- `react` - UI библиотека
- `lucide-react` - иконки
- `date-fns` - форматирование дат
- `sonner` - уведомления
- `@radix-ui` - UI компоненты

## Поддержка

При возникновении вопросов или проблем:
1. Проверьте логи сервера
2. Убедитесь, что миграция применена
3. Проверьте права доступа пользователя
4. Создайте issue в репозитории

---

**Дата создания:** 2025-01-08  
**Версия:** 1.0.0  
**Автор:** AI Assistant  
**Статус:** ✅ Реализовано

