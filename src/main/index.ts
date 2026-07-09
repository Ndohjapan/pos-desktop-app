import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { ExpressServer } from '../main/services/express-server'
import { Bonjour } from 'bonjour-service'
import { authApi, categoriesApi, foodsApi, ordersApi, utilsApi } from './client'
import { generateReceiptHTML, ReceiptOrder } from './receipt-formatting'
import { getErrorMessage } from './server/utils/errors'
import { SERVICE_APP_ID } from './services/network'
import { backupNow, listBackups, stageRestore } from './services/db-backup'
import axios from 'axios'

let expressServer: ExpressServer | null = null
let mainWindow: BrowserWindow | null = null

// Hardware-acceleration fallback for low-end / old-GPU POS machines where the
// GPU process crashes and blanks the screen. Presence of this marker file
// (toggled from the app, then relaunched) disables acceleration. Must be
// decided BEFORE app is ready.
const gpuDisabledMarker = join(app.getPath('userData'), 'gpu-disabled')
if (existsSync(gpuDisabledMarker)) {
  app.disableHardwareAcceleration()
}

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

function loadRenderer(window: BrowserWindow): void {
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
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
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Crash recovery: if the renderer/GPU process dies (a common blank-screen
  // cause on cheap POS hardware), reload instead of leaving a white window.
  let reloadAttempts = 0
  mainWindow.webContents.on('render-process-gone', (_e, details) => {
    console.error('Renderer process gone:', details.reason)
    if (details.reason === 'clean-exit') return
    if (reloadAttempts < 5 && mainWindow && !mainWindow.isDestroyed()) {
      reloadAttempts += 1
      loadRenderer(mainWindow)
    }
  })

  // Reset the reload counter once a load succeeds so future crashes get their
  // own fresh set of retry attempts.
  mainWindow.webContents.on('did-finish-load', () => {
    reloadAttempts = 0
  })

  // If the page hangs, force a reload rather than let it sit frozen.
  mainWindow.on('unresponsive', () => {
    console.error('Window unresponsive — reloading')
    if (mainWindow && !mainWindow.isDestroyed()) loadRenderer(mainWindow)
  })

  loadRenderer(mainWindow)
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

ipcMain.handle('logout', (_event, baseUrl, token) =>
  ipcResult(() => authApi.logout(baseUrl, token))
)

ipcMain.handle('list-admins', (_event, baseUrl, token) =>
  ipcResult(() => authApi.listAdmins(baseUrl, token))
)

ipcMain.handle('verify-admin', (_event, baseUrl, adminId, verified, token) =>
  ipcResult(() => authApi.verifyAdmin(baseUrl, adminId, verified, token))
)

ipcMain.handle('sync-data', (_event, baseUrl) => ipcResult(() => utilsApi.syncData(baseUrl)))

ipcMain.handle('get-sync-status', (_event, baseUrl) =>
  ipcResult(() => utilsApi.syncStatus(baseUrl))
)

ipcMain.handle('retry-failed-orders', (_event, baseUrl) =>
  ipcResult(() => utilsApi.retryFailed(baseUrl))
)

ipcMain.handle('print-receipt', async (_event, orderData: ReceiptOrder) => {
  // Hidden, self-contained print window. Previously this opened a *visible*
  // window and relied on getFocusedWindow() (which could be null right after a
  // print), leaving a stray white window on top and the UI stuck on a spinner.
  const printContentsWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  })

  // Guarantee the window is always torn down, exactly once.
  let settled = false
  const cleanup = (): void => {
    if (!printContentsWindow.isDestroyed()) printContentsWindow.destroy()
  }

  return new Promise((resolve, reject) => {
    // Hard timeout so a stalled printer driver can never hang the promise (and
    // the renderer's "Printing…" spinner) forever.
    const timeout = setTimeout(() => {
      if (settled) return
      settled = true
      cleanup()
      reject(new Error('Printing timed out'))
    }, 30000)

    const finish = (err: Error | null, message?: string): void => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      cleanup()
      if (err) reject(err)
      else resolve({ success: true, message })
    }

    const htmlContent = generateReceiptHTML(orderData)

    printContentsWindow.webContents.once('did-finish-load', () => {
      printContentsWindow.webContents.print(options, (success, failureReason) => {
        if (!success) finish(new Error(failureReason || 'Print failed'))
        else finish(null, 'Print completed successfully')
      })
    })

    printContentsWindow.webContents.once('did-fail-load', (_e, _code, desc) => {
      finish(new Error(desc || 'Failed to render receipt'))
    })

    printContentsWindow
      .loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`)
      .catch((err) => finish(err instanceof Error ? err : new Error('Failed to load receipt')))
  })
})

// Hardware-acceleration toggle for troublesome machines. Writing/removing the
// marker takes effect after a relaunch (the flag must be set before app-ready).
// --- Local database backup / restore (Main machine only) ---

ipcMain.handle('backup-database', async () => {
  try {
    const path = await backupNow()
    return { success: true, path }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
})

ipcMain.handle('list-database-backups', () => {
  try {
    return { success: true, data: listBackups() }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
})

ipcMain.handle('restore-database', (_event, name: string) => {
  const result = stageRestore(name)
  if (result.success) {
    // Apply the restore cleanly on a fresh start.
    app.relaunch()
    app.exit(0)
  }
  return result
})

ipcMain.handle('get-hardware-acceleration', () => {
  return { enabled: !existsSync(gpuDisabledMarker) }
})

ipcMain.handle('set-hardware-acceleration', (_event, enabled: boolean) => {
  try {
    if (enabled) {
      if (existsSync(gpuDisabledMarker)) rmSync(gpuDisabledMarker)
    } else {
      mkdirSync(app.getPath('userData'), { recursive: true })
      writeFileSync(gpuDisabledMarker, 'gpu-disabled')
    }
    // Relaunch so the change takes effect immediately.
    app.relaunch()
    app.exit(0)
    return { success: true }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
})
