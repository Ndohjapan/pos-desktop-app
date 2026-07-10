import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface BackupInfo {
  name: string
  sizeKb: number
  createdAt: string
}

/**
 * Local database backups for the Main machine. Data lives in a single SQLite
 * file; before this, the only "backup" was the cloud order push, so a dead disk
 * lost everything not yet synced. Nightly snapshots run automatically; this adds
 * manual backup + restore.
 */
function BackupsPanel(): JSX.Element {
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const result = await window.api.listDatabaseBackups()
    if (result.success && result.data) setBackups(result.data)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleBackupNow = async (): Promise<void> => {
    setBusy(true)
    const result = await window.api.backupDatabase()
    setBusy(false)
    if (result.success) {
      toast.success('Backup created')
      await load()
    } else {
      toast.error(result.error ?? 'Backup failed')
    }
  }

  const handleRestore = async (name: string): Promise<void> => {
    const confirmed = window.confirm(
      `Restore from "${name}"? This replaces the current data and restarts the app. Any orders not yet backed up may be lost.`
    )
    if (!confirmed) return
    await window.api.restoreDatabase(name)
    // App relaunches on success.
  }

  const formatDate = (iso: string): string =>
    new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })

  return (
    <div className="mt-10 border-t border-line pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-secondary">Database Backups</h2>
          <p className="text-sm text-muted">
            Automatic nightly snapshots of this device&apos;s data (last 7 kept).
          </p>
        </div>
        <button
          onClick={handleBackupNow}
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-primary-700 text-white text-sm font-bold hover:bg-primary-800 disabled:opacity-50"
        >
          {busy ? 'Backing up…' : 'Back up now'}
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {backups.map((backup) => (
          <div
            key={backup.name}
            className="flex items-center justify-between bg-app rounded-md px-4 py-2 text-sm"
          >
            <div>
              <p className="text-secondary font-medium">{formatDate(backup.createdAt)}</p>
              <p className="text-xs text-muted">
                {backup.name} · {backup.sizeKb} KB
              </p>
            </div>
            <button
              onClick={() => handleRestore(backup.name)}
              className="text-primary-700 underline text-sm hover:text-primary-900"
            >
              Restore
            </button>
          </div>
        ))}
        {backups.length === 0 && (
          <p className="text-muted text-sm">No backups yet — one runs automatically each day.</p>
        )}
      </div>
    </div>
  )
}

export default BackupsPanel
