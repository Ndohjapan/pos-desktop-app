// Single source of truth for the shapes the renderer receives.
// These are type-only imports from the server layer — erased at build time,
// so the renderer bundle never pulls in main-process code.

export type {
  CategoryRow as Category,
  FoodWithCategoryRow as Food,
  OrderWithDetails as Order,
  OrderGroupWithItems as OrderGroup,
  OrderItemRow as OrderItem,
  OrderPaymentRow as OrderPayment,
  PaginatedOrders,
  PaymentInput as Payment,
  CreateOrderInput,
  CreateFoodInput,
  UpdateFoodInput,
  SignupInput,
  LoginInput
} from '../../../main/server/types'

export type {
  Api,
  IpcResponse,
  DiscoveredService,
  StartServerResult,
  SearchServiceResult,
  AdminWithoutPassword,
  SyncStatus
} from '../../../preload'
