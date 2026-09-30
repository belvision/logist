'use client';

import { useEffect, useState } from 'react';
import { Messenger } from '@/components/messenger/Messenger';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { authMe } from '@/shared/api/auth';

export default function MessengerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const conversationId = searchParams.get('conversation') || undefined;

  useEffect(() => {
    // Получаем текущего пользователя через API
    const fetchCurrentUser = async () => {
      try {
        const { user } = await authMe();
        if (user?.id_user) {
          setCurrentUserId(user.id_user);
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Failed to get current user:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [router]);

  if (loading) {
    return (
      <AppLayout >
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!currentUserId) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <p className="text-muted-foreground">Требуется авторизация</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="h-[calc(100vh-120px)] flex flex-col">
        <div className="flex-1 overflow-hidden">
          <Messenger 
            currentUserId={currentUserId} 
            {...(conversationId ? { initialConversationId: conversationId } : {})}
          />
        </div>
      </div>
    </AppLayout>
  );
}
