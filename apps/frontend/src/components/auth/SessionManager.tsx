'use client';

import { useEffect, useState } from 'react';
import { SessionExpiredModal } from './SessionExpiredModal';
import { tokenManager } from '@/lib/tokenManager';

export function SessionManager() {
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  useEffect(() => {
    const handleSessionExpired = () => {
      setIsSessionExpired(true);
    };

    // Слушаем событие истечения сессии
    window.addEventListener('session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('session-expired', handleSessionExpired);
    };
  }, []);

  const handleRefresh = async () => {
    const success = await tokenManager.refreshToken();
    if (success) {
      setIsSessionExpired(false);
      // Перезагружаем страницу для обновления состояния
      window.location.reload();
    }
  };

  const handleClose = () => {
    setIsSessionExpired(false);
  };

  return (
    <SessionExpiredModal
      isOpen={isSessionExpired}
      onClose={handleClose}
      onRefresh={handleRefresh}
    />
  );
}
