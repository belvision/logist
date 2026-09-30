import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Настройка для работы в монорепозитории
  outputFileTracingRoot: '../../',
  
  // Отключение Turbopack для стабильности
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
};

export default nextConfig;
