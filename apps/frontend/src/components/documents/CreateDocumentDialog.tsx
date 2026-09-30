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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { documentsApi, DocumentType, DocumentTemplate, CreateDocumentDTO } from '@/shared/api/documents.api';
import { showToast } from '@/lib/toast';
import { Loader2 } from 'lucide-react';

interface CreateDocumentDialogProps {
  open: boolean;
  onClose: () => void;
  companyId: string;
}

const documentTypes: DocumentType[] = ['ТТН', 'CMR', 'Договор', 'Акт', 'Счёт', 'Счёт-фактура', 'Доверенность', 'Прочее'];

export function CreateDocumentDialog({ open, onClose, companyId }: CreateDocumentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);

  const [formData, setFormData] = useState<CreateDocumentDTO>({
    id_company: companyId,
    document_type: 'ТТН',
    document_number: '',
    document_date: new Date().toISOString().split('T')[0] || new Date().toISOString().substring(0, 10),
    title: '',
    description: '',
    counterparty_name: '',
    counterparty_unp: '',
    counterparty_address: '',
    document_data: {},
  });

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open, formData.document_type]);

  const loadTemplates = async () => {
    try {
      const response = await documentsApi.getTemplates(formData.document_type);
      setTemplates(response.templates || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find((t) => t.id_template === templateId);
    setSelectedTemplate(template || null);
    
    if (template) {
      // Инициализируем поля документа значениями по умолчанию из шаблона
      const defaultData: any = {};
      template.fields.forEach((field) => {
        if (field.default_value !== undefined) {
          defaultData[field.name] = field.default_value;
        }
      });
      setFormData((prev) => ({
        ...prev,
        template_id: templateId,
        document_data: { ...prev.document_data, ...defaultData },
      }));
    }
  };

  const handleDocumentDataChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      document_data: {
        ...prev.document_data,
        [fieldName]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.document_number || !formData.title) {
      showToast.error('Заполните обязательные поля');
      return;
    }

    try {
      setLoading(true);
      await documentsApi.createDocument(formData);
      showToast.success('Документ создан');
      onClose();
    } catch (error: any) {
      console.error('Create document error:', error);
      showToast.error('Не удалось создать документ', error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderFieldInput = (field: any) => {
    const value = formData.document_data[field.name] || '';

    switch (field.type) {
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleDocumentDataChange(field.name, parseFloat(e.target.value) || 0)}
            required={field.required}
            className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleDocumentDataChange(field.name, e.target.value)}
            required={field.required}
            className="bg-gray-800 border-gray-600 text-white"
          />
        );
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => handleDocumentDataChange(field.name, e.target.checked)}
            className="h-4 w-4 accent-blue-500"
          />
        );
      case 'select':
        return (
          <Select
            value={value}
            onValueChange={(val) => handleDocumentDataChange(field.name, val)}
          >
            <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
              <SelectValue placeholder="Выберите..." />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              {field.options?.map((option: string) => (
                <SelectItem key={option} value={option} className="text-white hover:bg-gray-700 focus:bg-gray-700">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleDocumentDataChange(field.name, e.target.value)}
            required={field.required}
            className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Создание документа</DialogTitle>
          <DialogDescription className="text-gray-300">
            Заполните информацию о новом документе
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="document_type" className="text-gray-200">Тип документа *</Label>
              <Select
                value={formData.document_type}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, document_type: value as DocumentType }))
                }
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {documentTypes.map((type) => (
                    <SelectItem key={type} value={type} className="text-white hover:bg-gray-700 focus:bg-gray-700">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template" className="text-gray-200">Шаблон</Label>
              <Select onValueChange={handleTemplateChange}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Выберите шаблон (опционально)" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {templates.map((template) => (
                    <SelectItem key={template.id_template} value={template.id_template} className="text-white hover:bg-gray-700 focus:bg-gray-700">
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="document_number" className="text-gray-200">Номер документа *</Label>
              <Input
                id="document_number"
                value={formData.document_number}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, document_number: e.target.value }))
                }
                required
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document_date" className="text-gray-200">Дата документа *</Label>
              <Input
                id="document_date"
                type="date"
                value={formData.document_date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, document_date: e.target.value }))
                }
                required
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-gray-200">Название документа *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              required
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-200">Описание</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={3}
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            />
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-white">Контрагент</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="counterparty_name" className="text-gray-200">Название</Label>
                <Input
                  id="counterparty_name"
                  value={formData.counterparty_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, counterparty_name: e.target.value }))
                  }
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="counterparty_unp" className="text-gray-200">УНП</Label>
                <Input
                  id="counterparty_unp"
                  value={formData.counterparty_unp}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, counterparty_unp: e.target.value }))
                  }
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="counterparty_address" className="text-gray-200">Адрес</Label>
              <Input
                id="counterparty_address"
                value={formData.counterparty_address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, counterparty_address: e.target.value }))
                }
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
          </div>

          {selectedTemplate && selectedTemplate.fields.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-white">Данные документа</h3>
              <div className="grid grid-cols-2 gap-4">
                {selectedTemplate.fields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name} className="text-gray-200">
                      {field.label}
                      {field.required && ' *'}
                    </Label>
                    {renderFieldInput(field)}
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="border-gray-600 text-gray-200 hover:bg-gray-700">
              Отмена
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Создать
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

