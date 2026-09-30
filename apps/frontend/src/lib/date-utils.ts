import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

/**
 * Форматирует дату в русском формате
 * @param date - дата (строка или объект Date)
 * @param formatString - формат даты (по умолчанию 'dd.MM.yyyy')
 * @returns отформатированная строка даты
 */
export const formatDate = (date: string | Date, formatString: string = 'dd.MM.yyyy'): string => {
  try {
    return format(new Date(date), formatString, { locale: ru });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Неверная дата';
  }
};

/**
 * Форматирует дату и время в русском формате
 * @param date - дата (строка или объект Date)
 * @returns отформатированная строка даты и времени
 */
export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, 'dd.MM.yyyy HH:mm');
};

/**
 * Форматирует дату в относительном формате (например, "2 дня назад")
 * @param date - дата (строка или объект Date)
 * @returns отформатированная строка относительной даты
 */
export const formatRelativeDate = (date: string | Date): string => {
  try {
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true, 
      locale: ru 
    });
  } catch (error) {
    console.error('Error formatting relative date:', error);
    return 'Неизвестно';
  }
};
