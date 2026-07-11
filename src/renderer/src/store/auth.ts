import { create } from 'zustand'

interface AuthState {
  adminId: string
  setAdminId: (adminId: string) => void
  clearAdminId: () => void
}
export const useAuthStore = create<AuthState>()((set) => ({
  adminId: '',
  setAdminId: (adminId: string) => set({ adminId }),
  clearAdminId: () => set({ adminId: '' })
}))
