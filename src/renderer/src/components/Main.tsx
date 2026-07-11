import { useEffect, useState } from 'react'
import OrderListPage from '@renderer/components/OrderListPage'
import Product from '@renderer/components/Product'
import TabsPellete from '@renderer/components/TabPellete'
import SpecialOrder from './SpecialOrder'
import OrderQueue from './pos/OrderQueue'
import DailySummaryView from './pos/DailySummaryView'
import CashierLogin from './pos/CashierLogin'
import BranchSetupModal from './pos/BranchSetupModal'
import { posApi } from '@renderer/api/pos'
import { useCashierStore, useSettingsStore } from '@renderer/store/pos'
import { useConnectionStore } from '@renderer/store/connection'

export default function Main(): JSX.Element {
  const [activeTab, setActiveTab] = useState('Menu')
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  // null = not yet checked; a number once we know how many cashier accounts exist.
  const [cashierAccountCount, setCashierAccountCount] = useState<number | null>(null)
  const settings = useSettingsStore((state) => state.settings)
  const setSettings = useSettingsStore((state) => state.setSettings)
  const cashier = useCashierStore((state) => state.cashier)
  const connectionType = useConnectionStore((state) => state.type)

  // Pull store settings from the host on entry (branch, mode, printers).
  useEffect(() => {
    posApi
      .getSettings()
      .then((response) => setSettings(response.data))
      .catch(() => undefined)
      .finally(() => setSettingsLoaded(true))
  }, [setSettings])

  // How many cashier accounts exist? We only force the sign-in screen when there
  // is actually someone to sign in as — enabling cashiers with zero accounts
  // would otherwise soft-lock the till (the sign-in overlay covers every way out).
  useEffect(() => {
    if (!settings.cashiersEnabled) {
      setCashierAccountCount(null)
      return
    }
    posApi
      .listCashiers()
      .then((response) => setCashierAccountCount(response.data.length))
      .catch(() => setCashierAccountCount(0))
  }, [settings.cashiersEnabled])

  const renderContent = (): JSX.Element => {
    switch (activeTab) {
      case 'Menu':
        return <Product />
      case 'Queue':
        return <OrderQueue />
      case 'Orders Analytics':
        return <OrderListPage />
      case 'Special Order':
        return <SpecialOrder />
      case 'Daily Summary':
        return <DailySummaryView />
      default:
        return <Product />
    }
  }

  // First-time setup: on the Main machine, pick this store before anything else.
  const needsBranchSetup = connectionType === 'Main' && settingsLoaded && !settings.branchConfigured
  // Require sign-in only when cashiers are enabled AND at least one account
  // exists (cashierAccountCount === 0 means none yet → don't block, no lock-out).
  const needsCashier = settings.cashiersEnabled && !cashier && cashierAccountCount !== 0

  return (
    <>
      <div>
        <TabsPellete activeTab={activeTab} onTabChange={setActiveTab} />
        {renderContent()}
      </div>
      {needsBranchSetup && <BranchSetupModal />}
      {!needsBranchSetup && needsCashier && <CashierLogin />}
    </>
  )
}
