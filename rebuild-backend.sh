#!/bin/bash

# Скрипт для пересборки и перезапуска backend на сервере

echo "🔧 Rebuilding backend..."

cd ~/www/logistgo.pro/logistgo-next

# Обновить код
echo "📥 Pulling latest code..."
git pull origin serg

# Собрать backend
echo "🔨 Building backend..."
cd apps/backend
npm run build

# Вернуться в корень
cd ../..

# Перезапустить
echo "♻️ Restarting backend..."
pm2 restart backend

echo "✅ Done! Checking logs..."
pm2 logs backend --lines 20

