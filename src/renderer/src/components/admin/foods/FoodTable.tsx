import { HiTrash } from "react-icons/hi2";
import { useState, useEffect } from "react";
import { Food } from "@renderer/types/food";
import { foodsApi } from "@renderer/api/client";
import { useConnectionStore } from "@renderer/store/connection";

export default function FoodTable({ foods, onDeleteFood, onUpdateFood }: { foods: Food[], onDeleteFood: (foodId: string) => void, onUpdateFood: (foodId: string, updatedFood: Food) => void }) {
  const [modifiedRows, setModifiedRows] = useState({});
  const [isUpdating, setIsUpdating] = useState({});
  const host = useConnectionStore((state) => state.host);
  const port = useConnectionStore((state) => state.port);

  const [toggleStates, setToggleStates] = useState({});

  useEffect(() => {
    const results = {};
    for (let i = 0; i < foods.length; i++) {
      results[foods[i].id] = foods[i].inStock;
    }
    setToggleStates(results);
  }, [foods]);

  const handleToggle = (foodId) => {
    const newValue = !toggleStates[foodId];
    setToggleStates((prev) => ({
      ...prev,
      [foodId]: newValue,
    }));

    handleChange(foodId, "inStock", newValue);
  };

  const handleChange = (foodId, field, value) => {
    const originalFood = foods.find((food) => food.id === foodId);

    setModifiedRows((prev) => {
      const updatedRow = {
        ...prev[foodId],
        [field]: value,
      };

      const isUnmodified =
        (field === "quantity" && Number(value) === originalFood.quantity) ||
        (field === "price" && Number(value) === originalFood.price) ||
        (field === "inStock" && value === originalFood.inStock);

      if (
        isUnmodified &&
        !Object.keys(updatedRow).some(
          (key) =>
            key !== field &&
            key !== "isModified" &&
            updatedRow[key] !== originalFood[key]
        )
      ) {
        const { [foodId]: _, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [foodId]: {
          ...updatedRow,
          isModified: true,
        },
      };
    });
  };

  const handleDeleteProduct = async (foodId) => {
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this item?"
    );
    if (isConfirmed) {
      const baseUrl = `http://${host}:${port}/api`;
      try {
        await foodsApi.delete(baseUrl, foodId);
        onDeleteFood(foodId);
      } catch (error) {
        console.error("Failed to delete product:", error);
      }
    }
  };

  const handleUpdateFood = async (foodId: string | number) => {
    setIsUpdating((prev) => ({ ...prev, [foodId]: true }));

    try {
      const modifiedFood = {
        ...foods.find((food) => food.id === foodId),
        ...modifiedRows[foodId],
        price: Number(modifiedRows[foodId]?.price ?? foods.find((f) => f.id === foodId).price),
        quantity: Number(modifiedRows[foodId]?.quantity ?? foods.find((f) => f.id === foodId).quantity),
      };

      const baseUrl = `http://${host}:${port}/api`;

      await foodsApi.update(baseUrl, foodId, modifiedFood);
      onUpdateFood(modifiedFood);

      setModifiedRows((prev) => {
        const { [foodId]: _, ...rest } = prev;
        return rest;
      });
    } catch (error) {
      console.error("Failed to update product:", error);
    } finally {
      setIsUpdating((prev) => ({ ...prev, [foodId]: false }));
    }
  };

  return (
    <>
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50 border-b shadow-sm">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                    >
                      Items
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Quantity
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Price(₦)
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      In stock
                    </th>
                    <th
                      scope="col"
                      className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                    >
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white py-4">
                  {foods.map((food) => (
                    <tr key={food.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <img
                              className="h-10 w-10 rounded-full"
                              src={food.image}
                              alt=""
                              width={100}
                              height={100}
                            />
                          </div>
                          <div className="ml-4">
                            <p className="font-bold text-secondary">
                              {food.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <input
                          type="number"
                          className="w-20 p-1 border rounded"
                          value={modifiedRows[food.id]?.quantity ?? food.quantity}
                          onChange={(e) => handleChange(food.id, "quantity", e.target.value)}
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <input
                          type="number"
                          className="w-20 p-1 border rounded"
                          value={modifiedRows[food.id]?.price ?? food.price}
                          onChange={(e) => handleChange(food.id, "price", e.target.value)}
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={toggleStates[food.id] ?? false}
                            onChange={() => handleToggle(food.id)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="w-full flex items-center space-x-3">
                          <button
                            onClick={() => {
                              handleDeleteProduct(food.id);
                            }}
                            className="border border-secondary rounded-md py-1 px-2"
                          >
                            <HiTrash className="w-5 h-5 text-red-500" />
                          </button>
                          <button
                            className={`px-10 py-2 text-sm font-bold rounded-md ${modifiedRows[food.id]?.isModified
                              ? "bg-primary-700 text-white"
                              : "bg-[#EEEEEE] text-gray-400 cursor-not-allowed"
                              }`}
                            disabled={
                              !modifiedRows[food.id]?.isModified ||
                              isUpdating[food.id]
                            }
                            onClick={() => handleUpdateFood(food.id)}
                          >
                            {isUpdating[food.id] ? "Updating..." : "Update"}
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
  );
}