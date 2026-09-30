'use client';
import { useState } from 'react';
import { formatDate } from '@/lib/date-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChangePasswordModal } from '@/components/auth';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/shared/context/auth-context';
import { authChangePassword, authUpdateProfile } from '@/shared/api';
import useCompanyStore from '@/store/company-store';
import { AddCompanyModal } from '@/components/company/AddCompanyModal';
import { showToast, handleApiError } from '@/lib/toast';

interface SecuritySetting {
  id: string;
  title: string;
  description: string;
  action: (() => void) | null;
  actionText: string | null;
  status: { text: string; type: 'disabled' | 'enabled' } | null;
}

export default function ProfilePage() {
  const { companies, createCompany } = useCompanyStore();
  const { user, loading } = useAuth();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);

  const securitySettings: SecuritySetting[] = [
    {
      id: 'password',
      title: 'Пароль',
      description: `${user?.lastPasswordUpdate ? `Последнее изменение: ${formatDate(user.lastPasswordUpdate)}` : 'Пароль не изменялся'}`,
      action: () => setIsPasswordModalOpen(true),
      actionText: 'Изменить',
      status: null,
    },
  ];

  const handlePasswordChange = async (data: { newPassword: string; confirmPassword: string }) => {
    if (!user) return;
    
    try {
      await authChangePassword({ password: data.newPassword, id_user: user.id_user });
      showToast.success('Пароль успешно изменен');
    } catch (err) {
      handleApiError(err, 'Ошибка изменения пароля');
    }
  };

  const handleAddCompany = async (companyData: {
    name_company: string;
    unp: string;
    entity_type: 'ИП' | 'Предприятие';
    ur_address: string;
    tel_1: string;
    tel_2: string | null;
    email: string | null;
    id_tip_company: number;
  }) => {
    try {
      await createCompany(companyData);
      showToast.success('Компания успешно создана');
      setIsAddCompanyModalOpen(false);
    } catch (error) {
      handleApiError(error, 'Ошибка при создании компании');
      throw error;
    }
  };

  const handleEditProfile = () => {
    setIsEditing(true);
    setUserData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
  };

  const handleSaveProfile = async () => {
    // Проверка на пустое поле телефона
    if (!userData.phone || userData.phone.trim() === '') {
      alert('Заполните номер телефона');
      return;
    }

    try {
      await authUpdateProfile({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
      });
      setIsEditing(false);
      // Обновляем данные пользователя в контексте
      window.location.reload(); // Простое обновление страницы для получения новых данных
    } catch (error) {
      handleApiError(error, 'Ошибка при сохранении профиля');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setUserData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 text-white">Загрузка профиля...</div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64 text-white gap-4">
          <div>Необходимо войти в систему, чтобы просмотреть профиль.</div>
          <a
            href="/login"
            className="px-4 py-2 rounded-xl font-medium bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Войти
          </a>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4 lg:space-y-6">
        <h1 className="text-xl lg:text-2xl font-bold text-white mb-4 lg:mb-6">Профиль пользователя</h1>
        <div>

          {/* Первая строка - основная информация */}
          <div className="mb-4 lg:mb-6">
            <Card className="shadow-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <CardHeader className="space-y-1 pb-4 lg:pb-6">
                <CardTitle className="text-lg lg:text-2xl font-semibold text-center text-gray-900 dark:text-white">
                  Личная информация
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 lg:space-y-6">
                {/* Аватар и основная информация */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-semibold flex-shrink-0">
                    👤
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{user.firstName} {user.lastName}</h3>
                    <p className="text-gray-600 dark:text-gray-300">{user.email}</p>
                    {/* <p className="text-sm text-gray-500 dark:text-gray-400">{userData.company}</p> */}
                  </div>
                </div>

                {/* Форма редактирования */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Имя
                      </Label>
                      {isEditing ? (
                        <Input
                          id="firstName"
                          value={userData.firstName}
                          onChange={e => setUserData({...userData, firstName: e.target.value})}
                          className="h-12 px-4 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          style={{ colorScheme: 'light' }}
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-white py-3 px-4 bg-gray-50 dark:bg-gray-700 rounded-lg">{user.firstName || 'Не указано'}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Фамилия
                      </Label>
                      {isEditing ? (
                        <Input
                          id="lastName"
                          value={userData.lastName}
                          onChange={e => setUserData({...userData, lastName: e.target.value})}
                          className="h-12 px-4 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          style={{ colorScheme: 'light' }}
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-white py-3 px-4 bg-gray-50 dark:bg-gray-700 rounded-lg">{user.lastName || 'Не указано'}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email
                      </Label>
                      {isEditing ? (
                        <Input
                          id="email"
                          type="email"
                          value={userData.email}
                          onChange={e => setUserData({...userData, email: e.target.value})}
                          className="h-12 px-4 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          style={{ colorScheme: 'light' }}
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-white py-3 px-4 bg-gray-50 dark:bg-gray-700 rounded-lg">{user.email || 'Не указано'}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Телефон
                      </Label>
                      {isEditing ? (
                        <Input
                          id="phone"
                          value={userData.phone}
                          onChange={e => setUserData({...userData, phone: e.target.value})}
                          className="h-12 px-4 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          style={{ colorScheme: 'light' }}
                          required
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-white py-3 px-4 bg-gray-50 dark:bg-gray-700 rounded-lg">{user.phone || 'Не указано'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Кнопки действий */}
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                  {isEditing ? (
                    <>
                      <Button
                        onClick={handleSaveProfile}
                        className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                      >
                        Сохранить
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancelEdit}
                        className="flex-1 h-12"
                      >
                        Отмена
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={handleEditProfile}
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                    >
                      Редактировать профиль
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Вторая строка - настройки в 3 колонки */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Безопасность */}
            <Card className="shadow-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <CardHeader className="space-y-1 pb-4 lg:pb-6">
                <CardTitle className="text-lg lg:text-xl font-semibold text-center text-gray-900 dark:text-white">
                  Безопасность
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 lg:space-y-4">
                {securitySettings.map((setting) => (
                  <div key={setting.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 lg:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2 sm:space-y-0">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white text-sm lg:text-base">{setting.title}</p>
                      <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-300">{setting.description}</p>
                      {setting.status && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                          setting.status.type === 'disabled' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        }`}>
                          {setting.status.text}
                        </span>
                      )}
                    </div>
                    {setting.action && (
                      <Button
                        variant="outline"
                        onClick={setting.action}
                        className="h-8 lg:h-10 w-full sm:w-auto sm:ml-3 text-xs lg:text-sm"
                      >
                        {setting.actionText}
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Компании */}
            <Card className="shadow-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <CardHeader className="space-y-1 pb-4 lg:pb-6">
                <CardTitle className="text-lg lg:text-xl font-semibold text-center text-gray-900 dark:text-white">
                  Мои компании
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {companies.slice(0, 3).map((company) => (
                  <div
                    key={company.id_company}
                    className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors ${
                      company.docs_approved 
                        ? 'bg-blue-50 dark:bg-blue-900/20' 
                        : 'bg-gray-50 dark:bg-gray-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded flex items-center justify-center text-white text-sm flex-shrink-0 ${
                      company.docs_approved ? 'bg-blue-600' : 'bg-gray-600'
                    }`}>
                      {company.entity_type === 'ИП' ? '👤' : '🏢'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm lg:text-base truncate ${
                        company.docs_approved 
                          ? 'text-blue-900 dark:text-blue-100' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {company.name_company}
                      </div>
                      <div className={`text-xs ${
                        company.docs_approved 
                          ? 'text-blue-600 dark:text-blue-300' 
                          : 'text-gray-600 dark:text-gray-300'
                      }`}>
                        {company.entity_type}
                      </div>
                    </div>
                  </div>
                ))}

                <Button variant="outline" className="w-full mt-4 h-8 lg:h-10 text-xs lg:text-sm" onClick={() => setIsAddCompanyModalOpen(true)}>
                  <span className="mr-2">+</span>
                  Добавить компанию
                </Button>
              </CardContent>
            </Card>

            <AddCompanyModal
              isOpen={isAddCompanyModalOpen}
              onClose={() => setIsAddCompanyModalOpen(false)}
              onSubmit={handleAddCompany}
            />
          </div>

          <div className="text-center mt-6 lg:mt-8">
            <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">
              © 2024 LogisticPro. Все права защищены.
            </p>
          </div>
        </div>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSubmit={handlePasswordChange}
      />
      </div>
    </AppLayout>
  );
}
