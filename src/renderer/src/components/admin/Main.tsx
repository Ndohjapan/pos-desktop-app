import { useState } from 'react'
import TabsPellete from '@renderer/components/admin/TabsPellete'
import Foods from './foods/Foods'
import Orders from './order-analytics/Orders'

export default function Main(): JSX.Element {
  const [activeTab, setActiveTab] = useState('Foods')

  const renderContent = () => {
    switch (activeTab) {
      case 'Foods':
        return <Foods />
      case 'Orders Analytics':
        return <Orders />
      default:
        return <Foods />
    }
  }

  return (
    <>
      <div>
        <TabsPellete activeTab={activeTab} onTabChange={setActiveTab} />
        {renderContent()}
      </div>
    </>
  )
}
