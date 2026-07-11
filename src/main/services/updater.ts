import { app, dialog } from 'electron'
import electronUpdater from 'electron-updater'
import log from 'electron-log'
import { getErrorMessage } from '../server/utils/errors'

const { autoUpdater } = electronUpdater

const SIX_HOURS_MS = 6 * 60 * 60 * 1000

/**
 * Automatic updates via electron-updater, served from GitHub Releases (provider
 * configured in electron-builder.yml). A tagged release is built and published
 * by GitHub Actions; installed tills check on launch + every 6h, download in the
 * background, and are asked to restart when a new version is ready.
 *
 * Every step is logged to electron-log's file (userData/logs/main.log on the
 * machine — %APPDATA%/amala-oluyole-pos/logs on Windows) so OTA can be observed
 * and diagnosed in production instead of silently failing.
 */
export function initAutoUpdater(): void {
  // No-op in dev / unpackaged runs (electron-updater needs a real install).
  if (!app.isPackaged) return

  autoUpdater.logger = log
  log.transports.file.level = 'info'
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => {
    log.info('[update] checking for updates…')
  })

  autoUpdater.on('update-available', (info) => {
    log.info(`[update] available: ${info.version} (current ${app.getVersion()}) — downloading`)
  })

  autoUpdater.on('update-not-available', () => {
    log.info(`[update] none — already on the latest (${app.getVersion()})`)
  })

  autoUpdater.on('download-progress', (p) => {
    log.info(`[update] downloading ${Math.round(p.percent)}%`)
  })

  autoUpdater.on('error', (err) => {
    log.error('[update] error:', getErrorMessage(err))
  })

  autoUpdater.on('update-downloaded', async (info) => {
    log.info(`[update] downloaded ${info.version} — prompting to restart`)
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
      log.error('[update] check failed:', getErrorMessage(err))
    })
  }

  check()
  setInterval(check, SIX_HOURS_MS)
}
