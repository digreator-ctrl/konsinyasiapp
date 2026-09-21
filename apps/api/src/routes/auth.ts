// ============================================================
// KonsinyasiApp — Auth Routes
// Login, Register, Logout, Session management
// ============================================================

import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq, and, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import * as schema from "../db/schema";
import type { AppEnv } from "../index";
import { RESOURCES, ACTIONS, RESOURCE_ACTIONS, DefaultRole } from "@konsinyasi/shared";
import { hashPassword, verifyPassword } from "../lib/password";

const auth = new Hono<AppEnv>();

// ---- Default Permissions for system roles ----
function getDefaultPermissions(roleName: string): Array<{ resource: string; action: string }> {
  const allResources = Object.values(RESOURCES);

  if (roleName === DefaultRole.OWNER || roleName === DefaultRole.ADMIN) {
    // Owner & Admin: full access, terbatas pada aksi yang berlaku per resource
    return allResources.flatMap((resource) =>
      RESOURCE_ACTIONS[resource].map((action) => ({ resource, action }))
    );
  }

  if (roleName === DefaultRole.SALES) {
    // Sales: limited access
    return [
      { resource: RESOURCES.DASHBOARD, action: ACTIONS.LIST },
      { resource: RESOURCES.STORES, action: ACTIONS.LIST },
      { resource: RESOURCES.STORES, action: ACTIONS.SHOW },
      { resource: RESOURCES.STORES, action: ACTIONS.CREATE },
      { resource: RESOURCES.DISTRIBUTION_SALES, action: ACTIONS.LIST },
      { resource: RESOURCES.DISTRIBUTION_SALES, action: ACTIONS.SHOW },
      { resource: RESOURCES.DISTRIBUTION_SALES, action: ACTIONS.CREATE },
      { resource: RESOURCES.DISTRIBUTION_SALES, action: ACTIONS.APPROVE },
      { resource: RESOURCES.CONSIGNMENTS, action: ACTIONS.LIST },
      { resource: RESOURCES.CONSIGNMENTS, action: ACTIONS.SHOW },
      { resource: RESOURCES.CONSIGNMENTS, action: ACTIONS.CREATE },
      { resource: RESOURCES.CONSIGNMENTS, action: ACTIONS.EDIT },
      { resource: RESOURCES.RETURN_SALES, action: ACTIONS.LIST },
      { resource: RESOURCES.RETURN_SALES, action: ACTIONS.SHOW },
      { resource: RESOURCES.RETURN_SALES, action: ACTIONS.CREATE },
      { resource: RESOURCES.PRODUCTS, action: ACTIONS.LIST },
      { resource: RESOURCES.PRODUCTS, action: ACTIONS.SHOW },
    ];
  }

  return [];
}

// ---- POST /register ----
auth.post("/register", async (c) => {
  const body = await c.req.json();
  const { name, email, password, tenant_name } = body;

  if (!name || !email || !password || !tenant_name) {
    return c.json({ success: false, error: "Semua field wajib diisi" }, 400);
  }

  const db = drizzle(c.env.DB, { schema });

  // Check if email already exists
  const existing = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  if (existing.length > 0) {
    return c.json({ success: false, error: "Email sudah terdaftar" }, 409);
  }

  const tenantId = nanoid();
  const userId = nanoid();
  const hashedPassword = await hashPassword(password);
  const now = new Date().toISOString();

  // Create tenant
  await db.insert(schema.tenants).values({
    id: tenantId,
    name: tenant_name,
    created_at: now,
    updated_at: now,
  });

  // Create user
  await db.insert(schema.users).values({
    id: userId,
    tenant_id: tenantId,
    name,
    email,
    hashed_password: hashedPassword,
    status: "active",
    created_at: now,
    updated_at: now,
  });

  // Create default roles (Owner, Admin, Sales)
  const defaultRoles = [DefaultRole.OWNER, DefaultRole.ADMIN, DefaultRole.SALES];
  const roleIds: Record<string, string> = {};

  for (const roleName of defaultRoles) {
    const roleId = nanoid();
    roleIds[roleName] = roleId;

    await db.insert(schema.roles).values({
      id: roleId,
      tenant_id: tenantId,
      name: roleName,
      description:
        roleName === DefaultRole.OWNER
          ? "Pemilik unit usaha"
          : roleName === DefaultRole.ADMIN
            ? "Administrator operasional"
            : "Tim sales lapangan",
      is_system: true,
      created_at: now,
      updated_at: now,
    });

    // Insert default permissions for this role
    const permissions = getDefaultPermissions(roleName);
    for (const perm of permissions) {
      await db.insert(schema.rolePermissions).values({
        id: nanoid(),
        role_id: roleId,
        resource: perm.resource,
        action: perm.action,
        allowed: true,
        created_at: now,
      });
    }
  }

  // Assign Owner role to the registering user
  await db.insert(schema.userRoles).values({
    id: nanoid(),
    user_id: userId,
    role_id: roleIds[DefaultRole.OWNER],
    created_at: now,
  });

  // Create session
  const sessionToken = nanoid(64);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

  await db.insert(schema.sessions).values({
    id: nanoid(),
    user_id: userId,
    token: sessionToken,
    expires_at: expiresAt,
    ip_address: c.req.header("CF-Connecting-IP") || "",
    user_agent: c.req.header("User-Agent") || "",
    created_at: now,
    updated_at: now,
  });

  // Set cookie
  c.header(
    "Set-Cookie",
    `better-auth.session_token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`
  );

  return c.json({
    success: true,
    data: {
      user: { id: userId, name, email, tenant_id: tenantId },
      tenant: { id: tenantId, name: tenant_name },
    },
  });
});

