'use client';

import * as React from 'react';
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
};

type DeleteConfirmationModalProps = {
  // Новый интерфейс
  open?: boolean;
  member?: TeamMember | null;
  onClose: () => void;
  onConfirm?: (memberId: string) => void;
  
  // Старый интерфейс для совместимости
  isOpen?: boolean;
  loading?: boolean;
};

const nonEmpty = (v?: string | null): v is string => !!v && v.trim().length > 0;

function getNameOrEmail(m?: TeamMember | null): string {
  if (!m) return '';
  const hasName = nonEmpty(m.firstName) || nonEmpty(m.lastName);
  if (hasName) return `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim();
  return m.email;
}

export function DeleteConfirmationModal({
  open,
  member,
  onClose,
  onConfirm,
  // Старые пропсы для совместимости
  isOpen,
  loading,
}: DeleteConfirmationModalProps) {
  // Поддержка старого интерфейса
  const isModalOpen = open ?? isOpen ?? false;
  const handleConfirm = onConfirm ?? (() => {});
  
  if (!isModalOpen) return null;

  const target = getNameOrEmail(member);
  const canConfirm = !!member?.id_user;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 w-96 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Удалить участника</h2>
            <p className="text-sm text-muted-foreground">Это действие нельзя отменить</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-foreground mb-6">
          Вы действительно хотите удалить {target || 'этого пользователя'} из команды?
        </p>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent" disabled={loading}>
            Отмена
          </Button>
          <Button
            onClick={() => member && handleConfirm(member.id_user)}
            disabled={!canConfirm || loading}
            className="flex-1 bg-red-600 hover:bg-red-700"
          >
            {loading ? 'Удаление...' : 'Удалить'}
          </Button>
        </div>
      </div>
    </div>
  );
}
