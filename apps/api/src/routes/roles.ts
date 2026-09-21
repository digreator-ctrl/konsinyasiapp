// ============================================================
// Roles Routes — CRUD Peran & Hak Akses (RBAC)
// ============================================================

import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import * as schema from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { getDb, generateId, getNow, paginatedList } from "./helpers";
import type { AppEnv } from "../index";

const roles = new Hono<AppEnv>();
roles.use("*", authMiddleware);

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
  if (body.permissions && Array.isArray(body.permissions)) {
    for (const perm of body.permissions) {
      await db.insert(schema.rolePermissions).values({
        id: generateId(),
        role_id: roleId,
        resource: perm.resource,
        action: perm.action,
        allowed: perm.allowed !== false,
        created_at: now,
      });
    }
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

  await db
    .update(schema.roles)
    .set({
      name: body.name,
      description: body.description,
      updated_at: now,
    })
    .where(and(eq(schema.roles.id, id), eq(schema.roles.tenant_id, tenantId)));

  // Replace permissions
  if (body.permissions && Array.isArray(body.permissions)) {
    await db.delete(schema.rolePermissions).where(eq(schema.rolePermissions.role_id, id));

    for (const perm of body.permissions) {
      await db.insert(schema.rolePermissions).values({
        id: generateId(),
        role_id: id,
        resource: perm.resource,
        action: perm.action,
        allowed: perm.allowed !== false,
        created_at: now,
      });
    }
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
