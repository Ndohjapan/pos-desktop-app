import { useEffect, useState } from 'react'
import EmptyState from './EmptyState'

import FoodTable from './FoodTable'
import LoadingState from './LoadingState'
import { Category, Food } from '@renderer/types'
import { categoriesApi, foodsApi } from '@renderer/api/client'
import AddFoodModal from './modals/AddFoodModal'
import { useConnectionStore } from '@renderer/store/connection'

function Foods() {
  const [foods, setFoods] = useState<Food[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const host = useConnectionStore((state) => state.host)
  const port = useConnectionStore((state) => state.port)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all')
  const [foodLoading, setFoodLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        setFoodLoading(true)
        const baseUrl = `http://${host}:${port}/api`
        const response = await foodsApi.getAll(baseUrl)
        setFoods(response.data)
        console.log(response.data)
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
        const baseUrl = `http://${host}:${port}/api`
        const response = await categoriesApi.getAll(baseUrl)
        setCategories(response.data)
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }

    fetchCategories()
  }, [])

  const handleProductAdded = (newProduct: Food) => {
    setFoods((prevFoods) => [...prevFoods, newProduct])
    setModalOpen(false)
  }

  const handleProductDeleted = (deletedFoodId: number) => {
    setFoods((prevFoods) => prevFoods.filter((food) => food.id !== deletedFoodId))
  }

  const handleProductUpdated = (updatedProduct: Food) => {
    setFoods((prevFoods) =>
      prevFoods.map((food) => (food.id === updatedProduct.id ? updatedProduct : food))
    )
  }

  const handleCategoryAdded = (newCategory: Category) => {
    setCategories((prevCategories) => [...prevCategories, newCategory])
  }

  const filteredFoods = foods.filter(
    (food) =>
      // Category filter
      (selectedCategory === 'all' || food.categoryId === selectedCategory) &&
      // Search filter
      food.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <>
      {foodLoading ? (
        <>
          <LoadingState />
        </>
      ) : (
        <>
          {foods.length > 0 ? (
            <>
              <div className="w-full 2xl:max-w-[2000px] 2xl:m-auto py-1 px-8 md:px-24 mt-7">
                <div className="sm:flex sm:items-center">
                  <div className="sm:flex-auto">
                    <h1 className="text-xl font-bold text-secondary">Categories: </h1>
                    <div className="flex items-start mt-3 flex-wrap gap-3">
                      <div
                        className={`flex items-center gap-2 cursor-pointer px-4 py-2 text-xs border border-line rounded-md font-bold ${
                          selectedCategory === 'all'
                            ? 'bg-primary-700 text-white'
                            : 'bg-app text-secondary'
                        }`}
                        onClick={() => setSelectedCategory('all')}
                      >
                        <p>All</p>
                      </div>
                      {categories.length > 0 &&
                        categories.map((category) => (
                          <div
                            key={category.id}
                            className={`flex items-center gap-2 cursor-pointer px-4 py-2 text-xs border border-line rounded-md ${
                              selectedCategory === category.id
                                ? 'bg-primary-700 text-white'
                                : 'bg-app text-secondary'
                            }`}
                            onClick={() => setSelectedCategory(category.id)}
                          >
                            <p>{category.name}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                    <button
                      onClick={() => setModalOpen(true)}
                      type="button"
                      className="w-full inline-flex items-center justify-center rounded-lg border border-transparent bg-primary-700 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 sm:w-auto"
                    >
                      Add New Food Item
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="w-full mt-5">
                  <input
                    type="search"
                    placeholder="Search menu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-line bg-[#F5F5F5DD] placeholder-[#828080] text-[#828080] focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <FoodTable
                  foods={filteredFoods}
                  onDeleteFood={handleProductDeleted}
                  onUpdateFood={handleProductUpdated}
                />

                <AddFoodModal
                  isOpen={modalOpen}
                  onClose={() => setModalOpen(false)}
                  onProductAdded={handleProductAdded}
                  onCategoryAdded={handleCategoryAdded}
                />
              </div>
            </>
          ) : (
            <EmptyState onProductAdded={handleProductAdded} onCategoryAdded={handleCategoryAdded} />
          )}
        </>
      )}
    </>
  )
}

export default Foods
