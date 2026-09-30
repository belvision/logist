# Скачивание MinIO Client (mc) - Прямые ссылки

## 🪟 Windows

### Способ 1: PowerShell (рекомендуется)

Откройте PowerShell и выполните:

```powershell
# Скачать mc.exe
Invoke-WebRequest -Uri "https://dl.min.io/client/mc/release/windows-amd64/mc.exe" -OutFile "mc.exe"

# Проверить версию
.\mc.exe --version
```

### Способ 2: Через браузер

Прямая ссылка для скачивания:
- **mc.exe (Windows 64-bit)**: https://dl.min.io/client/mc/release/windows-amd64/mc.exe

1. Откройте ссылку в браузере
2. Файл должен автоматически скачаться
3. Сохраните `mc.exe` в удобную папку (например, `C:\tools\`)

### Способ 3: Через curl (если установлен)

```cmd
curl -o mc.exe https://dl.min.io/client/mc/release/windows-amd64/mc.exe
```

## 🐧 Linux

```bash
# Скачать
wget https://dl.min.io/client/mc/release/linux-amd64/mc

# Сделать исполняемым
chmod +x mc

# Переместить в системную папку
sudo mv mc /usr/local/bin/

# Проверить
mc --version
```

## 🍎 macOS

```bash
# Через Homebrew (рекомендуется)
brew install minio/stable/mc

# Или напрямую
curl -O https://dl.min.io/client/mc/release/darwin-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/
mc --version
```

## ✅ После скачивания

### Настройка подключения

```bash
# Windows (в командной строке или PowerShell)
mc.exe alias set myminio https://io.logistgo.pro minioadmin JXpKD1wn9rf8ash4fwr)pq!oM@Ry2e3bh0OW!)t

# Linux/Mac
mc alias set myminio https://io.logistgo.pro minioadmin JXpKD1wn9rf8ash4fwr)pq!oM@Ry2e3bh0OW!)t
```

### Проверка подключения

```bash
mc ls myminio/logistic-pro/
```

### Загрузка фоновых изображений

```bash
# Создать папки
mc mb myminio/logistic-pro/backgrounds/home
mc mb myminio/logistic-pro/backgrounds/carriers
mc mb myminio/logistic-pro/backgrounds/cargo-owners
mc mb myminio/logistic-pro/backgrounds/team

# Загрузить изображения
mc cp hero-bg.jpg myminio/logistic-pro/backgrounds/home/hero-bg.jpg
```

## 🔗 Прямые ссылки для скачивания

- **Windows 64-bit**: https://dl.min.io/client/mc/release/windows-amd64/mc.exe
- **Linux 64-bit**: https://dl.min.io/client/mc/release/linux-amd64/mc
- **macOS 64-bit**: https://dl.min.io/client/mc/release/darwin-amd64/mc
- **macOS ARM64**: https://dl.min.io/client/mc/release/darwin-arm64/mc

## 📝 Примечание

Если ссылка не работает в браузере, используйте PowerShell или curl для скачивания.

---

**Источник**: [MinIO Download Page](https://www.min.io/download)

