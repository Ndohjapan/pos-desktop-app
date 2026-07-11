import { BsCart3 } from 'react-icons/bs'
import { FiPackage, FiSettings, FiUsers } from 'react-icons/fi'

interface TabsPelleteProps {
  activeTab: string
  onTabChange: (tabName: string) => void
}

const tabs = [
  {
    name: 'Foods',
    icon: <BsCart3 />
  },
  {
    name: 'Orders Analytics',
    icon: <FiPackage />
  },
  {
    name: 'Staff',
    icon: <FiUsers />
  },
  {
    name: 'Settings',
    icon: <FiSettings />
  }
]

function TabsPellete({ activeTab, onTabChange }: TabsPelleteProps) {
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
