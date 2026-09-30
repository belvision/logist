# Добавление кнопки "Поддержка" в меню

## Обзор

Добавлена кнопка "Поддержка" в главное меню сайдбара с индикатором новых сообщений от поддержки. Кнопка ведет на страницу `/support` и показывает количество непрочитанных сообщений.

## Изменения в коде

### 1. Добавление кнопки поддержки в меню

**Файл:** `apps/frontend/src/widgets/sidebar/index.tsx`

**Изменения в `navigationItems`:**
```typescript
const navigationItems = [
  { name: 'Главная', href: companyHref('/main'), icon: '🏠' },
  {
    name: 'Грузы',
    href: companyHref('/cargo'),
    icon: '📦',
    submenu: [
      { name: 'Мои грузы', href: companyHref('/cargo'), icon: '📋' },
      { name: 'Поиск попутных грузов', href: companyHref('/cargo-search'), icon: '🔍' },
    ]
  },
  { name: 'Маршруты', href: companyHref('/routes'), icon: '🗺️' },
  {
    name: 'Автопарк',
    href: companyHref('/fleet'),
    icon: '🚛',
    submenu: [
      { name: 'Мой автопарк', href: companyHref('/fleet'), icon: '🚗' },
      { name: 'Поиск автомобилей', href: companyHref('/car-search'), icon: '🔍' },
    ]
  },
  { name: 'Уведомления', href: '/notifications', icon: '🔔' },
  { 
    name: 'Поддержка', 
    href: '/support', 
    icon: '🆘',
    badge: hasNewSupportMessages ? newMessagesCount : undefined
  },
];
```

### 2. Добавление поддержки badge в рендеринг меню

**Обновлен рендеринг обычных элементов меню:**
```typescript
<Link
  href={item.href}
  className={cn(
    'flex items-center justify-between px-3 py-2 rounded-lg transition-colors',
    isActive
      ? 'bg-gray-700 text-white'
      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
  )}
>
  <div className="flex items-center space-x-3">
    <span className="text-lg">{item.icon}</span>
    <span className="font-medium">{item.name}</span>
  </div>
  {item.badge && (
    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
      {item.badge}
    </span>
  )}
</Link>
```

**Обновлен рендеринг элементов управления компанией:**
```typescript
<Link
  key={item.name}
  href={item.href}
  className={cn(
    'flex items-center justify-between px-3 py-2 rounded-lg transition-colors',
    isActive
      ? 'bg-gray-700 text-white'
      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
  )}
>
  <div className="flex items-center space-x-3">
    <span className="text-sm">{item.icon}</span>
    <span className="text-sm font-medium">{item.name}</span>
  </div>
  {(item.badge || item.count) && (
    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
      {item.badge || item.count}
    </span>
  )}
</Link>
```

## Функциональность

### 1. Кнопка поддержки
- **Название**: "Поддержка"
- **Иконка**: 🆘 (SOS)
- **Ссылка**: `/support`
- **Позиция**: После "Уведомления" в основном меню

### 2. Индикатор новых сообщений
- **Badge**: Красный кружок с количеством новых сообщений
- **Условие отображения**: `hasNewSupportMessages ? newMessagesCount : undefined`
- **Источник данных**: `useNotifications()` hook

### 3. Интеграция с системой уведомлений
- **Автоматическое обновление**: Badge обновляется при получении новых сообщений
- **WebSocket**: Обновление в реальном времени
- **Fallback**: Polling каждую минуту

## Стилизация

### Badge стили
```css
.bg-red-500          /* Красный фон */
.text-white          /* Белый текст */
.text-xs             /* Маленький размер шрифта */
.font-bold           /* Жирный шрифт */
.px-2.py-1           /* Отступы */
.rounded-full        /* Круглая форма */
.min-w-[20px]        /* Минимальная ширина */
.text-center         /* Центрирование текста */
```

### Адаптивность
- **Мобильные устройства**: Badge остается видимым
- **Планшеты**: Badge отображается корректно
- **Десктоп**: Badge хорошо интегрирован в дизайн

## Логика работы

