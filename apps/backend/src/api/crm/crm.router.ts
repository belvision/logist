// apps/backend/src/api/crm/crm.router.ts
import { Hono } from 'hono';
import { companiesRouter } from './companies/companies.router';
import { vehiclesRouter } from './vehicles/vehicles.router';
import { driversRouter } from './drivers/drivers.router';

export const crmRouter = new Hono();

// Подключаем подроутеры
crmRouter.route('/', companiesRouter);
crmRouter.route('/', vehiclesRouter);
crmRouter.route('/', driversRouter);

