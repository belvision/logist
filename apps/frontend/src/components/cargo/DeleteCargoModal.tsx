'use client';

import * as React from 'react';
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type DeleteCargoModalProps = {
  isOpen: boolean;
  cargoId: number | null;
  cargoTitle?: string | undefined;
  cargoRoute?: string | undefined;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

export function DeleteCargoModal({
  isOpen,
  cargoId,
  cargoTitle,
  cargoRoute,
  onClose,
  onConfirm,
  loading,
}: DeleteCargoModalProps) {
  if (!isOpen) return null;

  const cargoDisplay = cargoTitle || cargoRoute || (cargoId ? `груз #${cargoId}` : 'этот груз');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 w-96 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Удалить груз</h2>
            <p className="text-sm text-muted-foreground">Это действие нельзя отменить</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-foreground mb-6">
          Вы действительно хотите удалить {cargoDisplay}?
        </p>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent" disabled={loading}>
            Отмена
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!cargoId || loading}
            variant="destructive"
            className="flex-1"
          >
            {loading ? 'Удаление...' : 'Удалить'}
          </Button>
        </div>
      </div>
    </div>
  );
}

