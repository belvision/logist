//E:\logistgo\apps\backend\src\api\company\company.router.ts
import { Hono } from 'hono';
import { 
  createCompanyHandler, 
  getCompaniesHandler, 
  getCompaniesTypeHandler,
  addUserToCompanyHandler,
  inviteUserToCompanyHandler,
  getCompanyUsersHandler,
  removeUserFromCompanyHandler,
  updateUserRoleHandler,
  verifyInviteHandler,
  getCompanyInfoByUnpHandler
} from './company.controller';
import { getCompanyStatsHandler } from './company-stats.controller';
import { getCompanyAnalyticsHandler } from './company-analytics.controller';
import { authenticate } from '../middleware/auth';

export const companyRouter = new Hono();
// POST /company - Создать новую компанию
companyRouter.post('/', authenticate, createCompanyHandler);
// GET /company - Получить список компаний пользователя
companyRouter.get('/', authenticate, getCompaniesHandler);
// GET /company/type - Получить типы компаний
companyRouter.get('/type', authenticate, getCompaniesTypeHandler);
// Поиск в налоговой по УНП (без записи в БД)
companyRouter.get('/grp', authenticate, getCompanyInfoByUnpHandler);

// === МАРШРУТЫ ДЛЯ УПРАВЛЕНИЯ ПОЛЬЗОВАТЕЛЯМИ КОМПАНИИ ===
// Добавить существующего пользователя в компанию по email
companyRouter.post('/:companyId/users', authenticate, addUserToCompanyHandler);
// Пригласить пользователя в компанию по email
companyRouter.post('/:companyId/invite', authenticate, inviteUserToCompanyHandler);
// Проверить валидность токена приглашения
companyRouter.get('/invite/verify', verifyInviteHandler);
// Получить список пользователей компании
companyRouter.get('/:companyId/users', authenticate, getCompanyUsersHandler);
// Удалить пользователя из компании
companyRouter.delete('/:companyId/users/:userId', authenticate, removeUserFromCompanyHandler);
// Изменить роль пользователя в компании
companyRouter.put('/:companyId/users/:userId/role', authenticate, updateUserRoleHandler);

// === СТАТИСТИКА КОМПАНИИ ===
// GET /company/:companyId/stats - Получить статистику компании
companyRouter.get('/:companyId/stats', authenticate, getCompanyStatsHandler);

// === АНАЛИТИКА КОМПАНИИ ===
// GET /company/:companyId/analytics - Получить аналитику компании
companyRouter.get('/:companyId/analytics', authenticate, getCompanyAnalyticsHandler);
