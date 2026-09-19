// ============================================================
// KonsinyasiApp — RBAC Middleware
// Checks role_permissions table for resource+action access
// ============================================================

import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { drizzle } from "drizzle-orm/d1";
import { eq, and, inArray } from "drizzle-orm";
import * as schema from "../db/schema";
import type { AppEnv } from "../index";

/**
 * Creates an RBAC middleware that checks if the user has permission
 * for the given resource and action.
 */
export function requirePermission(resource: string, action: string) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const userId = c.get("userId");
    const userRoles = c.get("userRoles");

    // Owner always has full access
    if (userRoles.includes("owner")) {
      await next();
      return;
    }

    const db = drizzle(c.env.DB, { schema });

    // Get role IDs for the user
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

    // Check if any of the user's roles has this permission
    const permissions = await db
      .select({ allowed: schema.rolePermissions.allowed })
      .from(schema.rolePermissions)
      .where(
        and(
          inArray(schema.rolePermissions.role_id, roleIds),
          eq(schema.rolePermissions.resource, resource),
          eq(schema.rolePermissions.action, action),
          eq(schema.rolePermissions.allowed, true)
        )
      )
      .limit(1);

    if (permissions.length === 0) {
      throw new HTTPException(403, {
        message: `Anda tidak memiliki akses untuk ${action} pada ${resource}.`,
      });
    }

    await next();
  });
}
