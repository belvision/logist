'use client';

import { useEffect, useState } from 'react';
import { getNotificationSettings, updateNotificationSettings, type NotificationSettings as Settings } from '@/shared/api/notifications';
import { Save, Bell } from 'lucide-react';
import { showToast } from '@/lib/toast';

export function NotificationSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getNotificationSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
      showToast.error('Ошибка загрузки настроек');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      await updateNotificationSettings(settings);
      showToast.success('Настройки сохранены');
    } catch (error) {
      console.error('Failed to save settings:', error);
      showToast.error('Ошибка сохранения настроек');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof Settings) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="p-6 text-center text-red-600 dark:text-red-400">
          Ошибка загрузки настроек
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Настройки уведомлений
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Управляйте способами получения уведомлений
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>

      {/* Email уведомления */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Email уведомления
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Получайте уведомления на вашу электронную почту
        </p>

        <div className="space-y-4">
          <ToggleItem
            label="Создание груза"
            description="Уведомления о новых грузах в компании"
            checked={settings.email_cargo_created}
            onChange={() => handleToggle('email_cargo_created')}
          />
          <ToggleItem
            label="Подходящие грузы"
            description="Уведомления о грузах, подходящих под ваши маршруты"
            checked={settings.email_cargo_match}
            onChange={() => handleToggle('email_cargo_match')}
          />
          <ToggleItem
            label="Подходящие маршруты"
            description="Уведомления о маршрутах, подходящих под ваши грузы"
            checked={settings.email_route_match}
            onChange={() => handleToggle('email_route_match')}
          />
          <ToggleItem
            label="Ответы в поддержке"
            description="Уведомления об ответах в ваших обращениях"
            checked={settings.email_support_reply}
            onChange={() => handleToggle('email_support_reply')}
          />
          <ToggleItem
            label="Приглашения в компанию"
            description="Уведомления о приглашениях в компании"
            checked={settings.email_company_invite}
            onChange={() => handleToggle('email_company_invite')}
          />
        </div>
      </div>

      {/* In-app уведомления */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Уведомления в приложении
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Получайте уведомления непосредственно в интерфейсе платформы
        </p>

        <div className="space-y-4">
          <ToggleItem
            label="Создание груза"
            description="Уведомления о новых грузах в компании"
            checked={settings.inapp_cargo_created}
            onChange={() => handleToggle('inapp_cargo_created')}
          />
          <ToggleItem
            label="Подходящие грузы"
            description="Уведомления о грузах, подходящих под ваши маршруты"
            checked={settings.inapp_cargo_match}
            onChange={() => handleToggle('inapp_cargo_match')}
          />
          <ToggleItem
            label="Подходящие маршруты"
            description="Уведомления о маршрутах, подходящих под ваши грузы"
            checked={settings.inapp_route_match}
            onChange={() => handleToggle('inapp_route_match')}
          />
          <ToggleItem
            label="Ответы в поддержке"
            description="Уведомления об ответах в ваших обращениях"
            checked={settings.inapp_support_reply}
            onChange={() => handleToggle('inapp_support_reply')}
          />
          <ToggleItem
            label="Приглашения в компанию"
            description="Уведомления о приглашениях в компании"
            checked={settings.inapp_company_invite}
            onChange={() => handleToggle('inapp_company_invite')}
          />
          <ToggleItem
            label="Системные уведомления"
            description="Важные уведомления от платформы"
            checked={settings.inapp_system}
            onChange={() => handleToggle('inapp_system')}
          />
        </div>
      </div>

      {/* Telegram уведомления (будущая функция) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 opacity-60">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Telegram уведомления
          </h3>
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">(Скоро)</span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Получайте уведомления в Telegram боте
        </p>

        <ToggleItem
          label="Включить Telegram уведомления"
          description="Связать аккаунт с Telegram ботом"
          checked={settings.telegram_enabled}
          onChange={() => handleToggle('telegram_enabled')}
          disabled={true}
        />
      </div>
    </div>
  );
}

interface ToggleItemProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

function ToggleItem({ label, description, checked, onChange, disabled = false }: ToggleItemProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <label className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
          {label}
        </label>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      <button
        type="button"
        onClick={onChange}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
          checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

