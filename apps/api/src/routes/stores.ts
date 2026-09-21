// ============================================================
// Stores Routes — CRUD Data Toko
// ============================================================

import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import * as schema from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { getDb, generateId, getNow, paginatedList } from "./helpers";
import type { AppEnv } from "../index";

const stores = new Hono<AppEnv>();
stores.use("*", authMiddleware);

stores.get("/", requirePermission("stores", "list"), async (c) => {
  return paginatedList(c, schema.stores, schema.stores.tenant_id, {
    searchCols: [schema.stores.name, schema.stores.area],
    sortableCols: { name: schema.stores.name, created_at: schema.stores.created_at },
  });
});

stores.get("/:id", requirePermission("stores", "show"), async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const result = await db
    .select()
    .from(schema.stores)
    .where(and(eq(schema.stores.id, id), eq(schema.stores.tenant_id, tenantId)))
    .limit(1);

  if (result.length === 0) return c.json({ success: false, error: "Toko tidak ditemukan" }, 404);
  return c.json({ success: true, data: result[0] });
});

stores.post("/", requirePermission("stores", "create"), async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");
  const body = await c.req.json();
  const now = getNow();
  const id = generateId();

  await db.insert(schema.stores).values({
    id,
    tenant_id: tenantId,
    name: body.name,
    address: body.address || null,
    owner_name: body.owner_name || null,
    phone: body.phone || null,
    latitude: body.latitude || null,
    longitude: body.longitude || null,
    area: body.area || null,
    is_active: body.is_active !== false,
    created_at: now,
    updated_at: now,
  });

  return c.json({ success: true, data: { id } }, 201);
});

stores.put("/:id", requirePermission("stores", "edit"), async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const body = await c.req.json();

  await db
    .update(schema.stores)
    .set({ ...body, updated_at: getNow() })
    .where(and(eq(schema.stores.id, id), eq(schema.stores.tenant_id, tenantId)));

  return c.json({ success: true, data: { id } });
});

stores.delete("/:id", requirePermission("stores", "delete"), async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  await db
    .delete(schema.stores)
    .where(and(eq(schema.stores.id, id), eq(schema.stores.tenant_id, tenantId)));

  return c.json({ success: true });
});

export { stores as storeRoutes };
