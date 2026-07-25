import { useAuth } from './useAuth'

const baseURL = import.meta.env.VITE_APP_MAIN_API_BASE_URL

type ApiEnvelope<T> = {
  data?: T
  error?: string
  metadata?: Record<string, unknown>
}

type RequestOptions = {
  includeContentType?: boolean
}

export type ApiResult<T> = {
  ok: boolean
  data: T | null
  error: string
  metadata?: Record<string, unknown>
  unauthorized?: boolean
}

export function useWellnessApi() {
  const { getAuthHeaders, logout } = useAuth()

  async function request<T>(
    path: string,
    init: RequestInit = {},
    options: RequestOptions = {},
  ): Promise<ApiResult<T>> {
    const { includeContentType = false } = options

    try {
      const headers = {
        ...getAuthHeaders(includeContentType),
        ...((init.headers as Record<string, string> | undefined) || {}),
      }

      const res = await fetch(`${baseURL}${path}`, {
        ...init,
        headers,
      })

      const payload = ((await res.json().catch(() => ({}))) || {}) as ApiEnvelope<T>

      if (res.status === 401 || res.status === 403) {
        await logout(true)
        return {
          ok: false,
          data: null,
          error: payload.error || 'Your session has expired.',
          unauthorized: true,
        }
      }

      if (!res.ok) {
        return {
          ok: false,
          data: null,
          error: payload.error || 'Unable to complete the request.',
          metadata: payload.metadata,
        }
      }

      return {
        ok: true,
        data: payload.data ?? null,
        error: '',
        metadata: payload.metadata,
      }
    } catch {
      return {
        ok: false,
        data: null,
        error: 'Unable to connect to the server.',
      }
    }
  }

  return { request }
}
