import Rollbar from 'rollbar'

// Renderer-side error reporting. Previously only the main process reported to
// Rollbar, so UI crashes (the "blank screen") were invisible. This captures
// uncaught renderer errors and unhandled promise rejections too.
const token = import.meta.env.RENDERER_VITE_ROLLBAR_TOKEN

export const rollbar = new Rollbar({
  accessToken: token,
  // Only actually transmit when a token is configured.
  enabled: Boolean(token),
  captureUncaught: true,
  captureUnhandledRejections: true,
  environment: import.meta.env.MODE,
  payload: { source: 'renderer' }
})

export function logError(error: unknown, context?: Record<string, unknown>): void {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message, context)
  rollbar.error(message, { ...context })
}
