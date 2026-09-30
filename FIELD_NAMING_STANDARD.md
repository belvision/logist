# Стандарт названий полей в проекте LogistGo

## Основные принципы

В проекте используется единый стандарт названий полей для обеспечения совместимости между frontend и backend.

## Стандартные поля пользователя

### Backend (схема БД и API)
- `id_user` - уникальный идентификатор пользователя (UUID)
- `username` - имя пользователя
- `email` - электронная почта
- `firstName` - имя
- `lastName` - фамилия
- `phone` - номер телефона
- `isActive` - статус активности
- `createdAt` - дата создания
- `updatedAt` - дата обновления
- `lastPasswordUpdate` - дата последнего изменения пароля

### Frontend (типы и интерфейсы)
- `id_user` - уникальный идентификатор пользователя
- `username` - имя пользователя
- `email` - электронная почта
- `firstName` - имя
- `lastName` - фамилия
- `phone` - номер телефона
- `isActive` - статус активности
- `createdAt` - дата создания
- `updatedAt` - дата обновления
- `lastPasswordUpdate` - дата последнего изменения пароля

## JWT токены

### Access Token и Refresh Token
Содержат следующие поля:
```typescript
{
  id_user: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone: string;
}
```

### MFA токены
Содержат специальное поле:
```typescript
{
  userId: string; // для MFA токенов используется userId
}
```

## Совместимость

В некоторых местах кода используется fallback логика для получения userId:
```typescript
const userId = auth?.id_user || auth?.id || auth?.userId || auth?.sub;
```

Это обеспечивает совместимость с различными форматами токенов.

## Важные замечания

1. **Основной стандарт**: `id_user` для идентификатора пользователя
2. **CamelCase**: для составных полей используется camelCase (firstName, lastName)
3. **Консистентность**: одинаковые названия в backend и frontend
4. **JWT payload**: должен содержать все необходимые поля пользователя
5. **MFA токены**: используют специальное поле `userId` для совместимости

## История изменений

- Исправлена функция `refreshTokens` для корректного создания токенов
- Обновлены все места использования `decoded.id` на `decoded.id_user`
- Унифицированы названия полей между frontend и backend
- Добавлена функция `updateUser` в auth-context для обновления данных пользователя
