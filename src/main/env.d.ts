/// <reference types="electron-vite/node" />

interface ImportMetaEnv {
  readonly MODE: string
  readonly MAIN_VITE_API_URL: string
  readonly MAIN_VITE_ROLLBAR_TOKEN: string
  // Shared secret sent to the cloud on every backup write. Optional — the cloud
  // only enforces it when it too has a key configured.
  readonly MAIN_VITE_INGEST_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
