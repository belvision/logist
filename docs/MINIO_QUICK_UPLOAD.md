# 🚀 Быстрая загрузка изображений в MinIO (без консоли)

Если MinIO Console недоступен (ошибка 403), используйте **MinIO Client (mc)** - это самый простой способ!

## 📥 Установка MinIO Client

### Windows

1. Скачайте `mc.exe` с официального сайта:
   - Перейдите: https://min.io/download
   - Выберите "MinIO Client (mc)" → Windows
   - Скачайте `mc.exe`

2. Поместите `mc.exe` в удобную папку (например, `C:\tools\`)

3. Добавьте папку в PATH (опционально, но удобно):
   - Откройте "Переменные среды" в Windows
   - Добавьте путь к папке с `mc.exe` в переменную PATH

### Linux/Mac

```bash
# Linux
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/

# Mac
brew install minio/stable/mc
```

## ⚙️ Настройка подключения

Откройте командную строку (Windows) или терминал (Linux/Mac) и выполните:

```bash
mc alias set myminio https://io.logistgo.pro minioadmin JXpKD1wn9rf8ash4fwr)pq!oM@Ry2e3bh0OW!)t
```

**Где:**
- `myminio` - имя алиаса (можете использовать любое)
- `https://io.logistgo.pro` - адрес MinIO сервера
- `minioadmin` - Access Key
- `JXpKD1wn9rf8ash4fwr)pq!oM@Ry2e3bh0OW!)t` - Secret Key

## 📤 Загрузка фоновых изображений

### Шаг 1: Создание структуры папок

```bash
# Создайте папки для фоновых изображений
mc mb myminio/logistic-pro/backgrounds/home
mc mb myminio/logistic-pro/backgrounds/carriers
mc mb myminio/logistic-pro/backgrounds/cargo-owners
mc mb myminio/logistic-pro/backgrounds/team
```

**Примечание:** Если папки уже существуют, команда вернет ошибку - это нормально, просто продолжайте.

### Шаг 2: Загрузка изображений

```bash
# Загрузите изображение для главной страницы
mc cp hero-bg.jpg myminio/logistic-pro/backgrounds/home/hero-bg.jpg

# Загрузите изображение для перевозчиков
mc cp carriers-bg.jpg myminio/logistic-pro/backgrounds/carriers/hero-bg.jpg

# Загрузите изображение для грузовладельцев
mc cp cargo-owners-bg.jpg myminio/logistic-pro/backgrounds/cargo-owners/hero-bg.jpg

# Загрузите изображение для команды
mc cp team-bg.jpg myminio/logistic-pro/backgrounds/team/hero-bg.jpg
```

### Шаг 3: Проверка загрузки

```bash
# Просмотр всех файлов в папке
mc ls myminio/logistic-pro/backgrounds/home/

# Просмотр структуры
mc tree myminio/logistic-pro/backgrounds/
```

## 🔄 Замена изображения

Просто загрузите новое изображение с тем же именем - оно заменит старое:

```bash
mc cp new-hero-bg.jpg myminio/logistic-pro/backgrounds/home/hero-bg.jpg
```

## 🗑️ Удаление изображения

```bash
mc rm myminio/logistic-pro/backgrounds/home/hero-bg.jpg
```

## 📋 Полезные команды

```bash
# Просмотр содержимого bucket
mc ls myminio/logistic-pro/

# Просмотр содержимого папки
mc ls myminio/logistic-pro/backgrounds/home/

# Копирование файла
mc cp source.jpg myminio/logistic-pro/backgrounds/home/hero-bg.jpg

# Копирование всей папки
mc cp --recursive ./images/ myminio/logistic-pro/backgrounds/home/

# Синхронизация папки
mc mirror ./local-images/ myminio/logistic-pro/backgrounds/home/

# Просмотр информации о файле
mc stat myminio/logistic-pro/backgrounds/home/hero-bg.jpg

# Скачивание файла
mc cp myminio/logistic-pro/backgrounds/home/hero-bg.jpg ./downloaded-hero-bg.jpg
```

## ✅ Проверка после загрузки

После загрузки проверьте доступность по URL:

- Главная: `https://io.logistgo.pro/logistic-pro/backgrounds/home/hero-bg.jpg`
- Перевозчики: `https://io.logistgo.pro/logistic-pro/backgrounds/carriers/hero-bg.jpg`
- Грузовладельцы: `https://io.logistgo.pro/logistic-pro/backgrounds/cargo-owners/hero-bg.jpg`
- Команда: `https://io.logistgo.pro/logistic-pro/backgrounds/team/hero-bg.jpg`

Откройте эти URL в браузере - если изображение загрузилось, вы увидите его.

## 🎯 Пример полного процесса

```bash
# 1. Настройка (один раз)
mc alias set myminio https://io.logistgo.pro minioadmin JXpKD1wn9rf8ash4fwr)pq!oM@Ry2e3bh0OW!)t

# 2. Создание папок (один раз)
mc mb myminio/logistic-pro/backgrounds/home
mc mb myminio/logistic-pro/backgrounds/carriers

# 3. Загрузка изображений
mc cp C:\Users\YourName\Pictures\hero-bg.jpg myminio/logistic-pro/backgrounds/home/hero-bg.jpg

# 4. Проверка
mc ls myminio/logistic-pro/backgrounds/home/
```

## 🐛 Решение проблем

### Ошибка: "Access Denied"

Проверьте правильность Access Key и Secret Key в команде `mc alias set`.

### Ошибка: "Connection refused"

Проверьте, что MinIO сервер доступен:
```bash
curl https://io.logistgo.pro/logistic-pro/
```

### Ошибка: "Bucket does not exist"

Создайте bucket:
```bash
mc mb myminio/logistic-pro
```

---

**Это самый простой способ загрузки файлов без настройки nginx!** 🎉

