#!/bin/bash

# Скрипт для создания .env файла на продакшене

echo "🔧 Setting up production environment for backend..."

cd apps/backend

# Проверяем, существует ли .env файл
if [ -f .env ]; then
    echo "⚠️  .env file already exists. Creating backup..."
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
fi

# Создаем .env файл из env.example
echo "📝 Creating .env file from env.example..."
cp env.example .env

echo "✅ .env file created successfully!"
echo ""
echo "⚠️  ВАЖНО! Проверьте следующие настройки в apps/backend/.env:"
echo ""
echo "1. MinIO настройки (должны быть для продакшена):"
echo "   MINIO_ENDPOINT=io.logistgo.pro"
echo "   MINIO_PORT=443"
echo "   MINIO_USE_SSL=true"
echo "   MINIO_ACCESS_KEY=minioadmin"
echo "   MINIO_SECRET_KEY=JXpKD1wn9rf8ash4fwr)pq!oM@Ry2e3bh0OW!)t"
echo "   MINIO_BUCKET_NAME=logistic-pro"
echo ""
echo "2. NODE_ENV должен быть:"
echo "   NODE_ENV=production"
echo ""
echo "3. Проверьте другие настройки (DB, SMTP, JWT и т.д.)"
echo ""
echo "После проверки перезапустите backend:"
echo "pm2 restart backend"
