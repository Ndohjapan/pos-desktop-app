import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { ExpressServer } from '../main/services/express-server'
import { Bonjour } from 'bonjour-service'
import { authApi, categoriesApi, foodsApi, ordersApi, utilsApi } from './client'
import { generateReceiptHTML, ReceiptOrder } from './receipt-formatting'
import { getErrorMessage } from './server/utils/errors'
import { SERVICE_APP_ID } from './services/network'
import axios from 'axios'

let expressServer: ExpressServer | null = null

const bonjourBrowser = new Bonjour()

// Wrap an IPC handler body so the renderer always gets { success, data | error }
async function ipcResult<T>(
  fn: () => Promise<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    return { success: true, data: await fn() }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

const options = {
  silent: true,
  printBackground: true,
  color: false,
  margin: {
    marginType: 'custom',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  },
  landscape: false,
  pagesPerSheet: 1,
  collate: false,
  copies: 1,
  preview: true
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    },
    icon: join(__dirname, '../../resources/icon.png')
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (expressServer) {
    expressServer.stop()
  }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

ipcMain.handle('start-server', async () => {
  try {
    expressServer = new ExpressServer()
    const serverDetails = await expressServer.start()
    return {
      success: true,
      serviceName: serverDetails.serviceName,
      port: serverDetails.port,
      ip: serverDetails.ip
    }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
})

ipcMain.handle('stop-server', () => {
  if (expressServer) {
    expressServer.stop()
    console.log('Server stopped')
    expressServer = null
  }
  return { success: true }
})

interface DiscoveredService {
  name: string
  port: number
  host: string
  ip: string
}

ipcMain.handle('search-service', () => {
  return new Promise((resolve) => {
    const discoveredServices = new Map<string, DiscoveredService>()

    const browser = bonjourBrowser.find({ type: 'http' }, (service) => {
      // Only keep services advertised by *our* app. Consumer networks are full
      // of printers/routers/NAS boxes advertising _http._tcp — selecting one of
      // those was a common cause of "connection error" reports.
      const txt = (service.txt ?? {}) as Record<string, string>
      const isOurApp = txt.app === SERVICE_APP_ID || service.name?.startsWith('Amala POS')
      if (!isOurApp) return

      // Prefer the IP the host advertised in its txt record; fall back to the
      // resolved address. We connect by IP, never the flaky .local hostname.
      const ip = txt.ip || service.referer?.address || service.addresses?.[0] || ''
      if (!ip) return

      discoveredServices.set(service.name, {
        name: service.name,
        port: service.port,
        host: service.host,
        ip
      })
    })

    // After 8 seconds, return all discovered services
    setTimeout(() => {
      browser.stop()
      const services = Array.from(discoveredServices.values())
      resolve({
        found: services.length > 0,
        services: services
      })
    }, 8000)
  })
})

// Lightweight reachability probe used by the tills' heartbeat / auto-reconnect.
// Hits the host's /health (mounted outside /api) with a short timeout.
ipcMain.handle('check-health', async (_event, host: string, port: number) => {
  try {
    const response = await axios.get(`http://${host}:${port}/health`, { timeout: 4000 })
    return { ok: response.data?.status === 'ok' }
  } catch {
    return { ok: false }
  }
})

ipcMain.handle('create-food', (_event, baseUrl, foodData, authToken) =>
  ipcResult(() => foodsApi.create(baseUrl, foodData, authToken))
)

ipcMain.handle('update-food', (_event, baseUrl, foodId, foodData, authToken) =>
  ipcResult(() => foodsApi.update(baseUrl, foodId, foodData, authToken))
)

ipcMain.handle('delete-food', (_event, baseUrl, foodId, authToken) =>
  ipcResult(() => foodsApi.delete(baseUrl, foodId, authToken))
)

ipcMain.handle('get-foods', (_event, baseUrl) => ipcResult(() => foodsApi.getAll(baseUrl)))

ipcMain.handle('get-categories', (_event, baseUrl) =>
  ipcResult(() => categoriesApi.getAll(baseUrl))
)

ipcMain.handle('create-categories', (_event, baseUrl, categoryData, authToken) =>
  ipcResult(() => categoriesApi.create(baseUrl, categoryData, authToken))
)

ipcMain.handle('create-order', (_event, baseUrl, orderData) =>
  ipcResult(() => ordersApi.create(baseUrl, orderData))
)

ipcMain.handle('delete-order', (_event, baseUrl, orderId, authToken) =>
  ipcResult(() => ordersApi.deleteById(baseUrl, orderId, authToken))
)

ipcMain.handle('get-orders-by-date', (_event, baseUrl, page, limit, date) =>
  ipcResult(() => ordersApi.getByDate(baseUrl, page, limit, date))
)

ipcMain.handle('search-orders-by-date', (_event, baseUrl, page, limit, date, searchQuery) =>
  ipcResult(() => ordersApi.search(baseUrl, page, limit, date, searchQuery))
)

ipcMain.handle('backup-orders', (_event, baseUrl) =>
  ipcResult(() => utilsApi.backupOrders(baseUrl))
)

ipcMain.handle('signup', (_event, baseUrl, adminData) =>
  ipcResult(() => authApi.signup(baseUrl, adminData))
)

ipcMain.handle('login', (_event, baseUrl, credentials) =>
  ipcResult(() => authApi.login(baseUrl, credentials))
)

ipcMain.handle('sync-data', (_event, baseUrl) => ipcResult(() => utilsApi.syncData(baseUrl)))

ipcMain.handle('print-receipt', async (_event, orderData: ReceiptOrder) => {
  const printWindow = BrowserWindow.getFocusedWindow()
  if (printWindow) {
    await printWindow.webContents.getPrintersAsync()
  }

  const printContentsWindow = new BrowserWindow({
    show: true,
    webPreferences: {
      nodeIntegration: true
    }
  })

  const htmlContent = generateReceiptHTML(orderData)

  await printContentsWindow.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`
  )

  return new Promise((resolve, reject) => {
    printContentsWindow.webContents.print(options, (success, failureReason) => {
      if (!success) {
        console.log(failureReason)
        reject(new Error(failureReason))
      } else {
        resolve({ success: true, message: 'Print completed successfully' })
      }
      printContentsWindow.close()
    })
  })
})
