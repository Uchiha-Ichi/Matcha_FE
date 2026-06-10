import { API_BASE_URL } from './config.js'
// API_BASE_URL = '/api/v1' khi dev (qua Vite proxy), absolute URL khi production
const BASE_URL = API_BASE_URL
let refreshPromise = null

const shouldTryRefresh = (path) =>
  ![
    '/auth/signin',
    '/auth/signup',
    '/auth/logout',
    '/auth/refresh',
  ].includes(path)

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    }).finally(() => {
      refreshPromise = null
    })
  }

  const res = await refreshPromise
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message ?? `HTTP ${res.status}`)
  }

  return res.json()
}

/**
 * Gọi API chung — tự động đính kèm cookie (credentials: 'include').
 */
async function apiFetch(path, options = {}) {
  const requestOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  }

  let res = await fetch(`${BASE_URL}${path}`, requestOptions)

  if (res.status === 401 && shouldTryRefresh(path)) {
    try {
      await refreshAccessToken()
      res = await fetch(`${BASE_URL}${path}`, requestOptions)
    } catch {
      // Refresh token het han/khong hop le: giu nguyen loi 401 cua request ban dau.
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message ?? `HTTP ${res.status}`)
  }

  return res.json()
}

// ── Partner Concepts ───────────────────────────────────────────────────────────
export const getPartnerConcepts = () => apiFetch('/partner-concepts')
export const getPartnerConcept = (id) => apiFetch(`/partner-concepts/${id}`)
export const createPartnerConcept = (formData) =>
  fetch(`${BASE_URL}/partner-concepts`, {
    method: 'POST',
    credentials: 'include',
    body: formData, // FormData (no Content-Type header — browser sets boundary)
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }))
      throw new Error(err.message ?? `HTTP ${res.status}`)
    }
    return res.json()
  })
export const updatePartnerConcept = (id, dto) =>
  apiFetch(`/partner-concepts/${id}`, { method: 'PATCH', body: JSON.stringify(dto) })
export const deletePartnerConcept = (id) =>
  apiFetch(`/partner-concepts/${id}`, { method: 'DELETE' })

// ── Partners ──────────────────────────────────────────────────────────────────
export const getPartners = () => apiFetch('/partners')
export const getPartner = (id) => apiFetch(`/partners/${id}`)
export const createPartner = (dto) =>
  apiFetch('/partners', { method: 'POST', body: JSON.stringify(dto) })
export const updatePartner = (id, dto) =>
  apiFetch(`/partners/${id}`, { method: 'PATCH', body: JSON.stringify(dto) })
export const getPartnerCalendar = (id) => apiFetch(`/partners/${id}/calendar`)
export const getMyPartner = () => apiFetch('/partners/me')

// ── Concepts ──────────────────────────────────────────────────────────────────
export const getConcepts = () => apiFetch('/concepts')
export const getConcept = (id) => apiFetch(`/concepts/${id}`)

// ── Categories ────────────────────────────────────────────────────────────────
export const getCategories = () => apiFetch('/categories')

// ── Feedbacks ─────────────────────────────────────────────────────────────────
export const getFeedbacks = () => apiFetch('/feedbacks')
export const createFeedback = (dto) =>
  apiFetch('/feedbacks', { method: 'POST', body: JSON.stringify(dto) })

// ── Carts ─────────────────────────────────────────────────────────────────────
export const getCart = () => apiFetch('/carts')

export const addCartItem = (partnerConceptId, quantity = 1) =>
  apiFetch('/carts/items', {
    method: 'POST',
    body: JSON.stringify({ partner_concept_id: partnerConceptId, quantity }),
  })

