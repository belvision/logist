# Установка системы отзывов и рейтингов

## Быстрый старт

### 1. Применить миграцию базы данных

```bash
cd apps/backend
npx drizzle-kit push:pg
```

Или вручную выполнить SQL из файла `drizzle/0003_massive_dragon_man.sql`

### 2. Перезапустить backend сервер

```bash
cd apps/backend
npm run dev
# или в production:
pm2 restart backend
```

### 3. Проверить работу API

```bash
# Получить статистику рейтинга компании (должно вернуть пустую статистику)
curl http://localhost:5000/api/reviews/company/{company_id}/stats

# Должен вернуть:
# {
#   "stats": {
#     "id_company": "...",
#     "total_reviews": 0,
#     "average_rating": 0,
#     "rating_breakdown": { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
#     "approved_reviews": 0,
#     "pending_reviews": 0
#   }
# }
```

### 4. Перезапустить frontend

```bash
cd apps/frontend
npm run dev
# или в production:
npm run build
pm2 restart frontend
```

## Проверка работы

### 1. Проверка в интерфейсе

1. Войдите в систему
2. Перейдите на главную страницу компании
3. Прокрутите вниз до раздела "Отзывы клиентов"
4. Нажмите "Оставить отзыв"
5. Заполните форму и отправьте отзыв
6. Отзыв должен появиться со статусом "Ожидает модерации"

### 2. Проверка через API

```bash
# Создать отзыв (требуется авторизация)
curl -X POST http://localhost:5000/api/reviews \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id_reviewed_company": "COMPANY_UUID",
    "rating": 5,
    "review_text": "Отличная компания!"
  }'

# Получить отзывы компании
curl http://localhost:5000/api/reviews?id_reviewed_company=COMPANY_UUID&status=Одобрен

# Получить статистику
curl http://localhost:5000/api/reviews/company/COMPANY_UUID/stats
```

## Возможные проблемы

### Ошибка: "Table 'reviews' does not exist"

**Решение:** Миграция не применена. Выполните:
```bash
cd apps/backend
npx drizzle-kit push:pg
```

### Ошибка: "Module not found: Can't resolve '@/components/reviews'"

**Решение:** Перезапустите dev сервер frontend:
```bash
cd apps/frontend
rm -rf .next
npm run dev
```

### Ошибка 401 при создании отзыва

**Решение:** Убедитесь, что вы авторизованы. Проверьте наличие токена в localStorage.

### Отзывы не отображаются в аналитике

**Решение:** 
1. Убедитесь, что отзывы имеют статус "Одобрен"
2. Проверьте, что аналитика обновилась (может потребоваться перезагрузка страницы)

## Модерация отзывов

### Через SQL (временное решение)

```sql
-- Одобрить отзыв
UPDATE reviews 
SET status = 'Одобрен', 
    moderated_at = NOW()
WHERE id_review = 'REVIEW_UUID';

-- Отклонить отзыв
UPDATE reviews 
SET status = 'Отклонен', 
    moderated_at = NOW(),
    moderation_comment = 'Причина отклонения'
WHERE id_review = 'REVIEW_UUID';

-- Скрыть отзыв
UPDATE reviews 
SET status = 'Скрыт', 
    moderated_at = NOW()
WHERE id_review = 'REVIEW_UUID';
```

### Через API (требуется роль администратора)

```bash
curl -X POST http://localhost:5000/api/reviews/REVIEW_UUID/moderate \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Одобрен",
    "moderation_comment": "Отзыв соответствует правилам"
  }'
```

## Интеграция с существующей системой

### 1. Добавление рейтинга в карточки компаний

```tsx
import { StarRating } from '@/components/reviews';
import { getCompanyRatingStats } from '@/shared/api/reviewsApi';

function CompanyCard({ companyId }) {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    getCompanyRatingStats(companyId).then(res => setStats(res.stats));
  }, [companyId]);
  
  return (
    <div>
      {stats && stats.total_reviews > 0 && (
        <div>
          <StarRating rating={stats.average_rating} showNumber />
          <span>({stats.total_reviews})</span>
        </div>
      )}
    </div>
  );
}
```

### 2. Автоматическое предложение оставить отзыв после сделки

```tsx
// После успешного завершения груза/маршрута
import { AddReviewForm } from '@/components/reviews';

function CargoCompleted({ cargoId, partnerCompanyId }) {
  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Груз доставлен!</DialogTitle>
        </DialogHeader>
        <AddReviewForm
          companyId={partnerCompanyId}
          relatedCargoId={cargoId}
          onSuccess={() => {
            toast.success('Спасибо за отзыв!');
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
```

## Настройки

### Изменение количества отзывов на странице

В файле `ReviewsList.tsx`:
```tsx
<ReviewsList
  companyId={companyId}
  limit={20} // Изменить с 10 на 20
/>
```

### Отключение модерации (только для тестирования!)

В файле `reviews.repository.ts`:
```typescript
// ВНИМАНИЕ: Только для разработки!
async createReview(...) {
  const [review] = await db
    .insert(reviews)
    .values({
      ...data,
      status: 'Одобрен', // Изменить с 'Ожидает модерации'
    })
}
```

## Следующие шаги

1. ✅ Система установлена и работает
2. 🔄 Протестируйте создание и просмотр отзывов
3. 🔄 Настройте процесс модерации
4. 🔄 Интегрируйте в другие части приложения
5. 🔄 Настройте уведомления (опционально)

## Поддержка

Если возникли проблемы:
1. Проверьте логи backend: `pm2 logs backend`
2. Проверьте логи frontend: `pm2 logs frontend`
3. Проверьте подключение к БД
4. Создайте issue с описанием проблемы

---

**Версия:** 1.0.0  
**Дата:** 2025-01-08

