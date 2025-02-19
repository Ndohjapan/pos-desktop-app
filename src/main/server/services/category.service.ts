//@ts-nocheck
import { CategoryRepository } from '../database/repositories/category.repository'
import CustomError from '../utils/customError'

export class CategoryService {
  private categoryRepository: CategoryRepository

  constructor() {
    this.categoryRepository = new CategoryRepository()
  }

  async getAllCategories() {
    return this.categoryRepository.findAll()
  }

  async createCategory(categoryData: { _id: string; name: string }) {
    try {
      const formattedData = {
        cloudId: categoryData._id,
        name: categoryData.name
      }

      const result = await this.categoryRepository.create(formattedData)
      return result
    } catch (error) {
      console.log(error)
      throw new CustomError(error.message, error.code || 409)
    }
  }


}
