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
    return this.foodRepository.findAll()
  }

  async createFood(foodData: any) {
    try {
      const formattedData = {
        name: foodData.name,
        cloudId: foodData._id,
        price: foodData.price,
        quantity: foodData.quantity,
        categoryId: foodData.categoryId,
        image: foodData.image
      }

      let foodExists = await this.foodRepository.findByFilter({
        name: foodData.name
      })

      if (foodExists.length > 0) {
        throw new CustomError('Food already exists', 409)
      }

      foodExists = await this.foodRepository.findByFilter({
        cloudId: foodData._id
      })

      if (foodExists.length > 0) {
        throw new CustomError('Food already exists', 409)
      }

      const result = await this.foodRepository.create(formattedData)
      return result
    } catch (error) {
      throw new CustomError(error.message, error.code || 500)
    }
  }

  async upsertFood(foodData: any) {
    try {
      // Find the category by cloudId
      const category = await this.categoryRepository.findByFilter({
        cloudId: foodData.category._id
      })

      if (category.length === 0) {
        throw new CustomError('Category not found', 404)
      }

      const formattedData = {
        name: foodData.name,
        cloudId: foodData._id,
        price: foodData.price,
        quantity: foodData.quantity,
        category: {
          cloudId: foodData.category._id,
          id: category[0].id
        },
        image: foodData.image,
        inStock: foodData.inStock ? 1 : 0
      }

      // Update if exists, create if doesn't
      const food = await this.foodRepository.upsert(formattedData)

      return food
    } catch (error) {
      console.log(error)
      throw new CustomError(error.message, error.code || 409)
    }
  }
}
