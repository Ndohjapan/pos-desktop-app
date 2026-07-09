import { BsCart3 } from 'react-icons/bs'
import { FiPackage, FiUsers } from 'react-icons/fi'

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
  }
]

function TabsPellete({ activeTab, onTabChange }: TabsPelleteProps) {
  return (
    <div className="w-full mt-3 bg-white">
      {/* Desktop version */}
      <div className="hidden md:flex justify-between items-center m-auto">
        <div className="w-[33%] m-auto flex gap-4 justify-around">
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
