import { useEffect, useState } from 'react'
import OrderListPage from '@renderer/components/OrderListPage'
import Product from '@renderer/components/Product'
import TabsPellete from '@renderer/components/TabPellete'
import SpecialOrder from './SpecialOrder'
import OrderQueue from './pos/OrderQueue'
import DailySummaryView from './pos/DailySummaryView'
import CashierLogin from './pos/CashierLogin'
import { posApi } from '@renderer/api/pos'
import { useCashierStore, useSettingsStore } from '@renderer/store/pos'

export default function Main(): JSX.Element {
  const [activeTab, setActiveTab] = useState('Menu')
  const settings = useSettingsStore((state) => state.settings)
  const setSettings = useSettingsStore((state) => state.setSettings)
  const cashier = useCashierStore((state) => state.cashier)

  // Pull store settings from the host on entry (branch, mode, printers).
  useEffect(() => {
    posApi
      .getSettings()
      .then((response) => setSettings(response.data))
      .catch(() => undefined)
  }, [setSettings])

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

  // When cashier accounts are enabled, nobody sells until someone signs in.
  const needsCashier = settings.cashiersEnabled && !cashier

  return (
    <>
      <div>
        <TabsPellete activeTab={activeTab} onTabChange={setActiveTab} />
        {renderContent()}
      </div>
      {needsCashier && <CashierLogin />}
    </>
  )
}
