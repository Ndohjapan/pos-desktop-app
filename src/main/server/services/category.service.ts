import { CategoryRepository } from '../database/repositories/category.repository'
import CustomError from '../utils/customError'
import { getErrorMessage, toCustomError } from '../utils/errors'
import { rollbar } from '../utils/logging'

export class CategoryService {
  private categoryRepository: CategoryRepository

  constructor() {
    this.categoryRepository = new CategoryRepository()
  }

  async getAllCategories() {
    return this.categoryRepository.findAll()
  }

  async createCategory(categoryData: { name: string }) {
    try {
      const categoryExists = await this.categoryRepository.findByFilter({
        name: categoryData.name
      })

      if (categoryExists.length > 0) {
        throw new CustomError('Category already exists', 409)
      }

      const result = await this.categoryRepository.create(categoryData)
      return result
    } catch (error) {
      rollbar.error(
        getErrorMessage(error),
        { categoryData },
        { level: 'error' },
        `(desktop): ${getErrorMessage(error)}`
      )
      throw toCustomError(error, 409)
    }
  }
}
