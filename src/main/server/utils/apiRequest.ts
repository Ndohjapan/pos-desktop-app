import axios, { AxiosRequestConfig } from 'axios'
import CustomError from './customError'
import Rollbar from 'rollbar'

const rollbar = new Rollbar({
  accessToken: import.meta.env.MAIN_VITE_ROLLBAR_TOKEN,
  environment: process.env.NODE_ENV || 'development',
  captureUncaught: true,
  captureUnhandledRejections: true
})

interface ApiRequestOptions {
  url: string
  method: 'GET' | 'POST'
  body?: any
  headers?: Record<string, string>
}

export const makeApiRequest = async ({
  url,
  method,
  body,
  headers = {}
}: ApiRequestOptions): Promise<T> => {
  try {
    const config: AxiosRequestConfig = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }

    if (method === 'POST' && body) {
      config.data = body
    }

    const response = await axios(config)
    return response.data
  } catch (error) {
    rollbar.error('API request failed', error)
    if (axios.isAxiosError(error)) {
      throw new CustomError(error.response?.data?.message || 'API request failed', 500)
    }
    throw new CustomError(error.message, 500)
  }
}
