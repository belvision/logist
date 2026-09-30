#!/bin/bash

# Скрипт для пересборки и перезапуска backend на сервере
# Универсальная версия - работает из любого места в проекте

set -e  # Остановить выполнение при ошибке

# Получить корневую директорию проекта (где находится этот скрипт)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

echo "🔧 Rebuilding backend..."
echo "📁 Project root: $PROJECT_ROOT"

# Перейти в корень проекта
cd "$PROJECT_ROOT"

# Определить ветку (можно передать как аргумент или использовать текущую)
if [ -n "$1" ]; then
    BRANCH="$1"
    echo "🌿 Using branch from argument: $BRANCH"
else
    # Получить текущую ветку
    BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
    echo "🌿 Using current branch: $BRANCH"
fi

# Обновить код
echo "📥 Pulling latest code from origin/$BRANCH..."
if git pull origin "$BRANCH"; then
    echo "✅ Code updated successfully"
else
    echo "⚠️  Warning: git pull failed, continuing with build..."
fi

# Собрать backend
echo "🔨 Building backend..."
cd apps/backend

if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found in apps/backend"
    exit 1
fi

npm run build

# Вернуться в корень
cd "$PROJECT_ROOT"

# Перезапустить через PM2
echo "♻️ Restarting backend via PM2..."

# Проверить, существует ли процесс backend в PM2
if pm2 list | grep -q "backend"; then
    echo "🔄 Restarting existing backend process..."
    pm2 restart backend
else
    echo "⚠️  Backend process not found in PM2"
    echo "💡 Tip: Start backend with: pm2 start ecosystem.config.js"
    exit 1
fi

echo "✅ Done! Checking logs..."
pm2 logs backend --lines 20 --nostream





