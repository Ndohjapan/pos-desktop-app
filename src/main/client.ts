import axios from 'axios'

const handleApiError = (error: any) => {
  if (error.response) {
    const message = error.response.data.message || 'Something went wrong'
    throw new Error(message)
  } else {
    throw new Error('Network error')
  }
}

export const foodsApi = {
  getAll: async (baseUrl: string) => {
    try {
      const response = await axios.get(`${baseUrl}/foods`)

      return response.data
    } catch (error) {
      handleApiError(error)
    }
  },

  create: async (
    baseUrl: string,
    foodData: {
      name: string
      price: number
      categoryId: string | number
      quantity: number
      image: string
    },
    authToken: string
  ) => {
    try {
      const response = await axios.post(`${baseUrl}/foods`, foodData, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      })
      return response.data
    } catch (error) {
      handleApiError(error)
    }
  },

  update: async (
    baseUrl: string,
    foodId: string | number,
    foodData: {
      price?: number
      quantity?: number
      inStock?: boolean
    },
    authToken: string
  ) => {
    try {
      const response = await axios.put(`${baseUrl}/foods/${foodId}`, foodData, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      })
      return response.data
    } catch (error) {
      handleApiError(error)
    }
  },

  delete: async (baseUrl: string, foodId: string | number, authToken: string) => {
    try {
      const response = await axios.delete(`${baseUrl}/foods/${foodId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      })
      return response.data
    } catch (error) {
      handleApiError(error)
    }
  }
}

export const categoriesApi = {
  getAll: async (baseUrl: string) => {
    try {
      const response = await axios.get(`${baseUrl}/categories`)
      return response.data
    } catch (error) {
      handleApiError(error)
    }
  },

  create: async (baseUrl: string, categoryData: { name: string }, authToken: string) => {
    try {
      const response = await axios.post(`${baseUrl}/categories`, categoryData, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      })
      return response.data
    } catch (error) {
      handleApiError(error)
    }
  }
}

export const ordersApi = {
  create: async (
    baseUrl: string,
    orderData: {
      groups: any[]
      paymentMethod: string
      total: number,
      payments: any[],
      subTotal: number,
      serviceFee: number

    }
  ) => {
    try {
      const response = await axios.post(`${baseUrl}/orders`, orderData)
      return response.data
    } catch (error) {
      handleApiError(error)
    }
  },

  getByDate: async (baseUrl: string, page: number = 1, limit: number = 10, date: string) => {
    try {
      const response = await axios.get(`${baseUrl}/orders`, {
        params: { date, page, limit }
      })
      return response.data
    } catch (error) {
      handleApiError(error)
    }
  },

  search: async (
    baseUrl: string,
    page: number = 1,
    limit: number = 10,
    date: string,
    searchQuery: string
  ) => {
    try {
      const response = await axios.get(`${baseUrl}/orders`, {
        params: { date, page, limit, searchQuery }
      })
      return response.data
    } catch (error) {
      handleApiError(error)
    }
  },

  deleteById: async (baseUrl: string, orderId: string | number, authToken: string) => {
    try {
      const response = await axios.delete(`${baseUrl}/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      })
      return response.data
    } catch (error) {
      handleApiError(error)
    }
  }
}

export const utilsApi = {
  syncData: async (baseUrl: string) => {
    try {
      const response = await axios.get(`${baseUrl}/utils/food-and-categoories`)
      return response.data
    } catch (error) {
      handleApiError(error)
    }
  },

  backupOrders: async (baseUrl: string) => {
    try {
      const response = await axios.get(`${baseUrl}/utils/backup-orders`)
      return response.data
    } catch (error) {
      handleApiError(error)
    }
  }
}

export const authApi = {
  signup: async (
    baseUrl: string,
    adminData: { phoneNumber: string; password: string; fullName: string }
  ) => {
    try {
      const response = await axios.post(`${baseUrl}/auth/signup`, adminData)
      return response.data
    } catch (error) {
      handleApiError(error)
    }
  },

  login: async (baseUrl: string, credentials: { phoneNumber: string; password: string }) => {
    try {
      const response = await axios.post(`${baseUrl}/auth/login`, credentials)
      return response.data
    } catch (error) {
      handleApiError(error)
    }
  }
}
