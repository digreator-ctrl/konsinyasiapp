// ============================================================
// KonsinyasiApp — Generic CRUD Helper
// Reusable CRUD operations for Hono routes with Drizzle
// ============================================================

import { drizzle } from "drizzle-orm/d1";
import { eq, and, or, like, asc, desc, sql } from "drizzle-orm";
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

interface PaginatedListOptions {
  additionalFilters?: any[];
  /** Columns searched by the `_search` query param (OR-ed together). */
  searchCols?: any[];
  /** Map of sortable field name → Drizzle column. Unknown fields are ignored. */
  sortableCols?: Record<string, any>;
  /** Fallback ordering column when no valid `_sort` is provided. */
  defaultSortCol?: any;
  /** Default sort direction (defaults to "desc"). */
  defaultSortDir?: "asc" | "desc";
}

/**
 * Build a paginated list response supporting `_page`, `_pageSize`, `_search`,
 * `_sort` and `_order` query params.
 */
export async function paginatedList<T extends SQLiteTable>(
  c: Context<AppEnv>,
  table: T,
  tenantIdCol: any,
  options?: PaginatedListOptions
) {
  const db = getDb(c);
  const tenantId = c.get("tenantId");

  const url = new URL(c.req.url);
  const page = Math.max(parseInt(url.searchParams.get("_page") || "1", 10) || 1, 1);
  const pageSize = Math.min(
    Math.max(parseInt(url.searchParams.get("_pageSize") || "10", 10) || 10, 1),
    100
  );
  const search = url.searchParams.get("_search") || "";
  const sortField = url.searchParams.get("_sort") || "";
  const sortOrder = url.searchParams.get("_order") === "asc" ? "asc" : "desc";

  const offset = (page - 1) * pageSize;

  // Build where conditions
  const conditions: any[] = [eq(tenantIdCol, tenantId)];

  if (options?.additionalFilters?.length) {
    conditions.push(...options.additionalFilters);
  }

  if (search && options?.searchCols?.length) {
    const searchConditions = options.searchCols.map((col) => like(col, `%${search}%`));
    conditions.push(searchConditions.length === 1 ? searchConditions[0] : or(...searchConditions));
  }

  const whereClause = and(...conditions);

  // Count total
  const countResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(table)
    .where(whereClause);

  const total = Number(countResult[0]?.count || 0);

  // Resolve ordering column (only from an allow-list to avoid injection)
  const orderCol =
    (sortField && options?.sortableCols?.[sortField]) ||
    options?.defaultSortCol ||
    (table as any).created_at;
  const dir = sortField ? sortOrder : options?.defaultSortDir || "desc";
  const orderBy = orderCol ? (dir === "asc" ? asc(orderCol) : desc(orderCol)) : undefined;

  // Get data
  let query: any = db.select().from(table).where(whereClause).limit(pageSize).offset(offset);
  if (orderBy) {
    query = query.orderBy(orderBy);
  }

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
