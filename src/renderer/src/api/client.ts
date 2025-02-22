//@ts-nocheck
import toast from 'react-hot-toast'
const handleApiError = (error: any) => {
  console.log(error);
  toast.error(error.message)
  throw new Error(error.message)
}

export const foodsApi = {
  getAll: async (baseUrl: string) => {
    try {
      const response = await window.api.getFoods(baseUrl)
      return response
    } catch (error) {
      handleApiError(error)
    }
  }
}

export const categoriesApi = {
  getAll: async (baseUrl: string) => {
    try {
      const response = await window.api.getCategories(baseUrl)
      return response
    } catch (error) {
      handleApiError(error)
    }
  }
}

export const ordersApi = {
  create: async (baseUrl: string, orderData: object) => {
    try {
      const response = await window.api.createOrder(baseUrl, orderData)

      if (!response.success) {
        throw new Error(response.message)
      }

      return response
    } catch (error) {
      handleApiError(error)
    }
  },

  getByDate: async (baseUrl: string, date: string, page: number, limit: number) => {
    try {
      const response = await window.api.getGetOrdersByDate(baseUrl, page, limit, date)
      return response
    } catch (error) {
      handleApiError(error)
    }
  }
}

export const utilsApi = {
  syncData: async (baseUrl: string) => {
    try {
      const response = await window.api.syncData(baseUrl)

      console.log(response)

      if (!response.success) {
        throw new Error(response.error)
      }

      return response
    } catch (error) {
      handleApiError(error)
    }
  },

  backupOrders: async (baseUrl: string) => {
    try {
      const response = await window.api.backupOrders(baseUrl)

      console.log(response)

      if (!response.success) {
        throw new Error(response.errpr)
      }

      return response
    } catch (error) {
      handleApiError(error)
    }
  },

  printReceipt: async (orderData: object) => {
    try {
      const response = await window.api.printReceipt(orderData)

      if (!response.success) {
        throw new Error(response.error)
      }

      return response
    } catch (error) {
      handleApiError(error)
    }
  }
}
