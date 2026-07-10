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

export type OrderStatus = 'completed' | 'voided'
export type FulfillmentStatus = 'preparing' | 'ready' | 'served'

export interface OrderRow {
  id: number
  total: number
  subTotal: number
  backupStatus: 0 | 1 | 2
  isDeleted: 0 | 1
  specialOrder: 0 | 1
  serviceFee: number
  orderNumber: number
  status: OrderStatus
  fulfillment: FulfillmentStatus
  cashierId: number | null
  cashierName: string | null
  shiftId: number | null
  discount: number
  discountReason: string | null
  tendered: number
  changeDue: number
  voidReason: string | null
  voidedBy: string | null
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

// --- Quick-service entities ---

export type CashierRole = 'cashier' | 'supervisor'

export interface CashierRow {
  id: number
  fullName: string
  pin: string
  role: CashierRole
  active: 0 | 1
  createdAt: string
  updatedAt: string | null
}

export type CashierPublic = Omit<CashierRow, 'pin'>

export interface ShiftRow {
  id: number
  cashierId: number
  cashierName: string
  openingFloat: number
  openedAt: string
  closedAt: string | null
  countedCash: number | null
  expectedCash: number | null
  notes: string | null
}

export interface ParkedOrderRow {
  id: number
  label: string
  cashierId: number | null
  cashierName: string | null
  payload: string
  createdAt: string
  updatedAt: string | null
}

export interface AuditLogRow {
  id: number
  action: string
  orderId: number | null
  cashierName: string | null
  approvedBy: string | null
  reason: string | null
  detail: string | null
  createdAt: string
}

export interface StoreSettings {
  branchId: string
  branchName: string
  // True once the owner has picked this machine's store at first-time setup.
  // Until then the setup dropdown is shown; afterwards it never reappears.
  branchConfigured: boolean
  quickService: boolean
  cashiersEnabled: boolean
  kitchenPrintingEnabled: boolean
  kitchenPrinterName: string
}

export interface CanonicalBranch {
  branchId: string
  branchName: string
}

// Shift report (X = live snapshot, Z = at close)
export interface ShiftReport {
  shift: ShiftRow
  orderCount: number
  grossSales: number
  totalDiscount: number
  voidCount: number
  voidedAmount: number
  byPaymentMethod: { paymentMethod: string; amount: number; count: number }[]
  cashSales: number
  expectedCash: number
  countedCash: number | null
  variance: number | null
}

export interface DailySummary {
  date: string
  orderCount: number
  grossSales: number
  totalDiscount: number
  serviceFees: number
  voidCount: number
  voidedAmount: number
  byPaymentMethod: { paymentMethod: string; amount: number; count: number }[]
  topItems: { foodName: string; quantity: number; amount: number }[]
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
  // Quick-service extras (all optional so the restaurant flow is unchanged)
  cashierId?: number
  cashierName?: string
  shiftId?: number
  discount?: number
  discountReason?: string
  supervisorPin?: string
  tendered?: number
  changeDue?: number
  // resume flow: the parked draft this order came from (deleted on success)
  parkedOrderId?: number
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
