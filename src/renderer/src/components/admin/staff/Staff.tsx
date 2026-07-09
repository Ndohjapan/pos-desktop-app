import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { authApi } from '@renderer/api/client'
import { useConnectionStore } from '@renderer/store/connection'
import { getAdminToken } from '@renderer/utils/auth'
import type { AdminWithoutPassword } from '@renderer/types'
import BackupsPanel from './BackupsPanel'

/**
 * Owner-only staff management: approve (verify) new accounts so they can log in.
 * Enforcing the verified flag without this screen would leave new staff unable
 * to sign in at all.
 */
function Staff(): JSX.Element {
  const [admins, setAdmins] = useState<AdminWithoutPassword[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)
  const host = useConnectionStore((state) => state.host)
  const port = useConnectionStore((state) => state.port)
  const connectionType = useConnectionStore((state) => state.type)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const baseUrl = `http://${host}:${port}/api`
      const response = await authApi.listAdmins(baseUrl, getAdminToken())
      setAdmins(response.data.data)
    } catch (error) {
      console.error('Failed to load staff:', error)
    } finally {
      setLoading(false)
    }
  }, [host, port])

  useEffect(() => {
    load()
  }, [load])

  const toggleVerified = async (admin: AdminWithoutPassword): Promise<void> => {
    try {
      setBusyId(admin.id)
      const baseUrl = `http://${host}:${port}/api`
      await authApi.verifyAdmin(baseUrl, admin.id, !admin.verified, getAdminToken())
      toast.success(`${admin.fullName} ${admin.verified ? 'suspended' : 'approved'}`)
      await load()
    } catch (error) {
      console.error('Failed to update staff:', error)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="w-full 2xl:max-w-[2000px] 2xl:m-auto py-1 px-8 md:px-24 mt-7">
      <h1 className="text-xl font-bold text-secondary">Staff Accounts</h1>
      <p className="text-sm text-gray-600 mt-1">
        Approve new staff so they can log in. The owner account is always active.
      </p>

      {loading ? (
        <div className="mt-6 space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-200 animate-pulse rounded-md" />
          ))}
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          {admins.map((admin) => (
            <div
              key={admin.id}
              className="flex items-center justify-between bg-[#F6F6F6] rounded-md px-4 py-3"
            >
              <div>
                <p className="font-bold text-secondary">
                  {admin.fullName}
                  {admin.isSuperAdmin ? (
                    <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                      Owner
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-gray-500">{admin.phoneNumber}</p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-medium px-2 py-1 rounded ${admin.verified ? 'bg-[#DDFFFC] text-[#01A920]' : 'bg-[#F5E6E8] text-[#FD0002]'}`}
                >
                  {admin.verified ? 'Active' : 'Pending'}
                </span>
                {!admin.isSuperAdmin && (
                  <button
                    onClick={() => toggleVerified(admin)}
                    disabled={busyId === admin.id}
                    className={`text-sm font-bold px-3 py-1 rounded-md disabled:opacity-50 ${
                      admin.verified
                        ? 'border border-[#FD0002] text-[#FD0002]'
                        : 'bg-primary-700 text-white'
                    }`}
                  >
                    {busyId === admin.id ? '…' : admin.verified ? 'Suspend' : 'Approve'}
                  </button>
                )}
              </div>
            </div>
          ))}
          {admins.length === 0 && <p className="text-gray-500 text-sm">No staff accounts yet.</p>}
        </div>
      )}

      {/* Local database backups only make sense on the Main machine that holds
          the data (backup/restore are local to that device). */}
      {connectionType === 'Main' && <BackupsPanel />}
    </div>
  )
}

export default Staff
