import { join } from 'path'
import { existsSync, readdirSync, rmSync, statSync, writeFileSync } from 'fs'
import db from '../server/database/client'
import { getBackupDir, getRestoreMarkerPath } from '../server/database/paths'

const KEEP_BACKUPS = 7 // retain the last week of daily snapshots
const DAILY_MS = 24 * 60 * 60 * 1000

let backupTimer: NodeJS.Timeout | null = null

function timestamp(): string {
  // Local time, filename-safe: YYYY-MM-DD_HH-mm-ss
  const d = new Date()
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`
}

function listBackupFiles(): string[] {
  const dir = getBackupDir()
  return readdirSync(dir)
    .filter((f) => f.startsWith('pos-') && f.endsWith('.db'))
    .sort()
    .reverse() // newest first (timestamped names sort chronologically)
}

function pruneOld(): void {
  const files = listBackupFiles()
  for (const stale of files.slice(KEEP_BACKUPS)) {
    try {
      rmSync(join(getBackupDir(), stale))
    } catch {
      // best-effort
    }
  }
}

// Uses SQLite's online backup API — a consistent copy even while the DB is open.
export async function backupNow(): Promise<string> {
  const dest = join(getBackupDir(), `pos-${timestamp()}.db`)
  await db.backup(dest)
  pruneOld()
  console.log(`Database backed up to ${dest}`)
  return dest
}

function mostRecentBackupAgeMs(): number {
  const files = listBackupFiles()
  if (files.length === 0) return Infinity
  const newest = join(getBackupDir(), files[0])
  return Date.now() - statSync(newest).mtimeMs
}

export function startScheduledBackups(): void {
  stopScheduledBackups()
  // Take one now if we haven't backed up in roughly a day (covers machines that
  // are shut down overnight and never hit the interval).
  if (mostRecentBackupAgeMs() > DAILY_MS * 0.8) {
    backupNow().catch((err) => console.error('Initial backup failed:', err))
  }
  backupTimer = setInterval(() => {
    backupNow().catch((err) => console.error('Scheduled backup failed:', err))
  }, DAILY_MS)
}

export function stopScheduledBackups(): void {
  if (backupTimer) {
    clearInterval(backupTimer)
    backupTimer = null
  }
}

export function listBackups(): { name: string; sizeKb: number; createdAt: string }[] {
  return listBackupFiles().map((name) => {
    const stat = statSync(join(getBackupDir(), name))
    return {
      name,
      sizeKb: Math.round(stat.size / 1024),
      createdAt: new Date(stat.mtimeMs).toISOString()
    }
  })
}

// Stage a restore: the chosen backup is applied on next startup (see
// applyPendingRestore) to avoid corrupting an open DB file. Caller relaunches.
export function stageRestore(name: string): { success: boolean; error?: string } {
  const source = join(getBackupDir(), name)
  if (!existsSync(source)) {
    return { success: false, error: 'Backup file not found' }
  }
  writeFileSync(getRestoreMarkerPath(), source)
  return { success: true }
}
