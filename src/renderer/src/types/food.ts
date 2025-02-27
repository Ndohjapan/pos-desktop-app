interface Category {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface Food {
  id: string
  name: string
  price: number
  quantity: number
  inStock: boolean
  image: string
  isDeleted: boolean
  categoryId: string
  createdAt: string
  updatedAt: string
  category: Category
}
