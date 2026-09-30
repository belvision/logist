import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

/**
 * Парсит дату из API (PostgreSQL timestamp без timezone)
 * PostgreSQL возвращает timestamp в UTC, но без 'Z' в конце
 * Добавляем 'Z' чтобы JavaScript правильно интерпретировал как UTC
 */
export function parseApiDate(dateString: string | undefined | null): Date {
  if (!dateString) {
    return new Date();
  }

  // Просто парсим дату как есть - она уже в правильном формате ISO с Z
  return new Date(dateString);
}

export const formatDate = (date: string | Date, formatString: string = 'dd.MM.yyyy'): string => {
  try {
    return format(new Date(date), formatString, { locale: ru });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Неверная дата';
  }
};
