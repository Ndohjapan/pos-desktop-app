import { HiTrash } from 'react-icons/hi2'
import { useState, useEffect } from 'react'
import { Food } from '@renderer/types'
import { foodsApi } from '@renderer/api/client'
import { useConnectionStore } from '@renderer/store/connection'
import { getAdminToken } from '@renderer/utils/auth'

interface ModifiedRow {
  quantity?: string | number
  price?: string | number
  inStock?: boolean
  isModified?: boolean
}

type EditableField = 'quantity' | 'price' | 'inStock'

export default function FoodTable({
  foods,
  onDeleteFood,
  onUpdateFood
}: {
  foods: Food[]
  onDeleteFood: (foodId: number) => void
  onUpdateFood: (updatedFood: Food) => void
}) {
  const [modifiedRows, setModifiedRows] = useState<Record<number, ModifiedRow>>({})
  const [isUpdating, setIsUpdating] = useState<Record<number, boolean>>({})
  const host = useConnectionStore((state) => state.host)
  const port = useConnectionStore((state) => state.port)

  const [toggleStates, setToggleStates] = useState<Record<number, boolean>>({})

  useEffect(() => {
    const results: Record<number, boolean> = {}
    for (let i = 0; i < foods.length; i++) {
      results[foods[i].id] = Boolean(foods[i].inStock)
    }
    setToggleStates(results)
  }, [foods])

  const handleToggle = (foodId: number) => {
    const newValue = !toggleStates[foodId]
    setToggleStates((prev) => ({
      ...prev,
      [foodId]: newValue
    }))

    handleChange(foodId, 'inStock', newValue)
  }

  const handleChange = (foodId: number, field: EditableField, value: string | boolean) => {
    const originalFood = foods.find((food) => food.id === foodId)
    if (!originalFood) return

    setModifiedRows((prev) => {
      const updatedRow: ModifiedRow = {
        ...prev[foodId],
        [field]: value
      }

      const isUnmodified =
        (field === 'quantity' && Number(value) === originalFood.quantity) ||
        (field === 'price' && Number(value) === originalFood.price) ||
        (field === 'inStock' && value === Boolean(originalFood.inStock))

      if (
        isUnmodified &&
        !(Object.keys(updatedRow) as (keyof ModifiedRow)[]).some(
          (key) =>
            key !== field &&
            key !== 'isModified' &&
            updatedRow[key] !== originalFood[key as EditableField]
        )
      ) {
        const { [foodId]: _removed, ...rest } = prev
        return rest
      }

      return {
        ...prev,
        [foodId]: {
          ...updatedRow,
          isModified: true
        }
      }
    })
  }

  const handleDeleteProduct = async (foodId: number) => {
    const isConfirmed = window.confirm('Are you sure you want to delete this item?')
    if (isConfirmed) {
      const baseUrl = `http://${host}:${port}/api`
      try {
        await foodsApi.delete(baseUrl, foodId, getAdminToken())
        onDeleteFood(foodId)
      } catch (error) {
        console.error('Failed to delete product:', error)
      }
    }
  }

  const handleUpdateFood = async (foodId: number) => {
    setIsUpdating((prev) => ({ ...prev, [foodId]: true }))

    try {
      const originalFood = foods.find((food) => food.id === foodId)
      if (!originalFood) return

      const row = modifiedRows[foodId] ?? {}
      const updatedFields = {
        price: Number(row.price ?? originalFood.price),
        quantity: Number(row.quantity ?? originalFood.quantity),
        inStock: row.inStock ?? Boolean(originalFood.inStock)
      }

      const baseUrl = `http://${host}:${port}/api`

      await foodsApi.update(baseUrl, foodId, updatedFields, getAdminToken())
      onUpdateFood({
        ...originalFood,
        ...updatedFields,
        inStock: updatedFields.inStock ? 1 : 0
      })

      setModifiedRows((prev) => {
        const { [foodId]: _removed, ...rest } = prev
        return rest
      })
    } catch (error) {
      console.error('Failed to update product:', error)
    } finally {
      setIsUpdating((prev) => ({ ...prev, [foodId]: false }))
    }
  }

  return (
    <>
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-line">
                <thead className="bg-app border-b shadow-sm">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-ink sm:pl-6"
                    >
                      Items
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-ink"
                    >
                      Quantity
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-ink"
                    >
                      Price(₦)
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-ink"
                    >
                      In stock
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line bg-white py-4">
                  {foods.map((food) => (
                    <tr key={food.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <img
                              className="h-10 w-10 rounded-full"
                              src={food.image ?? undefined}
                              alt=""
                              width={100}
                              height={100}
                            />
                          </div>
                          <div className="ml-4">
                            <p className="font-bold text-secondary">{food.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-muted">
                        <input
                          type="number"
                          className="w-20 p-1 border rounded"
                          value={modifiedRows[food.id]?.quantity ?? food.quantity}
                          onChange={(e) => handleChange(food.id, 'quantity', e.target.value)}
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-muted">
                        <input
                          type="number"
                          className="w-20 p-1 border rounded"
                          value={modifiedRows[food.id]?.price ?? food.price}
                          onChange={(e) => handleChange(food.id, 'price', e.target.value)}
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-muted">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={toggleStates[food.id] ?? false}
                            onChange={() => handleToggle(food.id)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-line after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="w-full flex items-center space-x-3">
                          <button
                            onClick={() => {
                              handleDeleteProduct(food.id)
                            }}
                            className="border border-secondary rounded-md py-1 px-2"
                          >
                            <HiTrash className="w-5 h-5 text-danger-600" />
                          </button>
                          <button
                            className={`px-10 py-2 text-sm font-bold rounded-md ${
                              modifiedRows[food.id]?.isModified
                                ? 'bg-primary-700 text-white'
                                : 'bg-[#EEEEEE] text-muted cursor-not-allowed'
                            }`}
                            disabled={!modifiedRows[food.id]?.isModified || isUpdating[food.id]}
                            onClick={() => handleUpdateFood(food.id)}
                          >
                            {isUpdating[food.id] ? 'Updating...' : 'Update'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
