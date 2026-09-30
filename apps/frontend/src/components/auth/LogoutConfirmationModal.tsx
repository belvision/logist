"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LogoutConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutConfirmationModal({ isOpen, onClose, onConfirm }: LogoutConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 w-96 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Выйти из системы</h2>
            <p className="text-sm text-muted-foreground">Вы уверены, что хотите выйти?</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-foreground mb-6">
          Вы действительно хотите выйти из системы? Вам потребуется войти снова для доступа к аккаунту.
        </p>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
            Отмена
          </Button>
          <Button
            onClick={onConfirm}
            variant="destructive"
            className="flex-1 !bg-red-600 hover:!bg-red-700"
          >
            Выйти
          </Button>
        </div>
      </div>
    </div>
  );
}

