/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly RENDERER_VITE_ROLLBAR_TOKEN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
