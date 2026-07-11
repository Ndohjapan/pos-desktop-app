import { RxReload } from 'react-icons/rx'
import { FiSearch } from 'react-icons/fi'
import { useState, useRef, useEffect } from 'react'
import Logo from '@renderer/assets/images/logo.svg'
import CreateOrder, { CreateOrderHandle, DraftOrderGroup } from './CreateOrder'
import HeldOrdersBar from './pos/HeldOrdersBar'
import { categoriesApi, foodsApi } from '@renderer/api/client'
import { useConnectionStore, useSectionStore } from '@renderer/store/connection'
import { Food } from '@renderer/types/food'
import { Category } from '@renderer/types/category'

function Product() {
  const createOrderRef = useRef<CreateOrderHandle>(null)
  const [selectedFoods, setSelectedFoods] = useState<Record<number, Record<number, boolean>>>({})
  const [imageError, setImageError] = useState<Record<string, boolean>>({})
  const host = useConnectionStore((state) => state.host)
  const port = useConnectionStore((state) => state.port)
  const [searchTerm, setSearchTerm] = useState('')
  const setSectionName = useSectionStore((state) => state.setSectionName)

  const [activeGroupIndex, setActiveGroupIndex] = useState(0)

  const [categories, setCategories] = useState<Category[]>([])

  const [foods, setFoods] = useState<Food[]>([])

  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all')

  const [foodLoading, setFoodLoading] = useState(true)
  const [categoryLoading, setCategoryLoading] = useState(true)

  useEffect(() => {
    setSectionName('User')
  }, [])

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        setFoodLoading(true)
        const baseUrl = `http://${host}:${port}/api`
        const response = await foodsApi.getAll(baseUrl)
        setFoods(response.data)
      } catch (error) {
        console.error('Error fetching foods:', error)
      } finally {
        setFoodLoading(false)
        console.log('done')
      }
    }

    fetchFoods()
  }, [])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoryLoading(true)
        const baseUrl = `http://${host}:${port}/api`
        const response = await categoriesApi.getAll(baseUrl)
        setCategories(response.data)
      } catch (error) {
        console.error('Error fetching foods:', error)
      } finally {
        setCategoryLoading(false)
      }
    }

    fetchCategories()
  }, [])

  const refreshData = async () => {
    setFoodLoading(true)
    setCategoryLoading(true)

    const baseUrl = `http://${host}:${port}/api`

    // Fetch fresh foods data
    try {
      const foodResponse = await foodsApi.getAll(baseUrl)
      setFoods(foodResponse.data)
    } catch (error) {
      console.error('Error fetching foods:', error)
    } finally {
      setFoodLoading(false)
    }

    // Fetch fresh categories data
    try {
      const categoryResponse = await categoriesApi.getAll(baseUrl)
      setCategories(categoryResponse.data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setCategoryLoading(false)
    }
  }

  const FoodCardSkeleton = () => (
    <div className="mt-3 bg-[#F5F5F533] rounded-lg p-3 border border-line animate-pulse">
      <div className="w-full flex items-center justify-center">
        <div className="w-24 h-24 bg-gray-200 rounded-full" />
      </div>
      <div className="h-4 bg-gray-200 rounded mt-2 w-3/4 mx-auto" />
      <div className="h-4 bg-gray-200 rounded mt-1 w-1/2 mx-auto" />
      <div className="h-8 bg-gray-200 rounded-md mt-2" />
    </div>
  )

  const CategorySkeleton = () => (
    <div className="flex items-start mt-3 flex-wrap gap-3">
      <div className="h-8 w-16 bg-gray-200 rounded-md animate-pulse" />
      {[...Array(6)].map((_, index) => (
        <div key={index} className="h-8 w-24 bg-gray-200 rounded-md animate-pulse" />
      ))}
    </div>
  )

  const handleAddToOrder = (food: Food) => {
    createOrderRef.current?.addItemToGroup(food)
    setSelectedFoods((prev) => ({
      ...prev,
      [activeGroupIndex]: {
        ...(prev[activeGroupIndex] || {}),
        [food.id]: true
      }
    }))
  }
  const handleOrderUpdate = (groups: DraftOrderGroup[], groupIndex: number) => {
    setActiveGroupIndex(groupIndex)

    // Update selected foods based on current group items
    const groupItems = groups[groupIndex]?.items || []
    const groupSelections: Record<number, boolean> = {}
    groupItems.forEach((item) => {
      groupSelections[item.id] = true
    })

    setSelectedFoods((prev) => ({
      ...prev,
      [groupIndex]: groupSelections
    }))
  }

  const handleResume = (draftGroups: DraftOrderGroup[], parkedOrderId: number): void => {
    createOrderRef.current?.loadDraft(draftGroups, parkedOrderId)
    handleOrderUpdate(draftGroups, 0)
  }

  // Filtered foods based on selected category
  const filteredFoods = foods.filter(
    (food) =>
      // Category filter
      (selectedCategory === 'all' || food.categoryId === selectedCategory) &&
      // Search filter
      food.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  return (
    <>
      <HeldOrdersBar onResume={handleResume} />
      <div className="grid grid-cols-1 lg:grid-cols-12 w-full gap-6 px-6 md:px-10 pt-5 pb-8">
        {/* Product Menu */}
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h1 className="text-lg font-bold text-ink">Menu</h1>
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-base" />
                <input
                  type="search"
                  placeholder="Search menu…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-9"
                />
              </div>
              <button
                type="button"
                onClick={refreshData}
                title="Refresh"
                className="flex items-center justify-center w-11 h-11 shrink-0 rounded-control border border-line bg-white text-muted hover:bg-app hover:text-ink transition-colors"
              >
                <RxReload className="text-lg" />
              </button>
            </div>
          </div>

          {/* Category chips */}
          {categoryLoading ? (
            <CategorySkeleton />
          ) : (
            <div className="flex items-center flex-wrap gap-2">
              <button
                className={`px-4 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-primary-700 text-white border-primary-700'
                    : 'bg-white text-muted border-line hover:text-ink hover:border-primary-200'
                }`}
                onClick={() => setSelectedCategory('all')}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-primary-700 text-white border-primary-700'
                      : 'bg-white text-muted border-line hover:text-ink hover:border-primary-200'
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          )}

          {/* Food Cards Section */}
          {foodLoading ? (
            <FoodCardSkeleton />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 mt-5">
              {filteredFoods.length > 0 ? (
                filteredFoods.map((food) => {
                  const alreadyAdded = !!selectedFoods[activeGroupIndex]?.[food.id]
                  const disabled = !food.inStock || alreadyAdded
                  return (
                    <div
                      key={food.id}
                      className="card p-3 flex flex-col transition-shadow hover:shadow-elevated"
                    >
                      <div className="relative w-full aspect-video overflow-hidden flex items-center justify-center mb-2.5">
                        <img
                          src={imageError[food.id] || !food.image ? Logo : food.image}
                          alt={food.name}
                          className="max-w-full max-h-full object-contain"
                          onError={() => setImageError((prev) => ({ ...prev, [food.id]: true }))}
                        />
                        {!food.inStock && (
                          <span className="absolute top-2 left-2 pill bg-danger-50 text-danger-600">
                            Out of stock
                          </span>
                        )}
                      </div>
                      <h2 className="text-lg text-ink font-bold text-center leading-snug line-clamp-2">
                        {food.name}
                      </h2>
                      <p
                        className={`text-xl font-bold mt-1 text-center ${food.inStock ? 'text-primary-700' : 'text-muted line-through'}`}
                      >
                        ₦{food.price.toLocaleString()}
                      </p>
                      <button
                        className={`w-full mt-2 py-2 rounded-control text-sm font-semibold transition-colors ${
                          disabled
                            ? 'bg-app text-muted cursor-not-allowed'
                            : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                        }`}
                        onClick={() => !disabled && handleAddToOrder(food)}
                        disabled={disabled}
                      >
                        {alreadyAdded ? 'Added' : 'Add to order'}
                      </button>
                    </div>
                  )
                })
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-muted text-sm">No food items found</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Order Details */}
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-24">
            <CreateOrder ref={createOrderRef} onOrderUpdate={handleOrderUpdate} />
          </div>
        </div>
      </div>
    </>
  )
}

export default Product
