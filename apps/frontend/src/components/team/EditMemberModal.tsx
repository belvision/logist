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

type EditMemberModalProps = {
  // Новый интерфейс
  open?: boolean;
  member?: TeamMember | null;
  onClose: () => void;
  onSave?: (updated: TeamMember) => void;
  
  // Старый интерфейс для совместимости
  isOpen?: boolean;
  onSuccess?: () => void;
  companyId?: string;
};

export function EditMemberModal({
  open,
  member,
  onClose,
  onSave,
  // Старые пропсы для совместимости
  isOpen,
  onSuccess,
}: EditMemberModalProps) {
  // Поддержка старого интерфейса
  const isModalOpen = open ?? isOpen ?? false;
  const [firstName, setFirstName] = React.useState<string>('');
  const [lastName, setLastName] = React.useState<string>('');
  const [email, setEmail] = React.useState<string>('');
  const [role, setRole] = React.useState<string>('');

  // Инициализируем локальное состояние при открытии/смене member
  React.useEffect(() => {
    if (!isModalOpen) return;
    setFirstName(member?.firstName ?? '');
    setLastName(member?.lastName ?? '');
    setEmail(member?.email ?? '');
    setRole(member?.role ?? '');
  }, [isModalOpen, member?.id_user]);

  if (!isModalOpen) return null;

  const canSave =
    (firstName?.trim().length ?? 0) > 0 ||
    (lastName?.trim().length ?? 0) > 0 ||
    (email?.trim().length ?? 0) > 0;

  const handleSaveClick = () => {
    if (!member) return;
    if (onSave) {
      onSave({
        id_user: member.id_user,
        username: member.username,
        email: email.trim() || member.email,
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
        isActive: member.isActive,
        role: (role.trim() as 'Владелец' | 'Администратор' | 'Пользователь') || member.role,
        joinedAt: member.joinedAt,
        ...(member.id_company && { id_company: member.id_company }),
      });
    } else {
      onSuccess?.();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-4 shadow-lg">
        <h2 className="mb-3 text-base font-semibold">Редактировать участника</h2>

        <div className="grid grid-cols-1 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-600">Имя</span>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring"
              placeholder="Иван"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-600">Фамилия</span>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring"
              placeholder="Иванов"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-600">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring"
              placeholder="user@example.com"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-600">Роль</span>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring"
              placeholder="Логист / Админ / ..."
            />
          </label>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Отмена
          </button>
          <button
            type="button"
            disabled={!member || !canSave}
            onClick={handleSaveClick}
            className={`rounded-lg px-3 py-1.5 text-sm text-white ${
              member && canSave ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300'
            }`}
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
