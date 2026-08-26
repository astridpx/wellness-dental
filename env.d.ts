/// <reference types="vite/client" />

declare const __APP_VERSION__: string

interface ImportMetaEnv {
  readonly VITE_APP_PER_PAGE?: string
  readonly VITE_APP_MAINTENANCE_MODE?: string
}
