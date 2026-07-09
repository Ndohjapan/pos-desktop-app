import axios, { AxiosRequestConfig } from 'axios'
import CustomError from './customError'
import { getErrorMessage } from './errors'
import { rollbar } from './logging'

interface ApiRequestOptions {
  url: string
  method: 'GET' | 'POST'
  body?: unknown
  headers?: Record<string, string>
}

export const makeApiRequest = async <T = unknown>({
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

    const response = await axios<T>(config)
    return response.data
  } catch (error) {
    const apiMessage = axios.isAxiosError(error)
      ? error.response?.data?.message || 'API request failed'
      : getErrorMessage(error)

    rollbar.log(
      getErrorMessage(error),
      { url, method, body, headers },
      { level: 'error' },
      `(desktop): ${apiMessage}`
    )

    throw new CustomError(apiMessage, 500)
  }
}
