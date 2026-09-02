// Central API client for PPE Backend
// Usage: import { api } from '@/lib/api'

const API_BASE = (import.meta as any).env?.VITE_API_URL || "";

type FetchOptions = RequestInit & { token?: string };

function getToken(): string | null {
  return localStorage.getItem("ppe_token");
}

export function setToken(token: string) {
  localStorage.setItem("ppe_token", token);
}
export function clearToken() {
  localStorage.removeItem("ppe_token");
}

async function request<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const token = opts.token ?? getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Request failed ${res.status}`);
  }
  // handle 204 no content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  login: (employeeCode: string, password: string) =>
    request<{ token: string; user: any }>("/api/auth/login", { method: "POST", body: JSON.stringify({ employeeCode, password }) }),
  me: (token?: string) => request<any>("/api/auth/me", { token } as any),
  register: (data: any, token?: string) =>
    request("/api/auth/register", { method: "POST", body: JSON.stringify(data), token } as any),

  // Generic CRUD helpers
  list: <T>(resource: string, params?: Record<string, any>, token?: string) => {
    const qs = params ? `?${new URLSearchParams(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString()}` : "";
    return request<{ data: T[]; meta: any }>(`/api/${resource}${qs}`, { token } as any);
  },
  get: <T>(resource: string, id: string, token?: string) => request<T>(`/api/${resource}/${id}`, { token } as any),
  create: <T>(resource: string, data: any, token?: string) =>
    request<T>(`/api/${resource}`, { method: "POST", body: JSON.stringify(data), token } as any),
  update: <T>(resource: string, id: string, data: any, token?: string) =>
    request<T>(`/api/${resource}/${id}`, { method: "PUT", body: JSON.stringify(data), token } as any),
  remove: (resource: string, id: string, token?: string) =>
    request(`/api/${resource}/${id}`, { method: "DELETE", token } as any),
  restore: <T>(resource: string, id: string, token?: string) =>
    request<T>(`/api/${resource}/${id}/restore`, { method: "POST", token } as any),

  // Stock
  stockBalances: (params?: any, token?: string) => request<{ data: any[]; meta: any }>(`/api/stock/balances${params ? `?${new URLSearchParams(params)}` : ""}`, { token } as any),
  batches: (params?: any, token?: string) => request(`/api/stock/batches${params ? `?${new URLSearchParams(params)}` : ""}`, { token } as any),
  adjustments: (params?: any, token?: string) => request(`/api/stock/adjustments${params ? `?${new URLSearchParams(params)}` : ""}`, { token } as any),
  createAdjustment: (data: any, token?: string) => request("/api/stock/adjustments", { method: "POST", body: JSON.stringify(data), token } as any),
  reviewAdjustment: (id: string, status: "approved" | "rejected", token?: string) =>
    request(`/api/stock/adjustments/${id}/review`, { method: "PATCH", body: JSON.stringify({ status }), token } as any),
  transfer: (data: any, token?: string) => request("/api/stock/transfers", { method: "POST", body: JSON.stringify(data), token } as any),
  movements: (params?: any, token?: string) => request(`/api/stock/movements${params ? `?${new URLSearchParams(params)}` : ""}`, { token } as any),

  // Opening Balances
  openingBalances: (params?: any, token?: string) => request(`/api/opening-balances${params ? `?${new URLSearchParams(params)}` : ""}`, { token } as any),
  createOpening: (data: any, token?: string) => request("/api/opening-balances", { method: "POST", body: JSON.stringify(data), token } as any),
  submitOpening: (id: string, token?: string) => request(`/api/opening-balances/${id}/submit`, { method: "PATCH", token } as any),
  approveOpening: (id: string, token?: string) => request(`/api/opening-balances/${id}/approve`, { method: "PATCH", token } as any),
  rejectOpening: (id: string, reason: string, token?: string) =>
    request(`/api/opening-balances/${id}/reject`, { method: "PATCH", body: JSON.stringify({ reason }), token } as any),

  // Issuances
  issuances: (params?: any, token?: string) => request(`/api/issuances${params ? `?${new URLSearchParams(params)}` : ""}`, { token } as any),
  createIssuance: (data: any, token?: string) => request("/api/issuances", { method: "POST", body: JSON.stringify(data), token } as any),
  returnIssuance: (id: string, data: any, token?: string) =>
    request(`/api/issuances/${id}/return`, { method: "POST", body: JSON.stringify(data), token } as any),
  myPpe: (token?: string) => request("/api/issuances/my", { token } as any),

  // Scrap
  scraps: (params?: any, token?: string) => request(`/api/scrap${params ? `?${new URLSearchParams(params)}` : ""}`, { token } as any),
  createScrap: (data: any, token?: string) => request("/api/scrap", { method: "POST", body: JSON.stringify(data), token } as any),
  reverseScrap: (id: string, reason: string, token?: string) =>
    request(`/api/scrap/${id}/reverse`, { method: "POST", body: JSON.stringify({ reason }), token } as any),

  // Others
  auditLogs: (params?: any, token?: string) => request(`/api/audit-logs${params ? `?${new URLSearchParams(params)}` : ""}`, { token } as any),
  expiry: (token?: string) => request("/api/expiry-settings", { token } as any),
  updateExpiry: (data: any, token?: string) => request("/api/expiry-settings", { method: "PUT", body: JSON.stringify(data), token } as any),
  dashboard: (token?: string) => request("/api/dashboard/stats", { token } as any),
  trash: (token?: string) => request("/api/trash", { token } as any),
  employees: (params?: any, token?: string) => request<{ data: any[]; meta: any }>(`/api/employees${params ? `?${new URLSearchParams(params)}` : ""}`, { token } as any),
  employee: (id: string, token?: string) => request<any>(`/api/employees/${id}`, { token } as any),
  employeeTimeline: (id: string, token?: string) => request<{ data: any[] }>(`/api/employees/${id}/timeline`, { token } as any),

  // File upload example (photo)
  uploadPhoto: async (ppeItemId: string, file: File, token?: string) => {
    const fd = new FormData();
    fd.append("photo", file);
    const t = token ?? getToken();
    const res = await fetch(`${API_BASE}/api/ppe-items/${ppeItemId}/photo`, {
      method: "POST",
      headers: t ? { Authorization: `Bearer ${t}` } : undefined,
      body: fd,
    });
    if (!res.ok) throw new Error((await res.json()).error || "Upload failed");
    return res.json();
  },
  // Catalog Import (PPE-007)
  importCatalog: async (file: File, mode: 'new_only' | 'new_and_update' = 'new_and_update', token?: string) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("mode", mode);
    const t = token ?? getToken();
    const res = await fetch(`${API_BASE}/api/ppe-items/import?mode=${mode}`, {
      method: "POST",
      headers: t ? { Authorization: `Bearer ${t}` } : undefined,
      body: fd,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || err.message || "Catalog import failed");
    }
    return res.json() as Promise<{
      success: boolean;
      imported: number;
      created?: number;
      updated: number;
      errors: string[];
      message?: string;
    }>;
  },
};
