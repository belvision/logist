'use client';

import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  // i18n инициализируется синхронно при импорте, поэтому не нужна проверка
  // Это предотвращает проблемы с гидратацией и мерцание контента
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
};

