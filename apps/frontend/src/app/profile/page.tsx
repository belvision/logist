'use client';
import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/date-utils';
import { Button } from '@/components/ui/button';
import { ChangePasswordModal, LogoutConfirmationModal } from '@/components/auth';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/shared/context/auth-context';
import { authChangePassword, authUpdateProfile } from '@/shared/api';
import useCompanyStore from '@/store/company-store';
import { AddCompanyModal } from '@/components/company/AddCompanyModal';
import { showToast, handleApiError } from '@/lib/toast';
import { Lock, LogOut, Building2 } from 'lucide-react';
import { AvatarUpload } from '@/components/user/AvatarUpload';

export default function ProfilePage() {
  const { companies, createCompany, getCompanies } = useCompanyStore();
  const { user, loading, updateUser, logout } = useAuth();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (getCompanies && typeof getCompanies === 'function') {
      getCompanies();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePasswordChange = async (data: { newPassword: string; confirmPassword: string }) => {
    if (!user) return;
    
    try {
      const result = await authChangePassword({ password: data.newPassword, id_user: user.id_user });
      if (!result.success) {
        throw new Error(result.error || 'Ошибка изменения пароля');
      }
      showToast.success('Пароль успешно изменен');
      setIsPasswordModalOpen(false);
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
      getCompanies();
    } catch (error) {
      handleApiError(error, 'Ошибка при создании компании');
      throw error;
    }
  };

  const handleSaveProfile = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      showToast.error('Заполните все обязательные поля');
      return;
    }

    try {
      await authUpdateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
      });
      setIsEditing(false);
      showToast.success('Профиль успешно обновлен');
      updateUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
      });
    } catch (error) {
      handleApiError(error, 'Ошибка при сохранении профиля');
    }
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    showToast.success('Вы вышли из системы');
    logout();
    setIsLogoutModalOpen(false);
  };

  if (loading || !user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Загрузка профиля...</div>
        </div>
      </AppLayout>
    );
  }

  const initials = `${(formData.firstName?.[0] || '')}${(formData.lastName?.[0] || '')}`.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U';
  const joinDate = user.createdAt 
    ? new Date(user.createdAt).toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
      })
    : new Date().toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
      });

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">

        {/* Personal Information Section */}
        <div className="bg-card border border-border rounded-lg p-4 md:p-8">
          <div className="text-center mb-6 md:mb-8">
            {isEditing ? (
              <div className="mb-4">
                <AvatarUpload 
                  avatarUrl={user.avatar_url} 
                  onAvatarUpdate={(avatarUrl) => {
                    updateUser({ avatar_url: avatarUrl } as any);
                  }} 
                />
              </div>
            ) : (
              <>
                {user.avatar_url ? (
                  <div className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-3 md:mb-4 rounded-full overflow-hidden relative">
                    <img
                      src={user.avatar_url} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-3 md:mb-4 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xl md:text-2xl relative">
                    {initials}
                    <div className="absolute bottom-0.5 right-0.5 md:bottom-1 md:right-1 w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded-full border-2 border-card"></div>
                  </div>
                )}
              </>
            )}
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-1">
              {formData.firstName} {formData.lastName}
            </h3>
            <p className="text-sm md:text-base text-muted-foreground mb-1 break-words">{formData.email}</p>
            <p className="text-xs md:text-sm text-muted-foreground">Участник с {joinDate} г.</p>
          </div>

          <h4 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4 text-center">Личная информация</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
            <div>
              <label className="text-xs md:text-sm font-medium text-muted-foreground mb-1.5 md:mb-2 block">Имя</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                disabled={!isEditing}
                className="w-full px-3 md:px-4 py-2 text-sm md:text-base bg-accent/5 border border-border rounded-lg text-foreground disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs md:text-sm font-medium text-muted-foreground mb-1.5 md:mb-2 block">Фамилия</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                disabled={!isEditing}
                className="w-full px-3 md:px-4 py-2 text-sm md:text-base bg-accent/5 border border-border rounded-lg text-foreground disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs md:text-sm font-medium text-muted-foreground mb-1.5 md:mb-2 block">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!isEditing}
                className="w-full px-3 md:px-4 py-2 text-sm md:text-base bg-accent/5 border border-border rounded-lg text-foreground disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs md:text-sm font-medium text-muted-foreground mb-1.5 md:mb-2 block">Телефон</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing}
                className="w-full px-3 md:px-4 py-2 text-sm md:text-base bg-accent/5 border border-border rounded-lg text-foreground disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {isEditing ? (
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
              <button
                onClick={handleSaveProfile}
                className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-lg text-sm md:text-base font-medium hover:bg-primary/90 transition-colors"
              >
                Сохранить
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    email: user.email || '',
                    phone: user.phone || '',
                  });
                }}
                className="flex-1 bg-muted text-muted-foreground py-2 px-4 rounded-lg text-sm md:text-base font-medium hover:bg-muted/80 transition-colors"
              >
                Отменить
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg text-sm md:text-base font-medium hover:bg-primary/90 transition-colors"
            >
              Редактировать профиль
            </button>
          )}
        </div>

        {/* Security and Company Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Security Section */}
          <div className="bg-card border border-border rounded-lg p-4 md:p-6">
            <h4 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 md:w-5 md:h-5" />
              Безопасность
            </h4>

            <div className="space-y-3 md:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 md:p-4 bg-accent/5 rounded-lg border border-border/50 hover:bg-accent/10 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {/* <Lock className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground flex-shrink-0" /> */}
                    <p className="font-medium text-sm md:text-base text-foreground">Пароль</p>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground break-words">
                    {user.lastPasswordUpdate 
                      ? `Последнее изменение: ${formatDate(user.lastPasswordUpdate)}` 
                      : 'Пароль не изменялся'}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs md:text-sm bg-transparent w-full sm:w-auto flex-shrink-0 h-9 md:h-10"
                  onClick={() => setIsPasswordModalOpen(true)}
                >
                  Изменить
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 md:p-4 bg-accent/5 rounded-lg border border-border/50 hover:bg-accent/10 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm md:text-base text-foreground">Выход из системы</p>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground">Завершить текущую сессию и выйти из аккаунта</p>
                </div>
                <Button 
                  onClick={handleLogout} 
                  variant="destructive" 
                  size="sm"
                  className="text-xs md:text-sm gap-2 w-full sm:w-auto flex-shrink-0 h-9 md:h-10"
                >
                  <LogOut className="w-3 h-3 md:w-4 md:h-4" />
                  Выйти
                </Button>
              </div>
            </div>
          </div>

          {/* My Companies Section */}
          <div className="bg-card border border-border rounded-lg p-4 md:p-6">
            <h4 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 md:w-5 md:h-5" />
              Мои компании
            </h4>

            <div className="space-y-2 mb-3 md:mb-4">
              {companies && companies.length > 0 ? (
                companies.map((company) => (
                  <div key={company.id_company} className="p-3 md:p-4 bg-accent/5 rounded-lg">
                    <p className="font-medium text-sm md:text-base text-foreground break-words">{company.name_company}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">{company.entity_type}</p>
                  </div>
                ))
              ) : (
                <div className="p-3 md:p-4 bg-accent/5 rounded-lg">
                  <p className="text-xs md:text-sm text-muted-foreground">Нет компаний</p>
                </div>
              )}
            </div>

            <button 
              onClick={() => setIsAddCompanyModalOpen(true)}
              className="w-full border border-primary text-primary py-2 px-4 rounded-lg text-sm md:text-base font-medium hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
            >
              <span>+</span>
              Добавить компанию
            </button>
          </div>
        </div>
      </div>

      {/* Модальные окна */}
      <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} onSubmit={handlePasswordChange} />

      <AddCompanyModal
        isOpen={isAddCompanyModalOpen}
        onClose={() => setIsAddCompanyModalOpen(false)}
        onSubmit={handleAddCompany}
      />

      {/* Модалка подтверждения выхода */}
      <LogoutConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={confirmLogout}
      />
    </AppLayout>
  );
}
