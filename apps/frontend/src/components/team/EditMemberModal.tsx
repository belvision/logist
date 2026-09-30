'use client';

import * as React from 'react';
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
        role: (role.trim() as 'Владелец' | 'Администратор' | 'Пользователь' | 'Водитель') || member.role,
        joinedAt: member.joinedAt,
        ...(member.id_company && { id_company: member.id_company }),
      });
    } else {
      onSuccess?.();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 w-96 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Редактировать участника</h2>
            <p className="text-sm text-muted-foreground">Измените данные сотрудника</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Имя</label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Иван"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Фамилия</label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Иванов"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Email адрес</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Роль в команде</label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Пользователь">Пользователь</SelectItem>
                <SelectItem value="Администратор">Администратор</SelectItem>
                <SelectItem value="Водитель">Водитель</SelectItem>
                <SelectItem value="Владелец">Владелец</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
            Отмена
          </Button>
          <Button
            onClick={handleSaveClick}
            disabled={!member || !canSave}
            className="flex-1"
          >
            Сохранить
          </Button>
        </div>
      </div>
    </div>
  );
}
