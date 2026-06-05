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

// ── Partners ──────────────────────────────────────────────────────────────────
export const getPartners = () => apiFetch('/partners')
export const getPartner = (id) => apiFetch(`/partners/${id}`)

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

export const signUp = (email, password) =>
  apiFetch('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

export const signOut = () =>
  apiFetch('/auth/logout', {
    method: 'POST',
  })

export const getAuthStatus = () => apiFetch('/auth/me')

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



