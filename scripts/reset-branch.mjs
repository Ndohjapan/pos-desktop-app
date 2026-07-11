/**
 * Reset or switch the desktop app's branch — without opening the app or touching
 * the UI. Handy for testing (e.g. flipping between the Restaurant and the
 * Walk-in Store while the two share one dev machine).
 *
 *   npm run reset                  → clear branch config; the app shows the
 *                                    branch-setup screen again on next launch
 *   npm run reset -- restaurant    → set branch to Restaurant (no setup needed)
 *   npm run reset -- walk-in-store → set branch to Walk-in Store
 *   npm run reset:restaurant       → shortcut for the above
 *   npm run reset:walkin           → shortcut for Walk-in Store
 *
 * Works on the local dev DB (pos-development.db) and, if present, the installed
 * app's DB (pos-production.db). Requires Node >= 22.5 (uses built-in node:sqlite).
 * Always fully restart the desktop app afterwards for the change to take effect.
 */
import { DatabaseSync } from 'node:sqlite'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { existsSync } from 'node:fs'

// Keep in sync with the cloud's CANONICAL_BRANCHES list.
const CANONICAL = {
  restaurant: 'Restaurant',
  'walk-in-store': 'Walk-in Store'
}
const ALIASES = {
  walkin: 'walk-in-store',
  'walk-in': 'walk-in-store',
  walk: 'walk-in-store',
  rest: 'restaurant'
}

const APP_NAME = 'amala-oluyole-pos'

function userDataDir() {
  const home = homedir()
  if (process.platform === 'darwin') return join(home, 'Library', 'Application Support', APP_NAME)
  if (process.platform === 'win32')
    return join(process.env.APPDATA || join(home, 'AppData', 'Roaming'), APP_NAME)
  return join(process.env.XDG_CONFIG_HOME || join(home, '.config'), APP_NAME)
}

function usage() {
  console.log(`Usage:
  npm run reset                  reset — app asks for branch setup next launch
  npm run reset -- <branch>      switch directly to a branch (no setup)

Branches: ${Object.keys(CANONICAL).join(', ')}  (aliases: ${Object.keys(ALIASES).join(', ')})`)
}

const raw = (process.argv[2] || '').toLowerCase()
if (raw === '-h' || raw === '--help') {
  usage()
  process.exit(0)
}

const targetId = ALIASES[raw] || raw
const mode = !raw ? 'reset' : CANONICAL[targetId] ? 'switch' : 'invalid'

if (mode === 'invalid') {
  console.error(`✗ Unknown branch "${raw}".\n`)
  usage()
  process.exit(1)
}

const dir = userDataDir()
const dbFiles = ['pos-development.db', 'pos-production.db']
  .map((f) => join(dir, f))
  .filter(existsSync)

if (dbFiles.length === 0) {
  console.error(`✗ No database found in:\n  ${dir}\nRun the desktop app at least once first.`)
  process.exit(1)
}

function setSetting(db, key, value) {
  db.prepare(
    `INSERT INTO Settings (key, value, updatedAt) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt`
  ).run(key, String(value))
}

for (const path of dbFiles) {
  const db = new DatabaseSync(path)
  if (mode === 'reset') {
    setSetting(db, 'branchConfigured', '0')
    setSetting(db, 'branchId', 'main')
    setSetting(db, 'branchName', 'Amala Oluyole')
    console.log(`✓ Reset  ${path}`)
  } else {
    setSetting(db, 'branchId', targetId)
    setSetting(db, 'branchName', CANONICAL[targetId])
    setSetting(db, 'branchConfigured', '1')
    console.log(`✓ ${CANONICAL[targetId]}  ${path}`)
  }
  db.close()
}

console.log(
  mode === 'reset'
    ? '\nDone — restart the desktop app; it will ask you to pick a branch.'
    : `\nDone — restart the desktop app; it is now the ${CANONICAL[targetId]}.`
)
