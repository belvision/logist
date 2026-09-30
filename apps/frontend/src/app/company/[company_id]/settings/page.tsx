'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { useState } from 'react';
import { Bell, Building2, User, Shield } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'company' | 'security'>('notifications');

  const tabs = [
    { id: 'profile' as const, name: 'Профиль', icon: User },
    { id: 'notifications' as const, name: 'Уведомления', icon: Bell },
    { id: 'company' as const, name: 'Компания', icon: Building2 },
    { id: 'security' as const, name: 'Безопасность', icon: Shield },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Настройки</h1>

        {/* Вкладки */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Контент вкладок */}
        <div className="mt-6">
          {activeTab === 'notifications' && <NotificationSettings />}
          
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Настройки профиля
              </h2>
              <p className="text-gray-600 dark:text-gray-400">В разработке...</p>
            </div>
          )}
          
          {activeTab === 'company' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Настройки компании
              </h2>
              <p className="text-gray-600 dark:text-gray-400">В разработке...</p>
            </div>
          )}
          
          {activeTab === 'security' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Безопасность
              </h2>
              <p className="text-gray-600 dark:text-gray-400">В разработке...</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}