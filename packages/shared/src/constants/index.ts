// ============================================================
// KonsinyasiApp — Shared Constants
// Enums, status codes, resource names, permission actions
// ============================================================

// ---- Sumber Produk ----
export enum ProductSource {
  /** Produksi sendiri */
  OWN_PRODUCTION = "own_production",
  /** Titipan dari produsen lain */
  CONSIGNED = "consigned",
}

// ---- Jenis Produsen ----
export enum ProducerType {
  /** Unit usaha sendiri */
  INTERNAL = "internal",
  /** Produsen pihak ketiga */
  THIRD_PARTY = "third_party",
}

// ---- Tipe Harga ----
export enum PriceType {
  /** Harga produksi / HPP */
  PRODUCTION = "production",
  /** Harga khusus agen (beli putus / grosir) */
  AGENT = "agent",
  /** Harga untuk sales / konsinyasi */
  SALES = "sales",
}

// ---- Channel Distribusi ----
export enum DistributionChannel {
  /** Jalur A: Melalui Agen (Beli Putus) */
  AGENT = "agent",
  /** Jalur B: Melalui Sales (Distribusi Internal) */
  SALES = "sales",
}

// ---- Metode Distribusi Sales ----
export enum DistributionMethod {
  /** Sales mengajukan permintaan stok */
  REQUEST_BY_SALES = "request_by_sales",
  /** Admin menugaskan stok ke Sales */
  ASSIGN_BY_ADMIN = "assign_by_admin",
}

// ---- Status Approval ----
export enum ApprovalStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

// ---- Status Distribusi ----
export enum DistributionStatus {
  DRAFT = "draft",
  PENDING_APPROVAL = "pending_approval",
  APPROVED = "approved",
  REJECTED = "rejected",
  DELIVERED = "delivered",
  COMPLETED = "completed",
}

// ---- Status Konsinyasi ----
export enum ConsignmentStatus {
  /** Barang aktif di toko */
  ACTIVE = "active",
  /** Semua barang terjual */
  COMPLETED = "completed",
  /** Barang expired */
  EXPIRED = "expired",
  /** Barang ditarik kembali */
  RETURNED = "returned",
}

// ---- Alasan Retur ----
export enum ReturnReason {
  /** Rusak/cacat dari proses produksi */
  DEFECT_PRODUCTION = "defect_production",
  /** Rusak/cacat saat pengiriman */
  DEFECT_SHIPPING = "defect_shipping",
  /** Barang sudah kadaluarsa */
  EXPIRED = "expired",
  /** Barang tidak terjual (khusus Sales/Toko) */
  UNSOLD = "unsold",
}

// ---- Sumber Retur ----
export enum ReturnSource {
  AGENT = "agent",
  SALES = "sales",
  STORE = "store",
}

// ---- Status Retur ----
export enum ReturnStatus {
  /** Retur diajukan */
  SUBMITTED = "submitted",
  /** Retur diverifikasi Admin */
  VERIFIED = "verified",
  /** Retur selesai diproses (barang masuk stok retur / barang pengganti dikirim) */
  PROCESSED = "processed",
  REJECTED = "rejected",
}

// ---- Default Role Names ----
export enum DefaultRole {
  OWNER = "owner",
  ADMIN = "admin",
  SALES = "sales",
}

// ---- Resource Names (untuk RBAC) ----
export const RESOURCES = {
  DASHBOARD: "dashboard",
  PRODUCERS: "producers",
  PRODUCTS: "products",
  SALES_TEAM: "sales_team",
  STORES: "stores",
  STOCK_ENTRIES: "stock_entries",
  WAREHOUSE: "warehouse",
  DISTRIBUTION_AGENT: "distribution_agent",
  DISTRIBUTION_SALES: "distribution_sales",
  CONSIGNMENTS: "consignments",
  RETURN_AGENT: "return_agent",
  RETURN_SALES: "return_sales",
  REPORTS: "reports",
  SETTINGS_COMPANY: "settings_company",
  SETTINGS_USERS: "settings_users",
  SETTINGS_ROLES: "settings_roles",
} as const;

export type ResourceName = (typeof RESOURCES)[keyof typeof RESOURCES];

// ---- Permission Actions ----
export const ACTIONS = {
  LIST: "list",
  SHOW: "show",
  CREATE: "create",
  EDIT: "edit",
  DELETE: "delete",
  APPROVE: "approve",
  EXPORT: "export",
} as const;

export type ActionName = (typeof ACTIONS)[keyof typeof ACTIONS];

// ---- User Status ----
export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
}

// ---- Stock Batch Status ----
export enum BatchStatus {
  AVAILABLE = "available",
  LOW_STOCK = "low_stock",
  OUT_OF_STOCK = "out_of_stock",
  EXPIRED = "expired",
}

// ---- Media File Category ----
export enum MediaCategory {
  PRODUCT_PHOTO = "product_photo",
  VISIT_PROOF = "visit_proof",
  RETURN_PROOF = "return_proof",
  COMPANY_LOGO = "company_logo",
  OTHER = "other",
}
