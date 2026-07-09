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
    <div className="w-full mt-3 bg-white">
      {/* Desktop version */}
      <div className="hidden md:flex justify-between items-center m-auto">
        <div className="m-auto flex gap-4 justify-around">
          {tabs.map((tab, index) => (
            <div
              key={index}
              onClick={() => onTabChange(tab.name)}
              className={`flex items-center gap-2 cursor-pointer px-4 py-2 text-sm border border-[#DCDCDC] rounded-full ${activeTab === tab.name ? 'bg-primary-700 shadow-lg text-white' : 'text-secondary'}`}
            >
              {tab.icon}
              <p>{tab.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile version */}
      <div className="flex md:hidden">
        <div className="w-full flex gap-2 justify-around">
          {tabs.map((tab, index) => (
            <div
              key={index}
              onClick={() => onTabChange(tab.name)}
              className={`flex flex-col items-center gap-1 cursor-pointer px-3 py-2 border border-[#DCDCDC] rounded-lg ${activeTab === tab.name ? 'bg-primary-700 shadow-lg text-white' : 'text-secondary'}`}
            >
              {tab.icon}
              <p className="text-xs">{tab.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TabsPellete
