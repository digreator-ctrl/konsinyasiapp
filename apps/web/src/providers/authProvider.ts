// ============================================================
// KonsinyasiApp — Auth Provider for Refine
// Integrates with Hono auth API endpoints
// ============================================================

import type { AuthProvider } from "@refinedev/core";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  tenant_id: string;
  avatar_url?: string;
  roles: string[];
}

interface AuthState {
  user: AuthUser | null;
  tenant: any | null;
  permissions: Array<{ resource: string; action: string }>;
}

let cachedAuth: AuthState | null = null;

async function fetchMe(): Promise<AuthState | null> {
  try {
    const response = await fetch("/api/auth/me", {
      credentials: "include",
    });

    if (!response.ok) {
      cachedAuth = null;
      return null;
    }

    const result = await response.json();

    if (result.success && result.data) {
      cachedAuth = {
        user: result.data.user,
        tenant: result.data.tenant,
        permissions: result.data.permissions || [],
      };
      return cachedAuth;
    }

    cachedAuth = null;
    return null;
  } catch {
    cachedAuth = null;
    return null;
  }
}

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const result = await response.json();

      if (result.success) {
        cachedAuth = null; // Force refresh
        return {
          success: true,
          redirectTo: "/",
        };
      }

      return {
        success: false,
        error: {
          name: "LoginError",
          message: result.error || "Login gagal",
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          name: "LoginError",
          message: error.message || "Terjadi kesalahan saat login",
        },
      };
    }
  },

  register: async ({ name, email, password, tenant_name }: any) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, tenant_name }),
        credentials: "include",
      });

      const result = await response.json();

      if (result.success) {
        cachedAuth = null;
        return {
          success: true,
          redirectTo: "/",
        };
      }

      return {
        success: false,
        error: {
          name: "RegisterError",
          message: result.error || "Registrasi gagal",
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          name: "RegisterError",
          message: error.message || "Terjadi kesalahan saat registrasi",
        },
      };
    }
  },

  logout: async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    cachedAuth = null;
    return {
      success: true,
      redirectTo: "/login",
    };
  },

  check: async () => {
    const auth = await fetchMe();
    if (auth?.user) {
      return { authenticated: true };
    }
    return {
      authenticated: false,
      redirectTo: "/login",
    };
  },

  getIdentity: async () => {
    if (!cachedAuth) {
      await fetchMe();
    }

    if (cachedAuth?.user) {
      return {
        id: cachedAuth.user.id,
        name: cachedAuth.user.name,
        email: cachedAuth.user.email,
        avatar: cachedAuth.user.avatar_url,
        tenant: cachedAuth.tenant,
        roles: cachedAuth.user.roles,
      };
    }

    return null;
  },

  getPermissions: async () => {
    if (!cachedAuth) {
      await fetchMe();
    }
    return cachedAuth?.permissions || [];
  },

  onError: async (error) => {
    if (error.statusCode === 401) {
      return { logout: true, redirectTo: "/login" };
    }
    return { error };
  },
};
