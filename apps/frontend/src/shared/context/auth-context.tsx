'use client';
import { createContext, useContext, useEffect, useState } from "react";
import { authMe, User } from "../api/auth";
import { getCookie, deleteCookie } from "cookies-next";
import { usePathname } from "next/navigation";
import { handleApiError } from "@/lib/toast";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // const router = useRouter();
  const pathname = usePathname();
  const publicPaths = new Set<string>([
    "/", 
    "/login", 
    "/registry", 
    "/invite/confirm",
    "/cargo-owners",
    "/carriers",
    "/carriers/7-steps",
    "/carriers/add-transport", 
    "/carriers/licenses",
    "/team",
    "/api-docs",
    "/privacy-policy",
    "/offer-agreement",
    "/social-cargo",
  "/verify-email"
  ]);

  // Проверяем публичные пути, включая динамические маршруты стран
  const isPublicPath = publicPaths.has(pathname || "") || (pathname?.startsWith("/countries/") ?? false);

  const logout = () => {
    // Очищаем токены напрямую через cookies для избежания циклических зависимостей
    deleteCookie('access_token');
    deleteCookie('refresh_token');
    setUser(null);
    // Перенаправляем на страницу входа
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  useEffect(() => {
    const fetchUser = async () => {
      const token = getCookie('access_token');
      
      // На публичных маршрутах не требуем авторизацию, но проверяем, есть ли токен
      if (isPublicPath) {
        if (!token) {
          setLoading(false);
          return;
        }
        // Если есть токен на публичной странице, пытаемся загрузить пользователя
        try {
          const data = await authMe();
          setUser(data.user);
        } catch {
          // На публичных страницах не показываем ошибки авторизации
          setUser(null);
        } finally {
          setLoading(false);
        }
        return;
      }

      // На защищенных маршрутах требуем авторизацию
      if (!token) {
        setLoading(false);
        window.location.href = '/login';
        return;
      }

      try {
        const data = await authMe();
        setUser(data.user);
      } catch (error) {
        console.error('Auth error:', error);
        // Если получили 401, это означает, что токен недействителен
        if ((error as any)?.status === 401 || (error as any)?.response?.status === 401) {
          // Очищаем токены напрямую через cookies для избежания циклических зависимостей
          deleteCookie('access_token');
          deleteCookie('refresh_token');
          setUser(null);
          // Показываем сообщение об истекшей сессии
          handleApiError(error, 'Сессия истекла');
        } else {
          handleApiError(error, 'Ошибка авторизации');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [pathname, isPublicPath]);

  return <AuthContext.Provider value={{ user, loading, logout, updateUser }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
