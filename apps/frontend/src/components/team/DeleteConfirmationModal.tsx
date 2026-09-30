'use client';

import * as React from 'react';

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

  const title = 'Удалить участника команды?';
  const target = getNameOrEmail(member);
  const canConfirm = !!member?.id_user; // используем id_user для совместимости


 

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-lg">
        <h2 className="mb-2 text-base font-semibold">{title}</h2>
        <p className="mb-4 text-sm text-gray-600">
          Вы действительно хотите удалить {target || 'этого пользователя'}? Это действие
          нельзя отменить.
        </p>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Отмена
          </button>
          <button
            type="button"
            disabled={!canConfirm || loading}
            onClick={() => member && handleConfirm(member.id_user)}
            className={`rounded-lg px-3 py-1.5 text-sm text-white ${
              canConfirm && !loading ? 'bg-red-600 hover:bg-red-700' : 'bg-red-300'
            }`}
            aria-disabled={!canConfirm || loading}
          >
            {loading ? 'Удаление...' : 'Удалить'}
          </button>
        </div>
      </div>
    </div>
  );
}
