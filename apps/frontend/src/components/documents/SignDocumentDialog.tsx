'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { documentsApi, Document } from '@/shared/api/documents.api';
import { showToast } from '@/lib/toast';
import { Loader2, FileSignature, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface SignDocumentDialogProps {
  document: Document;
  open: boolean;
  onClose: () => void;
}

export function SignDocumentDialog({ document, open, onClose }: SignDocumentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [signerRole, setSignerRole] = useState('');
  const [comment, setComment] = useState('');

  const handleSign = async () => {
    if (!signerRole.trim()) {
      showToast.error('Укажите вашу роль при подписании');
      return;
    }

    try {
      setLoading(true);
      const payload: { signer_role: string; comment?: string } = {
        signer_role: signerRole.trim(),
      };
      
      if (comment.trim()) {
        payload.comment = comment.trim();
      }
      
      await documentsApi.signDocument(document.id_document, payload);
      
      showToast.success('Документ подписан');
      onClose();
    } catch (error: any) {
      showToast.error('Не удалось подписать документ', error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <FileSignature className="w-5 h-5" />
            Подписание документа
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            {document.document_type} №{document.document_number}
          </DialogDescription>
        </DialogHeader>

        <Alert className="bg-yellow-900/20 border-yellow-700 text-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-400" />
          <AlertTitle className="text-yellow-200">Важно</AlertTitle>
          <AlertDescription className="text-yellow-300">
            После подписания документа вы не сможете отменить это действие. Убедитесь, что все
            данные в документе корректны.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signer_role" className="text-gray-200">Ваша роль *</Label>
            <Input
              id="signer_role"
              placeholder="Например: Директор, Водитель, Ответственное лицо"
              value={signerRole}
              onChange={(e) => setSignerRole(e.target.value)}
              required
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            />
            <p className="text-xs text-gray-400">
              Укажите вашу должность или роль при подписании этого документа
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment" className="text-gray-200">Комментарий (опционально)</Label>
            <Textarea
              id="comment"
              placeholder="Дополнительный комментарий к подписи"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            />
          </div>

          <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg space-y-2 text-sm">
            <p className="text-gray-200">
              <strong className="text-gray-100">Документ:</strong> {document.title}
            </p>
            <p className="text-gray-200">
              <strong className="text-gray-100">Номер:</strong> {document.document_number}
            </p>
            <p className="text-gray-200">
              <strong className="text-gray-100">Дата:</strong>{' '}
              {new Date(document.document_date).toLocaleDateString('ru-RU')}
            </p>
            <p className="text-gray-200">
              <strong className="text-gray-100">Версия:</strong> {document.version}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading} className="border-gray-600 text-gray-200 hover:bg-gray-700">
            Отмена
          </Button>
          <Button onClick={handleSign} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Подписать документ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

