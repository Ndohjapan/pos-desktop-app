import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import AddCategoryModal from './AddCategoryModal'
import SelectCategoryDropDown from './SelectCategoryDropDown'
import { UploadImage } from '../../../../utils/uploadImage'
import { Category, Food } from '@renderer/types'
import { getAdminToken } from '@renderer/utils/auth'
import { useConnectionStore } from '@renderer/store/connection'
import { categoriesApi, foodsApi } from '@renderer/api/client'

const AddFoodModal = ({
  isOpen,
  onClose,
  onProductAdded,
  onCategoryAdded
}: {
  isOpen: boolean
  onClose: () => void
  onProductAdded: (food: Food) => void
  onCategoryAdded: (category: Category) => void
}) => {
  const [productName, setProductName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [category, setCategory] = useState<Category | null>(null)
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const host = useConnectionStore((state) => state.host)
  const port = useConnectionStore((state) => state.port)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const baseUrl = `http://${host}:${port}/api`
        const response = await categoriesApi.getAll(baseUrl)
        setCategories(response.data)
      } catch (error) {
        console.error('Error fetching foods:', error)
      }
    }

    fetchCategories()
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const maxSize = 0.5 * 1024 * 1024

    if (file && file.size > maxSize) {
      toast.error('File size exceeds the maximum limit of 500KB.')
      return
    }

    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === 'string') setPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImage(null)
    setPreview(null)
  }

  const handleSubmit = async () => {
    let image_url =
      'https://res.cloudinary.com/lcu-feeding/image/upload/v1738939187/amala-oluyole/foods/bpkbfmng2np4nq18tqc7.png'

    if (productName && category && price && quantity) {
      setIsLoading(true)
      try {
        if (image) {
          const response = (await UploadImage(image)) as { secure_url: string }
          image_url = response.secure_url
        }

        const foodData = {
          name: productName,
          categoryId: category.id,
          quantity: parseInt(quantity),
          price: parseInt(price),
          image: image_url
        }

        const baseUrl = `http://${host}:${port}/api`
        const food = await foodsApi.create(baseUrl, foodData, getAdminToken())

        toast.success('Food Item Created')
        onProductAdded(food.data)
        setProductName('')
        setCategory(null)
        setPrice('')
        setQuantity('')
        setImage(null)
        onClose()
      } catch (error) {
        console.error('Error adding food item:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleAddCategory = (newCategory: Category) => {
    if (newCategory && !categories.some((category) => category.id === newCategory.id)) {
      setCategories([...categories, newCategory])
      onCategoryAdded(newCategory)
      toast.success(`${newCategory.name} added successfully`)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#000000db]">
      <div className="bg-white rounded-2xl p-6 w-full md:min-w-[540px] max-w-md shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">New Item</h2>
          <button onClick={onClose}>✖</button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-medium text-xs text-secondary">Food Name</label>
              <input
                type="text"
                placeholder="Food Name"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="text-xs rounded-lg w-full px-3 py-3 border border-secondary"
              />
            </div>

            <div className="space-y-2 relative">
              <label className="font-medium text-xs text-secondary">Category</label>
              <SelectCategoryDropDown
                categories={categories}
                onSelect={setCategory}
                onAddNew={() => setIsCategoryModalOpen(true)}
              />
            </div>

            <div className="space-y-2">
              <label className="font-medium text-xs text-secondary">Price (₦)</label>
              <input
                type="number"
                placeholder="Price (₦)"
                value={price}
                required
                onChange={(e) => setPrice(e.target.value)}
                className="text-xs rounded-lg w-full px-3 py-3 border border-secondary"
              />
            </div>

            <div className="space-y-2">
              <label className="font-medium text-xs text-secondary">Quantity</label>
              <input
                type="number"
                placeholder="Quantity"
                value={quantity}
                required
                onChange={(e) => setQuantity(e.target.value)}
                className="text-xs rounded-lg w-full px-3 py-3 border border-secondary"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <label className="bg-gray-200 py-2 px-4 rounded cursor-pointer flex flex-col">
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              Add Image
              <span className="text-xs">(Max size: 500KB)</span>
            </label>
            {preview && (
              <div className="relative">
                <img src={preview} alt="Preview" width={100} height={100} className="rounded" />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full text-xs"
                >
                  ✖
                </button>
              </div>
            )}
          </div>

          <button
            className={`${
              isLoading ? 'bg-primary-500' : 'bg-primary-700'
            } w-full text-white px-4 py-4 rounded-lg font-bold text-sm`}
            disabled={isLoading}
            onClick={handleSubmit}
          >
            {isLoading ? 'Creating...' : 'Create Food'}
          </button>
        </div>
      </div>

      <AddCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onAddCategory={handleAddCategory}
      />
    </div>
  )
}

export default AddFoodModal
