import axios, { AxiosRequestConfig } from 'axios'
import CustomError from './customError'
import { getErrorMessage } from './errors'
import { rollbar } from './logging'

interface ApiRequestOptions {
  url: string
  method: 'GET' | 'POST'
  body?: unknown
  headers?: Record<string, string>
  timeout?: number
}

// Code 503 is used to signal a *transient* network/connectivity failure (no
// HTTP response reached us) — callers use this to decide "retry later" vs
// "this payload was rejected, isolate it".
export const NETWORK_ERROR_CODE = 503

export const makeApiRequest = async <T = unknown>({
  url,
  method,
  body,
  headers = {},
  timeout = 20000
}: ApiRequestOptions): Promise<T> => {
  try {
    const config: AxiosRequestConfig = {
      method,
      url,
      timeout,
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
    if (axios.isAxiosError(error)) {
      // No response object => request never reached the server (offline,
      // DNS, timeout, connection refused). Treat as transient.
      if (!error.response) {
        throw new CustomError(getErrorMessage(error) || 'Network error', NETWORK_ERROR_CODE)
      }
      // Server responded with an error status — a genuine rejection.
      const message = error.response.data?.message || 'API request failed'
      throw new CustomError(message, error.response.status || 500)
    }

    throw new CustomError(getErrorMessage(error), 500)
  }
}

/**
 * Retry an async operation with exponential backoff, but only while the failure
 * is transient (network). A non-network CustomError (a real rejection) is
 * rethrown immediately so we don't hammer the server with a doomed payload.
 */
export async function retryTransient<T>(
  fn: () => Promise<T>,
  { attempts = 3, baseDelayMs = 1000, label = 'request' }: { attempts?: number; baseDelayMs?: number; label?: string } = {}
): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      const isTransient = error instanceof CustomError && error.code === NETWORK_ERROR_CODE
      if (!isTransient || attempt === attempts) {
        throw error
      }
      const delay = baseDelayMs * Math.pow(2, attempt - 1)
      console.log(`Retry ${label}: attempt ${attempt} failed (network), retrying in ${delay}ms`)
      rollbar.log(
        getErrorMessage(error),
        { attempt, label },
        { level: 'warning' },
        `(desktop): transient failure, retrying ${label}`
      )
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  throw lastError
}
