import { app } from 'electron'
import { join } from 'path'
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync } from 'fs'

export function getDbPath(): string {
  return join(app.getPath('userData'), `pos-${import.meta.env.MODE}.db`)
}

export function getBackupDir(): string {
  const dir = join(app.getPath('userData'), 'backups')
  mkdirSync(dir, { recursive: true })
  return dir
}

// A restore is staged (not applied live) to avoid touching an open DB file:
// the chosen backup path is written here, the app relaunches, and the copy is
// applied on next startup BEFORE the DB is opened.
export function getRestoreMarkerPath(): string {
  return join(app.getPath('userData'), 'pending-restore')
}

/**
 * If a restore was staged, copy the chosen backup over the live DB before it is
 * opened, and clear stale WAL/SHM sidecars so the restored data is used as-is.
 * Runs at the very top of the DB module import.
 */
export function applyPendingRestore(): void {
  const marker = getRestoreMarkerPath()
  if (!existsSync(marker)) return

  try {
    const source = readFileSync(marker, 'utf-8').trim()
    const dbPath = getDbPath()
    if (source && existsSync(source)) {
      copyFileSync(source, dbPath)
      for (const sidecar of [`${dbPath}-wal`, `${dbPath}-shm`]) {
        if (existsSync(sidecar)) rmSync(sidecar)
      }
      console.log(`Restored database from ${source}`)
    }
  } catch (error) {
    console.error('Failed to apply pending restore:', error)
  } finally {
    if (existsSync(marker)) rmSync(marker)
  }
}
