// ============================================================
// KonsinyasiApp — Auth Middleware
// Validates session token and injects userId/tenantId
// ============================================================

import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { drizzle } from "drizzle-orm/d1";
import { eq, and, gt } from "drizzle-orm";
import * as schema from "../db/schema";
import type { AppEnv } from "../index";

/**
 * Authentication middleware: validates session token from cookie or Authorization header.
 * Injects userId and tenantId into context variables.
 */
export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  // Extract token from cookie or Authorization header
  const cookieHeader = c.req.header("Cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [key, ...val] = c.trim().split("=");
      return [key, val.join("=")];
    })
  );

  let token = cookies["better-auth.session_token"];

  if (!token) {
    const authHeader = c.req.header("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }

  if (!token) {
    throw new HTTPException(401, { message: "Sesi tidak valid. Silakan login kembali." });
  }

  // Validate session in D1
  const db = drizzle(c.env.DB, { schema });
  const now = new Date().toISOString();

  const sessionResult = await db
    .select({
      userId: schema.sessions.user_id,
      expiresAt: schema.sessions.expires_at,
    })
    .from(schema.sessions)
    .where(and(eq(schema.sessions.token, token), gt(schema.sessions.expires_at, now)))
    .limit(1);

  if (sessionResult.length === 0) {
    throw new HTTPException(401, { message: "Sesi telah berakhir. Silakan login kembali." });
  }

  const userId = sessionResult[0].userId;

  // Get user's tenant_id
  const userResult = await db
    .select({
      tenantId: schema.users.tenant_id,
      status: schema.users.status,
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  if (userResult.length === 0 || userResult[0].status !== "active") {
    throw new HTTPException(403, { message: "Akun tidak aktif atau tidak ditemukan." });
  }

  // Get user's roles
  const userRolesResult = await db
    .select({ roleName: schema.roles.name })
    .from(schema.userRoles)
    .innerJoin(schema.roles, eq(schema.userRoles.role_id, schema.roles.id))
    .where(eq(schema.userRoles.user_id, userId));

  // Set context variables
  c.set("userId", userId);
  c.set("tenantId", userResult[0].tenantId);
  c.set("userRoles", userRolesResult.map((r) => r.roleName));

  await next();
});
