// apps/backend/src/api/crm/vehicles/vehicles.router.ts
import { Hono } from 'hono';
import { authenticate } from '../../middleware/auth';
import {
  createCrmVehicleHandler,
  getCrmVehicleHandler,
  getCrmVehiclesByCompanyHandler,
  updateCrmVehicleHandler,
  deleteCrmVehicleHandler,
  getCrmVehicleDriversHandler,
  attachDriverToVehicleHandler,
  detachDriverFromVehicleHandler,
} from './vehicles.controller';

export const vehiclesRouter = new Hono();

// === Автомобили ===
vehiclesRouter.post('/vehicles', authenticate, createCrmVehicleHandler);
vehiclesRouter.get('/vehicles/:id', authenticate, getCrmVehicleHandler);
vehiclesRouter.get('/companies/:id/vehicles', authenticate, getCrmVehiclesByCompanyHandler);
vehiclesRouter.patch('/vehicles/:id', authenticate, updateCrmVehicleHandler);
vehiclesRouter.delete('/vehicles/:id', authenticate, deleteCrmVehicleHandler);

// === Водители автомобилей ===
vehiclesRouter.get('/vehicles/:id/drivers', authenticate, getCrmVehicleDriversHandler);
vehiclesRouter.post('/vehicles/:id/drivers/:driverId', authenticate, attachDriverToVehicleHandler);
vehiclesRouter.delete('/vehicles/:id/drivers/:driverId', authenticate, detachDriverFromVehicleHandler);

