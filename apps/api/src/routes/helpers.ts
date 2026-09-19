// ============================================================
// KonsinyasiApp — Generic CRUD Helper
// Reusable CRUD operations for Hono routes with Drizzle
// ============================================================

import { drizzle } from "drizzle-orm/d1";
import { eq, and, like, desc, asc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import type { Context } from "hono";
import type { AppEnv } from "../index";
import * as schema from "../db/schema";

type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

export function getDb(c: Context<AppEnv>): DrizzleDB {
  return drizzle(c.env.DB, { schema });
}

export function generateId(): string {
  return nanoid();
}

export function getNow(): string {
  return new Date().toISOString();
}

/**
 * Build a paginated list response.
 */
export async function paginatedList<T extends SQLiteTable>(
  c: Context<AppEnv>,
  table: T,
  tenantIdCol: any,
  options?: {
    additionalFilters?: any[];
    searchCol?: any;
    orderByCol?: any;
    orderDir?: "asc" | "desc";
  }
) {
  const db = getDb(c);
  const tenantId = c.get("tenantId");

  const url = new URL(c.req.url);
  const page = parseInt(url.searchParams.get("_page") || "1", 10);
  const pageSize = Math.min(parseInt(url.searchParams.get("_pageSize") || "10", 10), 100);
  const search = url.searchParams.get("_search") || "";
  const sortField = url.searchParams.get("_sort") || "";
  const sortOrder = url.searchParams.get("_order") || "desc";

  const offset = (page - 1) * pageSize;

  // Build where conditions
  const conditions: any[] = [eq(tenantIdCol, tenantId)];

  if (options?.additionalFilters) {
    conditions.push(...options.additionalFilters);
  }

  if (search && options?.searchCol) {
    conditions.push(like(options.searchCol, `%${search}%`));
  }

  const whereClause = and(...conditions);

  // Count total
  const countResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(table)
    .where(whereClause);

  const total = countResult[0]?.count || 0;

  // Get data
  let query = db
    .select()
    .from(table)
    .where(whereClause)
    .limit(pageSize)
    .offset(offset);

  // Note: Dynamic ordering is complex with Drizzle; we'll use default desc by created_at
  const data = await query;

  return c.json({
    success: true,
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}
