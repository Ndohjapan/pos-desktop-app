// Row shapes as they exist in SQLite (see database/client.ts currentSchema).
// SQLite has no real booleans: BOOLEAN columns come back as 0/1.

export interface CategoryRow {
  id: number
  name: string
  createdAt: string
  updatedAt: string | null
}

export interface FoodRow {
  id: number
  name: string
  price: number
  quantity: number
  inStock: 0 | 1
  image: string | null
  isDeleted: 0 | 1
  categoryId: number
  createdAt: string
  updatedAt: string | null
}

export interface FoodWithCategoryRow extends FoodRow {
  category: string | null
}

export interface OrderRow {
  id: number
  total: number
  subTotal: number
  backupStatus: 0 | 1
  isDeleted: 0 | 1
  specialOrder: 0 | 1
  serviceFee: number
  createdAt: string
  updatedAt: string | null
}

export interface OrderPaymentRow {
  id: number
  orderId: number
  paymentMethod: string
  amount: number
  createdAt: string
}

export interface OrderGroupRow {
  id: number
  orderId: number
  total: number
}

export interface OrderItemRow {
  id: number
  foodName: string
  quantity: number
  price: number
  amount: number
  foodId: number
  groupId: number
}

export interface AdminRow {
  id: number
  fullName: string
  phoneNumber: string
  password: string
  verified: 0 | 1
  isSuperAdmin: 0 | 1
  createdAt: string
  updatedAt: string | null
}

export interface SessionRow {
  id: number
  token: string
  adminId: number
  expiresAt: string
  createdAt: string
}

// Hydrated shapes returned by the repositories
export interface OrderGroupWithItems extends OrderGroupRow {
  items: OrderItemRow[]
}

export interface OrderWithDetails extends OrderRow {
  groups: OrderGroupWithItems[]
  payments: OrderPaymentRow[]
}

export interface PaginatedOrders {
  rows: OrderWithDetails[]
  totalRows: number
  limit: number
  totalPages: number
  page: number
  pagingCounter: number
  hasPrevPage: boolean
  hasNextPage: boolean
  prevPage: number | null
  nextPage: number | null
}

// Payloads accepted by the services (what the renderer sends over HTTP)
export interface OrderItemInput {
  id: number
  foodName: string
  quantity: number
  price: number
  amount: number
}

export interface OrderGroupInput {
  items: OrderItemInput[]
  total: number
}

export interface PaymentInput {
  paymentMethod: string
  amount: number
}

export interface CreateOrderInput {
  payments: PaymentInput[]
  total: number
  subTotal: number
  serviceFee: number
  specialOrder: 0 | 1
  groups: OrderGroupInput[]
}

export interface CreateFoodInput {
  name: string
  price: number
  quantity: number
  categoryId: number
  image: string | null
}

export interface UpdateFoodInput {
  price: number
  quantity: number
  inStock: boolean
}

export interface SignupInput {
  fullName: string
  phoneNumber: string
  password: string
}

export interface LoginInput {
  phoneNumber: string
  password: string
}

// Filter shape used by order repository queries
export interface DateRangeFilter {
  gte: string
  lte: string
}

export type OrderFilter = Record<string, string | number | DateRangeFilter>
