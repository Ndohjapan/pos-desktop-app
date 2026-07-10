import axios from 'axios'
import { CanonicalBranch } from '../server/types'

// Built-in fallback used when the cloud list can't be reached at setup time
// (offline, cloud down). Keep in sync with the cloud's canonical list.
export const FALLBACK_BRANCHES: CanonicalBranch[] = [
  { branchId: 'restaurant', branchName: 'Restaurant' },
  { branchId: 'walk-in-store', branchName: 'Walk-in Store' }
]

/**
 * The list of stores to offer at first-time setup. Preferred source is the
 * cloud (so stores can be added centrally without an app update); falls back to
 * the built-in list if the cloud is unreachable.
 */
export async function getAvailableBranches(): Promise<CanonicalBranch[]> {
  try {
    const response = await axios.get(`${import.meta.env.MAIN_VITE_API_URL}/branches/available`, {
      timeout: 6000
    })
    const branches = response.data?.data
    if (Array.isArray(branches) && branches.length > 0) {
      return branches
    }
  } catch {
    // fall through to the built-in list
  }
  return FALLBACK_BRANCHES
}
