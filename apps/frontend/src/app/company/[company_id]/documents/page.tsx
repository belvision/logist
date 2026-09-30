'use client';

import React, { useState, useEffect, useCallback, useMemo, memo, use } from 'react';
import { documentsApi, Document, DocumentWithCreator, DocumentType, DocumentStatus } from '@/shared/api/documents.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Plus,
  Search,
  Download,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  Archive,
} from 'lucide-react';
import { showToast } from '@/lib/toast';
import { CreateDocumentDialog } from '@/components/documents/CreateDocumentDialog';
import { DocumentDetailDialog } from '@/components/documents/DocumentDetailDialog';
import { AppLayout } from '@/components/layout/AppLayout';

// Memoized table row component
const DocumentTableRow = memo(({ 
  doc, 
  statusConfig, 
  documentTypeLabels, 
  formatDate, 
  handleDownloadPdf, 
  handleDeleteDocument, 
  setSelectedDocument 
}: {
  doc: Document;
  statusConfig: Record<DocumentStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: React.ReactNode }>;
  documentTypeLabels: Record<DocumentType, string>;
  formatDate: (dateString: string) => string;
  handleDownloadPdf: (document: Document) => void;
  handleDeleteDocument: (id: string) => void;
  setSelectedDocument: (document: Document | null) => void;
}) => {
  const statusConf = statusConfig[doc.status];
  
  return (
    <TableRow className="border-gray-700 hover:bg-gray-800/50">
      <TableCell className="font-mono text-sm text-gray-100">
        {doc.document_number}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="border-gray-600 text-gray-200">
          {documentTypeLabels[doc.document_type as DocumentType]}
        </Badge>
      </TableCell>
      <TableCell className="font-medium text-gray-100">{doc.title}</TableCell>
      <TableCell className="text-gray-200">{formatDate(doc.document_date)}</TableCell>
      <TableCell>
        <Badge variant={statusConf?.variant} className="gap-1">
          {statusConf?.icon}
          {statusConf?.label}
        </Badge>
      </TableCell>
      <TableCell>
        <span className="text-sm text-gray-300">
          v{doc.version}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedDocument(doc)}
            className="h-8 w-8 p-0 hover:bg-gray-700"
            title="Просмотр"
          >
            <Eye className="w-4 h-4" />
          </Button>
          {doc.pdf_file_path && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDownloadPdf(doc)}
              className="h-8 w-8 p-0 hover:bg-gray-700"
              title="Скачать PDF"
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
          {doc.status === 'Черновик' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDeleteDocument(doc.id_document)}
              className="h-8 w-8 p-0 hover:bg-gray-700 hover:text-red-400"
              title="Удалить"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
});

DocumentTableRow.displayName = 'DocumentTableRow';

const documentTypeLabels: Record<DocumentType, string> = {
  'ТТН': 'ТТН',
  'CMR': 'CMR',
  'Договор': 'Договор',
  'Акт': 'Акт',
  'Счёт': 'Счёт',
  'Счёт-фактура': 'Счёт-фактура',
  'Доверенность': 'Доверенность',
  'Прочее': 'Прочее',
};

