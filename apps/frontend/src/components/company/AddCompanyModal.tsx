'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    
    try {
      await onSubmit(formData);
      handleClose();
    } catch (error) {
      console.error('Ошибка при создании компании:', error);
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
  };

  useEffect(() => {
    if (formData.unp.length === 9) {
      const fetchCompanyInfo = async () => {
        const data = await companyInfoByUnp(formData.unp);
        setFormData(prev => ({ ...prev, name_company: data.name_company, entity_type: data.entity_type === 'ИП' ? 'ИП' : 'Предприятие', ur_address: data.ur_address }));
        };

      fetchCompanyInfo();
    }
  }, [formData.unp]);

  useEffect(() => {
    const fetchCompanyTypes = async () => {
      const data = await getCompanyTypes();
      setCompanyTypes(data.companies);
    };
    fetchCompanyTypes();
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50 no-scrollbar">
      <Card className="w-full max-w-md shadow-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
        <CardHeader className="space-y-1 pb-4 lg:pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg lg:text-2xl font-semibold text-gray-900 dark:text-white">
                Добавить компанию
              </CardTitle>
              <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                Заполните информацию о новой компании
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isSubmitting}
              className="h-8 w-8 p-0"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
            {/* Название компании */}
            <div className="space-y-2">
              <Label htmlFor="name_company" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Название компании *
              </Label>
              <Input
                id="name_company"
                type="text"
                value={formData.name_company}
                onChange={(e) => handleInputChange('name_company', e.target.value)}
                placeholder="Введите название компании"
                className={cn(
                  "h-12 px-4 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white",
                  errors.name_company && 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                )}
                style={{ colorScheme: 'light' }}
                disabled={isSubmitting}
              />
              {errors.name_company && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.name_company}</p>
              )}
            </div>

            {/* УНП */}
            <div className="space-y-2">
              <Label htmlFor="unp" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                УНП (Учетный номер плательщика) *
              </Label>
              <Input
                id="unp"
                type="text"
                value={formData.unp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                  handleInputChange('unp', value);
                }}
                placeholder="123456789"
                className={cn(
                  "h-12 px-4 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white",
                  errors.unp && 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                )}
                style={{ colorScheme: 'light' }}
                disabled={isSubmitting}
              />
              {errors.unp && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.unp}</p>
              )}
            </div>

            {/* Тип юридического лица */}
            <div className="space-y-2">
              <Label htmlFor="entity_type" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Тип юридического лица *
              </Label>
              <select
                id="entity_type"
                value={formData.entity_type}
                onChange={(e) => handleInputChange('entity_type', e.target.value as 'ИП' | 'Предприятие')}
                className={cn(
                  'w-full h-12 px-4 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white',
                  errors.entity_type && 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                )}
                disabled={isSubmitting}
              >
                {ENTITY_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.entity_type && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.entity_type}</p>
              )}
            </div>

            {/* Юридический адрес */}
            <div className="space-y-2">
              <Label htmlFor="ur_address" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Юридический адрес *
              </Label>
              <textarea
                id="ur_address"
                value={formData.ur_address}
                onChange={(e) => handleInputChange('ur_address', e.target.value)}
                placeholder="Полный юридический адрес компании"
                rows={3}
                className={cn(
                  "w-full px-4 py-3 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none",
                  errors.ur_address && 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                )}
                disabled={isSubmitting}
              />
              {errors.ur_address && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.ur_address}</p>
              )}
            </div>

            {/* Основной телефон */}
            <div className="space-y-2">
              <Label htmlFor="tel_1" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Основной телефон *
              </Label>
              <Input
                id="tel_1"
                type="tel"
                value={formData.tel_1}
                onChange={(e) => handleInputChange('tel_1', e.target.value)}
                placeholder="+375 29 123-45-67"
                className={cn(
                  "h-12 px-4 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white",
                  errors.tel_1 && 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                )}
                style={{ colorScheme: 'light' }}
                disabled={isSubmitting}
              />
              {errors.tel_1 && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.tel_1}</p>
              )}
            </div>

            {/* Дополнительный телефон */}
            <div className="space-y-2">
              <Label htmlFor="tel_2" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Дополнительный телефон
              </Label>
              <Input
                id="tel_2"
                type="tel"
                value={formData.tel_2 || ''}
                onChange={(e) => handleInputChange('tel_2', e.target.value)}
                placeholder="+375 29 987-65-43"
                className={cn(
                  "h-12 px-4 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white",
                  errors.tel_2 && 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                )}
                style={{ colorScheme: 'light' }}
                disabled={isSubmitting}
              />
              {errors.tel_2 && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.tel_2}</p>
              )}
            </div>

            {/* Тип компании */}
            <div className="space-y-2">
              <Label htmlFor="id_tip_company" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Тип компании *
              </Label>
              <select
                id="id_tip_company"
                value={formData.id_tip_company}
                onChange={(e) => handleInputChange('id_tip_company', parseInt(e.target.value))}
                className={cn(
                  'w-full h-12 px-4 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white',
                  errors.id_tip_company && 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                )}
                disabled={isSubmitting}
              >
                <option value={0}>Выберите тип компании</option>
                {companyTypes.map((option) => (
                  <option key={option.id_tip_company} value={option.id_tip_company}>
                    {option.name_tip_company}
                  </option>
                ))}
              </select>
              {errors.id_tip_company && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.id_tip_company}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="info@company.com"
                className={cn(
                  "h-12 px-4 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white",
                  errors.email && 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                )}
                style={{ colorScheme: 'light' }}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Кнопки */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1 h-10 lg:h-12 text-sm lg:text-base"
                disabled={isSubmitting}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="flex-1 h-10 lg:h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] text-sm lg:text-base"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 lg:mr-3 h-4 w-4 lg:h-5 lg:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="hidden sm:inline">Создание...</span>
                    <span className="sm:hidden">Создание...</span>
                  </div>
                ) : (
                  'Создать компанию'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