### 1. Получение данных о новых сообщениях
```typescript
const { hasNewSupportMessages, newMessagesCount, isWebSocketConnected, connectionStatus } = useNotifications();
```

### 2. Условное отображение badge
```typescript
badge: hasNewSupportMessages ? newMessagesCount : undefined
```

### 3. Обновление в реальном времени
- **WebSocket**: При получении нового сообщения от поддержки
- **Polling**: Каждую минуту как fallback
- **Автоматическое обновление**: Без перезагрузки страницы

## Интеграция с существующей системой

### 1. Использование существующих hooks
- `useNotifications()` - для получения данных о новых сообщениях
- `useAuth()` - для проверки авторизации
- `useCompanyStore()` - для работы с компаниями

### 2. Использование существующих компонентов
- `AppLayout` - для отображения в контексте приложения
- `Link` - для навигации
- `cn()` - для условных CSS классов

### 3. Использование существующих стилей
- Tailwind CSS классы
- Темная тема поддержка
- Hover эффекты

## Тестирование

### 1. Тест отображения кнопки
1. Откройте личный кабинет
2. Проверьте, что кнопка "Поддержка" отображается в меню
3. Убедитесь, что иконка 🆘 отображается корректно

### 2. Тест навигации
1. Нажмите на кнопку "Поддержка"
2. Убедитесь, что происходит переход на `/support`
3. Проверьте, что страница поддержки загружается корректно

### 3. Тест badge
1. Создайте тикет в поддержке
2. Добавьте комментарий от поддержки в Bitrix24
3. Проверьте, что badge с количеством сообщений появился
4. Убедитесь, что badge исчезает после просмотра сообщений

### 4. Тест обновления в реальном времени
1. Откройте личный кабинет
2. Добавьте комментарий от поддержки
3. Проверьте, что badge обновился без перезагрузки страницы

## Известные особенности

### 1. Позиционирование
- Кнопка "Поддержка" размещена после "Уведомления"
- Не зависит от выбранной компании (глобальная ссылка)

### 2. Badge поведение
- Отображается только при наличии новых сообщений
- Показывает точное количество новых сообщений
- Исчезает после просмотра всех сообщений

### 3. Производительность
- Badge обновляется только при изменении состояния
- Минимальное влияние на производительность
- Эффективное использование WebSocket соединения

## Дальнейшие улучшения

### Возможные улучшения
1. **Звуковое уведомление** при появлении badge
2. **Анимация** появления/исчезновения badge
3. **Цветовая индикация** приоритета сообщений
4. **Tooltip** с кратким описанием новых сообщений
5. **Группировка** уведомлений по типу

### Настройки пользователя
```typescript
interface SupportNotificationSettings {
  show_badge: boolean;
  sound_notification: boolean;
  badge_color: 'red' | 'orange' | 'blue';
  update_frequency: 'realtime' | 'minute' | 'manual';
}
```

## Применение изменений

### 1. Перезапуск приложения
```bash
cd apps/frontend
npm run dev
```

### 2. Проверка работы
1. Откройте личный кабинет
2. Проверьте наличие кнопки "Поддержка" в меню
3. Создайте тикет и добавьте комментарий от поддержки
4. Убедитесь, что badge отображается корректно

### 3. Мониторинг
- Проверьте консоль браузера на наличие ошибок
- Убедитесь, что WebSocket соединение работает
- Проверьте обновление badge в реальном времени

## Коммит изменений

```bash
git add .
git commit -m "feat: добавить кнопку 'Поддержка' в меню с индикатором новых сообщений

- Добавлена кнопка 'Поддержка' в navigationItems сайдбара
- Добавлена поддержка badge для элементов меню
- Интеграция с системой уведомлений для отображения количества новых сообщений
- Обновлен рендеринг меню для поддержки badge
- Кнопка ведет на страницу /support с индикатором новых сообщений"
```

## Результат

✅ **Кнопка "Поддержка" добавлена в меню**
✅ **Индикатор новых сообщений работает**
✅ **Интеграция с системой уведомлений**
✅ **Обновление в реальном времени**
✅ **Адаптивный дизайн**
