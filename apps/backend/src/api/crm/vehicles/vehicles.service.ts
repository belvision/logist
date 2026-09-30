// apps/backend/src/api/crm/vehicles/vehicles.service.ts
import type {
  CreateCrmVehicleDto,
  UpdateCrmVehicleDto,
} from '../crm.schema';
import {
  createCrmVehicle,
  getCrmVehicleById,
  getCrmVehiclesByCompany,
  updateCrmVehicle,
  deleteCrmVehicle,
  getCrmVehicleDrivers,
  attachDriverToVehicle,
  detachDriverFromVehicle,
} from './vehicles.repository';
import { getCrmCompanyById } from '../companies/companies.repository';
import { getCrmDriverById, existsCompanyDriverLink, attachDriverToCompany } from '../drivers/drivers.repository';
import { getWorkspaceCompanyId, checkWorkspaceMembership } from '../crm.utils';

// === Vehicles ===

export async function createCrmVehicleService(payload: CreateCrmVehicleDto, userId: string) {
  const workspaceRes = await getWorkspaceCompanyId(userId);
  if (!workspaceRes.ok) {
    return workspaceRes;
  }
  const workspace_company_id = workspaceRes.workspace_company_id;

  const isMember = await checkWorkspaceMembership(userId, workspace_company_id);
  if (!isMember) {
    return { ok: false as const, status: 403, error: 'У вас нет доступа к этому workspace' };
  }

  const company = await getCrmCompanyById(payload.id_crm_company, workspace_company_id);
  if (!company) {
    return { ok: false as const, status: 404, error: 'Контрагент не найден' };
  }

  const vehicle = await createCrmVehicle({
    ...payload,
    workspace_company_id,
    created_by: userId,
  });

  return { ok: true as const, status: 201, vehicle };
}

export async function getCrmVehicleService(id: string, userId: string) {
  const workspaceRes = await getWorkspaceCompanyId(userId);
  if (!workspaceRes.ok) {
    return workspaceRes;
  }
  const workspace_company_id = workspaceRes.workspace_company_id;

  const isMember = await checkWorkspaceMembership(userId, workspace_company_id);
  if (!isMember) {
    return { ok: false as const, status: 403, error: 'У вас нет доступа к этому workspace' };
  }

  const vehicle = await getCrmVehicleById(id, workspace_company_id);
  if (!vehicle) {
    return { ok: false as const, status: 404, error: 'Автомобиль не найден' };
  }

  return { ok: true as const, status: 200, vehicle };
}

export async function getCrmVehiclesByCompanyService(id_crm_company: string, userId: string) {
  const workspaceRes = await getWorkspaceCompanyId(userId);
  if (!workspaceRes.ok) {
    return workspaceRes;
  }
  const workspace_company_id = workspaceRes.workspace_company_id;

  const isMember = await checkWorkspaceMembership(userId, workspace_company_id);
  if (!isMember) {
    return { ok: false as const, status: 403, error: 'У вас нет доступа к этому workspace' };
  }

  const company = await getCrmCompanyById(id_crm_company, workspace_company_id);
  if (!company) {
    return { ok: false as const, status: 404, error: 'Контрагент не найден' };
  }

  const vehicles = await getCrmVehiclesByCompany(id_crm_company, workspace_company_id);
  return { ok: true as const, status: 200, vehicles };
}

export async function updateCrmVehicleService(id: string, payload: UpdateCrmVehicleDto, userId: string) {
  const workspaceRes = await getWorkspaceCompanyId(userId);
  if (!workspaceRes.ok) {
    return workspaceRes;
  }
  const workspace_company_id = workspaceRes.workspace_company_id;

  const isMember = await checkWorkspaceMembership(userId, workspace_company_id);
  if (!isMember) {
    return { ok: false as const, status: 403, error: 'У вас нет доступа к этому workspace' };
  }

  if (payload.id_crm_company) {
    const company = await getCrmCompanyById(payload.id_crm_company, workspace_company_id);
    if (!company) {
      return { ok: false as const, status: 404, error: 'Контрагент не найден' };
    }
  }

  const updated = await updateCrmVehicle(id, workspace_company_id, payload);
  if (!updated) {
    return { ok: false as const, status: 404, error: 'Автомобиль не найден' };
  }

  return { ok: true as const, status: 200, vehicle: updated };
}

