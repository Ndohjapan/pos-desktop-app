import toast from 'react-hot-toast'
const handleApiError = (error: any) => {
  console.log('FROM HERE: ', error)
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
  },

  create: async (
    baseUrl: string,
    foodData: {
      name: string
      price: number
      quantity: number
      categoryId: number | string
      image: string
    }
  ) => {
    try {
      const authToken = localStorage.getItem('pos-admin-token')

      const response = await window.api.createFood(baseUrl, foodData, authToken)

      if (!response.success) {
        throw new Error(response.error)
      }

      return response
    } catch (error) {
      handleApiError(error)
    }
  },

  update: async (
    baseUrl: string,
    foodId: number | string,
    foodData: {
      price?: number
      quantity?: number
      inStock?: boolean
    }
  ) => {
    try {
      const authToken = localStorage.getItem('pos-admin-token')

      const response = await window.api.updateFood(baseUrl, foodId, foodData, authToken)

      if (!response.success) {
        throw new Error(response.error)
      }

      return response
    } catch (error) {
      handleApiError(error)
    }
  },

  delete: async (baseUrl: string, foodId: number | string) => {
    try {
      const authToken = localStorage.getItem('pos-admin-token')

      const response = await window.api.deleteFood(baseUrl, foodId, authToken)

      if (!response.success) {
        throw new Error(response.error)
      }

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
  },

  create: async (baseUrl: string, categoryData: { name: string }) => {
    try {
      const authToken = localStorage.getItem('pos-admin-token')
      const response = await window.api.createCategory(baseUrl, categoryData, authToken)

      if (!response.success) {
        throw new Error(response.error)
      }

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
        throw new Error(response.error)
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
  },

  searchByDate: async (
    baseUrl: string,
    date: string,
    page: number,
    limit: number,
    searchquery: number | string
  ) => {
    try {
      const response = await window.api.searchOrdersByDate(baseUrl, page, limit, date, searchquery)
      return response
    } catch (error) {
      handleApiError(error)
    }
  },

  delete: async (baseUrl: string, orderId: string | number) => {
    try {
      const authToken = localStorage.getItem('pos-admin-token')

      const response = await window.api.deleteOrder(baseUrl, orderId, authToken)

      if (!response.success) {
        throw new Error(response.error)
      }

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
        throw new Error(response.error)
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

export const authApi = {
  login: async (baseUrl: string, credentials: { phoneNumber: string; password: string }) => {
    try {
      const response = await window.api.login(baseUrl, credentials)

      if (!response.success) {
        throw new Error(response.error)
      }

      return response
    } catch (error) {
      handleApiError(error)
    }
  },

  signup: async (
    baseUrl: string,
    adminData: { phoneNumber: string; password: string; fullName: string }
  ) => {
    try {
      const response = await window.api.signup(baseUrl, adminData)

      if (!response.success) {
        throw new Error(response.error)
      }

      return response
    } catch (error) {
      handleApiError(error)
    }
  }
}
