// ============================================================
// KonsinyasiApp — Shared TypeScript Types
// All entity interfaces & API types
// ============================================================

import type {
  ProductSource,
  ProducerType,
  PriceType,
  DistributionChannel,
  DistributionMethod,
  ApprovalStatus,
  DistributionStatus,
  ConsignmentStatus,
  ReturnReason,
  ReturnSource,
  ReturnStatus,
  UserStatus,
  BatchStatus,
  MediaCategory,
  ResourceName,
  ActionName,
} from "../constants";

// ---- Base Entity ----
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface TenantEntity extends BaseEntity {
  tenant_id: string;
}

// ---- Tenant ----
export interface Tenant extends BaseEntity {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  npwp?: string;
}

// ---- User ----
export interface User extends TenantEntity {
  name: string;
  email: string;
  phone?: string;
  status: UserStatus;
  avatar_url?: string;
}

export interface UserWithRoles extends User {
  roles: Role[];
}

// ---- Role ----
export interface Role extends TenantEntity {
  name: string;
  description?: string;
  is_system: boolean; // true = default role (owner/admin/sales), tidak bisa dihapus
}

// ---- User-Role Mapping ----
export interface UserRole extends BaseEntity {
  user_id: string;
  role_id: string;
}

// ---- Role Permission ----
export interface RolePermission extends BaseEntity {
  role_id: string;
  resource: ResourceName;
  action: ActionName;
  allowed: boolean;
}

// ---- Producer ----
export interface Producer extends TenantEntity {
  name: string;
  type: ProducerType;
  address?: string;
  phone?: string;
  email?: string;
  contact_person?: string;
  notes?: string;
}

// ---- Product ----
export interface Product extends TenantEntity {
  name: string;
  source: ProductSource;
  producer_id?: string;
  variation?: string;
  description?: string;
  photo_url?: string;
  is_active: boolean;
}

export interface ProductWithPrices extends Product {
  prices: ProductPrice[];
  producer?: Producer;
}

// ---- Product Price ----
export interface ProductPrice extends BaseEntity {
  product_id: string;
  price_type: PriceType;
  price: number;
}

// ---- Stock Entry (Inbound) ----
export interface StockEntry extends TenantEntity {
  product_id: string;
  producer_id?: string;
  source: ProductSource;
  production_period?: string;
  production_date: string;
  expiry_date: string;
  quantity: number;
  production_cost: number;
  notes?: string;
}

export interface StockEntryWithDetails extends StockEntry {
  product?: Product;
  producer?: Producer;
  batches?: StockBatch[];
}

// ---- Stock Batch ----
export interface StockBatch extends TenantEntity {
  stock_entry_id: string;
  product_id: string;
  production_date: string;
  expiry_date: string;
  initial_quantity: number;
  current_quantity: number;
  status: BatchStatus;
}

// ---- Distribution (Header) ----
export interface Distribution extends TenantEntity {
  channel: DistributionChannel;
  method?: DistributionMethod;
  /** ID agen/sales yang menerima */
  recipient_id: string;
  recipient_name?: string;
  status: DistributionStatus;
  total_amount: number;
  notes?: string;
}

export interface DistributionWithItems extends Distribution {
  items: DistributionItem[];
  approvals?: DistributionApproval[];
}

// ---- Distribution Item ----
export interface DistributionItem extends BaseEntity {
  distribution_id: string;
  product_id: string;
  batch_id: string;
  quantity: number;
  price: number;
  subtotal: number;
}

// ---- Distribution Approval ----
export interface DistributionApproval extends BaseEntity {
  distribution_id: string;
  user_id: string;
  status: ApprovalStatus;
  notes?: string;
}

// ---- Consignment (Header: Sales → Toko) ----
export interface Consignment extends TenantEntity {
  distribution_id?: string;
  sales_id: string;
  store_id: string;
  visit_id?: string;
  status: ConsignmentStatus;
  consignment_date: string;
  notes?: string;
}

export interface ConsignmentWithItems extends Consignment {
  items: ConsignmentItem[];
  store?: Store;
  sales?: User;
}

// ---- Consignment Item ----
export interface ConsignmentItem extends BaseEntity {
  consignment_id: string;
  product_id: string;
  batch_id: string;
  quantity_consigned: number;
  quantity_sold: number;
  quantity_returned: number;
  price: number;
}

// ---- Store ----
export interface Store extends TenantEntity {
  name: string;
  address?: string;
  owner_name?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  area?: string;
  is_active: boolean;
}

// ---- Store Visit ----
export interface StoreVisit extends TenantEntity {
  sales_id: string;
  store_id: string;
  visit_date: string;
  photo_url?: string;
  notes?: string;
}

// ---- Return (Header) ----
export interface Return extends TenantEntity {
  source: ReturnSource;
  /** ID agen/sales yang mengembalikan */
  source_id: string;
  distribution_id?: string;
  status: ReturnStatus;
  return_date: string;
  notes?: string;
}

export interface ReturnWithItems extends Return {
  items: ReturnItem[];
}

// ---- Return Item ----
export interface ReturnItem extends BaseEntity {
  return_id: string;
  product_id: string;
  batch_id?: string;
  quantity: number;
  reason: ReturnReason;
  photo_url?: string;
  notes?: string;
}

// ---- Media File ----
export interface MediaFile extends TenantEntity {
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  category: MediaCategory;
  url: string;
  entity_type?: string;
  entity_id?: string;
}

// ---- API Response Types ----
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ---- Dashboard Types ----
export interface DashboardMetrics {
  total_stock: number;
  distributed_stock: number;
  returned_stock: number;
  today_sales: number;
  expiring_soon: number;
  active_consignments: number;
}

export interface StockMovementReport {
  date: string;
  stock_in: number;
  stock_out: number;
  stock_return: number;
}

export interface SalesPerformance {
  sales_id: string;
  sales_name: string;
  total_distributed: number;
  total_sold: number;
  total_returned: number;
  sell_through_rate: number;
}
