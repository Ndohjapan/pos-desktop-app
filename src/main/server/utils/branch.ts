import { settingsRepository } from '../database/repositories/settings.repository'

/**
 * The store this machine is currently set to. Every user-facing read (menu,
 * analytics, daily summary, queue) is scoped to this, and new orders/foods are
 * stamped with it, so a machine that switches branch keeps each branch's data
 * cleanly separated.
 */
export function currentBranch(): { branchId: string; branchName: string } {
  const settings = settingsRepository.getAll()
  return { branchId: settings.branchId, branchName: settings.branchName }
}
