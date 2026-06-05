// Dùng relative URL để request qua Vite proxy → không có CORS issue
const BASE_URL = '/api/v1'

/**
 * Gọi API chung — tự động đính kèm cookie (credentials: 'include').
 */
async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  })

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
  fetch('/api/v1/partner-concepts', {
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
export const getBookings = () => apiFetch('/bookings')
export const getBooking = (id) => apiFetch(`/bookings/${id}`)
export const updateBookingStatus = (id, status) =>
  apiFetch(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })

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

export const signUp = (full_name, email, password, phone, role_id) =>
  apiFetch('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ full_name, email, password, phone, role_id }),
  })

export const signOut = () =>
  apiFetch('/auth/logout', {
    method: 'POST',
  })

export const getAuthStatus = () => apiFetch('/auth/me')

// ── Date Blocks ───────────────────────────────────────────────────────────────
export const getDateBlocks = () => apiFetch('/date-blocks')
export const createDateBlock = (partnerId, date) =>
  apiFetch('/date-blocks', {
    method: 'POST',
    body: JSON.stringify({ partner: { id: partnerId }, date_block: date }),
  })
export const deleteDateBlock = (id) => apiFetch(`/date-blocks/${id}`, { method: 'DELETE' })

// ── Payments ──────────────────────────────────────────────────────────────────
export const createPaymentUrl = (bookingId, paymentType = 'deposit') =>
  apiFetch('/payments/create-url', {
    method: 'POST',
    body: JSON.stringify({ booking_id: bookingId, payment_type: paymentType }),
  })

// ── AI Ideas ──────────────────────────────────────────────────────────────────
export const generateAiIdea = (prompt) =>
  apiFetch('/ai/generate-idea', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  })

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
