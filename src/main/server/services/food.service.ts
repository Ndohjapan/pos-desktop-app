//@ts-nocheck
import { CategoryRepository } from '../database/repositories/category.repository'
import { FoodRepository } from '../database/repositories/food.repository'
import CustomError from '../utils/customError'

export class FoodService {
  private foodRepository: FoodRepository
  private categoryRepository: CategoryRepository

  constructor() {
    this.foodRepository = new FoodRepository()
    this.categoryRepository = new CategoryRepository()
  }

  async getAllFoods() {
    const foods = this.foodRepository.findAll()
    return foods
  }

  async createFood(foodData: any) {
    try {
      const formattedData = {
        name: foodData.name,
        price: foodData.price,
        quantity: foodData.quantity,
        categoryId: foodData.categoryId,
        image: foodData.image
      }

      const category = await this.categoryRepository.findByFilter({
        id: foodData.categoryId
      })

      if (category.length === 0) {
        throw new CustomError('Category not found', 404)
      }

      let foodExists = await this.foodRepository.findByFilter({
        foodName: foodData.name
      })

      if (foodExists.length > 0) {
        throw new CustomError('Food already exists', 409)
      }

      const result = await this.foodRepository.create(formattedData)
      return result
    } catch (error) {
      console.log(error)
      throw new CustomError(error.message, error.code || 500)
    }
  }

  async updateFood(foodId: number, foodData: any) {
    try {
      const newFoodData = {
        price: foodData.price,
        quantity: foodData.quantity,
        inStock: foodData.inStock ? 1 : 0
      }

      const result = await this.foodRepository.updateById(foodId, newFoodData)
      return result
    } catch (error) {
      throw new CustomError(error.message, error.code || 500)
    }
  }

  async deleteFood(foodId: number) {
    try {
      const result = await this.foodRepository.deleteById(foodId)
      return result
    } catch (error) {
      throw new CustomError(error.message, error.code || 500)
    }
  }

}
