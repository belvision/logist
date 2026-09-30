#!/bin/bash

# Скрипт для проверки конфигурации MinIO на сервере

echo "🔍 Checking MinIO Configuration..."
echo "=================================="
echo ""

# Проверяем, существует ли .env файл
if [ -f "apps/backend/.env" ]; then
    echo "✅ .env file exists"
    echo ""
    echo "📋 MinIO Configuration from .env:"
    echo "-----------------------------------"
    grep "MINIO" apps/backend/.env
    echo ""
else
    echo "❌ .env file NOT found in apps/backend/"
    echo "⚠️  Backend is using default values (localhost:9000)"
    echo ""
    echo "To fix:"
    echo "cd apps/backend"
    echo "cp env.example .env"
    echo ""
fi

# Проверяем NODE_ENV
if [ -f "apps/backend/.env" ]; then
    echo "📋 Environment:"
    echo "-----------------------------------"
    grep "NODE_ENV" apps/backend/.env
    echo ""
fi

# Проверяем, запущен ли backend
echo "📋 Backend Status:"
echo "-----------------------------------"
pm2 list | grep backend || echo "Backend not found in PM2"
echo ""

# Проверяем логи backend
echo "📋 Recent Backend Logs (last 20 lines):"
echo "-----------------------------------"
pm2 logs backend --lines 20 --nostream 2>/dev/null || echo "Could not fetch logs"
echo ""

echo "=================================="
echo "🔧 Recommended Actions:"
echo "=================================="
echo ""
echo "1. If .env is missing or has wrong config:"
echo "   cd apps/backend && cp env.example .env"
echo ""
echo "2. Restart backend after .env changes:"
echo "   pm2 restart backend"
echo ""
echo "3. Check backend logs for errors:"
echo "   pm2 logs backend"
echo ""
echo "4. Test MinIO connection:"
echo "   curl -I https://io.logistgo.pro/logistic-pro/"
echo ""
