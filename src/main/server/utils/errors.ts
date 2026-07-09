import { Response } from 'express'
import CustomError from './customError'

// Narrow an unknown catch value to a usable message
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Something went wrong'
}

// Normalize any thrown value into a CustomError with a valid HTTP code
export function toCustomError(error: unknown, fallbackCode = 500): CustomError {
  if (error instanceof CustomError && Number.isInteger(error.code)) return error
  return new CustomError(getErrorMessage(error), fallbackCode)
}

// Uniform route error response — guards against non-numeric codes crashing express
export function sendError(res: Response, error: unknown): void {
  const customError = toCustomError(error)
  const code = customError.code >= 400 && customError.code <= 599 ? customError.code : 500
  res.status(code).json({ message: customError.message })
}
