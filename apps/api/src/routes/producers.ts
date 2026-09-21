// ============================================================
// Producers Routes — CRUD Data Produsen
// ============================================================

import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import * as schema from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { getDb, generateId, getNow, paginatedList } from "./helpers";
import type { AppEnv } from "../index";

const producers = new Hono<AppEnv>();
producers.use("*", authMiddleware);

producers.get("/", requirePermission("producers", "list"), async (c) => {
  return paginatedList(c, schema.producers, schema.producers.tenant_id, {
    searchCols: [schema.producers.name, schema.producers.contact_person],
    sortableCols: { name: schema.producers.name, created_at: schema.producers.created_at },
  });
});

producers.get("/:id", requirePermission("producers", "show"), async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const result = await db
    .select()
    .from(schema.producers)
    .where(and(eq(schema.producers.id, id), eq(schema.producers.tenant_id, tenantId)))
    .limit(1);

  if (result.length === 0) return c.json({ success: false, error: "Produsen tidak ditemukan" }, 404);
  return c.json({ success: true, data: result[0] });
});

producers.post("/", requirePermission("producers", "create"), async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");
  const body = await c.req.json();
  const now = getNow();
  const id = generateId();

  await db.insert(schema.producers).values({
    id,
    tenant_id: tenantId,
    name: body.name,
    type: body.type || "internal",
    address: body.address || null,
    phone: body.phone || null,
    email: body.email || null,
    contact_person: body.contact_person || null,
    notes: body.notes || null,
    created_at: now,
    updated_at: now,
  });

  return c.json({ success: true, data: { id } }, 201);
});

producers.put("/:id", requirePermission("producers", "edit"), async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const body = await c.req.json();

  await db
    .update(schema.producers)
    .set({ ...body, updated_at: getNow() })
    .where(and(eq(schema.producers.id, id), eq(schema.producers.tenant_id, tenantId)));

  return c.json({ success: true, data: { id } });
});

producers.delete("/:id", requirePermission("producers", "delete"), async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  await db
    .delete(schema.producers)
    .where(and(eq(schema.producers.id, id), eq(schema.producers.tenant_id, tenantId)));

  return c.json({ success: true });
});

export { producers as producerRoutes };
