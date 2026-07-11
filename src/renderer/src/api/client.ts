import toast from 'react-hot-toast'
import type {
  AdminWithoutPassword,
  Category,
  CreateFoodInput,
  CreateOrderInput,
  Food,
  IpcResponse,
  LoginInput,
  LoginResult,
  Order,
  PaginatedOrders,
  SignupInput,
  UpdateFoodInput
} from '../types'

const handleApiError = (error: unknown): never => {
  console.log(error)
  const message = error instanceof Error ? error.message : 'Something went wrong'
  toast.error(message)
  throw new Error(message)
}

// A response that has been checked: data is guaranteed present
export interface SuccessResponse<T> {
  success: true
  data: T
}

// Unwrap the { success, data, error } envelope or fail loudly
function ensureSuccess<T>(response: IpcResponse<T>): SuccessResponse<T> {
  if (!response.success || response.data === undefined) {
    throw new Error(response.error || 'Request failed')
  }
  return response as SuccessResponse<T>
}

export const foodsApi = {
  getAll: async (baseUrl: string): Promise<SuccessResponse<Food[]>> => {
    try {
      return ensureSuccess(await window.api.getFoods(baseUrl))
    } catch (error) {
      return handleApiError(error)
    }
  },

  create: async (
    baseUrl: string,
    foodData: CreateFoodInput,
    authToken: string
  ): Promise<SuccessResponse<Food>> => {
    try {
      return ensureSuccess(await window.api.createFood(baseUrl, foodData, authToken))
    } catch (error) {
      return handleApiError(error)
    }
  },

  update: async (
    baseUrl: string,
    foodId: number,
    foodData: UpdateFoodInput,
    authToken: string
  ): Promise<SuccessResponse<unknown>> => {
    try {
      return ensureSuccess(await window.api.updateFood(baseUrl, foodId, foodData, authToken))
    } catch (error) {
      return handleApiError(error)
    }
  },

  delete: async (
    baseUrl: string,
    foodId: number,
    authToken: string
  ): Promise<SuccessResponse<unknown>> => {
    try {
      return ensureSuccess(await window.api.deleteFood(baseUrl, foodId, authToken))
    } catch (error) {
      return handleApiError(error)
    }
  }
}

export const categoriesApi = {
  getAll: async (baseUrl: string): Promise<SuccessResponse<Category[]>> => {
    try {
      return ensureSuccess(await window.api.getCategories(baseUrl))
    } catch (error) {
      return handleApiError(error)
    }
  },

  create: async (
    baseUrl: string,
    categoryData: { name: string },
    authToken: string
  ): Promise<SuccessResponse<Category>> => {
    try {
      return ensureSuccess(await window.api.createCategory(baseUrl, categoryData, authToken))
    } catch (error) {
      return handleApiError(error)
    }
  }
}

export const ordersApi = {
  create: async (baseUrl: string, orderData: CreateOrderInput): Promise<SuccessResponse<Order>> => {
    try {
      return ensureSuccess(await window.api.createOrder(baseUrl, orderData))
    } catch (error) {
      return handleApiError(error)
    }
  },

  getByDate: async (
    baseUrl: string,
    date: string,
    page: number,
    limit: number
  ): Promise<SuccessResponse<PaginatedOrders>> => {
    try {
      return ensureSuccess(await window.api.getOrdersByDate(baseUrl, page, limit, date))
    } catch (error) {
      return handleApiError(error)
    }
  },

  searchByDate: async (
    baseUrl: string,
    date: string,
    page: number,
    limit: number,
    searchQuery: string
  ): Promise<SuccessResponse<PaginatedOrders>> => {
    try {
      return ensureSuccess(
        await window.api.searchOrdersByDate(baseUrl, page, limit, date, searchQuery)
      )
    } catch (error) {
      return handleApiError(error)
    }
  },

  delete: async (
    baseUrl: string,
    orderId: number,
    authToken: string
  ): Promise<SuccessResponse<unknown>> => {
    try {
      return ensureSuccess(await window.api.deleteOrder(baseUrl, orderId, authToken))
    } catch (error) {
      return handleApiError(error)
    }
  }
}

export const authApi = {
  signup: async (
    baseUrl: string,
    adminData: SignupInput
  ): Promise<SuccessResponse<AdminWithoutPassword>> => {
    try {
      return ensureSuccess(await window.api.signup(baseUrl, adminData))
    } catch (error) {
      return handleApiError(error)
    }
  },

  login: async (
    baseUrl: string,
    credentials: LoginInput
  ): Promise<SuccessResponse<LoginResult>> => {
    try {
      return ensureSuccess(await window.api.login(baseUrl, credentials))
    } catch (error) {
      return handleApiError(error)
    }
  },

  logout: async (baseUrl: string, token: string): Promise<void> => {
    try {
      await window.api.logout(baseUrl, token)
    } catch {
      // logout is best-effort; local state is cleared regardless
    }
  },

  listAdmins: async (
    baseUrl: string,
    token: string
  ): Promise<SuccessResponse<{ data: AdminWithoutPassword[] }>> => {
    try {
      return ensureSuccess(await window.api.listAdmins(baseUrl, token))
    } catch (error) {
      return handleApiError(error)
    }
  },

  verifyAdmin: async (
    baseUrl: string,
    adminId: number,
    verified: boolean,
    token: string
  ): Promise<SuccessResponse<{ success: boolean }>> => {
    try {
      return ensureSuccess(await window.api.verifyAdmin(baseUrl, adminId, verified, token))
    } catch (error) {
      return handleApiError(error)
    }
  }
}

export const utilsApi = {
  syncData: async (baseUrl: string): Promise<SuccessResponse<unknown>> => {
    try {
      return ensureSuccess(await window.api.syncData(baseUrl))
    } catch (error) {
      return handleApiError(error)
    }
  },

  backupOrders: async (baseUrl: string) => {
    try {
      return ensureSuccess(await window.api.backupOrders(baseUrl))
    } catch (error) {
      return handleApiError(error)
    }
  },

  getSyncStatus: async (baseUrl: string) => {
    try {
      return ensureSuccess(await window.api.getSyncStatus(baseUrl))
    } catch (error) {
      return handleApiError(error)
    }
  },

  retryFailed: async (baseUrl: string) => {
    try {
      return ensureSuccess(await window.api.retryFailedOrders(baseUrl))
    } catch (error) {
      return handleApiError(error)
    }
  },

  printReceipt: async (orderData: Order): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await window.api.printReceipt(orderData)
      if (!response.success) {
        throw new Error(response.message || 'Print failed')
      }
      return response
    } catch (error) {
      return handleApiError(error)
    }
  }
}
