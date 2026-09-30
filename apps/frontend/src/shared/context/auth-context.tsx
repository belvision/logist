'use client';
import { createContext, useContext, useEffect, useState } from "react";
import { authMe, User } from "../api/auth";
import { getCookie } from "cookies-next";
import { usePathname, useRouter } from "next/navigation";
import { deleteCookie } from "cookies-next";
import { handleApiError } from "@/lib/toast";


interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const publicPaths = new Set<string>(["/login", "/registry", "/invite/confirm"]);

  const logout = () => {
    deleteCookie('access_token');
    deleteCookie('refresh_token');

    setUser(null);

    // router.push("/login");
  };

  useEffect(() => {
    const fetchUser = async () => {
      // Не требуем авторизацию на публичных маршрутах
      if (publicPaths.has(pathname || "")) {
        setLoading(false);
        return;
      }
      const token = getCookie('access_token');
      if (!token) {
     //   router.push("/login");
            setLoading(false);
        return;
      }

      try {
        const data = await authMe();
        setUser(data.user);
      } catch (error) {
        handleApiError(error, 'Ошибка авторизации');
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [pathname]);

  return <AuthContext.Provider value={{ user, loading, logout }}>{children}</AuthContext.Provider>;
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
