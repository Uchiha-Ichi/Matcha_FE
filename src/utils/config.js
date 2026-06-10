/**
 * Base URLs cho API và Socket — tự động chọn đúng môi trường:
 *  - Dev: sử dụng relative path (/api/v1) để đi qua Vite proxy (tránh CORS)
 *  - Production: sử dụng absolute URL từ env variable VITE_BACKEND_URL
 */
const isDev = import.meta.env.DEV

// HTTP base URL cho apiFetch
export const API_BASE_URL = isDev
  ? '/api/v1'
  : `${import.meta.env.VITE_BACKEND_URL}/api/v1`

// Socket.io base URL (không có /api/v1)
export const SOCKET_URL = isDev
  ? undefined   // undefined → socket.io-client tự kết nối về cùng origin (qua Vite proxy)
  : import.meta.env.VITE_BACKEND_URL
