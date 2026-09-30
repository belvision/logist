// apps/backend/src/api/documents/documents.router.ts
import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import documentsController from './documents.controller';

export const documentsRouter = new Hono();

// Все маршруты требуют авторизации
documentsRouter.use('*', authenticate);

// ==================== TEMPLATES (должны быть ДО роутов с /:id) ====================

// Создать шаблон документа
documentsRouter.post('/templates', (c) => documentsController.createTemplate(c));

// Получить список шаблонов
documentsRouter.get('/templates', (c) => documentsController.listTemplates(c));

// Получить шаблон по ID
documentsRouter.get('/templates/:id', (c) => documentsController.getTemplate(c));

// Обновить шаблон
documentsRouter.put('/templates/:id', (c) => documentsController.updateTemplate(c));

// Удалить шаблон
documentsRouter.delete('/templates/:id', (c) => documentsController.deleteTemplate(c));

// ==================== SIGNATURES (специфичные роуты) ====================

// Отклонить подпись
documentsRouter.post('/signatures/:signatureId/reject', (c) => documentsController.rejectSignature(c));

// ==================== VERSIONS (специфичные роуты) ====================

// Получить конкретную версию документа
documentsRouter.get('/versions/:versionId', (c) => documentsController.getVersion(c));

// ==================== ACCESS CONTROL (специфичные роуты) ====================

// Отозвать доступ
documentsRouter.delete('/access/:accessId', (c) => documentsController.revokeAccess(c));

// ==================== BY COMPANY (специфичные роуты) ====================

// Получить список документов компании
documentsRouter.get('/by-company/:companyId', (c) => documentsController.listDocuments(c));

// ==================== DOCUMENTS ====================

// Создать документ
documentsRouter.post('/', (c) => documentsController.createDocument(c));

// Получить список документов (legacy - использует companyId из токена)
// documentsRouter.get('/', (c) => documentsController.listDocuments(c));

// Получить документ по ID
documentsRouter.get('/:id', (c) => documentsController.getDocument(c));

// Обновить документ
documentsRouter.put('/:id', (c) => documentsController.updateDocument(c));

// Удалить документ
documentsRouter.delete('/:id', (c) => documentsController.deleteDocument(c));

// ==================== PDF ====================

// Сгенерировать PDF для документа
documentsRouter.post('/:id/generate-pdf', (c) => documentsController.generatePdf(c));

// Скачать PDF документа
documentsRouter.get('/:id/download', (c) => documentsController.downloadPdf(c));

// ==================== SIGNATURES ====================

// Подписать документ
documentsRouter.post('/:id/sign', (c) => documentsController.signDocument(c));

// Получить подписи документа
documentsRouter.get('/:id/signatures', (c) => documentsController.getSignatures(c));

// ==================== VERSIONS ====================

// Получить историю версий документа
documentsRouter.get('/:id/versions', (c) => documentsController.getVersions(c));

// ==================== ACCESS CONTROL ====================

// Предоставить доступ к документу
documentsRouter.post('/:id/access', (c) => documentsController.grantAccess(c));

// Получить список доступа к документу
documentsRouter.get('/:id/access', (c) => documentsController.getAccess(c));

