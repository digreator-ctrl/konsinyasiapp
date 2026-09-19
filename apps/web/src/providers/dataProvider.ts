// ============================================================
// KonsinyasiApp — Custom Data Provider for Refine
// Maps Refine CRUD operations to Hono REST API endpoints
// ============================================================

import type { DataProvider } from "@refinedev/core";

const API_URL = "/api";

async function fetcher(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Terjadi kesalahan");
  }

  return data;
}

export const dataProvider: DataProvider = {
  getList: async ({ resource, pagination, sorters, filters, meta }) => {
    const params = new URLSearchParams();

    // Pagination
    const current = pagination?.current || 1;
    const pageSize = pagination?.pageSize || 10;
    params.set("_page", String(current));
    params.set("_pageSize", String(pageSize));

    // Sorting
    if (sorters && sorters.length > 0) {
      params.set("_sort", sorters[0].field);
      params.set("_order", sorters[0].order);
    }

    // Filters
    if (filters) {
      for (const filter of filters) {
        if ("field" in filter && filter.value !== undefined && filter.value !== null && filter.value !== "") {
          if (filter.field === "q" || filter.field === "_search") {
            params.set("_search", String(filter.value));
          } else {
            params.set(filter.field, String(filter.value));
          }
        }
      }
    }

    // Extra query params from meta
    if (meta?.query) {
      for (const [key, value] of Object.entries(meta.query)) {
        params.set(key, String(value));
      }
    }

    const url = `${API_URL}/${resource}?${params.toString()}`;
    const result = await fetcher(url);

    return {
      data: result.data || [],
      total: result.total || 0,
    };
  },

  getOne: async ({ resource, id }) => {
    const result = await fetcher(`${API_URL}/${resource}/${id}`);
    return { data: result.data };
  },

  create: async ({ resource, variables }) => {
    const result = await fetcher(`${API_URL}/${resource}`, {
      method: "POST",
      body: JSON.stringify(variables),
    });
    return { data: result.data };
  },

  update: async ({ resource, id, variables }) => {
    const result = await fetcher(`${API_URL}/${resource}/${id}`, {
      method: "PUT",
      body: JSON.stringify(variables),
    });
    return { data: result.data };
  },

  deleteOne: async ({ resource, id }) => {
    const result = await fetcher(`${API_URL}/${resource}/${id}`, {
      method: "DELETE",
    });
    return { data: result.data || { id } };
  },

  getApiUrl: () => API_URL,

  custom: async ({ url, method, payload, query, headers }) => {
    const params = query ? `?${new URLSearchParams(query as Record<string, string>).toString()}` : "";
    const fullUrl = `${API_URL}${url}${params}`;

    const result = await fetcher(fullUrl, {
      method: method?.toUpperCase() || "GET",
      body: payload ? JSON.stringify(payload) : undefined,
      headers: headers as Record<string, string>,
    });

    return { data: result.data || result };
  },
};
