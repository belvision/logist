import { CreateRouteSchema, UpdateRouteSchema } from './routes.schema';
import { createRouteService, updateRouteService, deleteRouteService } from './routes.service';

// ===== Handlers =====
export async function createRouteHandler(c: any) {
  const body = await c.req.json().catch(() => ({}));
  const parsed = CreateRouteSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ message: 'Validation error', errors: parsed.error.flatten() }, 400);
  }
  const res = await createRouteService(parsed.data);
  return c.json(res.ok ? { ok: true, route: res.route } : { error: res.error }, res.status);
}

export async function updateRouteHandler(c: any) {
  const idParam = c.req.param('id_routes') ?? c.req.param('id');
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) {
    return c.json({ message: 'Некорректный идентификатор' }, 400);
  }

  const body = await c.req.json().catch(() => ({}));
  const parsed = UpdateRouteSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ message: 'Validation error', errors: parsed.error.flatten() }, 400);
  }
  const res = await updateRouteService(id, parsed.data);
  return c.json(res.ok ? { ok: true, route: res.route } : { error: res.error }, res.status);
}

export async function deleteRouteHandler(c: any) {
  const idParam = c.req.param('id_routes') ?? c.req.param('id');
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) {
    return c.json({ message: 'Некорректный идентификатор' }, 400);
  }
  const res = await deleteRouteService(id);
  return c.json(res.ok ? { ok: true } : { error: res.error }, res.status);
}

