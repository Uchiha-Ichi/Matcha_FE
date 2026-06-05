const AUTH_STORAGE_KEY = 'matcha_auth_user'
const AUTH_EVENT_NAME = 'matcha-auth-change'


export const getAuthUser = () => {
  try {
    const storedUser = window.localStorage.getItem(AUTH_STORAGE_KEY)
    return storedUser ? JSON.parse(storedUser) : null
  } catch {
    return null
  }
}

export const setAuthUser = (user) => {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
  window.dispatchEvent(new CustomEvent(AUTH_EVENT_NAME, { detail: user }))
}

export const clearAuthUser = () => {
  window.localStorage.removeItem(AUTH_STORAGE_KEY)
  window.dispatchEvent(new CustomEvent(AUTH_EVENT_NAME, { detail: null }))
}

export const subscribeAuthChange = (callback) => {
  const handleAuthChange = (event) => callback(event.detail ?? getAuthUser())
  window.addEventListener(AUTH_EVENT_NAME, handleAuthChange)
  window.addEventListener('storage', handleAuthChange)

  return () => {
    window.removeEventListener(AUTH_EVENT_NAME, handleAuthChange)
    window.removeEventListener('storage', handleAuthChange)
  }
}