const statusConfig: Record<DocumentStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: React.ReactNode }> = {
  'Черновик': {
    label: 'Черновик',
    variant: 'default',
    icon: <Edit className="w-3 h-3" />,
  },
  'Ожидает подписи': {
    label: 'Ожидает подписи',
    variant: 'outline',
    icon: <Clock className="w-3 h-3" />,
  },
  'Подписан': {
    label: 'Подписан',
    variant: 'secondary',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  'Отменён': {
    label: 'Отменён',
    variant: 'destructive',
    icon: <XCircle className="w-3 h-3" />,
  },
  'Архив': {
    label: 'Архив',
    variant: 'secondary',
    icon: <Archive className="w-3 h-3" />,
  },
};

interface DocumentsPageProps {
  params: Promise<{
    company_id: string;
  }>;
}

export default function DocumentsPage({ params }: DocumentsPageProps) {
  const { company_id: companyId } = use(params);

  const [documents, setDocuments] = useState<DocumentWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };
      
      if (debouncedSearchQuery) params.search = debouncedSearchQuery;
      if (typeFilter !== 'all') params.document_type = typeFilter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await documentsApi.getDocuments(companyId, params);
      setDocuments(response.documents || []);
      setTotalPages(response.totalPages || 1);
    } catch (error: any) {
      showToast.error('Не удалось загрузить документы', error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  }, [companyId, debouncedSearchQuery, typeFilter, statusFilter, page]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery, typeFilter, statusFilter]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleDownloadPdf = useCallback(async (document: Document) => {
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
  }, []);

  const handleDeleteDocument = useCallback(async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот документ?')) return;

    try {
      await documentsApi.deleteDocument(id);
      showToast.success('Документ удален');
      loadDocuments();
    } catch (error: any) {
      showToast.error('Не удалось удалить документ', error.response?.data?.message);
    }
  }, [loadDocuments]);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  }, []);

  // Memoize select options to prevent unnecessary re-renders
  const documentTypeOptions = useMemo(() => 
    Object.entries(documentTypeLabels).map(([value, label]) => (
      <SelectItem key={value} value={value} className="text-white hover:bg-gray-700 focus:bg-gray-700">
        {label}
      </SelectItem>
    )), []
  );

  const statusOptions = useMemo(() => 
    Object.entries(statusConfig).map(([value, config]) => (
      <SelectItem key={value} value={value} className="text-white hover:bg-gray-700 focus:bg-gray-700">
        {config.label}
      </SelectItem>
    )), []
  );


  return (
    <AppLayout>
    <div className="container mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6 text-gray-100 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-sm">Электронный документооборот</h1>
          <p className="text-gray-100 mt-2 text-sm sm:text-base font-medium">
            Управление транспортными документами и электронными подписями
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateDialog(true)} 
          className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Создать документ
        </Button>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Фильтры и поиск</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Поиск по названию, номеру..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-2">
              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as any)}>
                <SelectTrigger className="w-full sm:w-[180px] bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Тип документа" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all" className="text-white hover:bg-gray-700 focus:bg-gray-700">Все типы</SelectItem>
                  {documentTypeOptions}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                <SelectTrigger className="w-full sm:w-[180px] bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all" className="text-white hover:bg-gray-700 focus:bg-gray-700">Все статусы</SelectItem>
                  {statusOptions}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Документы</CardTitle>
          <CardDescription className="text-gray-200">
            Всего документов: {documents.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-200">Загрузка...</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-gray-200">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-300" />
              <p>Документы не найдены</p>
              <Button
                variant="outline"
                className="mt-4 border-gray-600 text-gray-100 hover:bg-gray-700 hover:text-white"
                onClick={() => setShowCreateDialog(true)}
              >
                Создать первый документ
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-100 font-semibold">Номер</TableHead>
                    <TableHead className="text-gray-100 font-semibold">Тип</TableHead>
                    <TableHead className="text-gray-100 font-semibold">Название</TableHead>
                    <TableHead className="text-gray-100 font-semibold">Дата</TableHead>
                    <TableHead className="text-gray-100 font-semibold">Статус</TableHead>
                    <TableHead className="text-gray-100 font-semibold">Версия</TableHead>
                    <TableHead className="text-right text-gray-100 font-semibold">Действия</TableHead>
                  </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <DocumentTableRow
                        key={doc.document?.id_document}
                        doc={doc.document}
                        statusConfig={statusConfig}
                        documentTypeLabels={documentTypeLabels}
                        formatDate={formatDate}
                        handleDownloadPdf={handleDownloadPdf}
                        handleDeleteDocument={handleDeleteDocument}
                        setSelectedDocument={setSelectedDocument}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {documents.map((doc) => {
                  const statusConf = statusConfig[doc.document.status];
                  return (
                    <Card key={doc.document?.id_document} className="bg-gray-800 border-gray-700">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-white truncate">{doc.document.title}</h3>
                              <p className="text-sm text-gray-300 font-mono">{doc.document.document_number}</p>
                            </div>
                            <Badge variant={statusConf?.variant} className="gap-1 ml-2">
                              {statusConf?.icon}
                              {statusConf?.label}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4">
                              <Badge variant="outline" className="text-xs border-gray-600 text-gray-200">
                                {documentTypeLabels[doc.document.document_type as DocumentType]}
                              </Badge>
                              <span className="text-gray-300">v{doc.document.version}</span>
                            </div>
                            <span className="text-gray-300">{formatDate(doc.document.document_date)}</span>
                          </div>
                          
                          <div className="flex justify-end gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedDocument(doc.document)}
                              className="h-9 w-9 p-0 hover:bg-gray-700"
                              title="Просмотр"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {doc.document.pdf_file_path && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDownloadPdf(doc.document)}
                                className="h-9 w-9 p-0 hover:bg-gray-700"
                                title="Скачать PDF"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                            {doc.document.status === 'Черновик' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteDocument(doc.document.id_document)}
                                className="h-9 w-9 p-0 hover:bg-gray-700 hover:text-red-400"
                                title="Удалить"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      className="border-gray-600 text-gray-100 hover:bg-gray-700 hover:text-white disabled:text-gray-500"
                    >
                      Назад
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                      className="border-gray-600 text-gray-100 hover:bg-gray-700 hover:text-white disabled:text-gray-500"
                    >
                      Далее
                    </Button>
                  </div>
                  <span className="text-sm text-gray-200">
                    Страница {page} из {totalPages}
                  </span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {showCreateDialog && (
        <CreateDocumentDialog
          open={showCreateDialog}
          onClose={() => {
            setShowCreateDialog(false);
            loadDocuments();
          }}
          companyId={companyId}
        />
      )}

      {selectedDocument && (
        <DocumentDetailDialog
          document={selectedDocument}
          open={!!selectedDocument}
          onClose={() => {
            setSelectedDocument(null);
            loadDocuments();
          }}
        />
      )}
    </div>
    </AppLayout>
  );
}

