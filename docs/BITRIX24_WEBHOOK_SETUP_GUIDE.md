# Настройка Webhook в Bitrix24

## 🚨 Проблема
Webhook работает при ручном тестировании, но не срабатывает автоматически при добавлении комментариев в Bitrix24.

## 🔧 Настройка Webhook в Bitrix24

### 1. Перейдите в настройки приложения
1. Войдите в Bitrix24
2. Перейдите в **Настройки** → **Разработчикам** → **Приложения**
3. Найдите ваше приложение или создайте новое

### 2. Настройте Webhook
1. В разделе **Webhook** добавьте новый webhook:
   - **URL обработчика:** `https://logistgo.pro/api/bitrix24/webhook?token=REDACTED_SECRET`
   - **События:** Выберите `ONCRMITEMUPDATE`
   - **Тип сущности:** `DYNAMIC_1038` (ID вашего смарт-процесса)

### 3. Альтернативный способ - через REST API
Если у вас есть доступ к REST API, можно настроить webhook через код:

```javascript
// Создание webhook через REST API
const webhookData = {
  EVENT: 'ONCRMITEMUPDATE',
  HANDLER: 'https://logistgo.pro/api/bitrix24/webhook?token=REDACTED_SECRET',
  AUTH_TYPE: 'A', // Авторизация через токен
  AUTH_USER_ID: '1', // ID пользователя
  TITLE: 'Support Webhook',
  COMMENT: 'Webhook for support messages'
};

// Отправка запроса на создание webhook
fetch('https://integro.bitrix24.by/rest/1/REDACTED_SECRET/event.bind', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams(webhookData)
});
```

### 4. Проверка настроек
Убедитесь, что:
- ✅ URL webhook правильный
- ✅ Токен правильный
- ✅ Событие `ONCRMITEMUPDATE` выбрано
- ✅ Тип сущности `DYNAMIC_1038` указан
- ✅ Webhook активен

## 🧪 Тестирование

### 1. Ручной тест (уже работает)
```bash
node test-webhook-with-real-id.js
```
Результат: ✅ SUCCESS

### 2. Тест автоматического webhook
1. Откройте тикет в Bitrix24
2. Добавьте комментарий от поддержки
3. Проверьте логи бэкенда
4. Проверьте базу данных

### 3. Проверка логов
Ищите в логах бэкенда:
```
🔍 [WEBHOOK ROUTER] ===== WEBHOOK RECEIVED =====
🔍 [WEBHOOK SERVICE] ===== PROCESSING WEBHOOK =====
🔍 [WEBHOOK REPOSITORY] Adding support comment to ticket:
✅ [WEBHOOK REPOSITORY] Support comment added successfully
```

## 🔍 Диагностика

### Если webhook не срабатывает:
1. **Проверьте настройки webhook** в Bitrix24
2. **Проверьте права приложения** - должно быть право на чтение CRM
3. **Проверьте логи Bitrix24** - есть ли ошибки отправки webhook
4. **Проверьте сетевые настройки** - доступен ли ваш сервер из интернета

### Если webhook срабатывает, но сообщения не добавляются:
1. **Проверьте логи бэкенда** - доходит ли запрос до webhook handler
2. **Проверьте API Bitrix24** - может ли приложение читать данные смарт-процесса
3. **Проверьте базу данных** - есть ли ошибки при записи

## 📋 Чек-лист

- [ ] Webhook настроен в Bitrix24
- [ ] URL webhook правильный
- [ ] Токен webhook правильный
- [ ] Событие `ONCRMITEMUPDATE` выбрано
- [ ] Тип сущности `DYNAMIC_1038` указан
- [ ] Приложение имеет права на чтение CRM
- [ ] Сервер доступен из интернета
- [ ] Логи бэкенда показывают получение webhook
- [ ] База данных обновляется при получении webhook

## 🎯 Следующие шаги

1. **Проверьте настройки webhook** в Bitrix24
2. **Добавьте комментарий** в тикет в Bitrix24
3. **Проверьте логи бэкенда** - пришел ли webhook
4. **Проверьте базу данных** - добавилось ли сообщение
5. **Проверьте интерфейс** - отображается ли сообщение
