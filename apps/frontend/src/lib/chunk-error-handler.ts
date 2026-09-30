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

// Проверяем, является ли ошибка ChunkLoadError или ошибкой инициализации модуля
function isChunkLoadError(error: any): error is ChunkLoadError {
  return error?.name === 'ChunkLoadError' || 
         error?.name === 'ReferenceError' && error?.message?.includes('Cannot access') ||
         error?.message?.includes('Loading chunk') ||
         error?.message?.includes('ChunkLoadError') ||
         error?.message?.includes('before initialization');
}

// Обработчик ошибок загрузки чанков
export function handleChunkLoadError(error: any) {
  if (isChunkLoadError(error)) {
    console.warn('🔄 [CHUNK ERROR] ChunkLoadError or initialization error detected, clearing cache and reloading...', {
      error: error.message,
      errorName: error.name,
      chunkId: error.chunkId,
      chunkName: error.chunkName
    });
    
    // Очищаем кэш service worker если есть
    if ('serviceWorker' in navigator && 'caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    // Добавляем параметр для принудительного обновления
    const url = new URL(window.location.href);
    url.searchParams.set('_reload', Date.now().toString());
    
    // Небольшая задержка перед перезагрузкой, чтобы пользователь увидел что происходит
    setTimeout(() => {
      window.location.href = url.toString();
    }, 100);
    
    return true;
  }
  return false;
}

// Глобальный обработчик ошибок
export function setupChunkErrorHandler() {
  let reloadAttempts = 0;
  const MAX_RELOAD_ATTEMPTS = 3;

  const handleError = (error: any, event?: ErrorEvent | PromiseRejectionEvent) => {
    if (isChunkLoadError(error)) {
      reloadAttempts++;
      
      if (reloadAttempts > MAX_RELOAD_ATTEMPTS) {
        console.error('❌ [CHUNK ERROR] Max reload attempts reached. Clearing all cache and reloading...');
        // Очищаем все возможные кэши
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
          });
        }
        // Очищаем localStorage и sessionStorage
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {
          console.warn('Could not clear storage:', e);
        }
        reloadAttempts = 0;
      }

      if (event) {
        event.preventDefault();
      }

      handleChunkLoadError(error);
      return true;
    }
    return false;
  };

  // Обработчик для unhandledrejection (Promise rejections)
  window.addEventListener('unhandledrejection', (event) => {
    handleError(event.reason, event);
  });

  // Обработчик для error events
  window.addEventListener('error', (event) => {
    handleError(event.error, event);
  });

  // Обработчик для ошибок загрузки скриптов
  window.addEventListener('error', (event) => {
    if (event.target && (event.target as any).tagName === 'SCRIPT') {
      const scriptError = event.error || new Error(`Failed to load script: ${(event.target as HTMLScriptElement).src}`);
      handleError(scriptError, event);
    }
  }, true); // Используем capture phase для перехвата ошибок загрузки скриптов

}

// Автоматическая настройка при импорте
if (typeof window !== 'undefined') {
  // Задержка для обеспечения инициализации других модулей
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupChunkErrorHandler);
  } else {
    setupChunkErrorHandler();
  }
}
