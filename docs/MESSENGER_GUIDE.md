# Руководство по использованию мессенджера

## 📱 Где начать чат

### 1. **Главная страница мессенджера**
- Перейдите на `/messenger`
- Откроется полноценный интерфейс мессенджера со списком всех ваших бесед

### 2. **Из обзора компании**
- На странице обзора компании нажмите кнопку **"Мессенджер"** (фиолетовая кнопка)
- Откроется страница мессенджера

### 3. **Создание новой беседы**
- В мессенджере нажмите кнопку **"Новая беседа"**
- Введите имя пользователя или компании в поиск
- Выберите пользователя из списка
- Опционально укажите связанный груз или маршрут
- Нажмите **"Создать беседу"**

## 🚀 Основные функции

### Отправка сообщений
1. Выберите беседу из списка слева
2. Введите сообщение в поле ввода внизу
3. Нажмите Enter или кнопку отправки

### Real-time функции
- ✅ **Мгновенная доставка** - сообщения приходят в реальном времени
- ✅ **Статус "печатает"** - видите, когда собеседник набирает сообщение
- ✅ **Статус прочтения** - двойная галочка показывает, что сообщение прочитано
- ✅ **Индикаторы непрочитанных** - красные бейджи с количеством новых сообщений

### Управление беседами
- **Архивировать** - скрыть беседу из основного списка
- **Восстановить** - вернуть беседу из архива
- **Заблокировать** - заблокировать пользователя
- **Настройки уведомлений** - включить/выключить уведомления для конкретной беседы

### Поиск
- Используйте поле поиска вверху списка бесед
- Поиск работает по:
  - Имени пользователя
  - Названию компании
  - Содержимому последнего сообщения

## 🔧 Интеграция в другие части приложения

### Добавление кнопки "Написать" в карточку пользователя

```tsx
import { CreateConversationDialog } from '@/components/messenger/CreateConversationDialog';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

// В компоненте карточки пользователя
<CreateConversationDialog
  onConversationCreated={(conversationId) => {
    router.push(`/messenger?conversation=${conversationId}`);
  }}
  trigger={
    <Button variant="outline" size="sm">
      <MessageSquare className="h-4 w-4 mr-2" />
      Написать
    </Button>
  }
/>
```

### Добавление кнопки в карточку груза

```tsx
// В компоненте карточки груза
<Button
  onClick={() => {
    // Получить ID владельца груза
    const ownerId = cargo.owner_id;
    router.push(`/messenger?user=${ownerId}&cargo=${cargo.id_cargo}`);
  }}
  variant="outline"
  size="sm"
>
  <MessageSquare className="h-4 w-4 mr-2" />
  Связаться с владельцем
</Button>
```

### Добавление в навигационное меню

```tsx
// В главном меню приложения
import { MessageSquare } from 'lucide-react';

{
  name: 'Мессенджер',
  href: '/messenger',
  icon: MessageSquare,
  badge: unreadCount > 0 ? unreadCount : undefined
}
```

## 📊 API методы

### Создание беседы
```typescript
import { messengerApi } from '@/shared/api/messengerApi';

const conversation = await messengerApi.createConversation({
  userId: 'target-user-id',
  relatedCargoId: 123, // опционально
  relatedRouteId: 456  // опционально
});
```

### Отправка сообщения
```typescript
const message = await messengerApi.sendMessage({
  conversationId: 'conversation-id',
  content: 'Привет! Интересует ваш груз.',
  type: 'text'
});
```

### Получение статистики
```typescript
const stats = await messengerApi.getMessengerStats();
// {
//   total_conversations: 10,
//   unread_messages: 5,
//   active_conversations: 8
// }
```

### Отметка сообщений как прочитанных
```typescript
await messengerApi.markMessagesAsRead({
  messageIds: ['msg-1', 'msg-2', 'msg-3']
});
```

## 🔌 WebSocket подключение

WebSocket подключается автоматически при открытии страницы мессенджера. Для ручного управления:

```typescript
import { messengerWebSocket } from '@/shared/lib/messengerWebSocket';

// Подключиться
await messengerWebSocket.connect({
  onMessage: (message) => {
    console.log('Новое сообщение:', message);
  },
  onTyping: (conversationId, senderId, isTyping) => {
    console.log('Пользователь печатает:', isTyping);
  },
  onConnectionChange: (connected) => {
    console.log('Статус подключения:', connected);
  }
});

// Отключиться
messengerWebSocket.disconnect();

// Проверить статус
const isConnected = messengerWebSocket.isConnected();
```

## 🎨 Кастомизация

### Изменение цветов
Мессенджер использует цвета из вашей темы Tailwind. Основные классы:
- `bg-primary` - фон отправленных сообщений
- `bg-muted` - фон полученных сообщений
- `text-primary-foreground` - текст отправленных сообщений

### Изменение размеров
```tsx
// Изменить ширину списка бесед (по умолчанию w-80)
<div className="w-96 border-r">
  <ConversationList ... />
</div>
```

## 🐛 Устранение неполадок

### Сообщения не приходят в реальном времени
1. Проверьте подключение WebSocket в консоли браузера
2. Убедитесь, что WebSocket сервер запущен на бэкенде
3. Проверьте настройки CORS и прокси

### Не удается создать беседу
1. Убедитесь, что пользователь авторизован
2. Проверьте, что целевой пользователь существует
3. Проверьте логи бэкенда на наличие ошибок

### Статус "печатает" не работает
1. Убедитесь, что WebSocket подключен
2. Проверьте, что обработчик `onTyping` настроен
3. Таймаут статуса "печатает" составляет 2 секунды

## 📝 Примеры использования

### Пример 1: Начать чат из карточки компании
```tsx
<Button
  onClick={async () => {
    // Получить ID владельца компании
    const ownerId = await getCompanyOwner(companyId);
    
    // Создать беседу
    const conversation = await messengerApi.createConversation({
      userId: ownerId,
      relatedCargoId: currentCargoId
    });
    
    // Перейти к беседе
    router.push(`/messenger?conversation=${conversation.id_conversation}`);
  }}
>
  Связаться с компанией
</Button>
```

### Пример 2: Показать количество непрочитанных в меню
```tsx
const [unreadCount, setUnreadCount] = useState(0);

useEffect(() => {
  const loadUnreadCount = async () => {
    const stats = await messengerApi.getMessengerStats();
    setUnreadCount(stats.unread_messages);
  };
  
  loadUnreadCount();
  
  // Обновлять каждую минуту
  const interval = setInterval(loadUnreadCount, 60000);
  return () => clearInterval(interval);
}, []);

// В меню
<Badge>{unreadCount}</Badge>
```

## 🔐 Безопасность

- ✅ Все запросы требуют авторизации
- ✅ Пользователи могут видеть только свои беседы
- ✅ WebSocket соединения аутентифицируются через JWT токен
- ✅ Возможность блокировки нежелательных пользователей

## 📈 Производительность

- Сообщения загружаются порциями по 50 штук
- Автоматическая пагинация при прокрутке
- WebSocket переподключение при обрыве связи
- Оптимизация рендеринга через React.memo

## 🚧 В разработке

- ⏳ Прикрепление файлов и документов
- ⏳ Групповые чаты
- ⏳ Голосовые сообщения
- ⏳ Видеозвонки
- ⏳ Эмодзи и стикеры
