import { IoMdGift } from 'react-icons/io'
import { IoFastFood, IoListCircleOutline } from 'react-icons/io5'
import { FiPackage, FiBarChart2 } from 'react-icons/fi'
import { useSettingsStore } from '@renderer/store/pos'

interface TabsPelleteProps {
  activeTab: string
  onTabChange: (tabName: string) => void
}

const BASE_TABS = [
  {
    name: 'Menu',
    icon: <IoFastFood />
  },
  {
    name: 'Special Order',
    icon: <IoMdGift />
  },
  {
    name: 'Orders Analytics',
    icon: <FiPackage />
  }
]

// Quick-service mode adds the live kitchen queue and the daily summary.
const QUICK_SERVICE_TABS = [
  {
    name: 'Queue',
    icon: <IoListCircleOutline />
  },
  {
    name: 'Daily Summary',
    icon: <FiBarChart2 />
  }
]

function TabsPellete({ activeTab, onTabChange }: TabsPelleteProps): JSX.Element {
  const quickService = useSettingsStore((state) => state.settings.quickService)
  const tabs = quickService
    ? [BASE_TABS[0], QUICK_SERVICE_TABS[0], BASE_TABS[1], BASE_TABS[2], QUICK_SERVICE_TABS[1]]
    : BASE_TABS

  return (
    <div className="w-full flex justify-center px-6 pt-5">
      <div className="inline-flex items-center gap-1 rounded-full border border-line bg-surface p-1 shadow-card overflow-x-auto max-w-full">
        {tabs.map((tab, index) => {
          const active = activeTab === tab.name
          return (
            <button
              key={index}
              onClick={() => onTabChange(tab.name)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary-700 text-white shadow-sm'
                  : 'text-muted hover:text-ink hover:bg-app'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default TabsPellete
