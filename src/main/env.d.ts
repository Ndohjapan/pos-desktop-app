/// <reference types="electron-vite/node" />

interface ImportMetaEnv {
  readonly MODE: string
  readonly MAIN_VITE_API_URL: string
  readonly MAIN_VITE_ROLLBAR_TOKEN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
