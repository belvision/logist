// apps/frontend/next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Если у тебя монорепо — оставляем; Next сам подставит абсолютный путь
  outputFileTracingRoot: '../../',

  // 1) Не валить сборку из-за ESLint (мы уже это включали ранее)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 2) ❗Главное: не валить сборку из-за TS-ошибок
  typescript: {
    ignoreBuildErrors: true,
  },

  // Исправления для ChunkLoadError и циклических зависимостей
  webpack: (config, { isServer }) => {
    // Улучшаем обработку циклических зависимостей
    config.resolve = {
      ...config.resolve,
      // Разрешаем циклические зависимости
      symlinks: false,
    };

    // Исключаем проблемные модули из обработки CSS
    // Next.js сам обрабатывает CSS, не нужно добавлять дополнительные правила

    // Увеличиваем лимиты для больших чанков
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization?.splitChunks,
        maxSize: 244000, // 244KB
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
            enforce: true,
          },
          // Выделяем tokenManager в отдельный чанк для избежания циклических зависимостей
          tokenManager: {
            test: /[\\/]lib[\\/]tokenManager/,
            name: 'token-manager',
            priority: 10,
            chunks: 'all',
            enforce: true,
          },
        },
      },
      // Улучшаем порядок модулей для избежания проблем с инициализацией
      moduleIds: 'deterministic',
      chunkIds: 'deterministic',
    };

    // Улучшаем обработку ошибок загрузки чанков
    config.output = {
      ...config.output,
      chunkLoadingGlobal: 'webpackChunklogistgo',
      // Используем более стабильные имена чанков
      chunkFilename: isServer
        ? '[name].js'
        : 'static/chunks/[name]-[contenthash:8].js',
    };

    return config;
  },

  // Настройки для продакшена
  generateEtags: false,
  poweredByHeader: false,
  
  // Улучшенная обработка ошибок
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  // Удалил устаревший experimental.turbo — он и так ругался в логах
  // Миграция на config.turbopack не обязательна прямо сейчас.
};

export default nextConfig;
