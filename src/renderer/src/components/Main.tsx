'use client'

import { useState } from 'react'
import OrderListPage from '@renderer/components/OrderListPage'
import Product from '@renderer/components/Product'
import TabsPellete from '@renderer/components/TabPellete'
import SpecialOrder from './SpecialOrder'

export default function Main(): JSX.Element {
  const [activeTab, setActiveTab] = useState('Menu')

  const renderContent = () => {
    switch (activeTab) {
      case 'Menu':
        return <Product />
      case 'Orders Analytics':
        return <OrderListPage />
      case 'Special Order':
        return <SpecialOrder />
      default:
        return <Product />
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
