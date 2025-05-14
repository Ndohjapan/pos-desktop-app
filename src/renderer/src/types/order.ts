interface OrderItem {
  id: string
  foodName: string
  quantity: number
  price: number
  amount: number
  foodId: string
  groupId: string
}

interface OrderGroup {
  id: string
  orderId: number
  total: number
  items: OrderItem[]
}

export interface Order {
  id: number
  payments: Payment[]
  total: number
  backupStatus: boolean
  createdAt: string
  updatedAt: string
  groups: OrderGroup[]
  specialOrder: number
  subtotal: number
  serviceFee: number
}
