import Rollbar from 'rollbar'

const token = import.meta.env.MAIN_VITE_ROLLBAR_TOKEN

// Only transmit when a token is configured — keeps local/dev (and any deploy
// without Rollbar set up) from erroring or spamming warnings on every log.
export const rollbar = new Rollbar({
  accessToken: token,
  enabled: Boolean(token),
  environment: process.env.NODE_ENV || 'development',
  captureUncaught: true,
  captureUnhandledRejections: true
})
