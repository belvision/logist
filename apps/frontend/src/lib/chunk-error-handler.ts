// apps/frontend/src/lib/chunk-error-handler.ts
/**
 * Обработчик ошибок загрузки чанков Next.js
 * Автоматически перезагружает страницу при ChunkLoadError
 */

interface ChunkLoadError extends Error {
  name: 'ChunkLoadError';
  chunkId?: string;
  chunkName?: string;
}

// Проверяем, является ли ошибка ChunkLoadError
function isChunkLoadError(error: any): error is ChunkLoadError {
  return error?.name === 'ChunkLoadError' || 
         error?.message?.includes('Loading chunk') ||
         error?.message?.includes('ChunkLoadError');
}

// Обработчик ошибок загрузки чанков
export function handleChunkLoadError(error: any) {
  if (isChunkLoadError(error)) {
    console.warn('🔄 [CHUNK ERROR] ChunkLoadError detected, reloading page...', {
      error: error.message,
      chunkId: error.chunkId,
      chunkName: error.chunkName
    });
    
    // Перезагружаем страницу для восстановления
    window.location.reload();
    return true;
  }
  return false;
}

// Глобальный обработчик ошибок
export function setupChunkErrorHandler() {
  // Обработчик для unhandledrejection (Promise rejections)
  window.addEventListener('unhandledrejection', (event) => {
    if (handleChunkLoadError(event.reason)) {
      event.preventDefault();
    }
  });

  // Обработчик для error events
  window.addEventListener('error', (event) => {
    if (handleChunkLoadError(event.error)) {
      event.preventDefault();
    }
  });

  console.log('🔄 [CHUNK ERROR] Chunk error handler setup complete');
}

// Автоматическая настройка при импорте
if (typeof window !== 'undefined') {
  setupChunkErrorHandler();
}
