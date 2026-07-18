type TokenPayload = {
  role?: string
}

export function parseJwtPayload(token: string) {
  try {
    const [, payload] = token.split('.')
    if (!payload) return null

    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decodedPayload = atob(normalizedPayload)
    return JSON.parse(decodedPayload) as TokenPayload
  } catch {
    return null
  }
}

export function getRoleFromToken(token: string | null | undefined) {
  if (!token) return ''
  return parseJwtPayload(token)?.role || ''
}
