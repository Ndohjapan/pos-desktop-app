import { categoriesApi } from '@renderer/api/client'
import { useConnectionStore } from '@renderer/store/connection'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Category } from '@renderer/types'
import { getAdminToken } from '@renderer/utils/auth'

const AddCategoryModal = ({
  isOpen,
  onClose,
  onAddCategory
}: {
  isOpen: boolean
  onClose: () => void
  onAddCategory: (category: Category) => void
}) => {
  const [categoryName, setCategoryName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const host = useConnectionStore((state) => state.host)
  const port = useConnectionStore((state) => state.port)

  const handleAddCategory = async () => {
    setIsLoading(true)
    if (!categoryName.trim()) {
      toast.error('Category name cannot be empty.')
      setIsLoading(false)
      return
    }

    try {
      const baseUrl = `http://${host}:${port}/api`
      const response = await categoriesApi.create(baseUrl, { name: categoryName }, getAdminToken())
      onAddCategory(response.data)
      setCategoryName('')
    } catch (error) {
      console.error('Error adding category:', error)
    } finally {
      setIsLoading(false)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="overlay">
      <div className="card w-full md:min-w-[400px] max-w-md p-6 shadow-elevated">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-ink">Add New Category</h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-muted hover:bg-app hover:text-ink text-xl"
          >
            &times;
          </button>
        </div>
        <input
          type="text"
          placeholder="Category name"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          className="input mb-4"
        />
        <button onClick={handleAddCategory} className="btn-primary w-full" disabled={isLoading}>
          {isLoading ? 'Adding…' : 'Add Category'}
        </button>
      </div>
    </div>
  )
}

export default AddCategoryModal
