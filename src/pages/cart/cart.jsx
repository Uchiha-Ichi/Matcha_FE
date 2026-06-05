import { useEffect, useMemo, useState } from 'react'
import Footer from '../../components/Footer.jsx'
import Header from '../../components/Header.jsx'
import { getCart, removeCartItem, updateCartItem, checkoutCart, createPaymentUrl } from '../../utils/api.js'
import { getAuthUser } from '../../utils/auth.js'
import './cart.css'

const imageFallbacks = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80',
]

const formatPrice = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

const navigate = (event, path) => {
  event.preventDefault()
  if (window.location.pathname === path) return
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function CartSkeleton() {
  return (
    <div className="cart-list">
      {[1, 2, 3].map((i) => (
        <article key={i} className="cart-item cart-item--skeleton">
          <div className="skeleton-box cart-item__image" />
          <div className="cart-item__body">
            <div className="cart-item__heading">
              <div>
                <div className="skeleton-box" style={{ width: 80, height: 22, borderRadius: 12, marginBottom: 8 }} />
                <div className="skeleton-box" style={{ width: 220, height: 20, marginBottom: 8 }} />
                <div className="skeleton-box" style={{ width: 140, height: 16 }} />
              </div>
              <div className="skeleton-box" style={{ width: 100, height: 24 }} />
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

function Cart() {
  const authUser = getAuthUser()
  const [cartData, setCartData] = useState(null)       // raw cart from API
  const [selected, setSelected] = useState(new Set())  // Set of cart item IDs
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [checkingOut, setCheckingOut] = useState(false)
  const [checkoutMsg, setCheckoutMsg] = useState(null)

  // Normalise API cart items into display shape
  const cartItems = useMemo(() => {
    if (!cartData?.items) return []
    return cartData.items.map((item, index) => {
      const pc = item.partner_concept ?? {}
      const concept = pc.concept ?? {}
      const partner = pc.partner ?? {}
      return {
        id: item.id,
        partnerConceptId: pc.id,
        serviceName: concept.name ?? 'Dịch vụ Matcha',
        partnerName: partner.band_name ?? 'Matcha Studio',
        category: concept.name ?? '—',
        location: partner.location_name ?? 'Việt Nam',
        duration: pc.time ?? '—',
        price: Number(pc.price ?? 0),
        quantity: item.quantity ?? 1,
        image: pc.image_des ?? imageFallbacks[index % imageFallbacks.length],
      }
    })
  }, [cartData])

  const loadCart = async () => {
    if (!authUser) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const data = await getCart()
      setCartData(data)
      // Auto-select all items
      if (data?.items) {
        setSelected(new Set(data.items.map((i) => i.id)))
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCart() }, [])

  const selectedItems = cartItems.filter((item) => selected.has(item.id))
  const allSelected = cartItems.length > 0 && selectedItems.length === cartItems.length

  const subtotal = useMemo(
    () => selectedItems.reduce((total, item) => total + item.price * item.quantity, 0),
    [selectedItems],
  )
  const deposit = Math.round(subtotal * 0.3)
  const remaining = subtotal - deposit

  const toggleItem = (id) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(cartItems.map((i) => i.id)))

  const handleUpdateQuantity = async (item, direction) => {
    const newQty = Math.max(1, item.quantity + direction)
    try {
      await updateCartItem(item.id, newQty)
      window.dispatchEvent(new CustomEvent('matcha-cart-change'))
      await loadCart()
    } catch {
      /* silent – UI optimistic update not needed for simplicity */
    }
  }

  const handleRemove = async (itemId) => {
    try {
      await removeCartItem(itemId)
      setSelected((prev) => { const next = new Set(prev); next.delete(itemId); return next })
      window.dispatchEvent(new CustomEvent('matcha-cart-change'))
      await loadCart()
    } catch (err) {
      alert('Không thể xóa dịch vụ: ' + err.message)
    }
  }

  const handleCheckout = async () => {
    if (selectedItems.length === 0) return
    if (!bookingDate || !bookingTime) {
      alert('Vui lòng chọn đầy đủ ngày và giờ chụp ảnh để đặt lịch!')
      return
    }

    setCheckingOut(true)
    setCheckoutMsg(null)
    try {
      const bookingTimeIso = new Date(`${bookingDate}T${bookingTime}:00`).toISOString()
      const bookings = await checkoutCart({ booking_time: bookingTimeIso })

      window.dispatchEvent(new CustomEvent('matcha-cart-change'))

      if (bookings && bookings.length > 0) {
        // Lấy link thanh toán cọc VNPay (30%) cho booking đầu tiên
        const { url } = await createPaymentUrl(bookings[0].id, 'deposit')
        // Chuyển hướng sang VNPay
        window.location.href = url
      } else {
        setCheckoutMsg('success')
        await loadCart()
      }
    } catch (err) {
      setCheckoutMsg(err.message)
    } finally {
      setCheckingOut(false)
    }
  }

  // Not logged in
  if (!authUser) {
    return (
      <main className="cart-page">
        <Header />
        <section className="cart-hero">
          <div className="cart-hero__overlay" />
          <img
            src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1600&q=80"
            alt="Matcha cart cover"
            className="cart-hero__image"
          />
          <div className="cart-hero__content">
            <span className="cart-hero__badge">MATCHA CART</span>
            <h1>Giỏ hàng</h1>
            <p>Đăng nhập để xem giỏ hàng của bạn.</p>
          </div>
        </section>
        <div className="cart-login-prompt">
          <p>Bạn cần đăng nhập để sử dụng giỏ hàng.</p>
          <a href="/login" onClick={(e) => navigate(e, '/login')}>Đăng nhập ngay</a>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="cart-page">
      <Header />

      <section className="cart-hero">
        <div className="cart-hero__overlay" />
        <img
          src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1600&q=80"
          alt="Matcha cart cover"
          className="cart-hero__image"
        />
        <div className="cart-hero__content">
          <span className="cart-hero__badge">MATCHA CART</span>
          <h1>Giỏ hàng</h1>
          <p>Chọn các dịch vụ bạn muốn đặt lịch và kiểm tra tổng chi phí trước khi thanh toán.</p>
        </div>
      </section>

      <section className="cart-layout">
        <div className="cart-main">
          {!loading && (
            <div className="cart-toolbar">
              <label className="cart-check">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  disabled={cartItems.length === 0}
                />
                <span>Chọn tất cả</span>
              </label>
              <p>{selectedItems.length} dịch vụ đang được chọn</p>
            </div>
          )}

          {error && (
            <div className="cart-error">
              <p>⚠ {error}</p>
              <button type="button" onClick={loadCart}>Thử lại</button>
            </div>
          )}

          {loading ? (
            <CartSkeleton />
          ) : cartItems.length === 0 ? (
            <section className="cart-empty">
              <h2>Giỏ hàng đang trống</h2>
              <p>Hãy quay lại trang chủ để chọn thêm dịch vụ phù hợp với ý tưởng chụp ảnh của bạn.</p>
              <a href="/" onClick={(event) => navigate(event, '/')}>
                Khám phá dịch vụ
              </a>
            </section>
          ) : (
            <div className="cart-list">
              {cartItems.map((item) => (
                <article key={item.id} className="cart-item">
                  <label className="cart-item__select" aria-label={`Chọn ${item.serviceName}`}>
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggleItem(item.id)}
                    />
                  </label>

                  <img src={item.image} alt={item.serviceName} className="cart-item__image" />

                  <div className="cart-item__body">
                    <div className="cart-item__heading">
                      <div>
                        <span className="cart-item__tag">{item.category}</span>
                        <h2>{item.serviceName}</h2>
                        <p>{item.partnerName}</p>
                      </div>
                      <strong>{formatPrice(item.price)}</strong>
                    </div>

                    <div className="cart-item__meta">
                      {item.location && <span>📍 {item.location}</span>}
                      {item.duration && item.duration !== '—' && <span>⏱ {item.duration}</span>}
                    </div>

                    <div className="cart-item__actions">
                      <div className="cart-stepper" aria-label="Số lượng">
                        <button type="button" onClick={() => handleUpdateQuantity(item, -1)}>−</button>
                        <span>{item.quantity}</span>
                        <button type="button" onClick={() => handleUpdateQuantity(item, 1)}>+</button>
                      </div>

                      <button
                        type="button"
                        className="cart-remove"
                        onClick={() => handleRemove(item.id)}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="cart-summary">
          <h2>Tổng quan đơn hàng</h2>

          <dl className="cart-summary__list">
            <div>
              <dt>Dịch vụ đã chọn</dt>
              <dd>{selectedItems.length}</dd>
            </div>
            <div>
              <dt>Tạm tính</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div>
              <dt>Đặt cọc 30%</dt>
              <dd>{formatPrice(deposit)}</dd>
            </div>
            <div>
              <dt>Còn lại</dt>
              <dd>{formatPrice(remaining)}</dd>
            </div>
          </dl>

          {/* Widget chọn lịch chụp */}
          <div className="cart-scheduler" style={{
            background: '#fcfaf6',
            border: '1px solid #e2d7c9',
            borderRadius: '18px',
            padding: '16px',
            marginBottom: '20px',
            display: 'grid',
            gap: '12px'
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: '#1f1713', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🗓</span> Chọn lịch chụp ảnh
            </h3>
            
            <label style={{ display: 'grid', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#735f52' }}>Chọn ngày</span>
              <input
                type="date"
                value={bookingDate}
                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} // Từ ngày mai
                onChange={(e) => setBookingDate(e.target.value)}
                style={{
                  minHeight: '44px',
                  borderRadius: '12px',
                  border: '1px solid #e2d7c9',
                  padding: '0 12px',
                  background: '#fff',
                  fontFamily: 'inherit',
                  fontWeight: '700'
                }}
              />
            </label>
            
            <div style={{ display: 'grid', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#735f52' }}>Chọn khung giờ</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {['08:00', '10:00', '14:00', '16:00'].map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setBookingTime(slot)}
                    style={{
                      minHeight: '38px',
                      borderRadius: '10px',
                      border: '1px solid',
                      borderColor: bookingTime === slot ? '#1f1713' : '#e2d7c9',
                      background: bookingTime === slot ? '#1f1713' : '#fff',
                      color: bookingTime === slot ? '#fff' : '#6f6257',
                      fontSize: '13px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {checkoutMsg === 'success' && (
            <div className="cart-checkout-success">
              ✓ Đặt lịch thành công! Ekip sẽ xác nhận sớm.
            </div>
          )}
          {checkoutMsg && checkoutMsg !== 'success' && (
            <div className="cart-checkout-error">⚠ {checkoutMsg}</div>
          )}

          <button
            className="cart-checkout"
            type="button"
            disabled={selectedItems.length === 0 || checkingOut}
            onClick={handleCheckout}
          >
            {checkingOut ? 'Đang xử lý...' : 'Tiếp tục đặt lịch'}
          </button>
          <a className="cart-continue" href="/" onClick={(event) => navigate(event, '/')}>
            Chọn thêm dịch vụ
          </a>
        </aside>
      </section>

      <Footer />
    </main>
  )
}

export default Cart
