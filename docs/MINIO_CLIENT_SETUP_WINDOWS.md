# Настройка MinIO Client (mc) на Windows

## ✅ Файл уже скачан!

Файл `mc.exe` находится в папке `C:\Users\23232323\Downloads\mc.exe`

## 🚀 Быстрая настройка

### Вариант 1: Использовать скрипт

Запустите файл `setup-minio-client.bat` в папке проекта - он автоматически настроит все.

### Вариант 2: Настроить вручную

1. **Откройте командную строку (CMD) или PowerShell** в папке проекта

2. **Переместите mc.exe в текущую папку** (опционально):
   ```cmd
   copy C:\Users\23232323\Downloads\mc.exe mc.exe
   ```

3. **Настройте подключение к MinIO**:
   ```cmd
   mc.exe alias set myminio https://io.logistgo.pro minioadmin JXpKD1wn9rf8ash4fwr)pq!oM@Ry2e3bh0OW!)t
   ```

4. **Проверьте подключение**:
   ```cmd
   mc.exe ls myminio/logistic-pro/
   ```

## 📤 Загрузка фоновых изображений

### Создание папок

```cmd
mc.exe mb myminio/logistic-pro/backgrounds/home
mc.exe mb myminio/logistic-pro/backgrounds/carriers
mc.exe mb myminio/logistic-pro/backgrounds/cargo-owners
mc.exe mb myminio/logistic-pro/backgrounds/team
```

### Загрузка изображений

**Рекомендуется использовать WebP формат** (меньший размер при том же качестве):

```cmd
# Главная страница
mc.exe cp hero-bg.webp myminio/logistic-pro/backgrounds/home/hero-bg.webp

# Перевозчики
mc.exe cp carriers-bg.webp myminio/logistic-pro/backgrounds/carriers/hero-bg.webp

# Грузовладельцы
mc.exe cp cargo-owners-bg.webp myminio/logistic-pro/backgrounds/cargo-owners/hero-bg.webp

# Команда
mc.exe cp team-bg.webp myminio/logistic-pro/backgrounds/team/hero-bg.webp
```

**Также поддерживается JPG формат:**

```cmd
mc.exe cp hero-bg.jpg myminio/logistic-pro/backgrounds/home/hero-bg.jpg
```

### Просмотр файлов

```cmd
# Список всех файлов в папке
mc.exe ls myminio/logistic-pro/backgrounds/home/

# Структура папок
mc.exe tree myminio/logistic-pro/backgrounds/
```

## 🔧 Полезные команды

```cmd
# Просмотр содержимого bucket
mc.exe ls myminio/logistic-pro/

# Копирование файла
mc.exe cp source.jpg myminio/logistic-pro/backgrounds/home/hero-bg.jpg

# Удаление файла
mc.exe rm myminio/logistic-pro/backgrounds/home/hero-bg.jpg

# Скачивание файла
mc.exe cp myminio/logistic-pro/backgrounds/home/hero-bg.jpg ./downloaded.jpg

# Синхронизация папки
mc.exe mirror ./local-images/ myminio/logistic-pro/backgrounds/home/
```

## ✅ Проверка после загрузки

После загрузки проверьте доступность по URL:

- `https://io.logistgo.pro/logistic-pro/backgrounds/home/hero-bg.jpg`
- `https://io.logistgo.pro/logistic-pro/backgrounds/carriers/hero-bg.jpg`
- `https://io.logistgo.pro/logistic-pro/backgrounds/cargo-owners/hero-bg.jpg`
- `https://io.logistgo.pro/logistic-pro/backgrounds/team/hero-bg.jpg`

Откройте эти URL в браузере - если изображение загрузилось, вы увидите его.

---

**Готово! Теперь вы можете загружать изображения через командную строку!** 🎉