export const updateCartItem = (itemId, quantity) =>
  apiFetch(`/carts/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
  })

export const removeCartItem = (itemId) =>
  apiFetch(`/carts/items/${itemId}`, { method: 'DELETE' })

export const clearCart = () => apiFetch('/carts', { method: 'DELETE' })

export const checkoutCart = (dto) =>
  apiFetch('/carts/checkout', {
    method: 'POST',
    body: JSON.stringify(dto),
  })

// ── Bookings ──────────────────────────────────────────────────────────────────
export const getBookings = (params = {}) => {
  const query = new URLSearchParams(params).toString()
  return apiFetch(`/bookings${query ? `?${query}` : ''}`)
}
export const getBooking = (id) => apiFetch(`/bookings/${id}`)
export const updateBookingStatus = (id, status) =>
  apiFetch(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
export const updateBooking = (id, dto) =>
  apiFetch(`/bookings/${id}`, { method: 'PATCH', body: JSON.stringify(dto) })

// ── Users ─────────────────────────────────────────────────────────────────────
export const getMe = () => apiFetch('/users/me')
export const updateMe = (dto) =>
  apiFetch('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(dto),
  })

// ── Auth ──────────────────────────────────────────────────────────────────────
export const signIn = (email, password) =>
  apiFetch('/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

export const signUp = (full_name, email, password, phone, role_id) => {
  const payload = { full_name, email, password, role_id }
  if (phone) payload.phone = phone
  return apiFetch('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const signOut = () =>
  apiFetch('/auth/logout', {
    method: 'POST',
  })

export const getAuthStatus = () => apiFetch('/auth/me')

// ── Chat ─────────────────────────────────────────────────────────────────────
export const getChatUnreadCount = () => apiFetch('/chat/unread-count')

// ── Date Blocks ───────────────────────────────────────────────────────────────
export const getDateBlocks = () => apiFetch('/date-blocks')
export const createDateBlock = (partnerId, date, startTime, endTime) =>
  apiFetch('/date-blocks', {
    method: 'POST',
    body: JSON.stringify({
      partner: { id: partnerId },
      date_block: date,
      start_time: startTime || undefined,
      end_time: endTime || undefined,
    }),
  })
export const deleteDateBlock = (id) => apiFetch(`/date-blocks/${id}`, { method: 'DELETE' })

// ── Payments ──────────────────────────────────────────────────────────────────
export const createPaymentUrl = (bookingId, paymentType = 'deposit') =>
  apiFetch('/payments/create-url', {
    method: 'POST',
    body: JSON.stringify({ booking_id: bookingId, payment_type: paymentType }),
  })

export const getPayment = (id) => apiFetch(`/payments/${id}`)

export const closePaymentQr = ({ paymentId, paymentLinkId, orderCode }) =>
  apiFetch('/payments/close-qr', {
    method: 'POST',
    body: JSON.stringify({
      payment_id: paymentId,
      payment_link_id: paymentLinkId,
      order_code: orderCode,
    }),
  })

/** Xác nhận thanh toán trực tiếp (không qua VNPay) — dùng cho demo */
export const mockConfirmPayment = (bookingId, paymentType = 'deposit') =>
  apiFetch('/payments/mock-confirm', {
    method: 'POST',
    body: JSON.stringify({ booking_id: bookingId, payment_type: paymentType }),
  })

// ── AI Ideas ──────────────────────────────────────────────────────────────────
export const generateAiIdea = (prompt) =>
  apiFetch('/ai/generate-idea', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  })

// ── Images ────────────────────────────────────────────────────────────────────
export const deleteImage = (id) => apiFetch(`/image/${id}`, { method: 'DELETE' })
export const setPrimaryImage = (id, targetType, targetId) =>
  apiFetch(`/image/${id}/set-primary`, {
    method: 'PATCH',
    body: JSON.stringify({ target_type: targetType, target_id: targetId }),
  })
export const addImageToTarget = (targetType, targetId, file) => {
  const formData = new FormData()
  formData.append('target_type', targetType)
  formData.append('target_id', String(targetId))
  formData.append('file', file)
  return fetch(`${BASE_URL}/image/add-to-target`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }))
      throw new Error(err.message ?? `HTTP ${res.status}`)
    }
    return res.json()
  })
}

export const uploadImage = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return fetch(`${BASE_URL}/image/upload`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }))
      throw new Error(err.message ?? `HTTP ${res.status}`)
    }
    return res.json()
  })
}

// ── Admin / Statistics ────────────────────────────────────────────────────────
export const getAdminStats = () => apiFetch('/statistics/dashboard')

// ── Users (admin) ─────────────────────────────────────────────────────────────
export const getUsers = () => apiFetch('/users')
export const updateUser = (id, dto) =>
  apiFetch(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(dto) })
export const deleteUser = (id) => apiFetch(`/users/${id}`, { method: 'DELETE' })

// ── Concepts (admin) ──────────────────────────────────────────────────────────
export const createConcept = (dto) =>
  apiFetch('/concepts', { method: 'POST', body: JSON.stringify(dto) })
export const updateConcept = (id, dto) =>
  apiFetch(`/concepts/${id}`, { method: 'PATCH', body: JSON.stringify(dto) })
export const deleteConcept = (id) => apiFetch(`/concepts/${id}`, { method: 'DELETE' })

// ── Categories (admin) ────────────────────────────────────────────────────────
export const createCategory = (dto) =>
  apiFetch('/categories', { method: 'POST', body: JSON.stringify(dto) })
export const updateCategory = (id, dto) =>
  apiFetch(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(dto) })
export const deleteCategory = (id) => apiFetch(`/categories/${id}`, { method: 'DELETE' })

// ── Notifications ─────────────────────────────────────────────────────────────
export const getNotifications = () => apiFetch('/notifications')
export const createNotification = (dto) =>
  apiFetch('/notifications', { method: 'POST', body: JSON.stringify(dto) })

// ── Feedbacks (admin) ────────────────────────────────────────────────────────
export const deleteFeedback = (id) => apiFetch(`/feedbacks/${id}`, { method: 'DELETE' })
export const updateFeedback = (id, dto) =>
  apiFetch(`/feedbacks/${id}`, { method: 'PATCH', body: JSON.stringify(dto) })

// ── Promotions ────────────────────────────────────────────────────────────────
export const validatePromoCode = (code) => apiFetch(`/promotions/validate/${code}`)
export const getPromotions = () => apiFetch('/promotions')
export const applyBookingPromotion = (bookingId, code) =>
  apiFetch(`/bookings/${bookingId}/apply-promotion`, {
    method: 'PATCH',
    body: JSON.stringify({ code }),
  })
