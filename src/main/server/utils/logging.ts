import Rollbar from 'rollbar'

export const rollbar = new Rollbar({
  accessToken: import.meta.env.MAIN_VITE_ROLLBAR_TOKEN,
  environment: process.env.NODE_ENV || 'development',
  captureUncaught: true,
  captureUnhandledRejections: true
})