export async function deleteCrmVehicleService(id: string, userId: string) {
  const workspaceRes = await getWorkspaceCompanyId(userId);
  if (!workspaceRes.ok) {
    return workspaceRes;
  }
  const workspace_company_id = workspaceRes.workspace_company_id;

  const isMember = await checkWorkspaceMembership(userId, workspace_company_id);
  if (!isMember) {
    return { ok: false as const, status: 403, error: 'У вас нет доступа к этому workspace' };
  }

  const deleted = await deleteCrmVehicle(id, workspace_company_id);
  if (!deleted) {
    return { ok: false as const, status: 404, error: 'Автомобиль не найден' };
  }

  return { ok: true as const, status: 200, message: 'Автомобиль успешно удалён' };
}

// === Vehicle Drivers ===

export async function getCrmVehicleDriversService(id_vehicle: string, userId: string) {
  const workspaceRes = await getWorkspaceCompanyId(userId);
  if (!workspaceRes.ok) {
    return workspaceRes;
  }
  const workspace_company_id = workspaceRes.workspace_company_id;

  const isMember = await checkWorkspaceMembership(userId, workspace_company_id);
  if (!isMember) {
    return { ok: false as const, status: 403, error: 'У вас нет доступа к этому workspace' };
  }

  const vehicle = await getCrmVehicleById(id_vehicle, workspace_company_id);
  if (!vehicle) {
    return { ok: false as const, status: 404, error: 'Автомобиль не найден' };
  }

  const drivers = await getCrmVehicleDrivers(id_vehicle, workspace_company_id);
  return { ok: true as const, status: 200, drivers };
}

export async function attachDriverToVehicleService(id_vehicle: string, id_driver: string, userId: string) {
  const workspaceRes = await getWorkspaceCompanyId(userId);
  if (!workspaceRes.ok) {
    return workspaceRes;
  }
  const workspace_company_id = workspaceRes.workspace_company_id;

  const isMember = await checkWorkspaceMembership(userId, workspace_company_id);
  if (!isMember) {
    return { ok: false as const, status: 403, error: 'У вас нет доступа к этому workspace' };
  }

  const vehicle = await getCrmVehicleById(id_vehicle, workspace_company_id);
  if (!vehicle) {
    return { ok: false as const, status: 404, error: 'Автомобиль не найден' };
  }

  const driver = await getCrmDriverById(id_driver, workspace_company_id);
  if (!driver) {
    return { ok: false as const, status: 404, error: 'Водитель не найден' };
  }

  if (vehicle.workspace_company_id !== driver.workspace_company_id) {
    return { ok: false as const, status: 400, error: 'Автомобиль и водитель должны принадлежать одному workspace' };
  }

  // КЛЮЧЕВАЯ ЛОГИКА: Если связь company-driver не существует, создаём её автоматически
  const companyDriverExists = await existsCompanyDriverLink(vehicle.id_crm_company, id_driver, workspace_company_id);
  if (!companyDriverExists) {
    await attachDriverToCompany({
      workspace_company_id,
      id_crm_company: vehicle.id_crm_company,
      id_driver,
    });
  }

  const linked = await attachDriverToVehicle({
    workspace_company_id,
    id_vehicle,
    id_driver,
  });
  if (!linked) {
    return { ok: false as const, status: 409, error: 'Водитель уже привязан к этому автомобилю' };
  }

  return { ok: true as const, status: 200, message: 'Водитель успешно привязан к автомобилю' };
}

export async function detachDriverFromVehicleService(id_vehicle: string, id_driver: string, userId: string) {
  const workspaceRes = await getWorkspaceCompanyId(userId);
  if (!workspaceRes.ok) {
    return workspaceRes;
  }
  const workspace_company_id = workspaceRes.workspace_company_id;

  const isMember = await checkWorkspaceMembership(userId, workspace_company_id);
  if (!isMember) {
    return { ok: false as const, status: 403, error: 'У вас нет доступа к этому workspace' };
  }

  const deleted = await detachDriverFromVehicle(id_vehicle, id_driver, workspace_company_id);
  if (!deleted) {
    return { ok: false as const, status: 404, error: 'Связь не найдена' };
  }

  return { ok: true as const, status: 200, message: 'Водитель успешно отвязан от автомобиля' };
}

