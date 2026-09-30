import { toast } from 'sonner';

export const showToast = {
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      duration: 4000,
    });
  },

  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
      duration: 6000,
    });
  },

  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      duration: 4000,
    });
  },

  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
      duration: 4000,
    });
  },

  loading: (message: string) => {
    return toast.loading(message);
  },

  dismiss: (toastId: string) => {
    toast.dismiss(toastId);
  },
};

// Утилита для обработки API ошибок
export const handleApiError = (error: any, defaultMessage: string = 'Произошла ошибка') => {
  console.error('API Error:', error);
  
  let message = defaultMessage;
  let description: string | undefined;

  if (error?.response?.status === 401) {
    message = 'Ошибка авторизации';
    description = 'Необходимо войти в систему заново';
  } else if (error?.response?.status === 403) {
    message = 'Доступ запрещен';
    description = 'У вас нет прав для выполнения этого действия';
  } else if (error?.response?.status === 404) {
    message = 'Ресурс не найден';
    description = 'Запрашиваемые данные не найдены';
  } else if (error?.response?.status >= 500) {
    message = 'Ошибка сервера';
    description = 'Попробуйте позже или обратитесь в поддержку';
  } else if (error?.message) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  showToast.error(message, description);
  return { message, description };
};

// Утилита для обработки успешных операций
export const handleApiSuccess = (message: string, description?: string) => {
  showToast.success(message, description);
};
