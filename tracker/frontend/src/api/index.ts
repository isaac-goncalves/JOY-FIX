const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

import type { Controller, ControllerDetail, Part, MaintenanceLog, Transaction, DashboardStats, MonthlyProfit, TypeCount } from '../types';

export const api = {
  // Dashboard
  getStats: () => request<DashboardStats>('/dashboard/stats'),
  getMonthlyProfit: () => request<MonthlyProfit[]>('/dashboard/monthly-profit'),
  getControllersByType: () => request<TypeCount[]>('/dashboard/controllers-by-type'),
  getTopTypes: () => request<any[]>('/dashboard/top-types'),

  // Controllers
  getControllers: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<Controller[]>(`/controllers${qs}`);
  },
  getController: (id: number) => request<ControllerDetail>(`/controllers/${id}`),
  createController: (data: Partial<Controller>) =>
    request<Controller>('/controllers', { method: 'POST', body: JSON.stringify(data) }),
  updateController: (id: number, data: Partial<Controller>) =>
    request<Controller>(`/controllers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteController: (id: number) =>
    request<any>(`/controllers/${id}`, { method: 'DELETE' }),

  // Parts
  getParts: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<Part[]>(`/parts${qs}`);
  },
  getPart: (id: number) => request<Part>(`/parts/${id}`),
  createPart: (data: Partial<Part>) =>
    request<Part>('/parts', { method: 'POST', body: JSON.stringify(data) }),
  updatePart: (id: number, data: Partial<Part>) =>
    request<Part>(`/parts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePart: (id: number) =>
    request<any>(`/parts/${id}`, { method: 'DELETE' }),

  // Maintenance
  getMaintenanceLogs: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<MaintenanceLog[]>(`/maintenance${qs}`);
  },
  createMaintenanceLog: (data: any) =>
    request<MaintenanceLog>('/maintenance', { method: 'POST', body: JSON.stringify(data) }),
  deleteMaintenanceLog: (id: number) =>
    request<any>(`/maintenance/${id}`, { method: 'DELETE' }),

  // Transactions
  getTransactions: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<Transaction[]>(`/transactions${qs}`);
  },
  createTransaction: (data: any) =>
    request<Transaction>('/transactions', { method: 'POST', body: JSON.stringify(data) }),
  deleteTransaction: (id: number) =>
    request<any>(`/transactions/${id}`, { method: 'DELETE' }),
};
