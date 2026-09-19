// ============================================================
// KonsinyasiApp — Access Control Provider for Refine
// RBAC enforcement at UI level using permissions from API
// ============================================================

import type { AccessControlProvider } from "@refinedev/core";

export const accessControlProvider: AccessControlProvider = {
  can: async ({ resource, action, params }) => {
    // Fetch permissions (cached by authProvider)
    let permissions: Array<{ resource: string; action: string }> = [];

    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          permissions = result.data.permissions || [];

          // Owner has full access
          if (result.data.user?.roles?.includes("owner")) {
            return { can: true };
          }
        }
      }
    } catch {
      // If we can't check, deny
      return { can: false, reason: "Tidak dapat memverifikasi hak akses" };
    }

    if (!resource || !action) {
      return { can: true };
    }

    // Map Refine resource names to our RBAC resource names
    const resourceMap: Record<string, string> = {
      dashboard: "dashboard",
      producers: "producers",
      products: "products",
      "sales-team": "sales_team",
      stores: "stores",
      "stock-entries": "stock_entries",
      warehouse: "warehouse",
      "distributions-agent": "distribution_agent",
      "distributions-sales": "distribution_sales",
      consignments: "consignments",
      "returns-agent": "return_agent",
      "returns-sales": "return_sales",
      reports: "reports",
      "settings-company": "settings_company",
      "settings-users": "settings_users",
      "settings-roles": "settings_roles",
    };

    const mappedResource = resourceMap[resource] || resource;

    // Check if permission exists
    const hasPermission = permissions.some(
      (p) => p.resource === mappedResource && p.action === action
    );

    if (hasPermission) {
      return { can: true };
    }

    return {
      can: false,
      reason: `Anda tidak memiliki akses untuk ${action} pada ${resource}`,
    };
  },

  options: {
    buttons: {
      enableAccessControl: true,
      hideIfUnauthorized: true,
    },
  },
};
