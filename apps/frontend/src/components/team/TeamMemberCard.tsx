'use client';

import * as React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { getRoleLabel } from '@/types/company';

type TeamMember = {
  id_user: string;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
  role: 'Владелец' | 'Администратор' | 'Пользователь' | 'Водитель';
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

const roleBgColor = {
  'Владелец': 'bg-purple-500',
  'Администратор': 'bg-blue-500',
  'Пользователь': 'bg-green-500',
  'Водитель': 'bg-orange-500',
};

export function TeamMemberCard({ member, onEdit, onDelete }: TeamMemberCardProps) {
  const initials = getInitials(member);
  const displayName = getDisplayName(member);
  const roleBg = roleBgColor[member.role] || 'bg-gray-500';

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div
            className={`w-16 h-16 ${roleBg} rounded-lg flex items-center justify-center text-white font-bold text-lg`}
          >
            {initials}
          </div>
          <div className="flex-1">
            <h3 className="text-foreground font-semibold">
              {displayName}
            </h3>
            <p className="text-sm text-muted-foreground">{member.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  member.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                }`}
              >
                {member.isActive ? "Активен" : "Неактивен"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2">Роль</p>
          <span className={`px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400`}>
            {getRoleLabel(member.role)}
          </span>
        </div>

        <div className="bg-muted/50 rounded-lg p-3 mb-4 text-xs text-muted-foreground break-all">{member.email}</div>

        <div className="flex gap-3">
          {onEdit && (
            <button
              onClick={() => onEdit(member)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-foreground"
            >
              <Edit className="w-4 h-4" />
              Редактировать
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(member.id_user)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-red-500/50 hover:bg-red-500/10 transition-colors text-red-400"
            >
              <Trash2 className="w-4 h-4" />
              Удалить
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
