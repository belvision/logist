# Фоновые изображения для оранжевых блоков на странице "7 шагов"

## 📐 Размеры изображений

### Рекомендуемые размеры:
- **Ширина:** 600px (для Retina дисплеев)
- **Высота:** 500px (соотношение 6:5 или 1.2:1)
- **Формат:** WebP
- **Размер файла:** 80-150 KB

**Почему такие размеры:**
- Оранжевый блок занимает `md:w-1/3` от контейнера (≈384px на десктопе)
- Для Retina дисплеев нужно 2x разрешение: 384px × 2 = 768px
- С учетом padding и отступов оптимально: **600×500px**

## 🎨 Требования к изображениям

1. **Соотношение сторон:** 6:5 или 1.2:1 (ширина немного больше высоты)
2. **Формат:** WebP (лучшее сжатие) или JPG
3. **Оптимизация:** Сжимайте изображения перед загрузкой
4. **Стиль:** Изображения должны хорошо смотреться с оранжевым overlay (80% прозрачности)

## 📂 Структура в MinIO

```
logistic-pro/
  └── backgrounds/
      └── carriers/
          └── 7-steps/
              ├── step-1.webp
              ├── step-2.webp
              ├── step-3.webp
              ├── step-4.webp
              ├── step-5.webp
              ├── step-6.webp
              └── step-7.webp
```

## 🔧 Загрузка изображений в MinIO

### Создание папки (если нужно):
```cmd
C:\Users\23232323\Downloads\mc.exe mb myminio/logistic-pro/backgrounds/carriers/7-steps
```

### Загрузка изображений:
```cmd
# Шаг 1
C:\Users\23232323\Downloads\mc.exe cp step-1.webp myminio/logistic-pro/backgrounds/carriers/7-steps/step-1.webp

# Шаг 2
C:\Users\23232323\Downloads\mc.exe cp step-2.webp myminio/logistic-pro/backgrounds/carriers/7-steps/step-2.webp

# Шаг 3
C:\Users\23232323\Downloads\mc.exe cp step-3.webp myminio/logistic-pro/backgrounds/carriers/7-steps/step-3.webp

# Шаг 4
C:\Users\23232323\Downloads\mc.exe cp step-4.webp myminio/logistic-pro/backgrounds/carriers/7-steps/step-4.webp

# Шаг 5
C:\Users\23232323\Downloads\mc.exe cp step-5.webp myminio/logistic-pro/backgrounds/carriers/7-steps/step-5.webp

# Шаг 6
C:\Users\23232323\Downloads\mc.exe cp step-6.webp myminio/logistic-pro/backgrounds/carriers/7-steps/step-6.webp

# Шаг 7
C:\Users\23232323\Downloads\mc.exe cp step-7.webp myminio/logistic-pro/backgrounds/carriers/7-steps/step-7.webp
```

### Проверка загрузки:
```cmd
C:\Users\23232323\Downloads\mc.exe ls myminio/logistic-pro/backgrounds/carriers/7-steps/
```

## ✅ Как это работает

1. **Если изображение загружено:** Отображается фоновое изображение с оранжевым overlay (80% прозрачности) для читаемости текста
2. **Если изображение не загружено:** Отображается градиентный фон `from-orange-500 to-orange-600`

## 🎯 Рекомендации по дизайну

- Изображения должны быть **тематически связаны** с каждым шагом
- Используйте **яркие, контрастные** изображения, которые хорошо смотрятся с оранжевым overlay
- Избегайте слишком темных или слишком светлых изображений
- Убедитесь, что **белый текст** (иконка, номер, "Шаг") хорошо читается поверх изображения

## 📱 Адаптивность

Изображения автоматически масштабируются на всех устройствах:
- **Десктоп:** Полная ширина блока (~384px)
- **Планшет:** Адаптируется под размер экрана
- **Мобильный:** Блок занимает всю ширину, изображение масштабируется

---

**Пример имен файлов:**
- `step-1.webp` - для первого шага (Регистрация)
- `step-2.webp` - для второго шага (Добавление транспорта)
- `step-3.webp` - для третьего шага (Профиль компании)
- и так далее...

