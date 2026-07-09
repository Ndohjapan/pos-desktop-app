import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ConnectionState {
  mainSystemIP: string
  port: number
  host: string
  type: string
  // The Main machine's own LAN IP, shown on screen so other tills can be
  // pointed at it (or type it manually if discovery fails).
  hostIp: string
  setConnectionDetails: (ip: string, port: number, host: string, type: string) => void
  setHostIp: (ip: string) => void
  clearConnectionDetails: () => void
}
export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set) => ({
      mainSystemIP: '',
      port: 0,
      host: '',
      type: '',
      hostIp: '',
      setConnectionDetails: (ip: string, port: number, host: string, type: string) =>
        set({ mainSystemIP: ip, port, host, type }),
      setHostIp: (ip: string) => set({ hostIp: ip }),
      clearConnectionDetails: () =>
        set({ mainSystemIP: '', port: 0, host: '', type: '', hostIp: '' })
    }),
    {
      name: 'connection-storage'
    }
  )
)

interface ServiceState {
  serviceName: string
  setServiceName: (name: string) => void
  clearServiceName: () => void
}

export const useServiceStore = create<ServiceState>()(
  persist(
    (set) => ({
      serviceName: '',
      setServiceName: (name: string) => set({ serviceName: name }),
      clearServiceName: () => set({ serviceName: '' })
    }),
    {
      name: 'service-storage'
    }
  )
)

interface SectionState {
  sectionName: string
  setSectionName: (name: string) => void
  clearSectionName: () => void
}
export const useSectionStore = create<SectionState>()(
  persist(
    (set) => ({
      sectionName: 'User',
      setSectionName: (name: string = 'User') => set({ sectionName: name }),
      clearSectionName: () => set({ sectionName: '' })
    }),
    {
      name: 'section-storage'
    }
  )
)
