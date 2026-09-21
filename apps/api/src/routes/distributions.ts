// ============================================================
// Distributions Routes — Distribusi ke Agen & Sales
// ============================================================

import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import * as schema from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { assertPermission, assertAnyPermission } from "../middleware/rbac";
import { getDb, generateId, getNow, paginatedList } from "./helpers";
import { adjustSalesStock } from "../services/sales-stock";
import type { AppEnv } from "../index";

const distributions = new Hono<AppEnv>();
distributions.use("*", authMiddleware);

const channelResource = (channel: string | null) =>
  channel === "agent" ? "distribution_agent" : "distribution_sales";

// GET /sales-team — List users who hold the "sales" role
distributions.get("/sales-team", async (c) => {
  await assertPermission(c, "distribution_sales", "list");

  const db = getDb(c);
  const tenantId = c.get("tenantId");

  const sales = await db
    .selectDistinct({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      phone: schema.users.phone,
      status: schema.users.status,
    })
    .from(schema.users)
    .innerJoin(schema.userRoles, eq(schema.userRoles.user_id, schema.users.id))
    .innerJoin(schema.roles, eq(schema.roles.id, schema.userRoles.role_id))
    .where(and(eq(schema.users.tenant_id, tenantId), eq(schema.roles.name, "sales")));

  return c.json({ success: true, data: sales, total: sales.length });
});

// GET / — List distributions (filtered by channel)
distributions.get("/", async (c) => {
  const url = new URL(c.req.url);
  const channel = url.searchParams.get("channel") || "sales";

  await assertPermission(c, channelResource(channel), "list");

  const roles = c.get("userRoles");
  const userId = c.get("userId");
  const isSales = roles.includes("sales") && !roles.includes("admin") && !roles.includes("owner");

  const additionalFilters = [eq(schema.distributions.channel, channel)];
  if (isSales && channel === "sales") {
    additionalFilters.push(eq(schema.distributions.recipient_id, userId));
  }

  return paginatedList(c, schema.distributions, schema.distributions.tenant_id, {
    additionalFilters,
    searchCols: [schema.distributions.recipient_name],
    sortableCols: { created_at: schema.distributions.created_at, status: schema.distributions.status },
  });
});

// GET /:id — Distribution detail with items
distributions.get("/:id", async (c) => {
  await assertAnyPermission(c, ["distribution_agent", "distribution_sales"], "show");

  const db = getDb(c);
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const roles = c.get("userRoles");
  const userId = c.get("userId");
  const isSales = roles.includes("sales") && !roles.includes("admin") && !roles.includes("owner");

  const conditions = [eq(schema.distributions.id, id), eq(schema.distributions.tenant_id, tenantId)];
  if (isSales) {
    conditions.push(eq(schema.distributions.recipient_id, userId));
  }

  const dist = await db
    .select()
    .from(schema.distributions)
    .where(and(...conditions))
    .limit(1);

  if (dist.length === 0) return c.json({ success: false, error: "Distribusi tidak ditemukan" }, 404);

  const items = await db
    .select({
      id: schema.distributionItems.id,
      product_id: schema.distributionItems.product_id,
      product_name: schema.products.name,
      batch_id: schema.distributionItems.batch_id,
      quantity: schema.distributionItems.quantity,
      price: schema.distributionItems.price,
      subtotal: schema.distributionItems.subtotal,
    })
    .from(schema.distributionItems)
    .innerJoin(schema.products, eq(schema.distributionItems.product_id, schema.products.id))
    .where(eq(schema.distributionItems.distribution_id, id));

  const approvals = await db
    .select()
    .from(schema.distributionApprovals)
    .where(eq(schema.distributionApprovals.distribution_id, id));

  return c.json({ success: true, data: { ...dist[0], items, approvals } });
});

// POST / — Create distribution
distributions.post("/", async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");
  const body = await c.req.json();
  const channel = body.channel || "sales";
  const now = getNow();
  const distId = generateId();

  await assertPermission(c, channelResource(channel), "create");

  // Calculate total
  let totalAmount = 0;
  const items = body.items || [];

  await db.insert(schema.distributions).values({
    id: distId,
    tenant_id: tenantId,
    channel,
    method: body.method || null,
    recipient_id: body.recipient_id || body.recipient_name || generateId(),
    recipient_name: body.recipient_name || null,
    status: channel === "agent" ? "draft" : "pending_approval",
    total_amount: 0,
    notes: body.notes || null,
    created_at: now,
    updated_at: now,
  });

  // Create items
  for (const item of items) {
    const subtotal = item.quantity * item.price;
    totalAmount += subtotal;

    await db.insert(schema.distributionItems).values({
      id: generateId(),
      distribution_id: distId,
      product_id: item.product_id,
      batch_id: item.batch_id,
      quantity: item.quantity,
      price: item.price,
      subtotal,
      created_at: now,
    });
  }

  // Update total amount
  await db
    .update(schema.distributions)
    .set({ total_amount: totalAmount })
    .where(eq(schema.distributions.id, distId));

  return c.json({ success: true, data: { id: distId } }, 201);
});

// POST /:id/approve — Approve/Reject distribution
distributions.post("/:id/approve", async (c) => {
  await assertAnyPermission(c, ["distribution_agent", "distribution_sales"], "approve");

  const db = getDb(c);
  const tenantId = c.get("tenantId");
  const userId = c.get("userId");
  const id = c.req.param("id");
  const body = await c.req.json();
  const now = getNow();

  const dist = await db
    .select()
    .from(schema.distributions)
    .where(and(eq(schema.distributions.id, id), eq(schema.distributions.tenant_id, tenantId)))
    .limit(1);

  if (dist.length === 0) return c.json({ success: false, error: "Distribusi tidak ditemukan" }, 404);

  // Create approval record
  await db.insert(schema.distributionApprovals).values({
    id: generateId(),
    distribution_id: id,
    user_id: userId,
    status: body.status, // "approved" or "rejected"
    notes: body.notes || null,
    created_at: now,
  });

  // Update distribution status
  const newStatus = body.status === "approved" ? "approved" : "rejected";
  await db
    .update(schema.distributions)
    .set({ status: newStatus, updated_at: now })
    .where(eq(schema.distributions.id, id));

  // If approved, deduct stock from batches (warehouse) and credit sales stock
  if (body.status === "approved") {
    const items = await db
      .select()
      .from(schema.distributionItems)
      .where(eq(schema.distributionItems.distribution_id, id));

    for (const item of items) {
      const batch = await db
        .select()
        .from(schema.stockBatches)
        .where(eq(schema.stockBatches.id, item.batch_id))
        .limit(1);

      if (batch.length > 0) {
        const newQty = Math.max(0, batch[0].current_quantity - item.quantity);
        await db
          .update(schema.stockBatches)
          .set({
            current_quantity: newQty,
            status: newQty === 0 ? "out_of_stock" : newQty < 10 ? "low_stock" : "available",
            updated_at: now,
          })
          .where(eq(schema.stockBatches.id, item.batch_id));
      }

      // Internal distribution: stock is now carried by the sales person
      if (dist[0].channel === "sales") {
        await adjustSalesStock(
          db,
          {
            tenantId,
            salesId: dist[0].recipient_id,
            productId: item.product_id,
            batchId: item.batch_id,
          },
          item.quantity
        );
      }
    }
  }

  return c.json({ success: true, data: { id, status: newStatus } });
});

export { distributions as distributionRoutes };
