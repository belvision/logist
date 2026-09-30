'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

interface PageHeaderContextType {
  title: string;
  description: string;
  icon?: ReactNode;
  actions?: ReactNode;
  setHeader: (title: string, description: string, icon?: ReactNode, actions?: ReactNode) => void;
  clearHeader: () => void;
}

// Константы для значений по умолчанию
const DEFAULT_TITLE = 'Обзор компании';
const DEFAULT_DESCRIPTION = 'Статистика и управление вашей логистической компанией';

const PageHeaderContext = createContext<PageHeaderContextType | undefined>(undefined);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [description, setDescription] = useState(DEFAULT_DESCRIPTION);
  const [icon, setIcon] = useState<ReactNode | undefined>(undefined);
  const [actions, setActions] = useState<ReactNode | undefined>(undefined);

  const setHeader = useCallback((newTitle: string, newDescription: string, newIcon?: ReactNode, newActions?: ReactNode) => {
    setTitle(newTitle);
    setDescription(newDescription);
    setIcon(newIcon);
    setActions(newActions);
  }, []);

  const clearHeader = useCallback(() => {
    setTitle(DEFAULT_TITLE);
    setDescription(DEFAULT_DESCRIPTION);
    setIcon(undefined);
    setActions(undefined);
  }, []);

  const value = useMemo(
    () => ({
      title,
      description,
      icon,
      actions,
      setHeader,
      clearHeader,
    }),
    [title, description, icon, actions, setHeader, clearHeader],
  );

  return (
    <PageHeaderContext.Provider value={value}>
      {children}
    </PageHeaderContext.Provider>
  );
}

export function usePageHeader() {
  const context = useContext(PageHeaderContext);
  if (!context) {
    console.warn('usePageHeader called outside PageHeaderProvider');
    // Возвращаем значения по умолчанию, если контекст не найден
    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      icon: undefined,
      actions: undefined,
      setHeader: () => {
        console.warn('setHeader called but PageHeaderProvider is not available');
      },
      clearHeader: () => {
        console.warn('clearHeader called but PageHeaderProvider is not available');
      },
    };
  }
  return context;
}

