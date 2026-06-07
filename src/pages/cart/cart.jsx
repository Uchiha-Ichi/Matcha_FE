import { useEffect, useMemo, useState } from 'react'
import Footer from '../../components/Footer.jsx'
import Header from '../../components/Header.jsx'
import { getCart, removeCartItem, checkoutCart, validatePromoCode, getPromotions, createPaymentUrl, getPayment, closePaymentQr } from '../../utils/api.js'
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

const formatCountdown = (milliseconds) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}
const getQrExpiresAt = (qrPayment) => {
  if (!qrPayment) return Date.now()
  return qrPayment.payment?.expired_at
    ? new Date(qrPayment.payment.expired_at).getTime()
    : new Date(qrPayment.payment?.created_at ?? Date.now()).getTime() + 5 * 60 * 1000
}

const navigate = (event, path) => {
  event.preventDefault()
  if (window.location.pathname === path) return
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

/** Đọc booking times đã lưu từ localStorage */
function getBookingTimes() {
  try {
    return JSON.parse(localStorage.getItem('matcha_booking_times') ?? '{}')
  } catch {
    return {}
  }
}

/** Format ngày + giờ đẹp cho hiển thị */
function formatBookingDisplay(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null
  try {
    const date = new Date(`${dateStr}T${timeStr}:00`)
    const dayLabel = date.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' })
    return `${dayLabel} · ${timeStr}`
  } catch {
    return `${dateStr} · ${timeStr}`
  }
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
  const [checkingOut, setCheckingOut] = useState(false)
  const [checkoutMsg, setCheckoutMsg] = useState(null)
  const [bookingTimes, setBookingTimes] = useState({})
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(null) // null | { type, amount }
  const [showSuccessScreen, setShowSuccessScreen] = useState(false)
  const [qrPayment, setQrPayment] = useState(null)
  const [paymentResult, setPaymentResult] = useState(null)
  const [paymentNow, setPaymentNow] = useState(Date.now())

  const [promoCode, setPromoCode] = useState('')
  const [appliedPromo, setAppliedPromo] = useState(null)
  const [promoError, setPromoError] = useState(null)
  const [validatingPromo, setValidatingPromo] = useState(false)

  const [promotions, setPromotions] = useState([])
  const [loadingPromos, setLoadingPromos] = useState(false)

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

  useEffect(() => {
    loadCart()
    setBookingTimes(getBookingTimes())
  }, [])

  const selectedItems = cartItems.filter((item) => selected.has(item.id))
  const allSelected = cartItems.length > 0 && selectedItems.length === cartItems.length

  const subtotal = useMemo(
    () => selectedItems.reduce((total, item) => total + item.price, 0),
    [selectedItems],
  )

  const discount = useMemo(() => {
    if (!appliedPromo) return 0
    let amt = 0
    if (appliedPromo.discount_percentage > 0) {
      amt = subtotal * (appliedPromo.discount_percentage / 100)
    } else if (appliedPromo.discount_amount > 0) {
      amt = Number(appliedPromo.discount_amount)
    }
    if (appliedPromo.max_discount && amt > Number(appliedPromo.max_discount)) {
      amt = Number(appliedPromo.max_discount)
    }
    if (amt > subtotal) amt = subtotal
    return Math.round(amt)
  }, [appliedPromo, subtotal])

  const netTotal = subtotal - discount
  const deposit = Math.round(netTotal * 0.3)
  const remaining = netTotal - deposit

  const toggleItem = (id) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(cartItems.map((i) => i.id)))

  const handleRemove = async (itemId, partnerConceptId) => {
    try {
      await removeCartItem(itemId)
      setSelected((prev) => { const next = new Set(prev); next.delete(itemId); return next })
      // Xóa booking time tương ứng khỏi localStorage
      if (partnerConceptId) {
        const stored = getBookingTimes()
        delete stored[partnerConceptId]
        localStorage.setItem('matcha_booking_times', JSON.stringify(stored))
        setBookingTimes({ ...stored })
      }
      window.dispatchEvent(new CustomEvent('matcha-cart-change'))
      await loadCart()
    } catch (err) {
      alert('Không thể xóa dịch vụ: ' + err.message)
    }
  }

  const handleCheckout = () => {
    if (selectedItems.length === 0) return

    // Lấy booking time từ item đầu tiên được chọn
    const firstSelected = selectedItems[0]
    const bt = bookingTimes[firstSelected?.partnerConceptId]
    if (!bt?.date || !bt?.time) {
      alert('Không tìm thấy thông tin lịch chụp. Vui lòng quay lại trang dịch vụ để chọn ngày giờ.')
      return
    }

    // Reset promo states
    setPromoCode('')
    setAppliedPromo(null)
    setPromoError(null)

    // Load available promotions
    setLoadingPromos(true)
    getPromotions()
      .then((data) => {
        const active = (data || []).filter(
          (p) => p.is_active && (!p.expired_at || new Date(p.expired_at) > new Date())
        )
        setPromotions(active)
      })
      .catch((err) => console.error('Lỗi khi tải mã giảm giá:', err))
      .finally(() => setLoadingPromos(false))

    // Mở modal chọn hình thức thanh toán
    setShowPaymentModal(true)
  }

  const handleApplyPromo = async (e) => {
    e.preventDefault()
    const code = promoCode.trim().toUpperCase()
    if (!code) return

    setValidatingPromo(true)
    setPromoError(null)
    try {
      const promo = await validatePromoCode(code)
      setAppliedPromo(promo)
      setPromoCode('')
    } catch (err) {
      setPromoError(err.message || 'Mã giảm giá không hợp lệ')
      setAppliedPromo(null)
    } finally {
      setValidatingPromo(false)
    }
  }

  const handleRemovePromo = () => {
    setAppliedPromo(null)
    setPromoError(null)
  }

  const handleConfirmPayment = async (type) => {
    setShowPaymentModal(false)
    setCheckingOut(true)
    setCheckoutMsg(null)
    setPaymentResult(null)
    try {
      const firstSelected = selectedItems[0]
      const bt = bookingTimes[firstSelected?.partnerConceptId]
      const bookingTimeIso = bt.iso ?? new Date(`${bt.date}T${bt.time}:00`).toISOString()
      
      const bookings = await checkoutCart({ 
        booking_time: bookingTimeIso,
        promotion_id: appliedPromo ? appliedPromo.id : undefined
      })
      window.dispatchEvent(new CustomEvent('matcha-cart-change'))

      if (Array.isArray(bookings) && bookings.length > 0) {
        const amount = type === 'deposit' ? deposit : netTotal
        const paymentData = await createPaymentUrl(bookings[0].id, type)
        setQrPayment({
          ...paymentData,
          type,
          bookingId: bookings[0].id,
          amount: paymentData.amount ?? amount,
        })
      }

      await loadCart()
      setAppliedPromo(null)
    } catch (err) {
      setCheckoutMsg(err.message)
    } finally {
      setCheckingOut(false)
    }
  }

  const handleCloseQr = async () => {
    if (!qrPayment) return
    try {
      await closePaymentQr({
        paymentId: qrPayment.payment?.id,
        paymentLinkId: qrPayment.paymentLinkId,
        orderCode: qrPayment.orderCode,
      })
    } catch (err) {
      console.error('Không thể đóng QR thanh toán:', err)
    } finally {
      setQrPayment(null)
      setPaymentResult({
        status: 'cancelled',
        title: 'Đã đóng QR thanh toán',
        message: 'Mã QR đã được hủy. Bạn có thể tạo mã mới khi muốn thanh toán lại.',
      })
    }
  }

  const handleCheckQrPayment = async () => {
    if (!qrPayment?.payment?.id) return
    try {
      const payload = await getPayment(qrPayment.payment.id)
      const payment = payload?.payment ?? payload
      const status = payment?.status
      if (status === 'paid' || status === 'partially_paid') {
        setPaymentSuccess({ type: qrPayment.type, amount: Number(payment.amount_paid ?? qrPayment.amount) })
        setQrPayment(null)
        setShowSuccessScreen(true)
        await loadCart()
        return
      }
      setPaymentResult({
        status: 'pending',
        title: 'Chưa ghi nhận thanh toán',
        message: 'Giao dịch vẫn đang chờ xác nhận. Nếu bạn đã chuyển khoản, vui lòng thử kiểm tra lại sau vài giây.',
      })
    } catch (err) {
      setQrPayment(null)
      setPaymentResult({
        status: 'failed',
        title: 'QR không còn hiệu lực',
        message: err.message || 'Mã QR đã hết hạn hoặc đã bị hủy. Vui lòng tạo mã thanh toán mới.',
      })
    }
  }

  useEffect(() => {
    if (!qrPayment) return undefined
    setPaymentNow(Date.now())
    const timer = window.setInterval(() => setPaymentNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [qrPayment])


  useEffect(() => {
    if (!qrPayment?.payment?.id) return undefined

    let cancelled = false
    const pollQrPaymentStatus = async () => {
      try {
        const payload = await getPayment(qrPayment.payment.id)
        const payment = payload?.payment ?? payload
        const status = payment?.status
        if (cancelled || (status !== 'paid' && status !== 'partially_paid')) return

        setPaymentSuccess({ type: qrPayment.type, amount: Number(payment.amount_paid ?? qrPayment.amount) })
        setQrPayment(null)
        setShowSuccessScreen(true)
        await loadCart()
      } catch (err) {
        if (!cancelled && Date.now() >= getQrExpiresAt(qrPayment)) {
          setQrPayment(null)
          setPaymentResult({
            status: 'failed',
            title: 'QR không còn hiệu lực',
            message: err.message || 'Mã QR đã hết hạn hoặc đã bị hủy. Vui lòng tạo mã thanh toán mới.',
          })
        }
      }
    }

    pollQrPaymentStatus()
    const timer = window.setInterval(pollQrPaymentStatus, 3000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [qrPayment])
  const qrExpiresAt = getQrExpiresAt(qrPayment)
  const qrCountdown = formatCountdown(qrExpiresAt - paymentNow)
  const qrTransferContent = qrPayment?.payment?.raw_response?.data?.description
    ?? qrPayment?.payment?.description
    ?? qrPayment?.description
    ?? `Matcha booking ${qrPayment?.bookingId ?? ''}`
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
              {cartItems.map((item) => {
                const bt = bookingTimes[item.partnerConceptId]
                const bookingDisplay = bt ? formatBookingDisplay(bt.date, bt.time) : null
                return (
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
                        {bookingDisplay && (
                          <span className="cart-item__booking-time">🗓 {bookingDisplay}</span>
                        )}
                      </div>

                      <div className="cart-item__actions">
                        <button
                          type="button"
                          className="cart-remove"
                          onClick={() => handleRemove(item.id, item.partnerConceptId)}
                        >
                          🗑 Xóa khỏi giỏ
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
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

          {/* Hiển thị lịch đã đặt của các dịch vụ được chọn */}
          {selectedItems.length > 0 && (
            <div className="cart-booking-summary">
              <h3>
                <span>🗓</span> Lịch chụp đã chọn
              </h3>
              {selectedItems.map((item) => {
                const bt = bookingTimes[item.partnerConceptId]
                const display = bt ? formatBookingDisplay(bt.date, bt.time) : null
                return (
                  <div key={item.id} className="cart-booking-summary__row">
                    <span className="cart-booking-summary__name">{item.serviceName}</span>
                    {display ? (
                      <span className="cart-booking-summary__time">{display}</span>
                    ) : (
                      <span className="cart-booking-summary__missing">⚠ Chưa có lịch</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {paymentSuccess && (
            <div className="cart-checkout-success">
              ✓ {paymentSuccess.type === 'deposit'
                ? `Đặt cọc thành công! Bạn đã đặt cọc ${formatPrice(paymentSuccess.amount)}.`
                : `Thanh toán 100% thành công! Đã thanh toán ${formatPrice(paymentSuccess.amount)}.`
              }
              {' '}Ekip sẽ xác nhận lịch sớm.
            </div>
          )}
          {checkoutMsg && checkoutMsg !== 'success' && (
            <div className="cart-checkout-error">⚠ {checkoutMsg}</div>
          )}

          <button
            className="cart-checkout"
            type="button"
            disabled={selectedItems.length === 0 || checkingOut || !!paymentSuccess}
            onClick={handleCheckout}
          >
            {checkingOut
              ? <span className="cart-checkout-spinner"><span className="spinner-dot" /><span className="spinner-dot" /><span className="spinner-dot" /></span>
              : 'Tiếp tục thanh toán'
            }
          </button>
          <a className="cart-continue" href="/" onClick={(event) => navigate(event, '/')}>
            Chọn thêm dịch vụ
          </a>
        </aside>
      </section>

      <Footer />

      {/* ── Processing Overlay ────────────────────────────────────── */}
      {checkingOut && (
        <div className="payment-processing-overlay">
          <div className="payment-processing-box">
            <div className="payment-processing-spinner" />
            <p>Đang xử lý đặt lịch...</p>
          </div>
        </div>
      )}

      {/* ── Success Screen ────────────────────────────────────────── */}
      {showSuccessScreen && paymentSuccess && (
        <div className="payment-success-overlay">
          <div className="payment-success-card">
            <div className="payment-success-icon">
              <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="26" cy="26" r="25" stroke="#1bc48f" strokeWidth="2" fill="rgba(27,196,143,0.08)" />
                <path d="M15 26.5l8 8 14-16" stroke="#1bc48f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="success-checkmark" />
              </svg>
            </div>
            <h2>Thanh toán thành công!</h2>
            <p className="payment-success-type">
              {paymentSuccess.type === 'deposit' ? '💰 Đặt cọc 30%' : '✅ Thanh toán 100%'}
            </p>
            <div className="payment-success-amount">
              <span>Số tiền</span>
              <strong>{formatPrice(paymentSuccess.amount)}</strong>
            </div>
            <p className="payment-success-note">
              🎉 Đặt lịch thành công! Ekip của chúng tôi sẽ liên hệ xác nhận lịch chụp sớm nhất.
            </p>
            <div className="payment-success-actions">
              <button
                type="button"
                className="payment-success-btn payment-success-btn--primary"
                onClick={() => { setShowSuccessScreen(false) }}
              >
                Xem giỏ hàng
              </button>
              <a
                href="/"
                className="payment-success-btn payment-success-btn--secondary"
                onClick={(e) => { setShowSuccessScreen(false); navigate(e, '/') }}
              >
                Về trang chủ
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment Modal ─────────────────────────────────────────── */}

      {qrPayment && (
        <div className="payment-modal-overlay" onClick={handleCloseQr}>
          <div className="payment-modal payment-qr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="payment-modal__header">
              <h2>Quét QR để thanh toán</h2>
              <button className="payment-modal__close" type="button" onClick={handleCloseQr} aria-label="Đóng">×</button>
            </div>
            <div className="payment-qr-body">
              <img
                className="payment-qr-image"
                src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrPayment.qrCode)}`}
                alt="QR thanh toán payOS"
              />
              <div className="payment-qr-info">
                <span>Số tiền cần thanh toán</span>
                <strong>{formatPrice(Number(qrPayment.amount ?? 0))}</strong>
              </div>
              <div className="payment-qr-countdown">
                <span>Thời gian còn lại</span>
                <strong>{qrCountdown}</strong>
              </div>
              <div className="payment-qr-bank-info">
                <div><span>Ngân hàng</span><strong>BIDV</strong></div>
                <div><span>Thụ hưởng</span><strong>Hoàng Huy Nhật</strong></div>
                <div><span>Nội dung giao dịch</span><strong>{qrTransferContent}</strong></div>
              </div>              <div className="payment-qr-actions payment-qr-actions--single">
                <button type="button" onClick={handleCloseQr}>Đóng QR</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {paymentResult && !showSuccessScreen && (
        <div className="payment-modal-overlay" onClick={() => setPaymentResult(null)}>
          <div className="payment-result-card" onClick={(e) => e.stopPropagation()}>
            <h2>{paymentResult.title}</h2>
            <p>{paymentResult.message}</p>
            <button type="button" onClick={() => setPaymentResult(null)}>Đóng</button>
          </div>
        </div>
      )}
      {showPaymentModal && (
        <div className="payment-modal-overlay" onClick={() => { setShowPaymentModal(false); setAppliedPromo(null); setPromoCode(''); setPromoError(null); }}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="payment-modal__header">
              <h2>Chọn hình thức thanh toán</h2>
              <button
                className="payment-modal__close"
                type="button"
                onClick={() => { setShowPaymentModal(false); setAppliedPromo(null); setPromoCode(''); setPromoError(null); }}
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <div className="payment-modal__price-breakdown">
              <div className="price-row">
                <span>Tổng tiền:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="price-row price-row--discount">
                  <span>Giảm giá:</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="price-row price-row--total">
                <span>Thành tiền:</span>
                <strong>{formatPrice(netTotal)}</strong>
              </div>
            </div>

            {/* Khung nhập mã giảm giá */}
            <div className="payment-modal__promo-container">
              {!appliedPromo ? (
                <>
                  <form className="payment-modal__promo-form" onSubmit={handleApplyPromo}>
                    <input
                      type="text"
                      placeholder="Nhập mã giảm giá (VD: MATCHAFREE)..."
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      disabled={validatingPromo}
                    />
                    <button type="submit" disabled={validatingPromo || !promoCode.trim()}>
                      {validatingPromo ? 'Áp dụng...' : 'Áp dụng'}
                    </button>
                  </form>

                  {/* Chọn mã giảm giá khả dụng */}
                  <div className="payment-modal__promos-select">
                    <h3>Hoặc chọn mã giảm giá khả dụng:</h3>
                    {loadingPromos ? (
                      <p className="promos-loading">Đang tải mã giảm giá...</p>
                    ) : promotions.length === 0 ? (
                      <p className="promos-empty">Chưa có mã giảm giá nào khả dụng.</p>
                    ) : (
                      <div className="promos-coupon-grid">
                        {promotions.map((promo) => (
                          <button
                            key={promo.id}
                            type="button"
                            className="promo-coupon-card"
                            onClick={() => {
                              setAppliedPromo(promo);
                              setPromoError(null);
                            }}
                          >
                            <div className="coupon-left">
                              <strong>{promo.code}</strong>
                              <span>{promo.description || 'Giảm giá đặc biệt'}</span>
                            </div>
                            <div className="coupon-right">
                              <strong>
                                {promo.discount_percentage > 0
                                  ? `-${promo.discount_percentage}%`
                                  : `-${formatPrice(promo.discount_amount)}`
                                }
                              </strong>
                              <span>Áp dụng</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="payment-modal__promo-active">
                  <div className="promo-active-badge">
                    <span>🏷️</span>
                    <strong>{appliedPromo.code}</strong>
                    <span className="promo-active-discount">
                      (-{appliedPromo.discount_percentage > 0 
                        ? `${appliedPromo.discount_percentage}%` 
                        : formatPrice(appliedPromo.discount_amount)})
                    </span>
                  </div>
                  <button type="button" onClick={handleRemovePromo} className="promo-active-remove">
                    ✕ Gỡ
                  </button>
                </div>
              )}
              {promoError && <p className="promo-error-msg">{promoError}</p>}
            </div>

            <div className="payment-modal__options">
              {/* Đặt cọc */}
              <button
                type="button"
                className="payment-option payment-option--deposit"
                onClick={() => handleConfirmPayment('deposit')}
              >
                <span className="payment-option__icon">💰</span>
                <div className="payment-option__body">
                  <strong>Đặt cọc 30%</strong>
                  <span>{formatPrice(deposit)}</span>
                  <p>Thanh toán số còn lại {formatPrice(remaining)} sau khi xác nhận lịch</p>
                </div>
                <span className="payment-option__arrow">→</span>
              </button>

              {/* Thanh toán 100% */}
              <button
                type="button"
                className="payment-option payment-option--full"
                onClick={() => handleConfirmPayment('full')}
              >
                <span className="payment-option__icon">✅</span>
                <div className="payment-option__body">
                  <strong>Thanh toán 100%</strong>
                  <span>{formatPrice(netTotal)}</span>
                  <p>Thanh toán toàn bộ ngay, ưu tiên xếp lịch sớm hơn</p>
                </div>
                <span className="payment-option__arrow">→</span>
              </button>
            </div>

            <p className="payment-modal__note">
              🔒 Thanh toán được bảo mật và xử lý an toàn
            </p>
          </div>
        </div>
      )}
    </main>
  )
}

export default Cart
