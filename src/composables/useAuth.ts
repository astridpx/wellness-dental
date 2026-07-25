import router from '@/router'

const {
  VITE_APP_MAIN_API_BASE_URL,
  VITE_APP_LOCAL_STORAGE_TOKEN_KEY,
  VITE_APP_LOCAL_STORAGE_EMAIL,
} = import.meta.env

const USER_STORAGE_KEY = 'dentalAuthClientUser'

type WellnessUser = {
  id: number
  userCode: string
  username: string
  email: string
  firstName: string
  lastName: string
  displayName: string
  department: string | null
  jobTitle: string | null
  mobileNumber: string | null
  roles: string[]
  primaryRole: string
  isActive: boolean
  mustChangePassword: boolean
}

type AuthResponse = {
  data?: {
    token: string
    user: WellnessUser
  }
  error?: string
}

type MeResponse = {
  data?: WellnessUser
  error?: string
}

function saveSession(token: string, user: WellnessUser) {
  localStorage.setItem(VITE_APP_LOCAL_STORAGE_TOKEN_KEY, token)
  localStorage.setItem(VITE_APP_LOCAL_STORAGE_EMAIL, user.email)
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
}

function clearSession() {
  localStorage.setItem(VITE_APP_LOCAL_STORAGE_TOKEN_KEY, '')
  localStorage.setItem(VITE_APP_LOCAL_STORAGE_EMAIL, '')
  localStorage.setItem(USER_STORAGE_KEY, '')
}

export function useAuth() {
  async function login(identifier: string, userPassword: string) {
    const loginURL = `${VITE_APP_MAIN_API_BASE_URL}/wellness/auth/login`
    const body = JSON.stringify({ identifier, password: userPassword })

    try {
      const res = await fetch(loginURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })

      const obj = (await res.json()) as AuthResponse

      if (res.ok && obj.data?.token && obj.data.user) {
        saveSession(obj.data.token, obj.data.user)
        return true
      }

      return obj.error || 'Unable to login at the moment.'
    } catch {
      return 'Unable to connect to the authentication server.'
    }
  }

  async function logout(forced = false, query = '') {
    const token = getToken()

    try {
      if (token) {
        await fetch(`${VITE_APP_MAIN_API_BASE_URL}/wellness/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      }
    } catch {
      // Clear local state even if logout request fails.
    }

    clearSession()
    const queryString = query || (forced ? '?forcedLogout=1' : '')
    router.push(`/login${queryString}`)
  }

  async function logoutForPasswordReset() {
    await logout(true, '?passwordResetRequired=1')
  }

  function getToken() {
    return localStorage.getItem(VITE_APP_LOCAL_STORAGE_TOKEN_KEY)
  }

  function getStoredUser(): WellnessUser | null {
    const raw = localStorage.getItem(USER_STORAGE_KEY)
    if (!raw) return null

    try {
      return JSON.parse(raw) as WellnessUser
    } catch {
      return null
    }
  }

  function getStoredRoles(): string[] {
    return getStoredUser()?.roles || []
  }

  async function fetchCurrentUser() {
    const token = getToken()
    if (!token) return null

    try {
      const res = await fetch(`${VITE_APP_MAIN_API_BASE_URL}/wellness/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) return null

      const obj = (await res.json()) as MeResponse
      if (!obj.data) return null

      saveSession(token, obj.data)
      return obj.data
    } catch {
      return null
    }
  }

  function getAuthHeaders(contentType = true): Record<string, string> {
    const token = getToken()
    return {
      ...(contentType ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  }

  return {
    login,
    logout,
    logoutForPasswordReset,
    getToken,
    getStoredUser,
    getStoredRoles,
    getAuthHeaders,
    fetchCurrentUser,
  }
}
