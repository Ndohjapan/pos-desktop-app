//@ts-nocheck
import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { ExpressServer } from '../main/services/express-server'
import { Bonjour } from 'bonjour-service'
import { categoriesApi, foodsApi, ordersApi, utilsApi } from './client'

let expressServer: ExpressServer | null = null

const bonjourBrowser = new Bonjour()

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
      port: serverDetails.port
    }
  } catch (error) {
    return { success: false, error: error.message }
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

ipcMain.handle('search-service', () => {
  return new Promise((resolve) => {
    const discoveredServices = new Map()

    const browser = bonjourBrowser.find({ type: 'http' }, (service) => {
      discoveredServices.set(service.name, {
        name: service.name,
        port: service.port,
        host: service.host,
        ip: service.referer.address
      })
    })

    // After 10 seconds, return all discovered services
    setTimeout(() => {
      browser.stop()
      const services = Array.from(discoveredServices.values())
      resolve({
        found: services.length > 0,
        services: services
      })
    }, 10000)
  })
})

ipcMain.handle('get-foods', async (event, baseUrl) => {
  try {
    const foods = await foodsApi.getAll(baseUrl)
    return {
      success: true,
      data: foods
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('get-categories', async (event, baseUrl) => {
  try {
    const categories = await categoriesApi.getAll(baseUrl)
    return {
      success: true,
      data: categories
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('create-order', async (event, baseUrl, orderData) => {
  try {
    const order = await ordersApi.create(baseUrl, orderData)
    return {
      success: true,
      data: order
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('get-orders-by-date', async (event, baseUrl, page, limit, date) => {
  try {
    const orders = await ordersApi.getByDate(baseUrl, page, limit, date)
    return {
      success: true,
      data: orders
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('backup-orders', async (event, baseUrl) => {
  try {
    const result = await utilsApi.backupOrders(baseUrl)
    return {
      success: true,
      data: result
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('sync-data', async (event, baseUrl) => {
  try {
    const result = await utilsApi.syncData(baseUrl)
    return {
      success: true,
      data: result
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
})
