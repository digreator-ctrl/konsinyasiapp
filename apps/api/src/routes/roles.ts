// ============================================================
// Roles Routes — CRUD Peran & Hak Akses (RBAC)
// ============================================================

import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { isActionAllowedForResource } from "@konsinyasi/shared";
import * as schema from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { getDb, generateId, getNow, paginatedList } from "./helpers";
import type { AppEnv } from "../index";

const roles = new Hono<AppEnv>();
roles.use("*", authMiddleware);

type NormalizedPermission = {
  resource: string;
  action: string;
  allowed: boolean;
};

/**
 * Validasi & normalisasi daftar permission dari request.
 * Menolak resource/action yang tidak berlaku dan membuang duplikat.
 */
function normalizePermissions(
  raw: unknown
):
  | { ok: true; value: NormalizedPermission[] }
  | { ok: false; error: string } {
  if (raw === undefined || raw === null) {
    return { ok: true, value: [] };
  }

  if (!Array.isArray(raw)) {
    return { ok: false, error: "Format permissions tidak valid" };
  }

  const value: NormalizedPermission[] = [];
  const seen = new Set<string>();

  for (const perm of raw as Array<Record<string, unknown>>) {
    const resource = perm?.resource;
    const action = perm?.action;

    if (
      typeof resource !== "string" ||
      typeof action !== "string" ||
      !isActionAllowedForResource(resource, action)
    ) {
      return {
        ok: false,
        error: `Hak akses tidak valid: ${String(resource)}:${String(action)}`,
      };
    }

    const key = `${resource}:${action}`;
    if (seen.has(key)) continue;
    seen.add(key);

    value.push({ resource, action, allowed: perm.allowed !== false });
  }

  return { ok: true, value };
}

// GET / — List roles
roles.get("/", requirePermission("settings_roles", "list"), async (c) => {
  return paginatedList(c, schema.roles, schema.roles.tenant_id, {
    searchCols: [schema.roles.name],
    sortableCols: { name: schema.roles.name, created_at: schema.roles.created_at },
  });
});

// GET /:id — Get role with permissions
roles.get("/:id", requirePermission("settings_roles", "show"), async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const role = await db
    .select()
    .from(schema.roles)
    .where(and(eq(schema.roles.id, id), eq(schema.roles.tenant_id, tenantId)))
    .limit(1);

  if (role.length === 0) {
    return c.json({ success: false, error: "Role tidak ditemukan" }, 404);
  }

  // Get permissions
  const permissions = await db
    .select()
    .from(schema.rolePermissions)
    .where(eq(schema.rolePermissions.role_id, id));

  return c.json({
    success: true,
    data: { ...role[0], permissions },
  });
});

// POST / — Create role
roles.post("/", requirePermission("settings_roles", "create"), async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");
  const body = await c.req.json();
  const now = getNow();
  const roleId = generateId();

  const permissions = normalizePermissions(body.permissions);
  if (!permissions.ok) {
    return c.json({ success: false, error: permissions.error }, 400);
  }

  await db.insert(schema.roles).values({
    id: roleId,
    tenant_id: tenantId,
    name: body.name,
    description: body.description || null,
    is_system: false,
    created_at: now,
    updated_at: now,
  });

  // Insert permissions
  for (const perm of permissions.value) {
    await db.insert(schema.rolePermissions).values({
      id: generateId(),
      role_id: roleId,
      resource: perm.resource,
      action: perm.action,
      allowed: perm.allowed,
      created_at: now,
    });
  }

  return c.json({ success: true, data: { id: roleId } }, 201);
});

// PUT /:id — Update role & permissions
roles.put("/:id", requirePermission("settings_roles", "edit"), async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const body = await c.req.json();
  const now = getNow();

  const permissions = normalizePermissions(body.permissions);
  if (!permissions.ok) {
    return c.json({ success: false, error: permissions.error }, 400);
  }

  await db
    .update(schema.roles)
    .set({
      name: body.name,
      description: body.description,
      updated_at: now,
    })
    .where(and(eq(schema.roles.id, id), eq(schema.roles.tenant_id, tenantId)));

  // Replace permissions
  await db.delete(schema.rolePermissions).where(eq(schema.rolePermissions.role_id, id));

  for (const perm of permissions.value) {
    await db.insert(schema.rolePermissions).values({
      id: generateId(),
      role_id: id,
      resource: perm.resource,
      action: perm.action,
      allowed: perm.allowed,
      created_at: now,
    });
  }

  return c.json({ success: true, data: { id } });
});

// DELETE /:id — Delete role (non-system only)
roles.delete("/:id", requirePermission("settings_roles", "delete"), async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  // Check if system role
  const role = await db
    .select({ is_system: schema.roles.is_system })
    .from(schema.roles)
    .where(and(eq(schema.roles.id, id), eq(schema.roles.tenant_id, tenantId)))
    .limit(1);

  if (role.length > 0 && role[0].is_system) {
    return c.json({ success: false, error: "Role sistem tidak dapat dihapus" }, 400);
  }

  await db
    .delete(schema.roles)
    .where(and(eq(schema.roles.id, id), eq(schema.roles.tenant_id, tenantId)));

  return c.json({ success: true });
});

export { roles as roleRoutes };
