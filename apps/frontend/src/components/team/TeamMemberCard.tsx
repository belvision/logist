'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getRoleLabel, getRoleColor, getStatusLabel, getStatusColor } from '@/types/company';

type TeamMember = {
  id_user: string;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
  role: 'Владелец' | 'Администратор' | 'Пользователь';
  joinedAt: string;
  id_company?: string;
  avatarUrl?: string | null;
};

type TeamMemberCardProps = {
  member: TeamMember;
  onEdit?: (member: TeamMember) => void;
  onDelete?: (memberId: string) => void;
};

const nonEmpty = (v?: string | null): v is string => !!v && v.trim().length > 0;

function getDisplayName(m: TeamMember): string {
  if (nonEmpty(m.firstName) || nonEmpty(m.lastName)) {
    return `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim();
  }
  return m.username;
}

function getInitials(m: TeamMember): string {
  const a = nonEmpty(m.firstName) ? m.firstName!.trim() : '';
  const b = nonEmpty(m.lastName) ? m.lastName!.trim() : '';

  if (a || b) {
    const i1 = a ? a[0] : '';
    const i2 = b ? b[0] : '';
    return `${i1}${i2}`.toUpperCase() || '—';
  }

  return m.username[0]!.toUpperCase();
}

export function TeamMemberCard({ member, onEdit, onDelete }: TeamMemberCardProps) {

  return (
    <Card className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col hover:scale-[1.02]">
      {/* Декоративный градиент */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="p-4 sm:p-6 flex-1 flex flex-col">
        {/* Заголовок с аватаром и статусом */}
        <div className="flex items-start justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            {/* Аватар с градиентом */}
            <div className="relative flex-shrink-0">
              {nonEmpty(member.avatarUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={member.avatarUrl!}
                  alt={getDisplayName(member)}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover shadow-lg"
                />
              ) : (
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg">
                  {getInitials(member)}
                </div>
              )}
              {/* Индикатор активности */}
              <div className={`absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white ${
                member.isActive ? 'bg-green-500' : 'bg-gray-400'
              }`}></div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
                {getDisplayName(member)}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1 truncate">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                @{member.username}
              </p>
            </div>
          </div>

          {/* Статус */}
          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold shadow-sm flex-shrink-0 ${getStatusColor(member.isActive)}`}>
            {getStatusLabel(member.isActive)}
          </span>
        </div>

        {/* Основная информация */}
        <div className="space-y-4 mb-6 flex-1">
          {/* Роль */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Роль</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(member.role)}`}>
              {getRoleLabel(member.role)}
            </span>
          </div>
          
          {/* Email */}
          <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
              {member.email}
            </span>
          </div>
        </div>

        {/* Действия */}
        {(onEdit || onDelete) && (
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-600 mt-auto">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(member)}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-300 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="hidden sm:inline">Редактировать</span>
                <span className="sm:hidden">Изменить</span>
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(member.id_user)}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-600 hover:text-red-700 dark:hover:text-red-300 text-red-600 dark:text-red-400 border-red-200 dark:border-red-600 text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="hidden sm:inline">Удалить</span>
                <span className="sm:hidden">Удалить</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
