/**
 * Base URLs cho API và Socket — tự động chọn đúng môi trường:
 *  - Dev: sử dụng relative path (/api/v1) để đi qua Vite proxy (tránh CORS)
 *  - Production: sử dụng absolute URL từ env variable VITE_BACKEND_URL
 */
const isDev = import.meta.env.DEV

const getCleanBackendUrl = () => {
  let url = (import.meta.env.VITE_BACKEND_URL || '').trim()
  
  // Remove trailing slash
  url = url.replace(/\/$/, '')
  
  if (!isDev && url) {
    // If it doesn't start with http or https, prepend https://
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`
    } else if (url.startsWith('http://')) {
      // Upgrade http to https to prevent Mixed Content block on HTTPS frontend
      url = url.replace(/^http:\/\//i, 'https://')
    }
  }
  return url
}

const backendUrl = getCleanBackendUrl()

// HTTP base URL cho apiFetch
export const API_BASE_URL = isDev
  ? '/api/v1'
  : `${backendUrl}/api/v1`

// Socket.io base URL (không có /api/v1)
export const SOCKET_URL = isDev
  ? undefined   // undefined → socket.io-client tự kết nối về cùng origin (qua Vite proxy)
  : backendUrl
