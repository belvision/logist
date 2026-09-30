# Отладка фоновых изображений

## 🔍 Проблема: Изображение не отображается

### Шаг 1: Проверьте, что файл загружен

```cmd
C:\Users\23232323\Downloads\mc.exe ls myminio/logistic-pro/backgrounds/carriers/
```

Должен быть виден файл `hero-bg.webp`.

### Шаг 2: Проверьте URL изображения

Откройте в браузере:
```
https://io.logistgo.pro/logistic-pro/backgrounds/carriers/hero-bg.webp
```

Если изображение открывается - файл загружен правильно.

### Шаг 3: Проверьте консоль браузера

1. Откройте страницу `http://localhost:3000/carriers`
2. Нажмите F12 (открыть DevTools)
3. Перейдите на вкладку **Console**
4. Проверьте, есть ли ошибки загрузки изображения

### Шаг 4: Проверьте Network вкладку

1. В DevTools перейдите на вкладку **Network**
2. Обновите страницу (F5)
3. Найдите запрос к `hero-bg.webp`
4. Проверьте статус ответа:
   - **200 OK** - файл загружается, но может быть проблема с отображением
   - **404 Not Found** - файл не найден
   - **403 Forbidden** - нет доступа к файлу
   - **CORS error** - проблема с CORS

### Шаг 5: Проверьте переменные окружения

Убедитесь, что в `.env.local` или `.env` указаны правильные значения:

```env
NEXT_PUBLIC_MINIO_BASE_URL=https://io.logistgo.pro
NEXT_PUBLIC_MINIO_BUCKET=logistic-pro
```

### Шаг 6: Проверьте компонент BackgroundImage

Компонент должен автоматически переключиться на градиент, если изображение не загрузилось. Проверьте:
- Отображается ли градиентный фон?
- Есть ли ошибки в консоли?

## 🐛 Частые проблемы

### Проблема 1: Файл не найден (404)

**Причина:** Неправильное имя файла или путь

**Решение:**
```cmd
# Проверьте имя файла
C:\Users\23232323\Downloads\mc.exe ls myminio/logistic-pro/backgrounds/carriers/

# Если файл называется по-другому, переименуйте:
C:\Users\23232323\Downloads\mc.exe mv myminio/logistic-pro/backgrounds/carriers/old-name.webp myminio/logistic-pro/backgrounds/carriers/hero-bg.webp
```

### Проблема 2: CORS ошибка

**Причина:** MinIO не разрешает запросы с localhost

**Решение:** Проверьте настройки CORS в MinIO или используйте продакшен URL.

### Проблема 3: Изображение загружается, но не видно

**Причина:** Проблема с overlay или z-index

**Решение:** Проверьте консоль браузера на ошибки CSS.

## ✅ Быстрая проверка

Выполните все команды по порядку:

```cmd
# 1. Проверка файла
C:\Users\23232323\Downloads\mc.exe ls myminio/logistic-pro/backgrounds/carriers/

# 2. Проверка URL (откройте в браузере)
https://io.logistgo.pro/logistic-pro/backgrounds/carriers/hero-bg.webp

# 3. Проверка в консоли браузера (F12 → Console)
```

---

**Выполните проверки и сообщите результаты!** 🔍

