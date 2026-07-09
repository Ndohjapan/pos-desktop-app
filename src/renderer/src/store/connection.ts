import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ConnectionState {
  mainSystemIP: string
  port: number
  host: string
  type: string
  setConnectionDetails: (ip: string, port: number, host: string, type: string) => void
  clearConnectionDetails: () => void
}
export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set) => ({
      mainSystemIP: '',
      port: 0,
      host: '',
      type: '',
      setConnectionDetails: (ip: string, port: number, host: string, type: string) =>
        set({ mainSystemIP: ip, port, host, type }),
      clearConnectionDetails: () => set({ mainSystemIP: '', port: 0, host: '', type: '' })
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
