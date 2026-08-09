export type ApiResult<T> = {
  ok: boolean
  data: T | null
  error: string
  metadata?: Record<string, unknown>
  unauthorized?: boolean
}
