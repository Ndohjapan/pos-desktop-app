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
  }
}

export const ordersApi = {
  create: async (
    baseUrl: string,
    orderData: {
      groups: any[]
      paymentMethod: string
      total: number
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
