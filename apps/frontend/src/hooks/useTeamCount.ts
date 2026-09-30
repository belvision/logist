// apps/frontend/src/hooks/useTeamCount.ts
'use client';

import { useState, useEffect } from 'react';
import { getCompanyUsers } from '@/shared/api/company';
import { CompanyUser } from '@/types/company';

interface UseTeamCountResult {
  teamCount: number;
  loading: boolean;
  error: string | null;
}

export function useTeamCount(companyId: string | null): UseTeamCountResult {
  const [teamCount, setTeamCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[TEAM COUNT HOOK] Effect triggered, companyId:', companyId);
    
    if (!companyId) {
      console.log('[TEAM COUNT HOOK] No companyId, setting count to 0');
      setTeamCount(0);
      return;
    }

    const fetchTeamCount = async () => {
      try {
        console.log('[TEAM COUNT HOOK] Starting fetch for companyId:', companyId);
        setLoading(true);
        setError(null);

        // Загружаем всех пользователей компании
        const response = await getCompanyUsers(companyId, {
          page: 1,
          limit: 1000 // Загружаем всех для подсчета
        });
        
        console.log('[TEAM COUNT HOOK] API response:', response);

        let users: CompanyUser[] = [];
        
        if (response && response.data && response.data.users) {
          // Новая структура API ответа
          users = response.data.users as CompanyUser[];
        } else if (response && response.users) {
          // Старая структура API ответа (для совместимости)
          users = response.users as CompanyUser[];
        }

        // Исключаем владельцев из подсчета
        const nonOwnerUsers = users.filter(user => user.role !== 'Владелец');
        
        console.log('[TEAM COUNT] Total users:', users.length);
        console.log('[TEAM COUNT] Non-owner users:', nonOwnerUsers.length);
        console.log('[TEAM COUNT] Users by role:', {
          owners: users.filter(u => u.role === 'Владелец').length,
          admins: users.filter(u => u.role === 'Администратор').length,
          users: users.filter(u => u.role === 'Пользователь').length
        });

        setTeamCount(nonOwnerUsers.length);
      } catch (err) {
        console.error('[TEAM COUNT] Error fetching team count:', err);
        setError('Ошибка загрузки количества сотрудников');
        setTeamCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamCount();
  }, [companyId]);

  return { teamCount, loading, error };
}
