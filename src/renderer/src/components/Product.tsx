//@ts-nocheck
import { RxReload } from 'react-icons/rx'
import { useState, useRef, useEffect } from 'react'
import Logo from '@renderer/assets/images/logo.svg'
import CreateOrder from './CreateOrder'
import { categoriesApi, foodsApi } from '@renderer/api/client'
import { useConnectionStore } from '@renderer/store/connection'
import { Food } from '@renderer/types/food'
import { Category } from '@renderer/types/category'

function Product() {
  const createOrderRef = useRef(null)
  const [selectedFoods, setSelectedFoods] = useState({})
  const [imageError, setImageError] = useState<Record<string, boolean>>({})
  const host = useConnectionStore((state) => state.host)
  const port = useConnectionStore((state) => state.port)
  const [searchTerm, setSearchTerm] = useState('')

  const [activeGroupIndex, setActiveGroupIndex] = useState(0)

  const [categories, setCategories] = useState<Category[]>([])

  const [foods, setFoods] = useState<Food[]>([])

  const [selectedCategory, setSelectedCategory] = useState('all')

  const [foodLoading, setFoodLoading] = useState(true)
  const [categoryLoading, setCategoryLoading] = useState(true)

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
    <div className="mt-3 bg-[#F5F5F533] rounded-lg p-3 border border-[#DCDCDC] animate-pulse">
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
  const handleOrderUpdate = (groups, groupIndex, removedItemId) => {
    setActiveGroupIndex(groupIndex)

    // Update selected foods based on current group items
    const groupItems = groups[groupIndex]?.items || []
    const groupSelections = {}
    groupItems.forEach((item) => {
      groupSelections[item.id] = true
    })

    setSelectedFoods((prev) => ({
      ...prev,
      [groupIndex]: groupSelections
    }))
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
      <div className="md:grid md:grid-cols-12 w-full py-1 px-8 md:pl-8 mt-7">
        {/* Product Menu */}
        <div className="col-span-8 pr-4">
          <div className="flex items-center flex-col">
            <div className="flex-auto w-full">
              <h1 className="text-xl font-bold text-secondary">Menu: </h1>
              {categoryLoading ? (
                <>
                  <CategorySkeleton />
                </>
              ) : (
                <>
                  <div className="flex items-start mt-3 flex-wrap gap-3">
                    <div
                      className={`flex items-center gap-2 cursor-pointer px-4 py-2 text-xs border border-[#DCDCDC] rounded-md font-bold ${selectedCategory === 'all'
                        ? 'bg-primary-700 text-white'
                        : 'bg-[#F5F5F5] text-secondary'
                        }`}
                      onClick={() => setSelectedCategory('all')}
                    >
                      <p>All</p>
                    </div>
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className={`flex items-center gap-2 cursor-pointer px-4 py-2 text-xs border border-[#DCDCDC] rounded-md ${selectedCategory === category.id
                          ? 'bg-primary-700 text-white'
                          : 'bg-[#F5F5F5] text-secondary'
                          }`}
                        onClick={() => setSelectedCategory(category.id)}
                      >
                        <p>{category.name}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            {/* Search Bar */}
            <div className="grid grid-cols-12 gap-2 w-full mt-5">
              <input
                type="search"
                placeholder="Search menu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="col-span-9 md:col-span-10 w-full px-4 py-2 rounded-md border border-[#DCDCDC] bg-[#F5F5F5DD] placeholder-[#828080] text-[#828080] focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />

              <button
                type="button"
                onClick={refreshData}
                className="col-span-3 md:col-span-2 w-full flex items-center justify-center space-x-3 rounded-lg border border-transparent px-4 py-2 text-sm font-bold text-white shadow-sm bg-primary-700 hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 sm:w-auto"
              >
                <span>Refresh</span> <RxReload className='text-xl' />
              </button>
            </div>
          </div>

          {/* Food Cards Section */}
          {foodLoading ? (
            <>
              <FoodCardSkeleton />
            </>
          ) : (
            <>
              <div className="grid grid-cols-5 gap-4 mt-6">
                {filteredFoods.length > 0 ? (
                  filteredFoods.map((food) => (
                    <div
                      key={food.id}
                      className="bg-[#F5F5F533] rounded-lg p-3 border border-[#DCDCDC]"
                    >
                      <div className="w-full flex items-center justify-center">
                        <img
                          src={imageError[food.id] ? Logo : food.image}
                          alt={food.name}
                          className="object-cover rounded-full"
                          onError={() => setImageError((prev) => ({ ...prev, [food.id]: true }))}
                        />
                      </div>
                      <h2 className="text-sm text-[#1C1C1E] font-bold mt-2 text-center">
                        {food.name}
                      </h2>
                      <p
                        className={`text-base/6 font-semibold mt-1 text-center text-secondary ${food.inStock ? '' : 'line-through'}`}
                      >
                        ₦{food.price.toLocaleString()}
                      </p>
                      <p className="text-center text-xs text-[#FD0002]">
                        {food.inStock ? '' : 'Out of Stock'}
                      </p>
                      <button
                        className={`w-full ${food.inStock && !selectedFoods[activeGroupIndex]?.[food.id]
                          ? 'bg-[#EEE] text-primary-700 py-2 rounded-md mt-2 hover:text-primary-500 font-bold text-sm cursor-pointer'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          }`}
                        onClick={() =>
                          food.inStock &&
                          !selectedFoods[activeGroupIndex]?.[food.id] &&
                          handleAddToOrder(food)
                        }
                        disabled={!food.inStock || selectedFoods[activeGroupIndex]?.[food.id]}
                      >
                        Add to Order
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-center col-span-full text-gray-600">No food items available</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Order Details */}
        <div className="col-span-4 bg-white border-l border-[#DCDCDC] pl-4">
          <CreateOrder ref={createOrderRef} onOrderUpdate={handleOrderUpdate} />
        </div>
      </div>
    </>
  )
}

export default Product
