import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  startServer: (): Promise<void> => ipcRenderer.invoke('start-server'),
  stopServer: (): Promise<void> => ipcRenderer.invoke('stop-server'),
  searchForService: () => ipcRenderer.invoke('search-service'),
  getFoods: async (baseUrl: string) => ipcRenderer.invoke('get-foods', baseUrl),
  getCategories: async (baseUrl: string) => ipcRenderer.invoke('get-categories', baseUrl),
  createOrder: async (baseUrl: string, orderData: object) =>
    ipcRenderer.invoke('create-order', baseUrl, orderData),
  printReceipt: async (orderData: object) => ipcRenderer.invoke('print-receipt', orderData),
  getGetOrdersByDate: async (baseUrl: string, page: number, limit: number, date: string) =>
    ipcRenderer.invoke('get-orders-by-date', baseUrl, page, limit, date),
  syncData: async (baseUrl: string) => ipcRenderer.invoke('sync-data', baseUrl),
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
