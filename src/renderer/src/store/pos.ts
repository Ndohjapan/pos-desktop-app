import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CashierPublic, Shift, StoreSettings } from '../types'

// Store settings as fetched from the connected host. Kept in memory (refreshed
// on connect); defaults keep the classic restaurant behaviour until loaded.
interface SettingsState {
  settings: StoreSettings
  setSettings: (settings: StoreSettings) => void
}

const DEFAULT_SETTINGS: StoreSettings = {
  branchId: 'main',
  branchName: 'Amala Oluyole',
  branchConfigured: false,
  quickService: false,
  cashiersEnabled: false,
  kitchenPrintingEnabled: false,
  kitchenPrinterName: ''
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  settings: DEFAULT_SETTINGS,
  setSettings: (settings: StoreSettings) => set({ settings })
}))

// The cashier currently signed in at THIS till (persisted so an app restart
// mid-shift doesn't lose who's on the register) and their open shift.
interface CashierSessionState {
  cashier: CashierPublic | null
  shift: Shift | null
  setCashier: (cashier: CashierPublic | null) => void
  setShift: (shift: Shift | null) => void
  clearSession: () => void
}

export const useCashierStore = create<CashierSessionState>()(
  persist(
    (set) => ({
      cashier: null,
      shift: null,
      setCashier: (cashier) => set({ cashier }),
      setShift: (shift) => set({ shift }),
      clearSession: () => set({ cashier: null, shift: null })
    }),
    { name: 'cashier-session' }
  )
)
