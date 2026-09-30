'use client';

import { useEffect, useState } from 'react';
import { X } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { companyInfoByUnp, getCompanyTypes } from '@/shared/api/company';

interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (companyData: CompanyFormData) => void;
}

interface CompanyFormData {
  name_company: string;
  unp: string;
  entity_type: 'ИП' | 'Предприятие';
  ur_address: string;
  tel_1: string;
  tel_2: string | null;
  email: string | null;
  id_tip_company: number;
}

interface CompanyType {
  id_tip_company: number;
  name_tip_company: string;
  status: boolean;
}

const ENTITY_TYPE_OPTIONS = [
  { value: 'ИП', label: 'Индивидуальный предприниматель (ИП)' },
  { value: 'Предприятие', label: 'Предприятие' }
];

export const AddCompanyModal = ({ isOpen, onClose, onSubmit }: AddCompanyModalProps) => {
  const [formData, setFormData] = useState<CompanyFormData>({
    name_company: '',
    unp: '',
    entity_type: 'ИП',
    ur_address: '',
    tel_1: '',
    tel_2: null,
    email: '',
    id_tip_company: 1,
  });
  const [companyTypes, setCompanyTypes] = useState<CompanyType[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof CompanyFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unpRemoteError, setUnpRemoteError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CompanyFormData, string>> = {};

    if (!formData.name_company.trim()) {
      newErrors.name_company = 'Название компании обязательно';
    }

    if (!formData.unp.trim()) {
      newErrors.unp = 'УНП обязательно';
    } else if (!/^\d{9}$/.test(formData.unp.replace(/\s/g, ''))) {
      newErrors.unp = 'УНП должен содержать 9 цифр';
    }

    if (!formData.entity_type) {
      newErrors.entity_type = 'Выберите тип юридического лица';
    }

    if (!formData.ur_address.trim()) {
      newErrors.ur_address = 'Юридический адрес обязателен';
    }

    if (!formData.tel_1.trim()) {
      newErrors.tel_1 = 'Основной телефон обязателен';
    } else if (!/^[\+]?[0-9\s\-\(\)]{5,13}$/.test(formData.tel_1)) {
      newErrors.tel_1 = 'Неверный формат телефона';
    }

    if (formData.tel_2 && formData.tel_2.trim() !== '' && !/^[\+]?[0-9\s\-\(\)]{5,13}$/.test(formData.tel_2)) {
      newErrors.tel_2 = 'Неверный формат дополнительного телефона';
    }

    if (formData.email && formData.email.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Неверный формат email';
    }

    if (!formData.id_tip_company || formData.id_tip_company === 0) {
      newErrors.id_tip_company = 'Выберите тип компании';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Предварительно проверим УНП через /company/grp, чтобы показать точную ошибку под полем
    try {
      await companyInfoByUnp(formData.unp);
      setUnpRemoteError(null);
    } catch (err: unknown) {
      if ((err as any)?.code === 'NO_COMPANY_BY_UNP') {
        setUnpRemoteError('Проверьте правильность введённых данных, с таким УНП нет зарегистрированной компании');
        setIsSubmitting(false);
        return;
      }
      if ((err as any)?.code === 'SERVICES_UNAVAILABLE') {
        setUnpRemoteError('Сервисы поиска компаний недоступны. Попробуйте позже.');
        setIsSubmitting(false);
        return;
      }
      // Иная ошибка — продолжим и дадим стандартную обработку onSubmit
    }

    try {
      await onSubmit(formData);
      handleClose();
    } catch (error) {
      console.error('Ошибка при создании компании:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name_company: '',
      unp: '',
      entity_type: 'ИП',
      ur_address: '',
      tel_1: '',
      tel_2: '',
      email: '',
      id_tip_company: 0,
    });
    setErrors({});
    onClose();
  };

  const handleInputChange = (field: keyof CompanyFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if (field === 'unp' && unpRemoteError) {
      setUnpRemoteError(null);
    }
  };

  useEffect(() => {
    if (formData.unp.length === 9) {
      const fetchCompanyInfo = async () => {
        try {
          const data = await companyInfoByUnp(formData.unp);
          setFormData(prev => ({
            ...prev,
            name_company: (data && data.name_company) ? data.name_company : '',
            entity_type: (data && data.entity_type === 'ИП') ? 'ИП' : 'Предприятие',
            ur_address: (data && data.ur_address) ? data.ur_address : ''
          }));
          setUnpRemoteError(null);
        } catch (err: unknown) {
          const msg = String((err as any)?.message || '');
          if ((err as any)?.code === 'NO_COMPANY_BY_UNP' || msg.includes('С таким УНП нет зарегистрированной компании')) {
            setUnpRemoteError('Проверьте правильность введённых данных, с таким УНП нет зарегистрированной компании');
          } else if ((err as any)?.code === 'SERVICES_UNAVAILABLE' || msg.includes('Сервисы поиска компаний недоступны')) {
            setUnpRemoteError('Сервисы поиска компаний недоступны. Попробуйте позже.');
          }
        }
      };

      fetchCompanyInfo();
    }
  }, [formData.unp]);

  useEffect(() => {
    const fetchCompanyTypes = async () => {
      const data = await getCompanyTypes();
      setCompanyTypes(data.companies.filter((company: CompanyType) => company.status));
    };
    fetchCompanyTypes();
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Добавить компанию</h2>
            <p className="text-sm text-muted-foreground">Заполните информацию о новой компании</p>
          </div>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground" disabled={isSubmitting}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Название компании */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Название компании *</label>
              <Input
                type="text"
                value={formData.name_company ?? ''}
                onChange={(e) => handleInputChange('name_company', e.target.value)}
                placeholder="Введите название компании"
                className={cn(errors.name_company && 'border-red-500')}
                disabled={isSubmitting}
              />
              {errors.name_company && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.name_company}</p>
              )}
            </div>

            {/* УНП */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">УНП (Учетный номер плательщика) *</label>
              <Input
                type="text"
                value={formData.unp ?? ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                  handleInputChange('unp', value);
                }}
                placeholder="123456789"
                className={cn(errors.unp && 'border-red-500')}
                disabled={isSubmitting}
              />
              {errors.unp && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.unp}</p>
              )}
              {unpRemoteError && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{unpRemoteError}</p>
              )}
            </div>

            {/* Тип юридического лица */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Тип юридического лица *</label>
              <Select
                value={formData.entity_type}
                onValueChange={(value) => handleInputChange('entity_type', value as 'ИП' | 'Предприятие')}
                disabled={isSubmitting}
              >
                <SelectTrigger className={cn(errors.entity_type && 'border-red-500', 'w-full')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.entity_type && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.entity_type}</p>
              )}
            </div>

            {/* Юридический адрес */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Юридический адрес *</label>
              <textarea
                value={formData.ur_address ?? ''}
                onChange={(e) => handleInputChange('ur_address', e.target.value)}
                placeholder="Полный юридический адрес компании"
                rows={3}
                className={cn(
                  "w-full min-h-[80px] px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none",
                  errors.ur_address && 'border-red-500'
                )}
                disabled={isSubmitting}
              />
              {errors.ur_address && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.ur_address}</p>
              )}
            </div>

            {/* Основной телефон */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Основной телефон *</label>
              <Input
                type="tel"
                value={formData.tel_1 ?? ''}
                onChange={(e) => handleInputChange('tel_1', e.target.value)}
                placeholder="+375 29 123-45-67"
                className={cn(errors.tel_1 && 'border-red-500')}
                disabled={isSubmitting}
              />
              {errors.tel_1 && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.tel_1}</p>
              )}
            </div>

            {/* Дополнительный телефон */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Дополнительный телефон</label>
              <Input
                type="tel"
                value={formData.tel_2 ?? ''}
                onChange={(e) => handleInputChange('tel_2', e.target.value)}
                placeholder="+375 29 987-65-43"
                className={cn(errors.tel_2 && 'border-red-500')}
                disabled={isSubmitting}
              />
              {errors.tel_2 && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.tel_2}</p>
              )}
            </div>

            {/* Тип компании */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Тип компании *</label>
              <Select
                {...(formData.id_tip_company !== 0 && { value: formData.id_tip_company.toString() })}
                onValueChange={(value) => handleInputChange('id_tip_company', parseInt(value))}
                disabled={isSubmitting}
              >
                <SelectTrigger className={cn(errors.id_tip_company && 'border-red-500', 'w-full')}>
                  <SelectValue placeholder="Выберите тип компании" />
                </SelectTrigger>
                <SelectContent>
                  {companyTypes.map((option) => (
                    <SelectItem key={option.id_tip_company} value={option.id_tip_company.toString()}>
                      {option.name_tip_company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.id_tip_company && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.id_tip_company}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <Input
                type="email"
                value={formData.email ?? ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="info@company.com"
                className={cn(errors.email && 'border-red-500')}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Кнопки */}
            <div className="flex gap-3 mt-6">
              <Button variant="outline" type="button" onClick={handleClose} className="flex-1 bg-transparent" disabled={isSubmitting}>
                Отмена
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Создание...' : 'Создать компанию'}
              </Button>
            </div>
          </form>
      </div>
    </div>
  );
};

