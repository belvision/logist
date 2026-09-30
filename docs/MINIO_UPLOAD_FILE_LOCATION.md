# Где должен быть файл при загрузке в MinIO

## 📍 Расположение файла

При выполнении команды:
```cmd
C:\Users\23232323\Downloads\mc.exe cp hero-bg.webp myminio/logistic-pro/backgrounds/home/hero-bg.webp
```

Файл `hero-bg.webp` должен быть в **текущей рабочей директории**, откуда вы выполняете команду.

## 🔍 Проверка текущей папки

Выполните в командной строке:
```cmd
cd
```
или
```cmd
echo %CD%
```

Это покажет текущую папку (скорее всего `C:\Users\23232323\Desktop\logistPro`).

## ✅ Варианты решения

### Вариант 1: Файл в текущей папке

Если файл `hero-bg.webp` находится в `C:\Users\23232323\Desktop\logistPro\`:

```cmd
C:\Users\23232323\Downloads\mc.exe cp hero-bg.webp myminio/logistic-pro/backgrounds/home/hero-bg.webp
```

### Вариант 2: Файл в другой папке (полный путь)

Если файл находится в другой папке (например, в Downloads), укажите полный путь:

```cmd
C:\Users\23232323\Downloads\mc.exe cp "C:\Users\23232323\Downloads\hero-bg.webp" myminio/logistic-pro/backgrounds/home/hero-bg.webp
```

Или если файл на рабочем столе:

```cmd
C:\Users\23232323\Downloads\mc.exe cp "C:\Users\23232323\Desktop\hero-bg.webp" myminio/logistic-pro/backgrounds/home/hero-bg.webp
```

### Вариант 3: Перейти в папку с файлом

```cmd
cd C:\Users\23232323\Downloads
C:\Users\23232323\Downloads\mc.exe cp hero-bg.webp myminio/logistic-pro/backgrounds/home/hero-bg.webp
```

### Вариант 4: Перетащить файл в командную строку

1. Введите команду до имени файла:
   ```cmd
   C:\Users\23232323\Downloads\mc.exe cp 
   ```

2. Перетащите файл из Проводника в окно командной строки
3. Продолжите команду:
   ```cmd
    myminio/logistic-pro/backgrounds/home/hero-bg.webp
   ```

## 📋 Примеры для разных расположений

### Файл в Downloads:
```cmd
C:\Users\23232323\Downloads\mc.exe cp "C:\Users\23232323\Downloads\hero-bg.webp" myminio/logistic-pro/backgrounds/home/hero-bg.webp
```

### Файл на рабочем столе:
```cmd
C:\Users\23232323\Downloads\mc.exe cp "C:\Users\23232323\Desktop\hero-bg.webp" myminio/logistic-pro/backgrounds/home/hero-bg.webp
```

### Файл в папке проекта:
```cmd
C:\Users\23232323\Downloads\mc.exe cp "C:\Users\23232323\Desktop\logistPro\hero-bg.webp" myminio/logistic-pro/backgrounds/home/hero-bg.webp
```

## 🎯 Рекомендация

**Самый простой способ:**

1. Поместите файл `hero-bg.webp` в папку проекта: `C:\Users\23232323\Desktop\logistPro\`
2. Выполните команду из этой папки:
   ```cmd
   cd C:\Users\23232323\Desktop\logistPro
   C:\Users\23232323\Downloads\mc.exe cp hero-bg.webp myminio/logistic-pro/backgrounds/home/hero-bg.webp
   ```

## ✅ Проверка

После загрузки проверьте:

```cmd
C:\Users\23232323\Downloads\mc.exe ls myminio/logistic-pro/backgrounds/home/
```

Должен быть виден файл `hero-bg.webp`.

---

**Итого: файл должен быть в текущей папке ИЛИ укажите полный путь к файлу!** 📁

