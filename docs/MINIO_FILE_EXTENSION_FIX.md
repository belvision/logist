# Исправление расширения файлов в MinIO

## 🔍 Проблема

Файлы загружены без правильного расширения:
- `hero-bg.web` вместо `hero-bg.webp`
- `carriers-bg.web` вместо `carriers-bg.webp`

## ✅ Решение: Переименование файлов

### Вариант 1: Через MinIO Client (mc)

```cmd
# Переименовать файл
C:\Users\23232323\Downloads\mc.exe mv myminio/logistic-pro/backgrounds/carriers/hero-bg.web myminio/logistic-pro/backgrounds/carriers/hero-bg.webp

# Проверить результат
C:\Users\23232323\Downloads\mc.exe ls myminio/logistic-pro/backgrounds/carriers/
```

### Вариант 2: Удалить и загрузить заново

```cmd
# Удалить старый файл
C:\Users\23232323\Downloads\mc.exe rm myminio/logistic-pro/backgrounds/carriers/hero-bg.web

# Загрузить с правильным именем
C:\Users\23232323\Downloads\mc.exe cp "C:\Users\23232323\Desktop\logistPro\carriers-bg.webp" myminio/logistic-pro/backgrounds/carriers/hero-bg.webp
```

## 📋 Правильные имена файлов

- `hero-bg.webp` - для всех страниц
- `home/hero-bg.webp` - главная страница
- `carriers/hero-bg.webp` - перевозчики
- `cargo-owners/hero-bg.webp` - грузовладельцы
- `team/hero-bg.webp` - команда

## ✅ После исправления

1. **Проверьте файлы:**
   ```cmd
   C:\Users\23232323\Downloads\mc.exe ls myminio/logistic-pro/backgrounds/carriers/
   ```

2. **Проверьте доступность:**
   Откройте в браузере:
   ```
   https://io.logistgo.pro/logistic-pro/backgrounds/carriers/hero-bg.webp
   ```

3. **Обновите страницу:**
   ```
   http://localhost:3000/carriers
   ```
   Нажмите Ctrl+Shift+R (жесткая перезагрузка с очисткой кэша)

---

**Важно: расширение файла должно быть `.webp`, а не `.web`!** ✅

