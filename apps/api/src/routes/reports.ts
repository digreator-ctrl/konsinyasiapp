// ============================================================
// Reports Routes — Laporan & Analytics
// ============================================================

import { Hono } from "hono";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import * as schema from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { getDb } from "./helpers";
import type { AppEnv } from "../index";

const reports = new Hono<AppEnv>();
reports.use("*", authMiddleware);

// GET /dashboard — Dashboard metrics
reports.get("/dashboard", requirePermission("dashboard", "list"), async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");
  const today = new Date().toISOString().split("T")[0];

  // Total stock in warehouse
  const stockResult = await db
    .select({ total: sql<number>`COALESCE(SUM(${schema.stockBatches.current_quantity}), 0)` })
    .from(schema.stockBatches)
    .where(eq(schema.stockBatches.tenant_id, tenantId));

  // Total distributed
  const distResult = await db
    .select({ total: sql<number>`COALESCE(SUM(${schema.distributionItems.quantity}), 0)` })
    .from(schema.distributionItems)
    .innerJoin(schema.distributions, eq(schema.distributionItems.distribution_id, schema.distributions.id))
    .where(and(eq(schema.distributions.tenant_id, tenantId), eq(schema.distributions.status, "approved")));

  // Total returned
  const retResult = await db
    .select({ total: sql<number>`COALESCE(SUM(${schema.returnItems.quantity}), 0)` })
    .from(schema.returnItems)
    .innerJoin(schema.returns, eq(schema.returnItems.return_id, schema.returns.id))
    .where(eq(schema.returns.tenant_id, tenantId));

  // Active consignments
  const consignResult = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(schema.consignments)
    .where(and(eq(schema.consignments.tenant_id, tenantId), eq(schema.consignments.status, "active")));

  // Expiring soon (7 days)
  const sevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const expiringResult = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(schema.stockBatches)
    .where(
      and(
        eq(schema.stockBatches.tenant_id, tenantId),
        lte(schema.stockBatches.expiry_date, sevenDays),
        sql`${schema.stockBatches.current_quantity} > 0`
      )
    );

  return c.json({
    success: true,
    data: {
      total_stock: stockResult[0]?.total || 0,
      distributed_stock: distResult[0]?.total || 0,
      returned_stock: retResult[0]?.total || 0,
      active_consignments: consignResult[0]?.total || 0,
      expiring_soon: expiringResult[0]?.total || 0,
    },
  });
});

// GET /stock-movement — Stock movement over time
reports.get("/stock-movement", requirePermission("reports", "list"), async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");
  const url = new URL(c.req.url);
  const startDate = url.searchParams.get("start_date") || "";
  const endDate = url.searchParams.get("end_date") || "";

  // Stock in by date
  let stockInConditions: any[] = [eq(schema.stockEntries.tenant_id, tenantId)];
  if (startDate) stockInConditions.push(gte(schema.stockEntries.production_date, startDate));
  if (endDate) stockInConditions.push(lte(schema.stockEntries.production_date, endDate));

  const stockIn = await db
    .select({
      date: schema.stockEntries.production_date,
      total: sql<number>`SUM(${schema.stockEntries.quantity})`,
    })
    .from(schema.stockEntries)
    .where(and(...stockInConditions))
    .groupBy(schema.stockEntries.production_date);

  return c.json({ success: true, data: { stock_in: stockIn } });
});

// GET /sales-performance — Sales team performance
reports.get("/sales-performance", requirePermission("reports", "list"), async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");

  const performance = await db
    .select({
      sales_id: schema.distributions.recipient_id,
      total_distributions: sql<number>`COUNT(*)`,
      total_amount: sql<number>`COALESCE(SUM(${schema.distributions.total_amount}), 0)`,
    })
    .from(schema.distributions)
    .where(
      and(
        eq(schema.distributions.tenant_id, tenantId),
        eq(schema.distributions.channel, "sales"),
        eq(schema.distributions.status, "approved")
      )
    )
    .groupBy(schema.distributions.recipient_id);

  return c.json({ success: true, data: performance });
});

export { reports as reportRoutes };
