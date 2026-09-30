'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  documentsApi,
  Document,
} from '@/shared/api/documents.api';
import { showToast } from '@/lib/toast';
import {
  Download,
  FileText,
  FileSignature,
  History,
  CheckCircle2,
  XCircle,
  Clock,
  User,
} from 'lucide-react';
import { SignDocumentDialog } from './SignDocumentDialog';

interface DocumentDetailDialogProps {
  document: Document;
  open: boolean;
  onClose: () => void;
}

export function DocumentDetailDialog({ document, open, onClose }: DocumentDetailDialogProps) {
  const [signatures, setSignatures] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSignDialog, setShowSignDialog] = useState(false);

  useEffect(() => {
    if (open && document) {
      loadSignatures();
      loadVersions();
    }
  }, [open, document]);

  const loadSignatures = async () => {
    try {
      const response = await documentsApi.getSignatures(document.id_document);
      setSignatures(response.signatures || []);
    } catch (error) {
      console.error('Failed to load signatures:', error);
    }
  };

  const loadVersions = async () => {
    try {
      const response = await documentsApi.getVersions(document.id_document);
      setVersions(response.versions || []);
    } catch (error) {
      console.error('Failed to load versions:', error);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const blob = await documentsApi.downloadPdf(document.id_document);
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${document.document_number}.pdf`;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);

      showToast.success('PDF документ загружен');
    } catch (error: any) {
      showToast.error('Не удалось скачать PDF', error.response?.data?.message);
    }
  };

  const handleGeneratePdf = async () => {
    try {
      setLoading(true);
      await documentsApi.generatePdf(document.id_document);
      showToast.success('PDF документ сгенерирован');
      onClose();
    } catch (error: any) {
      showToast.error('Не удалось сгенерировать PDF', error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('ru-RU');
  };

  const getSignatureStatusBadge = (status: string) => {
    switch (status) {
      case 'Подписан':
        return <Badge className="gap-1 bg-green-600 text-white border-green-500"><CheckCircle2 className="w-3 h-3" />Подписан</Badge>;
      case 'Отклонён':
        return <Badge variant="destructive" className="gap-1 bg-red-600 text-white"><XCircle className="w-3 h-3" />Отклонён</Badge>;
      default:
        return <Badge className="gap-1 bg-yellow-600 text-white border-yellow-500"><Clock className="w-3 h-3" />Ожидает</Badge>;
    }
  };

  const tabItems = [
    {
      id: 'info',
      label: 'Информация',
      content: (
        <div className="space-y-4 mt-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Основная информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Статус</p>
                  <Badge className="mt-1">{document.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Версия</p>
                  <p className="font-medium text-gray-200">v{document.version}</p>
                </div>
              </div>

              {document.description && (
                <div>
                  <p className="text-sm text-gray-400">Описание</p>
                  <p className="font-medium text-gray-200">{document.description}</p>
                </div>
              )}

              {document.counterparty_name && (
                <div>
                  <p className="text-sm text-gray-400">Контрагент</p>
                  <p className="font-medium text-gray-200">{document.counterparty_name}</p>
                  {document.counterparty_unp && (
                    <p className="text-sm text-gray-300">УНП: {document.counterparty_unp}</p>
                  )}
                  {document.counterparty_address && (
                    <p className="text-sm text-gray-300">{document.counterparty_address}</p>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400">
                  Создан: {formatDate(document.created_at)}
                </p>
                <p className="text-sm text-gray-400">
                  Обновлен: {formatDate(document.updated_at)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'signatures',
      label: `Подписи (${signatures.length})`,
      content: (
        <div className="space-y-4 mt-4">
          {signatures.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="py-8 text-center text-gray-400">
                <FileSignature className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-500" />
                <p>Подписей пока нет</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {signatures.map((sig: any) => (
                <Card key={sig.signature.id_signature} className="bg-gray-800 border-gray-700">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-200">
                            {sig.user?.firstName} {sig.user?.lastName}
                          </span>
                          <Badge variant="outline" className="border-gray-600 text-gray-300">{sig.signature.signer_role}</Badge>
                        </div>
                        {sig.signature.comment && (
                          <p className="text-sm text-gray-400">
                            {sig.signature.comment}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          {formatDate(
                            sig.signature.signed_at || sig.signature.created_at
                          )}
                        </p>
                      </div>
                      {getSignatureStatusBadge(sig.signature.signature_status)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      id: 'versions',
      label: `Версии (${versions.length})`,
      content: (
        <div className="space-y-4 mt-4">
          {versions.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="py-8 text-center text-gray-400">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-500" />
                <p>История версий пуста</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {versions.map((ver: any) => (
                <Card key={ver.version.id_version} className="bg-gray-800 border-gray-700">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-blue-600 text-white">Версия {ver.version.version}</Badge>
                          <span className="text-sm text-gray-400">
                            {ver.creator?.firstName} {ver.creator?.lastName}
                          </span>
                        </div>
                        {ver.version.change_comment && (
                          <p className="text-sm text-gray-300">
                            {ver.version.change_comment}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {formatDate(ver.version.created_at)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      id: 'data',
      label: 'Данные',
      content: (
        <div className="space-y-4 mt-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Данные документа</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-gray-900 border border-gray-700 text-gray-300 p-4 rounded-lg overflow-x-auto">
                {JSON.stringify(document.document_data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )
    }
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <FileText className="w-5 h-5" />
              {document.title}
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {document.document_type} №{document.document_number} от{' '}
              {formatDate(document.document_date)}
            </DialogDescription>
          </DialogHeader>

          <Tabs items={tabItems} defaultTab="info" />

          <DialogFooter className="flex gap-2">
            {document.pdf_file_path ? (
              <Button onClick={handleDownloadPdf} variant="outline" className="border-gray-600 text-gray-200 hover:bg-gray-700">
                <Download className="w-4 h-4 mr-2" />
                Скачать PDF
              </Button>
            ) : (
              <Button onClick={handleGeneratePdf} variant="outline" disabled={loading} className="border-gray-600 text-gray-200 hover:bg-gray-700">
                <FileText className="w-4 h-4 mr-2" />
                Сгенерировать PDF
              </Button>
            )}
            {document.status !== 'Подписан' && (
              <Button onClick={() => setShowSignDialog(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                <FileSignature className="w-4 h-4 mr-2" />
                Подписать
              </Button>
            )}
            <Button variant="ghost" onClick={onClose} className="text-gray-200 hover:bg-gray-700">
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showSignDialog && (
        <SignDocumentDialog
          document={document}
          open={showSignDialog}
          onClose={() => {
            setShowSignDialog(false);
            loadSignatures();
            onClose();
          }}
        />
      )}
    </>
  );
}