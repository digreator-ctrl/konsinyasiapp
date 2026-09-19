// ============================================================
// KonsinyasiApp — Shared Zod Validation Schemas
// Reusable di frontend (form) dan backend (request validation)
// ============================================================

import { z } from "zod";
import {
  ProductSource,
  ProducerType,
  PriceType,
  DistributionChannel,
  DistributionMethod,
  ApprovalStatus,
  ReturnReason,
  ReturnSource,
  UserStatus,
  MediaCategory,
} from "../constants";

// ---- Helpers ----
const requiredString = (field: string) =>
  z.string().min(1, { message: `${field} wajib diisi` });

const optionalString = z.string().optional().or(z.literal(""));

const positiveNumber = (field: string) =>
  z.number().positive({ message: `${field} harus lebih dari 0` });

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}/, {
  message: "Format tanggal harus YYYY-MM-DD",
});

// ---- Auth ----
export const loginSchema = z.object({
  email: z.string().email({ message: "Email tidak valid" }),
  password: z.string().min(8, { message: "Password minimal 8 karakter" }),
});

export const registerSchema = z
  .object({
    name: requiredString("Nama"),
    email: z.string().email({ message: "Email tidak valid" }),
    password: z.string().min(8, { message: "Password minimal 8 karakter" }),
    password_confirm: z.string(),
    tenant_name: requiredString("Nama Unit Usaha"),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "Konfirmasi password tidak sama",
    path: ["password_confirm"],
  });

// ---- Tenant ----
export const tenantSchema = z.object({
  name: requiredString("Nama Usaha"),
  address: optionalString,
  phone: optionalString,
  email: z.string().email().optional().or(z.literal("")),
  npwp: optionalString,
});

// ---- User ----
export const userCreateSchema = z.object({
  name: requiredString("Nama"),
  email: z.string().email({ message: "Email tidak valid" }),
  password: z.string().min(8, { message: "Password minimal 8 karakter" }),
  phone: optionalString,
  role_ids: z.array(z.string()).min(1, { message: "Minimal 1 role harus dipilih" }),
});

export const userEditSchema = z.object({
  name: requiredString("Nama"),
  email: z.string().email({ message: "Email tidak valid" }),
  phone: optionalString,
  status: z.nativeEnum(UserStatus),
  role_ids: z.array(z.string()).min(1, { message: "Minimal 1 role harus dipilih" }),
});

// ---- Role ----
export const roleSchema = z.object({
  name: requiredString("Nama Role"),
  description: optionalString,
});

// ---- Role Permission ----
export const permissionSchema = z.object({
  resource: requiredString("Resource"),
  action: requiredString("Action"),
  allowed: z.boolean(),
});

// ---- Producer ----
export const producerSchema = z.object({
  name: requiredString("Nama Produsen"),
  type: z.nativeEnum(ProducerType),
  address: optionalString,
  phone: optionalString,
  email: z.string().email().optional().or(z.literal("")),
  contact_person: optionalString,
  notes: optionalString,
});

// ---- Product ----
export const productSchema = z.object({
  name: requiredString("Nama Produk"),
  source: z.nativeEnum(ProductSource),
  producer_id: optionalString,
  variation: optionalString,
  description: optionalString,
  is_active: z.boolean().default(true),
});

// ---- Product Price ----
export const productPriceSchema = z.object({
  price_type: z.nativeEnum(PriceType),
  price: positiveNumber("Harga"),
});

export const productWithPricesSchema = productSchema.extend({
  prices: z.array(productPriceSchema).min(1, { message: "Minimal 1 harga harus diisi" }),
});

// ---- Stock Entry (Inbound) ----
export const stockEntrySchema = z.object({
  product_id: requiredString("Produk"),
  producer_id: optionalString,
  source: z.nativeEnum(ProductSource),
  production_period: optionalString,
  production_date: dateString,
  expiry_date: dateString,
  quantity: positiveNumber("Jumlah Stok"),
  production_cost: positiveNumber("Harga Produksi"),
  notes: optionalString,
});

// ---- Store ----
export const storeSchema = z.object({
  name: requiredString("Nama Toko"),
  address: optionalString,
  owner_name: optionalString,
  phone: optionalString,
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  area: optionalString,
  is_active: z.boolean().default(true),
});

// ---- Distribution ----
export const distributionAgentSchema = z.object({
  recipient_id: requiredString("Agen"),
  items: z
    .array(
      z.object({
        product_id: requiredString("Produk"),
        batch_id: requiredString("Batch"),
        quantity: positiveNumber("Jumlah"),
      })
    )
    .min(1, { message: "Minimal 1 item" }),
  notes: optionalString,
});

export const distributionSalesSchema = z.object({
  method: z.nativeEnum(DistributionMethod),
  recipient_id: requiredString("Sales"),
  items: z
    .array(
      z.object({
        product_id: requiredString("Produk"),
        batch_id: requiredString("Batch"),
        quantity: positiveNumber("Jumlah"),
      })
    )
    .min(1, { message: "Minimal 1 item" }),
  notes: optionalString,
});

// ---- Consignment ----
export const consignmentSchema = z.object({
  store_id: requiredString("Toko"),
  items: z
    .array(
      z.object({
        product_id: requiredString("Produk"),
        batch_id: requiredString("Batch"),
        quantity_consigned: positiveNumber("Jumlah Titip"),
        price: positiveNumber("Harga"),
      })
    )
    .min(1, { message: "Minimal 1 item" }),
  notes: optionalString,
});

export const consignmentUpdateSoldSchema = z.object({
  items: z.array(
    z.object({
      consignment_item_id: requiredString("Item"),
      quantity_sold: z.number().min(0, { message: "Jumlah terjual minimal 0" }),
    })
  ),
});

// ---- Store Visit ----
export const storeVisitSchema = z.object({
  store_id: requiredString("Toko"),
  visit_date: dateString,
  notes: optionalString,
});

// ---- Return ----
export const returnSchema = z.object({
  source: z.nativeEnum(ReturnSource),
  source_id: requiredString("Sumber Retur"),
  distribution_id: optionalString,
  return_date: dateString,
  items: z
    .array(
      z.object({
        product_id: requiredString("Produk"),
        batch_id: optionalString,
        quantity: positiveNumber("Jumlah"),
        reason: z.nativeEnum(ReturnReason),
        notes: optionalString,
      })
    )
    .min(1, { message: "Minimal 1 item" }),
  notes: optionalString,
});

// ---- Approval ----
export const approvalSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  notes: optionalString,
});

// ---- Export types ----
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type TenantInput = z.infer<typeof tenantSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserEditInput = z.infer<typeof userEditSchema>;
export type RoleInput = z.infer<typeof roleSchema>;
export type ProducerInput = z.infer<typeof producerSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type ProductWithPricesInput = z.infer<typeof productWithPricesSchema>;
export type StockEntryInput = z.infer<typeof stockEntrySchema>;
export type StoreInput = z.infer<typeof storeSchema>;
export type DistributionAgentInput = z.infer<typeof distributionAgentSchema>;
export type DistributionSalesInput = z.infer<typeof distributionSalesSchema>;
export type ConsignmentInput = z.infer<typeof consignmentSchema>;
export type StoreVisitInput = z.infer<typeof storeVisitSchema>;
export type ReturnInput = z.infer<typeof returnSchema>;
export type ApprovalInput = z.infer<typeof approvalSchema>;
