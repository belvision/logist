"use client";

import React, { useState, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  items?: TabItem[];
  defaultValue?: string;
  className?: string;
  children?: React.ReactNode;
}

interface TabsContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export function Tabs({ items, defaultValue, className, children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue || items?.[0]?.id || '');

  const activeItem = items?.find(item => item.id === activeTab);

  // If using items prop (old API)
  if (items) {
    if (!items || items.length === 0) {
      return <div className={cn("w-full", className)}>No tabs available</div>;
    }

    return (
      <div className={cn("w-full", className)}>
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50">
          <nav className="-mb-px flex space-x-1 p-1">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "relative whitespace-nowrap py-3 px-6 font-medium text-sm transition-all duration-200 rounded-t-lg",
                  activeTab === item.id
                    ? "text-blue-600 dark:text-blue-400 bg-gray-50 dark:bg-gray-800 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                )}
              >
                {item.label}
                {activeTab === item.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
                )}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-6">
          {activeItem?.content}
        </div>
      </div>
    );
  }

  // If using children (new API with TabsList, TabsTrigger, TabsContent)
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn("w-full", className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  className?: string;
  children: React.ReactNode;
}

export function TabsList({ className, children }: TabsListProps) {
  return (
    <div className={cn("border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50", className)}>
      <nav className="-mb-px flex space-x-1 p-1">
        {children}
      </nav>
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

export function TabsTrigger({ value, className, children }: TabsTriggerProps) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('TabsTrigger must be used within a Tabs component');
  }

  const { activeTab, setActiveTab } = context;
  const isActive = activeTab === value;

  return (
    <button
      onClick={() => setActiveTab(value)}
      className={cn(
        "relative whitespace-nowrap py-3 px-6 font-medium text-sm transition-all duration-200 rounded-t-lg",
        isActive
          ? "text-blue-600 dark:text-blue-400 bg-gray-50 dark:bg-gray-800 shadow-sm"
          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50",
        className
      )}
    >
      {children}
      {isActive && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
      )}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

export function TabsContent({ value, className, children }: TabsContentProps) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('TabsContent must be used within a Tabs component');
  }

  const { activeTab } = context;

  if (activeTab !== value) {
    return null;
  }

  return (
    <div className={cn("mt-6", className)}>
      {children}
    </div>
  );
}
