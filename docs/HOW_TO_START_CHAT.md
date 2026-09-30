# Как начать беседу в мессенджере

## 🚀 Способы начать беседу

### 1. **Через страницу мессенджера** (основной способ)

1. Откройте страницу мессенджера:
   - Нажмите кнопку **"Мессенджер"** на странице обзора компании
   - Или перейдите по URL: `/company/{company_id}/messenger`

2. Нажмите кнопку **"Новая беседа"** (синяя кнопка с плюсом в правом верхнем углу)

3. В открывшемся диалоге:
   - Введите имя пользователя или название компании в поле поиска
   - Выберите пользователя из списка результатов
   - (Опционально) Укажите ID груза или маршрута для контекста
   - Нажмите **"Создать беседу"**

4. Беседа будет создана и автоматически откроется

### 2. **Из карточки груза** (нужно добавить)

Добавьте кнопку "Связаться с владельцем" в карточку груза:

```tsx
import { CreateConversationDialog } from '@/components/messenger/CreateConversationDialog';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

// В компоненте карточки груза
<CreateConversationDialog
  onConversationCreated={(conversationId) => {
    router.push(`/company/${companyId}/messenger?conversation=${conversationId}`);
  }}
  trigger={
    <Button variant="outline" size="sm">
      <MessageSquare className="h-4 w-4 mr-2" />
      Связаться с владельцем
    </Button>
  }
/>
```

### 3. **Из карточки автомобиля** (нужно добавить)

Аналогично карточке груза, добавьте кнопку "Написать перевозчику".

### 4. **Из результатов поиска** (нужно добавить)

В результатах поиска грузов/автомобилей добавьте кнопку быстрого начала чата.

### 5. **Из профиля пользователя** (нужно добавить)

В профиле любого пользователя добавьте кнопку "Начать чат".

## 🔍 Поиск пользователей

В диалоге создания беседы поиск работает по:
- **Имени пользователя** (username)
- **Имени и фамилии** (firstName, lastName)
- **Названию компании** (name_company)

### Примечание:
Сейчас в `CreateConversationDialog` используются моковые данные. Для полноценной работы нужно:

1. Создать API endpoint для поиска пользователей:
```typescript
// В backend: apps/backend/src/api/user/user.controller.ts
export const searchUsersHandler = async (c: Context) => {
  const query = c.req.query('q');
  const users = await searchUsers(query);
  return c.json({ users });
};
```

2. Добавить метод в API клиент:
```typescript
// В frontend: apps/frontend/src/shared/api/userApi.ts
export const searchUsers = async (query: string) => {
  const response = await apiClient.get('/user/search', {
    params: { q: query }
  });
  return response.data.users;
};
```

3. Использовать в `CreateConversationDialog`:
```typescript
const searchUsers = async () => {
  try {
    setLoading(true);
    const results = await userApi.searchUsers(searchQuery);
    setUsers(results);
  } catch (error) {
    console.error('Failed to search users:', error);
  } finally {
    setLoading(false);
  }
};
```

## 💡 Примеры интеграции

### Пример 1: Кнопка в карточке компании

```tsx
// В CompanyCard.tsx
import { CreateConversationDialog } from '@/components/messenger/CreateConversationDialog';

<CreateConversationDialog
  onConversationCreated={(conversationId) => {
    // Перейти к беседе
    router.push(`/company/${companyId}/messenger?conversation=${conversationId}`);
  }}
  trigger={
    <Button variant="outline">
      <MessageSquare className="h-4 w-4 mr-2" />
      Написать компании
    </Button>
  }
/>
```

### Пример 2: Быстрый чат из списка грузов

```tsx
// В CargoList.tsx
const handleStartChat = async (cargo: Cargo) => {
  try {
    const conversation = await messengerApi.createConversation({
      userId: cargo.owner_id,
      relatedCargoId: cargo.id_cargo
    });
    
    router.push(`/company/${companyId}/messenger?conversation=${conversation.id_conversation}`);
  } catch (error) {
    console.error('Failed to create conversation:', error);
  }
};

// В карточке груза
<Button onClick={() => handleStartChat(cargo)}>
  Связаться
</Button>
```

### Пример 3: Чат из уведомлений

```tsx
// В Notification.tsx
{notification.type === 'cargo_match' && (
  <Button
    size="sm"
    onClick={async () => {
      const conversation = await messengerApi.createConversation({
        userId: notification.metadata.user_id,
        relatedCargoId: notification.metadata.cargo_id
      });
      
      router.push(`/company/${companyId}/messenger?conversation=${conversation.id_conversation}`);
    }}
  >
    Написать
  </Button>
)}
```

## 🎯 Рекомендации

1. **Добавьте кнопки чата везде**, где пользователи могут взаимодействовать:
   - Карточки грузов
   - Карточки автомобилей
   - Результаты поиска
   - Профили пользователей
   - Уведомления о совпадениях

2. **Используйте контекст** - передавайте `relatedCargoId` или `relatedRouteId` для связи беседы с конкретным грузом/маршрутом

3. **Автоматическое создание** - создавайте беседу автоматически при клике на "Связаться", не показывая диалог выбора пользователя

4. **Переиспользуйте беседы** - API автоматически возвращает существующую беседу, если она уже есть между двумя пользователями

## 🔧 Текущий статус

✅ **Реализовано:**
- Страница мессенджера
- Кнопка "Новая беседа" в мессенджере
- Диалог создания беседы
- API для создания бесед
- WebSocket для real-time сообщений

⏳ **Требуется доработка:**
- API для поиска пользователей
- Интеграция кнопок чата в карточки грузов/автомобилей
- Быстрый чат из результатов поиска
- Чат из уведомлений

## 📞 Поддержка

Если у вас возникли вопросы по интеграции мессенджера, обратитесь к документации:
- `MESSENGER_GUIDE.md` - полное руководство по мессенджеру
- `HOW_TO_START_CHAT.md` - этот файл
