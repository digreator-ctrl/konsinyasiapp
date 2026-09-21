// ============================================================
// KonsinyasiApp — RBAC Middleware & Assertion Helpers
// Checks role_permissions table for resource+action access
// ============================================================

import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { drizzle } from "drizzle-orm/d1";
import { eq, and, inArray } from "drizzle-orm";
import type { Context } from "hono";
import * as schema from "../db/schema";
import type { AppEnv } from "../index";

type PermissionSet = Set<string> | "owner";

/**
 * Resolve the caller's effective permission set as `resource:action` keys.
 * Returns the literal "owner" when the caller is an owner (full access).
 */
async function loadPermissionSet(c: Context<AppEnv>): Promise<PermissionSet> {
  const userId = c.get("userId");
  const userRoles = c.get("userRoles") || [];

  if (userRoles.includes("owner")) {
    return "owner";
  }

  const db = drizzle(c.env.DB, { schema });

  const userRoleRecords = await db
    .select({ roleId: schema.userRoles.role_id })
    .from(schema.userRoles)
    .where(eq(schema.userRoles.user_id, userId));

  if (userRoleRecords.length === 0) {
    throw new HTTPException(403, {
      message: "Anda tidak memiliki role. Hubungi admin.",
    });
  }

  const roleIds = userRoleRecords.map((r) => r.roleId);

  const permissions = await db
    .select({
      resource: schema.rolePermissions.resource,
      action: schema.rolePermissions.action,
    })
    .from(schema.rolePermissions)
    .where(
      and(
        inArray(schema.rolePermissions.role_id, roleIds),
        eq(schema.rolePermissions.allowed, true)
      )
    );

  return new Set(permissions.map((p) => `${p.resource}:${p.action}`));
}

function assertFromSet(set: PermissionSet, keys: string[]): void {
  if (set === "owner") return;
  if (keys.some((key) => set.has(key))) return;
  const readable = keys.map((k) => k.replace(":", " pada ")).join(", ");
  throw new HTTPException(403, {
    message: `Anda tidak memiliki akses untuk ${readable}.`,
  });
}

/** Assert the caller may perform `action` on `resource`; throws 403 otherwise. */
export async function assertPermission(
  c: Context<AppEnv>,
  resource: string,
  action: string
): Promise<void> {
  const set = await loadPermissionSet(c);
  assertFromSet(set, [`${resource}:${action}`]);
}

/** Assert the caller may perform `action` on any of `resources`; throws 403 otherwise. */
export async function assertAnyPermission(
  c: Context<AppEnv>,
  resources: string[],
  action: string
): Promise<void> {
  const set = await loadPermissionSet(c);
  assertFromSet(set, resources.map((resource) => `${resource}:${action}`));
}

/**
 * Creates an RBAC middleware that checks if the user has permission
 * for the given resource and action.
 */
export function requirePermission(resource: string, action: string) {
  return createMiddleware<AppEnv>(async (c, next) => {
    await assertPermission(c, resource, action);
    await next();
  });
}
