import toast from 'react-hot-toast'
import { useConnectionStore } from '@renderer/store/connection'
import { getAdminToken } from '@renderer/utils/auth'
import type {
  CashierPublic,
  DailySummary,
  Order,
  ParkedOrder,
  Shift,
  ShiftReport,
  StoreSettings
} from '../types'

// Typed client for the quick-service endpoints, over the generic
// server-request IPC bridge. Reads the connected host from the store so
// callers don't have to thread baseUrl everywhere.
function baseUrl(): string {
  const { host, port } = useConnectionStore.getState()
  return `http://${host}:${port}/api`
}

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  options: { auth?: boolean; silent?: boolean } = {}
): Promise<T> {
  const response = await window.api.serverRequest<T>(
    baseUrl(),
    method,
    path,
    body,
    options.auth ? getAdminToken() : undefined
  )
  if (!response.success || response.data === undefined) {
    const message = response.error || 'Request failed'
    if (!options.silent) toast.error(message)
    throw new Error(message)
  }
  return response.data
}

interface Wrapped<T> {
  data: T
}

export const posApi = {
  // --- Store settings ---
  getSettings: () => request<Wrapped<StoreSettings>>('GET', '/settings'),
  updateSettings: (partial: Partial<StoreSettings>) =>
    request<Wrapped<StoreSettings>>('PUT', '/settings', partial, { auth: true }),
  setupBranch: (branchId: string, branchName: string) =>
    request<Wrapped<StoreSettings>>('POST', '/settings/setup-branch', { branchId, branchName }),
  bootstrapStatus: () =>
    request<Wrapped<{ hasAdmins: boolean; hasOwner: boolean }>>(
      'GET',
      '/auth/bootstrap-status',
      undefined,
      { silent: true }
    ),
  changeBranch: (branchId: string, branchName: string, password: string) =>
    request<Wrapped<StoreSettings>>(
      'POST',
      '/settings/change-branch',
      { branchId, branchName, password },
      { auth: true }
    ),

  // --- Cashiers ---
  listCashiers: () => request<Wrapped<CashierPublic[]>>('GET', '/cashiers'),
  listAllCashiers: () =>
    request<Wrapped<CashierPublic[]>>('GET', '/cashiers/all', undefined, { auth: true }),
  createCashier: (data: { fullName: string; pin: string; role: 'cashier' | 'supervisor' }) =>
    request<Wrapped<CashierPublic>>('POST', '/cashiers', data, { auth: true }),
  updateCashier: (
    id: number,
    data: Partial<{
      fullName: string
      pin: string
      role: 'cashier' | 'supervisor'
      active: boolean
    }>
  ) => request<Wrapped<CashierPublic>>('PUT', `/cashiers/${id}`, data, { auth: true }),
  cashierLogin: (cashierId: number, pin: string) =>
    request<Wrapped<CashierPublic>>('POST', '/cashiers/login', { cashierId, pin }),
  verifySupervisor: (pin: string, context: string) =>
    request<Wrapped<CashierPublic>>('POST', '/cashiers/verify-supervisor', { pin, context }),

  // --- Shifts ---
  openShift: (cashierId: number, openingFloat: number) =>
    request<Wrapped<Shift>>('POST', '/shifts/open', { cashierId, openingFloat }),
  currentShift: (cashierId: number) =>
    request<Wrapped<Shift | null>>('GET', `/shifts/current/${cashierId}`),
  shiftReport: (shiftId: number) =>
    request<Wrapped<ShiftReport>>('GET', `/shifts/${shiftId}/report`),
  closeShift: (shiftId: number, countedCash: number, notes?: string) =>
    request<Wrapped<ShiftReport>>('POST', `/shifts/${shiftId}/close`, { countedCash, notes }),

  // --- Parked (held) orders ---
  listParked: () => request<Wrapped<ParkedOrder[]>>('GET', '/parked'),
  parkOrder: (data: {
    label: string
    cashierId: number | null
    cashierName: string | null
    payload: unknown
  }) => request<Wrapped<ParkedOrder>>('POST', '/parked', data),
  getParked: (id: number) => request<Wrapped<ParkedOrder>>('GET', `/parked/${id}`),
  deleteParked: (id: number) => request<{ success: boolean }>('DELETE', `/parked/${id}`),

  // --- Queue / summary / voids ---
  getQueue: () => request<Wrapped<Order[]>>('GET', '/orders/queue', undefined, { silent: true }),
  setFulfillment: (orderId: number, fulfillment: 'preparing' | 'ready' | 'served') =>
    request<Wrapped<Order>>('PATCH', `/orders/${orderId}/fulfillment`, { fulfillment }),
  getDailySummary: (date: string) =>
    request<Wrapped<DailySummary>>('GET', `/orders/summary?date=${encodeURIComponent(date)}`),
  voidOrder: (orderId: number, reason: string, supervisorPin: string, cashierName?: string) =>
    request<Wrapped<Order>>('POST', `/orders/${orderId}/void`, {
      reason,
      supervisorPin,
      cashierName
    })
}
