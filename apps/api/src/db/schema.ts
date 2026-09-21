// ============================================================
// KonsinyasiApp — Database Schema (Drizzle ORM / Cloudflare D1)
// Complete schema for all 18+ tables
// ============================================================

import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Helper: Generate ISO timestamp default
const timestamp = (name: string) =>
  text(name).default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`);

const createdAt = timestamp("created_at").notNull();
const updatedAt = timestamp("updated_at").notNull();

// ============================================================
// 1. TENANTS — Unit Usaha (Multi-tenant)
// ============================================================
export const tenants = sqliteTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  province: text("province"),
  city: text("city"),
  district: text("district"),
  village: text("village"),
  email: text("email"),
  logo_url: text("logo_url"),
  npwp: text("npwp"),
  created_at: createdAt,
  updated_at: updatedAt,
});

// ============================================================
// 2. USERS — Pengguna Sistem
// ============================================================
export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    tenant_id: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    email_verified: integer("email_verified", { mode: "boolean" }).default(false),
    hashed_password: text("hashed_password").notNull(),
    phone: text("phone"),
    province: text("province"),
    city: text("city"),
    district: text("district"),
    village: text("village"),
    address: text("address"),
    gmaps_url: text("gmaps_url"),
    status: text("status").notNull().default("active"),
    avatar_url: text("avatar_url"),
    created_at: createdAt,
    updated_at: updatedAt,
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
    tenantIdx: index("users_tenant_idx").on(table.tenant_id),
  })
);

// ============================================================
// 3. SESSIONS — Better Auth Sessions
// ============================================================
export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    user_id: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expires_at: text("expires_at").notNull(),
    ip_address: text("ip_address"),
    user_agent: text("user_agent"),
    created_at: createdAt,
    updated_at: updatedAt,
  },
  (table) => ({
    tokenIdx: uniqueIndex("sessions_token_idx").on(table.token),
    userIdx: index("sessions_user_idx").on(table.user_id),
  })
);

// ============================================================
// 4. ACCOUNTS — Better Auth Accounts (for OAuth, etc.)
// ============================================================
export const accounts = sqliteTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    user_id: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    account_id: text("account_id").notNull(),
    provider_id: text("provider_id").notNull(),
    access_token: text("access_token"),
    refresh_token: text("refresh_token"),
    access_token_expires_at: text("access_token_expires_at"),
    refresh_token_expires_at: text("refresh_token_expires_at"),
    scope: text("scope"),
    id_token: text("id_token"),
    password: text("password"),
    created_at: createdAt,
    updated_at: updatedAt,
  },
  (table) => ({
    userIdx: index("accounts_user_idx").on(table.user_id),
  })
);

// ============================================================
// 5. VERIFICATIONS — Better Auth Verifications
// ============================================================
export const verifications = sqliteTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expires_at: text("expires_at").notNull(),
  created_at: createdAt,
  updated_at: updatedAt,
});

// ============================================================
// 6. ROLES — Peran Pengguna
// ============================================================
export const roles = sqliteTable(
  "roles",
  {
    id: text("id").primaryKey(),
    tenant_id: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    is_system: integer("is_system", { mode: "boolean" }).notNull().default(false),
    created_at: createdAt,
    updated_at: updatedAt,
  },
  (table) => ({
    tenantNameIdx: uniqueIndex("roles_tenant_name_idx").on(table.tenant_id, table.name),
  })
);

// ============================================================
// 7. USER_ROLES — Mapping User ↔ Role (M:N)
// ============================================================
export const userRoles = sqliteTable(
  "user_roles",
  {
    id: text("id").primaryKey(),
    user_id: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role_id: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    created_at: createdAt,
  },
  (table) => ({
    userRoleIdx: uniqueIndex("user_roles_unique_idx").on(table.user_id, table.role_id),
  })
);

// ============================================================
// 8. ROLE_PERMISSIONS — Hak Akses Granular per Resource+Action
// ============================================================
export const rolePermissions = sqliteTable(
  "role_permissions",
  {
    id: text("id").primaryKey(),
    role_id: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    resource: text("resource").notNull(),
    action: text("action").notNull(),
    allowed: integer("allowed", { mode: "boolean" }).notNull().default(true),
    created_at: createdAt,
  },
  (table) => ({
    roleResourceActionIdx: uniqueIndex("role_perm_unique_idx").on(
      table.role_id,
      table.resource,
      table.action
    ),
  })
);

// ============================================================
// 9. PRODUCERS — Data Produsen
// ============================================================
export const producers = sqliteTable(
  "producers",
  {
    id: text("id").primaryKey(),
    tenant_id: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type").notNull().default("internal"),
    address: text("address"),
    phone: text("phone"),
    email: text("email"),
    contact_person: text("contact_person"),
    notes: text("notes"),
    created_at: createdAt,
    updated_at: updatedAt,
  },
  (table) => ({
    tenantIdx: index("producers_tenant_idx").on(table.tenant_id),
  })
);

// ============================================================
// 10. PRODUCTS — Master Barang
// ============================================================
export const products = sqliteTable(
  "products",
  {
    id: text("id").primaryKey(),
    tenant_id: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    source: text("source").notNull().default("own_production"),
    producer_id: text("producer_id").references(() => producers.id, { onDelete: "set null" }),
    variation: text("variation"),
    description: text("description"),
    photo_url: text("photo_url"),
    is_active: integer("is_active", { mode: "boolean" }).notNull().default(true),
    created_at: createdAt,
    updated_at: updatedAt,
  },
  (table) => ({
    tenantIdx: index("products_tenant_idx").on(table.tenant_id),
    nameIdx: index("products_name_idx").on(table.tenant_id, table.name),
  })
);

// ============================================================
// 11. PRODUCT_PRICES — Harga Produk per Tipe
// ============================================================
export const productPrices = sqliteTable(
  "product_prices",
  {
    id: text("id").primaryKey(),
    product_id: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    price_type: text("price_type").notNull(),
    price: real("price").notNull(),
    created_at: createdAt,
    updated_at: updatedAt,
  },
  (table) => ({
    productPriceTypeIdx: uniqueIndex("product_price_type_idx").on(
      table.product_id,
      table.price_type
    ),
  })
);

// ============================================================
// 12. STOCK_ENTRIES — Record Stok Masuk (Inbound)
// ============================================================
export const stockEntries = sqliteTable(
  "stock_entries",
  {
    id: text("id").primaryKey(),
    tenant_id: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    product_id: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    producer_id: text("producer_id").references(() => producers.id, { onDelete: "set null" }),
    source: text("source").notNull(),
    production_period: text("production_period"),
    production_date: text("production_date").notNull(),
    expiry_date: text("expiry_date").notNull(),
    quantity: integer("quantity").notNull(),
    production_cost: real("production_cost").notNull(),
    notes: text("notes"),
    created_at: createdAt,
    updated_at: updatedAt,
  },
  (table) => ({
    tenantIdx: index("stock_entries_tenant_idx").on(table.tenant_id),
    productIdx: index("stock_entries_product_idx").on(table.product_id),
    dateIdx: index("stock_entries_date_idx").on(table.production_date),
  })
);

// ============================================================
// 13. STOCK_BATCHES — Batch Stok per Produksi
// ============================================================
export const stockBatches = sqliteTable(
  "stock_batches",
  {
    id: text("id").primaryKey(),
    tenant_id: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    stock_entry_id: text("stock_entry_id")
      .notNull()
      .references(() => stockEntries.id, { onDelete: "cascade" }),
    product_id: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    production_date: text("production_date").notNull(),
    expiry_date: text("expiry_date").notNull(),
    initial_quantity: integer("initial_quantity").notNull(),
    current_quantity: integer("current_quantity").notNull(),
    status: text("status").notNull().default("available"),
    created_at: createdAt,
    updated_at: updatedAt,
  },
  (table) => ({
    tenantIdx: index("stock_batches_tenant_idx").on(table.tenant_id),
    productIdx: index("stock_batches_product_idx").on(table.product_id),
    expiryIdx: index("stock_batches_expiry_idx").on(table.expiry_date),
    statusIdx: index("stock_batches_status_idx").on(table.status),
  })
);

// ============================================================
// 14. STORES — Data Toko Mitra
// ============================================================
export const stores = sqliteTable(
  "stores",
  {
    id: text("id").primaryKey(),
    tenant_id: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    address: text("address"),
    owner_name: text("owner_name"),
    phone: text("phone"),
    latitude: real("latitude"),
    longitude: real("longitude"),
    area: text("area"),
    is_active: integer("is_active", { mode: "boolean" }).notNull().default(true),
    created_at: createdAt,
    updated_at: updatedAt,
  },
  (table) => ({
    tenantIdx: index("stores_tenant_idx").on(table.tenant_id),
    areaIdx: index("stores_area_idx").on(table.area),
  })
);

// ============================================================
// 15. DISTRIBUTIONS — Header Distribusi
// ============================================================
export const distributions = sqliteTable(
  "distributions",
  {
    id: text("id").primaryKey(),
    tenant_id: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    channel: text("channel").notNull(),
    method: text("method"),
    recipient_id: text("recipient_id").notNull(),
    recipient_name: text("recipient_name"),
    status: text("status").notNull().default("draft"),
    total_amount: real("total_amount").notNull().default(0),
    notes: text("notes"),
    created_at: createdAt,
    updated_at: updatedAt,
  },
  (table) => ({
    tenantIdx: index("distributions_tenant_idx").on(table.tenant_id),
    recipientIdx: index("distributions_recipient_idx").on(table.recipient_id),
    statusIdx: index("distributions_status_idx").on(table.status),
    channelIdx: index("distributions_channel_idx").on(table.channel),
  })
);

// ============================================================
// 16. DISTRIBUTION_ITEMS — Detail Item Distribusi
// ============================================================
export const distributionItems = sqliteTable(
  "distribution_items",
  {
    id: text("id").primaryKey(),
    distribution_id: text("distribution_id")
      .notNull()
      .references(() => distributions.id, { onDelete: "cascade" }),
    product_id: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    batch_id: text("batch_id")
      .notNull()
      .references(() => stockBatches.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull(),
    price: real("price").notNull(),
    subtotal: real("subtotal").notNull(),
    created_at: createdAt,
  },
  (table) => ({
    distributionIdx: index("dist_items_distribution_idx").on(table.distribution_id),
  })
);

// ============================================================
// 17. DISTRIBUTION_APPROVALS — Log Approval
// ============================================================
export const distributionApprovals = sqliteTable(
  "distribution_approvals",
  {
    id: text("id").primaryKey(),
    distribution_id: text("distribution_id")
      .notNull()
      .references(() => distributions.id, { onDelete: "cascade" }),
    user_id: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    notes: text("notes"),
    created_at: createdAt,
  },
  (table) => ({
    distributionIdx: index("dist_approvals_distribution_idx").on(table.distribution_id),
  })
);

// ============================================================
// 18. STORE_VISITS — Log Kunjungan Sales
// ============================================================
export const storeVisits = sqliteTable(
  "store_visits",
  {
    id: text("id").primaryKey(),
    tenant_id: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    sales_id: text("sales_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    store_id: text("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    visit_date: text("visit_date").notNull(),
    photo_url: text("photo_url"),
    notes: text("notes"),
    created_at: createdAt,
    updated_at: updatedAt,
  },
  (table) => ({
    tenantIdx: index("store_visits_tenant_idx").on(table.tenant_id),
    salesIdx: index("store_visits_sales_idx").on(table.sales_id),
    storeIdx: index("store_visits_store_idx").on(table.store_id),
  })
);

// ============================================================
// 19. CONSIGNMENTS — Header Konsinyasi (Sales → Toko)
// ============================================================
export const consignments = sqliteTable(
  "consignments",
  {
    id: text("id").primaryKey(),
    tenant_id: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    distribution_id: text("distribution_id").references(() => distributions.id, {
      onDelete: "set null",
    }),
    sales_id: text("sales_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    store_id: text("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    visit_id: text("visit_id").references(() => storeVisits.id, { onDelete: "set null" }),
    status: text("status").notNull().default("active"),
    consignment_date: text("consignment_date").notNull(),
    notes: text("notes"),
    created_at: createdAt,
    updated_at: updatedAt,
  },
  (table) => ({
    tenantIdx: index("consignments_tenant_idx").on(table.tenant_id),
    salesIdx: index("consignments_sales_idx").on(table.sales_id),
    storeIdx: index("consignments_store_idx").on(table.store_id),
    statusIdx: index("consignments_status_idx").on(table.status),
  })
);

// ============================================================
// 20. CONSIGNMENT_ITEMS — Detail Item Konsinyasi
// ============================================================
export const consignmentItems = sqliteTable(
  "consignment_items",
  {
    id: text("id").primaryKey(),
    consignment_id: text("consignment_id")
      .notNull()
      .references(() => consignments.id, { onDelete: "cascade" }),
    product_id: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    batch_id: text("batch_id")
      .notNull()
      .references(() => stockBatches.id, { onDelete: "restrict" }),
    quantity_consigned: integer("quantity_consigned").notNull(),
    quantity_sold: integer("quantity_sold").notNull().default(0),
    quantity_returned: integer("quantity_returned").notNull().default(0),
    price: real("price").notNull(),
    created_at: createdAt,
    updated_at: updatedAt,
  },
  (table) => ({
    consignmentIdx: index("consignment_items_consignment_idx").on(table.consignment_id),
  })
);

// ============================================================
// 21. RETURNS — Header Retur
// ============================================================
export const returns = sqliteTable(
  "returns",
  {
    id: text("id").primaryKey(),
    tenant_id: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    source: text("source").notNull(),
    source_id: text("source_id").notNull(),
    distribution_id: text("distribution_id").references(() => distributions.id, {
      onDelete: "set null",
    }),
    status: text("status").notNull().default("submitted"),
    return_date: text("return_date").notNull(),
    notes: text("notes"),
    created_at: createdAt,
    updated_at: updatedAt,
  },
  (table) => ({
    tenantIdx: index("returns_tenant_idx").on(table.tenant_id),
    sourceIdx: index("returns_source_idx").on(table.source, table.source_id),
    statusIdx: index("returns_status_idx").on(table.status),
  })
);

// ============================================================
// 22. RETURN_ITEMS — Detail Item Retur
// ============================================================
export const returnItems = sqliteTable(
  "return_items",
  {
    id: text("id").primaryKey(),
    return_id: text("return_id")
      .notNull()
      .references(() => returns.id, { onDelete: "cascade" }),
    product_id: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    batch_id: text("batch_id").references(() => stockBatches.id, { onDelete: "set null" }),
    quantity: integer("quantity").notNull(),
    reason: text("reason").notNull(),
    photo_url: text("photo_url"),
    notes: text("notes"),
    created_at: createdAt,
  },
  (table) => ({
    returnIdx: index("return_items_return_idx").on(table.return_id),
  })
);

// ============================================================
// 23. MEDIA_FILES — Metadata File di R2
// ============================================================
export const mediaFiles = sqliteTable(
  "media_files",
  {
    id: text("id").primaryKey(),
    tenant_id: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    filename: text("filename").notNull(),
    original_name: text("original_name").notNull(),
    mime_type: text("mime_type").notNull(),
    size: integer("size").notNull(),
    category: text("category").notNull().default("other"),
    url: text("url").notNull(),
    entity_type: text("entity_type"),
    entity_id: text("entity_id"),
    created_at: createdAt,
  },
  (table) => ({
    tenantIdx: index("media_files_tenant_idx").on(table.tenant_id),
    entityIdx: index("media_files_entity_idx").on(table.entity_type, table.entity_id),
  })
);

// ============================================================
// 24. SALES_STOCKS — Stok yang Dibawa Sales (setelah distribusi)
// ============================================================
export const salesStocks = sqliteTable(
  "sales_stocks",
  {
    id: text("id").primaryKey(),
    tenant_id: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    sales_id: text("sales_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    product_id: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    batch_id: text("batch_id")
      .notNull()
      .references(() => stockBatches.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull().default(0),
    created_at: createdAt,
    updated_at: updatedAt,
  },
  (table) => ({
    salesBatchIdx: uniqueIndex("sales_stocks_sales_batch_idx").on(table.sales_id, table.batch_id),
    tenantIdx: index("sales_stocks_tenant_idx").on(table.tenant_id),
    salesIdx: index("sales_stocks_sales_idx").on(table.sales_id),
    productIdx: index("sales_stocks_product_idx").on(table.product_id),
  })
);
