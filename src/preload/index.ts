import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type {
  AdminRow,
  CategoryRow,
  CreateFoodInput,
  CreateOrderInput,
  FoodWithCategoryRow,
  LoginInput,
  OrderWithDetails,
  PaginatedOrders,
  SignupInput,
  UpdateFoodInput
} from '../main/server/types'
import type { SyncStatus } from '../main/server/services/util.service'

export type { SyncStatus }

// Envelope every data IPC handler resolves with (see ipcResult in src/main/index.ts)
export interface IpcResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface DiscoveredService {
  name: string
  port: number
  host: string
  ip: string
}

export interface StartServerResult {
  success: boolean
  serviceName?: string
  port?: number
  ip?: string
  error?: string
}

export interface HealthResult {
  ok: boolean
}

export interface SearchServiceResult {
  found: boolean
  services: DiscoveredService[]
}

export type AdminWithoutPassword = Omit<AdminRow, 'password'>
export type LoginResult = AdminWithoutPassword & { token: string }

// Custom APIs for renderer
const api = {
  startServer: (): Promise<StartServerResult> => ipcRenderer.invoke('start-server'),
  stopServer: (): Promise<{ success: boolean }> => ipcRenderer.invoke('stop-server'),
  searchForService: (): Promise<SearchServiceResult> => ipcRenderer.invoke('search-service'),
  checkHealth: (host: string, port: number): Promise<HealthResult> =>
    ipcRenderer.invoke('check-health', host, port),
  getHardwareAcceleration: (): Promise<{ enabled: boolean }> =>
    ipcRenderer.invoke('get-hardware-acceleration'),
  setHardwareAcceleration: (enabled: boolean): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('set-hardware-acceleration', enabled),
  backupDatabase: (): Promise<{ success: boolean; path?: string; error?: string }> =>
    ipcRenderer.invoke('backup-database'),
  listDatabaseBackups: (): Promise<{
    success: boolean
    data?: { name: string; sizeKb: number; createdAt: string }[]
    error?: string
  }> => ipcRenderer.invoke('list-database-backups'),
  restoreDatabase: (name: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('restore-database', name),
  getFoods: (baseUrl: string): Promise<IpcResponse<FoodWithCategoryRow[]>> =>
    ipcRenderer.invoke('get-foods', baseUrl),
  createFood: (
    baseUrl: string,
    foodData: CreateFoodInput,
    authToken: string
  ): Promise<IpcResponse<FoodWithCategoryRow>> =>
    ipcRenderer.invoke('create-food', baseUrl, foodData, authToken),
  updateFood: (
    baseUrl: string,
    foodId: number,
    foodData: UpdateFoodInput,
    authToken: string
  ): Promise<IpcResponse<unknown>> =>
    ipcRenderer.invoke('update-food', baseUrl, foodId, foodData, authToken),
  deleteFood: (baseUrl: string, foodId: number, authToken: string): Promise<IpcResponse<unknown>> =>
    ipcRenderer.invoke('delete-food', baseUrl, foodId, authToken),
  getCategories: (baseUrl: string): Promise<IpcResponse<CategoryRow[]>> =>
    ipcRenderer.invoke('get-categories', baseUrl),
  createCategory: (
    baseUrl: string,
    categoryData: { name: string },
    authToken: string
  ): Promise<IpcResponse<CategoryRow>> =>
    ipcRenderer.invoke('create-categories', baseUrl, categoryData, authToken),
  createOrder: (
    baseUrl: string,
    orderData: CreateOrderInput
  ): Promise<IpcResponse<OrderWithDetails>> =>
    ipcRenderer.invoke('create-order', baseUrl, orderData),
  deleteOrder: (
    baseUrl: string,
    orderId: number,
    authToken: string
  ): Promise<IpcResponse<unknown>> =>
    ipcRenderer.invoke('delete-order', baseUrl, orderId, authToken),
  printReceipt: (orderData: OrderWithDetails): Promise<{ success: boolean; message?: string }> =>
    ipcRenderer.invoke('print-receipt', orderData),
  getOrdersByDate: (
    baseUrl: string,
    page: number,
    limit: number,
    date: string
  ): Promise<IpcResponse<PaginatedOrders>> =>
    ipcRenderer.invoke('get-orders-by-date', baseUrl, page, limit, date),
  searchOrdersByDate: (
    baseUrl: string,
    page: number,
    limit: number,
    date: string,
    searchQuery: string
  ): Promise<IpcResponse<PaginatedOrders>> =>
    ipcRenderer.invoke('search-orders-by-date', baseUrl, page, limit, date, searchQuery),
  signup: (baseUrl: string, adminData: SignupInput): Promise<IpcResponse<AdminWithoutPassword>> =>
    ipcRenderer.invoke('signup', baseUrl, adminData),
  login: (baseUrl: string, credentials: LoginInput): Promise<IpcResponse<LoginResult>> =>
    ipcRenderer.invoke('login', baseUrl, credentials),
  logout: (baseUrl: string, token: string): Promise<IpcResponse<{ success: boolean }>> =>
    ipcRenderer.invoke('logout', baseUrl, token),
  listAdmins: (
    baseUrl: string,
    token: string
  ): Promise<IpcResponse<{ data: AdminWithoutPassword[] }>> =>
    ipcRenderer.invoke('list-admins', baseUrl, token),
  verifyAdmin: (
    baseUrl: string,
    adminId: number,
    verified: boolean,
    token: string
  ): Promise<IpcResponse<{ success: boolean }>> =>
    ipcRenderer.invoke('verify-admin', baseUrl, adminId, verified, token),
  syncData: (baseUrl: string): Promise<IpcResponse<unknown>> =>
    ipcRenderer.invoke('sync-data', baseUrl),
  getSyncStatus: (baseUrl: string): Promise<IpcResponse<SyncStatus>> =>
    ipcRenderer.invoke('get-sync-status', baseUrl),
  retryFailedOrders: (baseUrl: string): Promise<IpcResponse<{ requeued: number }>> =>
    ipcRenderer.invoke('retry-failed-orders', baseUrl),
  backupOrders: (
    baseUrl: string
  ): Promise<IpcResponse<{ success: boolean; message: string; uploadedCount: number }>> =>
    ipcRenderer.invoke('backup-orders', baseUrl)
}

export type Api = typeof api

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