// ---- POST /login ----
auth.post("/login", async (c) => {
  const body = await c.req.json();
  const { email, password } = body;

  if (!email || !password) {
    return c.json({ success: false, error: "Email dan password wajib diisi" }, 400);
  }

  const db = drizzle(c.env.DB, { schema });

  // Find user
  const userResult = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  if (userResult.length === 0) {
    return c.json({ success: false, error: "Email atau password salah" }, 401);
  }

  const user = userResult[0];

  if (user.status !== "active") {
    return c.json({ success: false, error: "Akun tidak aktif" }, 403);
  }

  // Verify password
  const verifyResult = await verifyPassword(password, user.hashed_password);
  if (!verifyResult.valid) {
    return c.json({ success: false, error: "Email atau password salah" }, 401);
  }

  // Transparently upgrade legacy unsalted hashes to salted PBKDF2
  if (verifyResult.needsRehash) {
    const upgraded = await hashPassword(password);
    await db
      .update(schema.users)
      .set({ hashed_password: upgraded, updated_at: new Date().toISOString() })
      .where(eq(schema.users.id, user.id));
  }

  // Get user roles
  const userRoles = await db
    .select({ roleName: schema.roles.name, roleId: schema.roles.id })
    .from(schema.userRoles)
    .innerJoin(schema.roles, eq(schema.userRoles.role_id, schema.roles.id))
    .where(eq(schema.userRoles.user_id, user.id));

  // Get tenant info
  const tenantResult = await db
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.id, user.tenant_id))
    .limit(1);

  // Create session
  const now = new Date().toISOString();
  const sessionToken = nanoid(64);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await db.insert(schema.sessions).values({
    id: nanoid(),
    user_id: user.id,
    token: sessionToken,
    expires_at: expiresAt,
    ip_address: c.req.header("CF-Connecting-IP") || "",
    user_agent: c.req.header("User-Agent") || "",
    created_at: now,
    updated_at: now,
  });

  c.header(
    "Set-Cookie",
    `better-auth.session_token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`
  );

  return c.json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tenant_id: user.tenant_id,
        avatar_url: user.avatar_url,
        roles: userRoles.map((r) => r.roleName),
      },
      tenant: tenantResult[0] || null,
    },
  });
});

// ---- POST /logout ----
auth.post("/logout", async (c) => {
  const cookieHeader = c.req.header("Cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [key, ...val] = c.trim().split("=");
      return [key, val.join("=")];
    })
  );

  const token = cookies["better-auth.session_token"];

  if (token) {
    const db = drizzle(c.env.DB, { schema });
    await db.delete(schema.sessions).where(eq(schema.sessions.token, token));
  }

  c.header(
    "Set-Cookie",
    `better-auth.session_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );

  return c.json({ success: true, message: "Berhasil logout" });
});

// ---- GET /me ----
auth.get("/me", async (c) => {
  // Extract token
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
    return c.json({ success: false, error: "Tidak terautentikasi" }, 401);
  }

  const db = drizzle(c.env.DB, { schema });
  const now = new Date().toISOString();

  const sessionResult = await db
    .select({ userId: schema.sessions.user_id })
    .from(schema.sessions)
    .where(eq(schema.sessions.token, token))
    .limit(1);

  if (sessionResult.length === 0) {
    return c.json({ success: false, error: "Sesi tidak valid" }, 401);
  }

  const userId = sessionResult[0].userId;

  const userResult = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  if (userResult.length === 0) {
    return c.json({ success: false, error: "User tidak ditemukan" }, 404);
  }

  const user = userResult[0];

  // Get roles
  const userRoles = await db
    .select({ roleName: schema.roles.name })
    .from(schema.userRoles)
    .innerJoin(schema.roles, eq(schema.userRoles.role_id, schema.roles.id))
    .where(eq(schema.userRoles.user_id, userId));

  // Get tenant
  const tenantResult = await db
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.id, user.tenant_id))
    .limit(1);

  // Get permissions
  const roleIds = await db
    .select({ roleId: schema.userRoles.role_id })
    .from(schema.userRoles)
    .where(eq(schema.userRoles.user_id, userId));

  let permissions: Array<{ resource: string; action: string }> = [];

  if (userRoles.some((r) => r.roleName === "owner")) {
    // Owner gets all valid permissions (aksi yang berlaku per resource)
    const allResources = Object.values(RESOURCES);
    permissions = allResources.flatMap((resource) =>
      RESOURCE_ACTIONS[resource].map((action) => ({ resource, action }))
    );
  } else if (roleIds.length > 0) {
    const permResult = await db
      .select({
        resource: schema.rolePermissions.resource,
        action: schema.rolePermissions.action,
      })
      .from(schema.rolePermissions)
      .where(
        and(
          inArray(
            schema.rolePermissions.role_id,
            roleIds.map((r) => r.roleId)
          ),
          eq(schema.rolePermissions.allowed, true)
        )
      );

    // Deduplicate permissions granted by multiple roles
    const seen = new Set<string>();
    permissions = permResult.filter((p) => {
      const key = `${p.resource}:${p.action}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  return c.json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        tenant_id: user.tenant_id,
        avatar_url: user.avatar_url,
        status: user.status,
        roles: userRoles.map((r) => r.roleName),
      },
      tenant: tenantResult[0] || null,
      permissions,
    },
  });
});

export { auth as authRoutes };
