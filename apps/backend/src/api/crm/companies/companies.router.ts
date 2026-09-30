// apps/backend/src/api/crm/companies/companies.router.ts
import { Hono } from 'hono';
import { authenticate } from '../../middleware/auth';
import {
  createCrmCompanyHandler,
  getCrmCompaniesHandler,
  getCrmCompanyHandler,
  updateCrmCompanyHandler,
  deleteCrmCompanyHandler,
  getCrmCompanyAutofillHandler,
  createCrmContactHandler,
  getCrmContactsHandler,
  deleteCrmContactHandler,
  getCrmFieldPrefsHandler,
  upsertCrmFieldPrefsHandler,
  getCrmCustomFieldsHandler,
  createCrmCustomFieldHandler,
  updateCrmCustomFieldHandler,
  deleteCrmCustomFieldHandler,
  getCrmCustomValuesHandler,
  upsertCrmCustomValuesHandler,
} from './companies.controller';

export const companiesRouter = new Hono();

// === Контрагенты ===
companiesRouter.post('/companies', authenticate, createCrmCompanyHandler);
companiesRouter.get('/companies', authenticate, getCrmCompaniesHandler);
companiesRouter.get('/companies/autofill', authenticate, getCrmCompanyAutofillHandler);
companiesRouter.get('/companies/:id', authenticate, getCrmCompanyHandler);
companiesRouter.patch('/companies/:id', authenticate, updateCrmCompanyHandler);
companiesRouter.delete('/companies/:id', authenticate, deleteCrmCompanyHandler);

// === Контакты ===
companiesRouter.post('/companies/:id/contacts', authenticate, createCrmContactHandler);
companiesRouter.get('/companies/:id/contacts', authenticate, getCrmContactsHandler);
companiesRouter.delete('/companies/:id/contacts/:contactId', authenticate, deleteCrmContactHandler);

// === Field Prefs ===
companiesRouter.get('/field-prefs', authenticate, getCrmFieldPrefsHandler);
companiesRouter.put('/field-prefs', authenticate, upsertCrmFieldPrefsHandler);

// === Custom Fields ===
companiesRouter.get('/custom-fields', authenticate, getCrmCustomFieldsHandler);
companiesRouter.post('/custom-fields', authenticate, createCrmCustomFieldHandler);
companiesRouter.patch('/custom-fields/:fieldId', authenticate, updateCrmCustomFieldHandler);
companiesRouter.delete('/custom-fields/:fieldId', authenticate, deleteCrmCustomFieldHandler);

// === Custom Values ===
companiesRouter.get('/companies/:id/custom-values', authenticate, getCrmCustomValuesHandler);
companiesRouter.put('/companies/:id/custom-values', authenticate, upsertCrmCustomValuesHandler);

