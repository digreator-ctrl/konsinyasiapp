// ============================================================
// Tenants Routes — CRUD Profil Usaha
// ============================================================

import { Hono } from "hono";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { getDb, getNow } from "./helpers";
import type { AppEnv } from "../index";

const tenants = new Hono<AppEnv>();
tenants.use("*", authMiddleware);

// GET / — Get current tenant info
tenants.get("/", requirePermission("settings_company", "list"), async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");

  const result = await db.select().from(schema.tenants).where(eq(schema.tenants.id, tenantId)).limit(1);

  return c.json({ success: true, data: result[0] || null });
});

// PUT / — Update tenant
tenants.put("/", requirePermission("settings_company", "edit"), async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");
  const body = await c.req.json();

  await db
    .update(schema.tenants)
    .set({ ...body, updated_at: getNow() })
    .where(eq(schema.tenants.id, tenantId));

  const updated = await db.select().from(schema.tenants).where(eq(schema.tenants.id, tenantId)).limit(1);

  return c.json({ success: true, data: updated[0] });
});

export { tenants as tenantRoutes };
