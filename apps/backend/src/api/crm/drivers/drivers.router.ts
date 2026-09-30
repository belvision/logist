// apps/backend/src/api/crm/drivers/drivers.router.ts
import { Hono } from 'hono';
import { authenticate } from '../../middleware/auth';
import {
  createCrmDriverHandler,
  getCrmDriversHandler,
  attachDriverToCompanyHandler,
  detachDriverFromCompanyHandler,
  getCrmCompanyDriversHandler,
} from './drivers.controller';

export const driversRouter = new Hono();

// === Водители ===
driversRouter.post('/drivers', authenticate, createCrmDriverHandler);
driversRouter.get('/drivers', authenticate, getCrmDriversHandler);

// === Водители контрагентов ===
driversRouter.post('/companies/:id/drivers/:driverId', authenticate, attachDriverToCompanyHandler);
driversRouter.delete('/companies/:id/drivers/:driverId', authenticate, detachDriverFromCompanyHandler);
driversRouter.get('/companies/:id/drivers', authenticate, getCrmCompanyDriversHandler);

