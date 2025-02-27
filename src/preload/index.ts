import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  startServer: (): Promise<void> => ipcRenderer.invoke('start-server'),
  stopServer: (): Promise<void> => ipcRenderer.invoke('stop-server'),
  searchForService: () => ipcRenderer.invoke('search-service'),
  createFood: async (baseUrl: string, foodData: object, authToken: string) =>
    ipcRenderer.invoke('create-food', baseUrl, foodData, authToken),
  updateFood: async (baseUrl: string, foodId, foodData: object, authToken: string) =>
    ipcRenderer.invoke('update-food', baseUrl, foodId, foodData, authToken),
  deleteFood: async (baseUrl: string, foodId: string, authToken: string) =>
    ipcRenderer.invoke('delete-food', baseUrl, foodId, authToken),
  getFoods: async (baseUrl: string) => ipcRenderer.invoke('get-foods', baseUrl),
  getCategories: async (baseUrl: string) => ipcRenderer.invoke('get-categories', baseUrl),
  createCategory: async (baseUrl: string, categoryData: object, authToken: string) =>
    ipcRenderer.invoke('create-categories', baseUrl, categoryData, authToken),
  signup: async (baseUrl: string, adminData: object) =>
    ipcRenderer.invoke('signup', baseUrl, adminData),
  login: async (baseUrl: string, credentials: object) =>
    ipcRenderer.invoke('login', baseUrl, credentials),
  createOrder: async (baseUrl: string, orderData: object) =>
    ipcRenderer.invoke('create-order', baseUrl, orderData),
  deleteOrder: async (baseUrl: string, orderId: string | number, authToken: string) =>
    ipcRenderer.invoke('delete-order', baseUrl, orderId, authToken),
  printReceipt: async (orderData: object) => ipcRenderer.invoke('print-receipt', orderData),
  getGetOrdersByDate: async (baseUrl: string, page: number, limit: number, date: string) =>
    ipcRenderer.invoke('get-orders-by-date', baseUrl, page, limit, date),
  syncData: async (baseUrl: string) => ipcRenderer.invoke('sync-data', baseUrl),
  searchOrdersByDate: async (
    baseUrl: string,
    page: number,
    limit: number,
    date: string,
    searchQuery: string | number
  ) => ipcRenderer.invoke('search-orders-by-date', baseUrl, page, limit, date, searchQuery),
  backupOrders: async (baseUrl: string) => ipcRenderer.invoke('backup-orders', baseUrl)
}
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
