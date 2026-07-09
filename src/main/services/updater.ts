import { app, dialog } from 'electron'
import electronUpdater from 'electron-updater'
import { getErrorMessage } from '../server/utils/errors'

const { autoUpdater } = electronUpdater

const SIX_HOURS_MS = 6 * 60 * 60 * 1000

/**
 * Automatic updates via electron-updater (generic provider configured in
 * electron-builder.yml -> springbokco.com/auto-updates). Before this, the app
 * had update config but no updater code, so every fix meant reinstalling on
 * each till by hand. Now updates download in the background and the user is
 * asked to restart when one is ready; long-running machines re-check every 6h.
 */
export function initAutoUpdater(): void {
  // No-op in dev / unpackaged runs.
  if (!app.isPackaged) return

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('error', (err) => {
    console.error('Auto-update error:', getErrorMessage(err))
  })

  autoUpdater.on('update-available', (info) => {
    console.log(`Update available: ${info.version}`)
  })

  autoUpdater.on('update-downloaded', async (info) => {
    const { response } = await dialog.showMessageBox({
      type: 'info',
      buttons: ['Restart now', 'Later'],
      defaultId: 0,
      cancelId: 1,
      title: 'Update ready',
      message: `A new version (${info.version}) is ready.`,
      detail: 'Restart to apply the update. Your data is safe and will be kept.'
    })
    if (response === 0) {
      autoUpdater.quitAndInstall()
    }
  })

  const check = (): void => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.error('Update check failed:', getErrorMessage(err))
    })
  }

  check()
  setInterval(check, SIX_HOURS_MS)
}
