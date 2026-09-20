// ============================================================
// Users Routes — CRUD Pengguna & Role Assignment
// ============================================================

import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import * as schema from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { getDb, generateId, getNow, paginatedList } from "./helpers";
import type { AppEnv } from "../index";

const users = new Hono<AppEnv>();
users.use("*", authMiddleware);

// GET / — List users
users.get("/", requirePermission("settings_users", "list"), async (c) => {
  return paginatedList(c, schema.users, schema.users.tenant_id, {
    searchCol: schema.users.name,
  });
});

// GET /:id — Get user detail
users.get("/:id", requirePermission("settings_users", "show"), async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const user = await db
    .select()
    .from(schema.users)
    .where(and(eq(schema.users.id, id), eq(schema.users.tenant_id, tenantId)))
    .limit(1);

  if (user.length === 0) {
    return c.json({ success: false, error: "User tidak ditemukan" }, 404);
  }

  // Get roles
  const userRoles = await db
    .select({
      id: schema.roles.id,
      name: schema.roles.name,
      description: schema.roles.description,
    })
    .from(schema.userRoles)
    .innerJoin(schema.roles, eq(schema.userRoles.role_id, schema.roles.id))
    .where(eq(schema.userRoles.user_id, id));

  return c.json({
    success: true,
    data: { ...user[0], roles: userRoles },
  });
});

// POST / — Create user
users.post("/", requirePermission("settings_users", "create"), async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");
  const body = await c.req.json();
  const now = getNow();
  const userId = generateId();

  // Hash password
  const encoder = new TextEncoder();
  const data = encoder.encode(body.password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashedPassword = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  await db.insert(schema.users).values({
    id: userId,
    tenant_id: tenantId,
    name: body.name,
    email: body.email,
    hashed_password: hashedPassword,
    phone: body.phone || null,
    province: body.province || null,
    city: body.city || null,
    district: body.district || null,
    village: body.village || null,
    address: body.address || null,
    gmaps_url: body.gmaps_url || null,
    status: "active",
    created_at: now,
    updated_at: now,
  });

  // Assign roles
  if (body.role_ids && Array.isArray(body.role_ids)) {
    for (const roleId of body.role_ids) {
      await db.insert(schema.userRoles).values({
        id: generateId(),
        user_id: userId,
        role_id: roleId,
        created_at: now,
      });
    }
  }

  return c.json({ success: true, data: { id: userId } }, 201);
});

// PUT /:id — Update user
users.put("/:id", requirePermission("settings_users", "edit"), async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const body = await c.req.json();
  const now = getNow();

  await db
    .update(schema.users)
    .set({
      name: body.name,
      email: body.email,
      phone: body.phone,
      province: body.province,
      city: body.city,
      district: body.district,
      village: body.village,
      address: body.address,
      gmaps_url: body.gmaps_url,
      status: body.status,
      updated_at: now,
    })
    .where(and(eq(schema.users.id, id), eq(schema.users.tenant_id, tenantId)));

  // Update roles if provided
  if (body.role_ids && Array.isArray(body.role_ids)) {
    // Remove existing roles
    await db.delete(schema.userRoles).where(eq(schema.userRoles.user_id, id));

    // Assign new roles
    for (const roleId of body.role_ids) {
      await db.insert(schema.userRoles).values({
        id: generateId(),
        user_id: id,
        role_id: roleId,
        created_at: now,
      });
    }
  }

  return c.json({ success: true, data: { id } });
});

// DELETE /:id — Delete user
users.delete("/:id", requirePermission("settings_users", "delete"), async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  await db
    .delete(schema.users)
    .where(and(eq(schema.users.id, id), eq(schema.users.tenant_id, tenantId)));

  return c.json({ success: true });
});

export { users as userRoutes };
