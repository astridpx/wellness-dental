import router from '@/router'

const {
  VITE_APP_MAIN_API_BASE_URL,
  VITE_APP_LOCAL_STORAGE_TOKEN_KEY,
  VITE_APP_LOCAL_STORAGE_EMAIL,
} = import.meta.env

export function useAuth() {
  // Login
  async function login(userEmail: string, userPassword: string) {
    const loginURL = `${VITE_APP_MAIN_API_BASE_URL}/login`
    const body = JSON.stringify({ email: userEmail, password: userPassword })
    try {
      const res = await fetch(loginURL, {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body,
      })

      const obj = await res.json()
      if (obj.data) {
        const { token, email } = obj.data
        localStorage.setItem(VITE_APP_LOCAL_STORAGE_TOKEN_KEY, token)
        localStorage.setItem(VITE_APP_LOCAL_STORAGE_EMAIL, email)
        return true
      }

      if (obj.error) return obj.error
      return 'Unable to login at the moment.'
    } catch (error) {
      return 'Unable to connect to the authentication server.'
    }
  }

  // Logout
  function logout(forced = false) {
    localStorage.setItem(VITE_APP_LOCAL_STORAGE_TOKEN_KEY, '')
    localStorage.setItem(VITE_APP_LOCAL_STORAGE_EMAIL, '')
    router.push(`/login${forced ? '?forcedLogout=1' : ''}`)
  }

  // Token
  function getToken() {
    return localStorage.getItem(VITE_APP_LOCAL_STORAGE_TOKEN_KEY)
  }

  return { login, logout, getToken }
}
