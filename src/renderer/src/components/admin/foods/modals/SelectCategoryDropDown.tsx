import { Category } from '@renderer/types/category'
import { useState, useRef, useEffect } from 'react'

const SelectCategoryDropDown = ({
  categories,
  onSelect,
  onAddNew
}: {
  categories: Category[]
  onSelect: (category: Category) => void
  onAddNew: () => void
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <input
        type="text"
        placeholder="Search or select category"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setIsDropdownOpen(true)}
        className="text-xs rounded-lg w-full px-3 py-3 border border-secondary"
      />
      {isDropdownOpen && (
        <div className="absolute w-full bg-white shadow-md rounded-lg border mt-1 max-h-40 overflow-y-auto z-50">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((cat) => (
              <div
                key={cat.id}
                className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  onSelect(cat)
                  setSearchTerm(cat.name)
                  setIsDropdownOpen(false)
                }}
              >
                {cat.name}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-gray-500">No categories found</div>
          )}
        </div>
      )}
      <button className="text-blue-500 text-xs mt-2" onClick={onAddNew}>
        + Add New Category
      </button>
    </div>
  )
}

export default SelectCategoryDropDown
