import { useCallback, useEffect, useMemo, useState } from 'react'
import Footer from '../../components/Footer.jsx'
import Header from '../../components/Header.jsx'
import { getBookings, updateBookingStatus, getPromotions, applyBookingPromotion, createPaymentUrl, getPayment, closePaymentQr, getFeedbacks, createFeedback, uploadImage } from '../../utils/api.js'
import { getAuthUser } from '../../utils/auth.js'
import { extractCityOrProvince } from '../../utils/helpers.js'
import './order_history.css'

const statusMeta = {
  all: { label: 'Tất cả' },
  pending: { label: 'Chờ xác nhận', tone: 'warning' },
  confirmed: { label: 'Đã xác nhận', tone: 'info' },
  completed: { label: 'Hoàn tất', tone: 'success' },
  cancelled: { label: 'Đã hủy', tone: 'muted' },
}

const paymentMeta = {
  paid: 'Đã thanh toán',
  partially_paid: 'Đã đặt cọc',
  pending: 'Đang chờ thanh toán',
  processing: 'Đang xử lý',
  unpaid: 'Chưa thanh toán',
}

const imageFallbacks = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
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

const formatDateTime = (value) => {
  if (!value) return '- '
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return value
  }
}

const navigate = (event, path) => {
  event.preventDefault()
  if (window.location.pathname === path) return
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

/** Normalise booking from API into display shape */
function normaliseBooking(booking, index) {
  const detail = booking.details?.[0]
  const pc = detail?.partner_concept ?? {}
  const concept = pc.concept ?? {}
  const partner = booking.partner ?? {}
  const payments = Array.isArray(booking.payments) ? booking.payments : []
  const activePayment = payments.find((p) => ['pending', 'processing'].includes(p.status)) ?? null
  const paidAmountFromPayments = payments
    .filter((p) => ['paid', 'partially_paid'].includes(p.status))
    .reduce((sum, p) => sum + Number(p.amount_paid ?? 0), 0)
  const grossPrice = Number(booking.price ?? 0)
  const discount = Number(booking.price_discount ?? 0)
  const netPrice = Math.max(0, grossPrice - discount)
  const paidAmount = booking.status === 'completed' && paidAmountFromPayments <= 0
    ? netPrice
    : Math.min(netPrice, paidAmountFromPayments)
  const remainingAmount = Math.max(0, netPrice - paidAmount)
  const paymentStatus = activePayment?.status
    ?? (paidAmount >= netPrice && netPrice > 0 ? 'paid' : paidAmount > 0 ? 'partially_paid' : 'unpaid')
  const payment = activePayment
    ?? payments.find((p) => p.status === paymentStatus)
    ?? payments[0]
    ?? null

  // pick image: partner concept image -> partner cover -> fallback
  const image =
    pc.image_des ||
    partner.cover_image ||
    imageFallbacks[index % imageFallbacks.length]

  return {
    id: booking.id,
    orderCode: `MTC-${String(booking.id).padStart(5, '0')}`,
    status: booking.status,
    paymentStatus,
    paymentId: payment?.id ?? null,
    paymentLinkId: payment?.payment_link_id ?? null,
    paymentOrderCode: payment?.order_code ?? null,
    serviceName: concept.name ?? 'Dịch vụ Matcha',
    partnerName: partner.band_name ?? 'Matcha Partner',
    partnerId: partner.id,
    location: extractCityOrProvince(partner.location_name),
    bookingTime: booking.booking_time,
    price: grossPrice,
    discount,
    netPrice,
    deposit: Number(booking.price_deposit ?? 0),
    paidAmount,
    remaining: remainingAmount,
    promotionCode: booking.promotion?.code ?? null,
    image,
    resultLink: booking.result_link ?? null,
    reviewTargets: (booking.details ?? []).map((item, detailIndex) => {
      const itemConcept = item.partner_concept?.concept ?? {}
      return {
        id: item.id,
        name: itemConcept.name ?? concept.name ?? `Dịch vụ ${detailIndex + 1}`,
      }
    }),
  }
}

function OrderSkeletonRow() {
  return (
    <article className="order-card order-card--skeleton">
      <div className="skeleton-box order-card__thumb" />
      <div className="order-card__body">
        <div className="order-card__top">
          <div>
            <div className="skeleton-box" style={{ width: 90, height: 16, marginBottom: 10 }} />
            <div className="skeleton-box" style={{ width: 220, height: 22, marginBottom: 8 }} />
            <div className="skeleton-box" style={{ width: 140, height: 16 }} />
          </div>
          <div className="skeleton-box" style={{ width: 90, height: 28, borderRadius: 12 }} />
        </div>
      </div>
    </article>
  )
}

function OrderHistory() {
  const authUser = getAuthUser()
  const authUserId = authUser?.id
  const [rawOrders, setRawOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeStatus, setActiveStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [paymentAlert, setPaymentAlert] = useState(null)
  const [payingOrder, setPayingOrder] = useState(null)
  const [payingUnpaidOrder, setPayingUnpaidOrder] = useState(null)
  const [cancellingOrder, setCancellingOrder] = useState(null)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [processingCancel, setProcessingCancel] = useState(false)
  const [qrPayment, setQrPayment] = useState(null)
  const [paymentResult, setPaymentResult] = useState(null)
  const [paymentNow, setPaymentNow] = useState(Date.now())
  const [reviewedDetailIds, setReviewedDetailIds] = useState(new Set())
  const [feedbackModal, setFeedbackModal] = useState(null)
  const [feedbackRating, setFeedbackRating] = useState(5)
  const [feedbackDescription, setFeedbackDescription] = useState('')
  const [feedbackImageFile, setFeedbackImageFile] = useState(null)
  const [submittingFeedback, setSubmittingFeedback] = useState(false)
  const [feedbackError, setFeedbackError] = useState(null)

  // Promo code states for payingUnpaidOrder modal
  const [promoCode, setPromoCode] = useState('')
  const [validatingPromo, setValidatingPromo] = useState(false)
  const [promoError, setPromoError] = useState(null)
  const [promotions, setPromotions] = useState([])
  const [loadingPromos, setLoadingPromos] = useState(false)

  const loadUserFeedbacks = useCallback(async () => {
    try {
      const data = await getFeedbacks()
      const ownFeedbacks = (Array.isArray(data) ? data : []).filter((fb) => fb.user?.id === authUserId)
      setReviewedDetailIds(new Set(
        ownFeedbacks
          .map((fb) => fb.booking_detail?.id)
          .filter(Boolean)
      ))
    } catch (err) {
      console.error('Lỗi khi tải danh sách đánh giá:', err)
    }
  }, [authUserId])

  const refreshOrders = useCallback(async () => {
    try {
      const [data] = await Promise.all([
        getBookings({ role: 'customer' }),
        loadUserFeedbacks(),
      ])
      setRawOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Lỗi khi tải lại danh sách đơn hàng:', err)
    }
  }, [loadUserFeedbacks])

  const openFeedbackModal = (order) => {
    const target = order.reviewTargets.find((item) => !reviewedDetailIds.has(item.id))
    if (!target) return
    setFeedbackModal({ order, target })
    setFeedbackRating(5)
    setFeedbackDescription('')
    setFeedbackImageFile(null)
    setFeedbackError(null)
  }

  const handleFeedbackImageChange = (event) => {
    const file = event.target.files?.[0]
    setFeedbackError(null)

    if (!file) {
      setFeedbackImageFile(null)
      return
    }

    if (!file.type.startsWith('image/')) {
      event.target.value = ''
      setFeedbackImageFile(null)
      setFeedbackError('Vui lòng chọn file ảnh hợp lệ.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      event.target.value = ''
      setFeedbackImageFile(null)
      setFeedbackError('Ảnh tối đa 5MB.')
      return
    }

    setFeedbackImageFile(file)
  }
  const handleSubmitFeedback = async (event) => {
    event.preventDefault()
    if (!feedbackModal?.target?.id || submittingFeedback) return

    setSubmittingFeedback(true)
    setFeedbackError(null)
    try {
      let uploadedImageUrl
      if (feedbackImageFile) {
        const payload = await uploadImage(feedbackImageFile)
        uploadedImageUrl = payload?.url
        if (!uploadedImageUrl) throw new Error('Không nhận được URL ảnh sau khi upload.')
      }

      await createFeedback({
        booking_detail_id: feedbackModal.target.id,
        rating: feedbackRating,
        description: feedbackDescription.trim() || undefined,
        image: uploadedImageUrl || undefined,
      })
      setReviewedDetailIds((current) => new Set([...current, feedbackModal.target.id]))
      setFeedbackModal(null)
      setPaymentAlert({
        status: 'success',
        title: 'Đã gửi đánh giá',
        message: `Cảm ơn bạn đã đánh giá ${feedbackModal.target.name}.`,
      })
      await loadUserFeedbacks()
    } catch (err) {
      setFeedbackError(err.message || 'Không thể gửi đánh giá. Vui lòng thử lại.')
    } finally {
      setSubmittingFeedback(false)
    }
  }

  const handleConfirmPayRemaining = async () => {
    if (!payingOrder) return
    setProcessingPayment(true)
    setPaymentResult(null)
    try {
      const paymentData = await createPaymentUrl(payingOrder.id, 'remaining')
      setQrPayment({
        ...paymentData,
        type: 'remaining',
        bookingId: payingOrder.id,
        orderCodeLabel: payingOrder.orderCode,
        amount: paymentData.amount ?? payingOrder.remaining,
      })
      setPayingOrder(null)
    } catch (err) {
      alert(`Thanh toán thất bại: ${err.message}`)
    } finally {
      setProcessingPayment(false)
    }
  }

  const handleConfirmPayUnpaid = async (type) => {
    if (!payingUnpaidOrder) return
    setProcessingPayment(true)
    setPaymentResult(null)
    try {
      const payAmount = type === 'deposit' ? payingUnpaidOrder.deposit : payingUnpaidOrder.netPrice
      const paymentData = await createPaymentUrl(payingUnpaidOrder.id, type)
      setQrPayment({
        ...paymentData,
        type,
        bookingId: payingUnpaidOrder.id,
        orderCodeLabel: payingUnpaidOrder.orderCode,
        amount: paymentData.amount ?? payAmount,
      })
      setPayingUnpaidOrder(null)
    } catch (err) {
      alert(`Thanh toán thất bại: ${err.message}`)
    } finally {
      setProcessingPayment(false)
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
        title: 'Đã đóng QR thanh toán',
        message: 'Mã QR đã được hủy. Bạn có thể tạo mã mới khi muốn thanh toán lại.',
      })
      await refreshOrders()
    }
  }

  const handleConfirmCancel = async () => {
    if (!cancellingOrder) return
    setProcessingCancel(true)
    try {
      await updateBookingStatus(cancellingOrder.id, 'cancelled')
      setPaymentAlert({
        status: 'success',
        message: `Đã hủy thành công đơn hàng ${cancellingOrder.orderCode}.`
      })
      await refreshOrders()
      setCancellingOrder(null)
    } catch (err) {
      alert(`Hủy đơn hàng thất bại: ${err.message}`)
    } finally {
      setProcessingCancel(false)
    }
  }

  const handleApplyPromoToBooking = async (code) => {
    if (!payingUnpaidOrder) return
    setValidatingPromo(true)
    setPromoError(null)
    try {
      await applyBookingPromotion(payingUnpaidOrder.id, code)
      const data = await getBookings({ role: 'customer' })
      const updated = Array.isArray(data) ? data : []
      setRawOrders(updated)

      // Sync lại payingUnpaidOrder từ data mới nhất
      const freshRaw = updated.find(b => b.id === payingUnpaidOrder.id)
      if (freshRaw) {
        const idx = updated.indexOf(freshRaw)
        setPayingUnpaidOrder(normaliseBooking(freshRaw, idx))
      }

      setPromoCode('')
    } catch (err) {
      setPromoError(err.message || 'Mã giảm giá không hợp lệ')
    } finally {
      setValidatingPromo(false)
    }
  }



  // Load promotions when the payingUnpaidOrder modal is shown
  useEffect(() => {
    if (!payingUnpaidOrder) return

    setPromoCode('')
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
  }, [payingUnpaidOrder])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const paymentStatus = params.get('paymentStatus')
    const message = params.get('message')
    if (paymentStatus) {
      setPaymentAlert({
        status: paymentStatus,
        message: paymentStatus === 'success'
          ? 'Đặt cọc / Thanh toán đơn hàng thành công! Ekip đã ghi nhận lịch chụp.'
          : message || 'Thanh toán thất bại hoặc đã bị hủy.'
      })
      // Clear URL params so reload doesn't trigger alert again
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])


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

        setQrPayment(null)
        setPaymentAlert({
          status: 'success',
          message: `Thanh toán thành công ${formatPrice(Number(payment.amount_paid ?? qrPayment.amount))} cho đơn hàng ${qrPayment.orderCodeLabel || qrPayment.bookingId}!`,
        })
        await refreshOrders()
      } catch (err) {
        if (!cancelled && Date.now() >= getQrExpiresAt(qrPayment)) {
          setQrPayment(null)
          setPaymentResult({
            title: 'QR không còn hiệu lực',
            message: err.message || 'Mã QR đã hết hạn hoặc đã bị hủy. Vui lòng tạo mã thanh toán mới.',
          })
          await refreshOrders()
        }
      }
    }

    pollQrPaymentStatus()
    const timer = window.setInterval(pollQrPaymentStatus, 3000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [qrPayment, refreshOrders])
  const qrExpiresAt = getQrExpiresAt(qrPayment)
  const qrCountdown = formatCountdown(qrExpiresAt - paymentNow)
  const qrTransferContent = qrPayment?.payment?.raw_response?.data?.description
    ?? qrPayment?.payment?.description
    ?? qrPayment?.description
    ?? `Matcha booking ${qrPayment?.bookingId ?? ''}`
  const handleChatClick = (event, order) => {
    event.preventDefault()
    window.history.pushState({
      partnerId: order.partnerId,
      bookingId: order.id,
      serviceName: order.serviceName,
      partnerName: order.partnerName
    }, '', '/chat')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  useEffect(() => {
    if (!authUserId) { setLoading(false); return }

    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const [data, feedbacks] = await Promise.all([
          getBookings({ role: 'customer' }),
          getFeedbacks().catch(() => []),
        ])
        if (!cancelled) {
          setRawOrders(Array.isArray(data) ? data : [])
          const ownFeedbacks = (Array.isArray(feedbacks) ? feedbacks : []).filter((fb) => fb.user?.id === authUserId)
          setReviewedDetailIds(new Set(
            ownFeedbacks
              .map((fb) => fb.booking_detail?.id)
              .filter(Boolean)
          ))
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [authUserId])

  const orders = useMemo(
    () => rawOrders.map((b, i) => normaliseBooking(b, i)),
    [rawOrders],
  )

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = activeStatus === 'all' || order.status === activeStatus
    const hay = `${order.orderCode} ${order.serviceName} ${order.partnerName}`.toLowerCase()
    return matchesStatus && hay.includes(searchTerm.trim().toLowerCase())
  }).reverse()

  const totalSpent = orders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + o.price - o.discount, 0)

  const pendingCount = orders.filter((o) => o.status === 'pending').length

  const nextBooking = orders
    .filter((o) => o.status === 'confirmed' || o.status === 'pending')
    .sort((a, b) => new Date(a.bookingTime) - new Date(b.bookingTime))[0]

  if (!authUser) {
    return (
      <main className="order-history-page">
        <Header />
        <section className="order-history-hero">
          <div>
            <span>LỊCH SỬ ĐƠN HÀNG</span>
            <h1>Theo dõi các buổi chụp đã đặt</h1>
          </div>
        </section>
        <div className="order-history-login-prompt">
          <p>Bạn cần đăng nhập để xem lịch sử đơn hàng.</p>
          <a href="/login" onClick={(e) => navigate(e, '/login')}>Đăng nhập ngay</a>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="order-history-page">
      <Header />

      <section className="order-history-hero">
        <div>
          <span>LỊCH SỬ ĐƠN HÀNG</span>
          <h1>Theo dõi các buổi chụp đã đặt</h1>
          <p>
            Quản lý trạng thái đặt lịch, thanh toán, đặt cọc và xem lại thông tin ekip
            trong một màn hình.
          </p>
        </div>
      </section>

      <section className="order-history-layout">
        <div className="order-history-main">
          <div className="order-history-toolbar">
            <div className="order-history-tabs" role="tablist" aria-label="Lọc đơn hàng">
              {Object.entries(statusMeta).map(([status, meta]) => (
                <button
                  key={status}
                  type="button"
                  className={activeStatus === status ? 'order-history-tab--active' : ''}
                  onClick={() => setActiveStatus(status)}
                >
                  {meta.label}
                </button>
              ))}
            </div>

            <label className="order-history-search">
              <span aria-hidden="true">⌕</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tìm mã đơn, dịch vụ, studio..."
              />
            </label>
          </div>

          {error && (
            <div className="order-error">⚠ Không thể tải đơn hàng: {error}</div>
          )}

          <div className="order-history-list">
            {loading ? (
              [1, 2, 3].map((i) => <OrderSkeletonRow key={i} />)
            ) : filteredOrders.length === 0 ? (
              <section className="order-history-empty">
                <h2>{error ? 'Không thể tải dữ liệu' : 'Không tìm thấy đơn hàng'}</h2>
                <p>Thử đổi bộ lọc hoặc từ khóa tìm kiếm để xem các đơn khác.</p>
              </section>
            ) : (
              filteredOrders.map((order) => {
                const statusInfo = statusMeta[order.status] ?? statusMeta.pending
                const canReview = order.status === 'completed'
                const reviewableCount = order.reviewTargets.filter((item) => !reviewedDetailIds.has(item.id)).length
                return (
                  <article key={order.id} className="order-card">
                    <div className="order-card__img-wrapper">
                      <img src={order.image} alt={order.serviceName} />
                    </div>

                    <div className="order-card__body">
                      <div className="order-card__top">
                        <div>
                          <span className="order-card__code">{order.orderCode}</span>
                          <h2>{order.serviceName}</h2>
                          <p>{order.partnerName}</p>
                        </div>
                        <span className={`order-status order-status--${statusInfo.tone}`}>
                          {statusInfo.label}
                        </span>
                      </div>

                      <div className="order-card__meta">
                        <span>{formatDateTime(order.bookingTime)}</span>
                        {order.location !== '-' && <span>📍 {order.location}</span>}
                        <span>{paymentMeta[order.paymentStatus] ?? order.paymentStatus}</span>
                      </div>

                      <dl className="order-card__prices">
                        <div><dt>Tổng tiền</dt><dd>{formatPrice(order.price)}</dd></div>
                        <div><dt>Giảm giá</dt><dd>{formatPrice(order.discount)}</dd></div>
                        <div><dt>Thành tiền</dt><dd>{formatPrice(order.netPrice)}</dd></div>
                        <div><dt>Đã thanh toán</dt><dd>{formatPrice(order.paidAmount)}</dd></div>
                        <div><dt>Còn lại</dt><dd>{formatPrice(order.remaining)}</dd></div>
                      </dl>

                      <div className="order-card__actions" style={{ flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                        {order.promotionCode && (
                          <span className="order-card__promo">Mã giảm: {order.promotionCode}</span>
                        )}
                        <a href="/chat" onClick={(event) => handleChatClick(event, order)}>
                          Nhắn ekip
                        </a>
                        {order.resultLink && (
                          <a
                            href={order.resultLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              background: '#b24b2a',
                              color: '#fff',
                              border: 'none',
                              padding: '8px 16px',
                              borderRadius: '999px',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              transition: 'background 0.2s',
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = '#d15c38' }}
                            onMouseOut={(e) => { e.currentTarget.style.background = '#b24b2a' }}
                          >
                            📸 Xem ảnh / sản phẩm
                          </a>
                        )}

                        {/* Spacer to align subsequent buttons to the right */}
                        <div style={{ marginLeft: 'auto' }} />

                        {order.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => setCancellingOrder(order)}
                            style={{
                              background: '#fff',
                              color: '#b24b2a',
                              border: '1.5px solid #f5c6c0',
                              padding: '7px 16px',
                              borderRadius: '999px',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = '#fff3f0'
                              e.currentTarget.style.borderColor = '#b24b2a'
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = '#fff'
                              e.currentTarget.style.borderColor = '#f5c6c0'
                            }}
                          >
                            Hủy đơn
                          </button>
                        )}

                        {order.status === 'pending' && order.paymentStatus === 'unpaid' && (
                          <button
                            type="button"
                            className="order-card__btn-pay"
                            onClick={() => setPayingUnpaidOrder(order)}
                            style={{
                              background: '#009b72',
                              color: '#fff',
                              border: 'none',
                              padding: '8px 16px',
                              borderRadius: '999px',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = '#007d5b' }}
                            onMouseOut={(e) => { e.currentTarget.style.background = '#009b72' }}
                          >
                            Thanh toán ngay
                          </button>
                        )}

                        {order.paymentStatus === 'partially_paid' && order.remaining > 0 && (
                          <button
                            type="button"
                            className="order-card__btn-pay"
                            onClick={() => setPayingOrder(order)}
                            style={{
                              background: '#1f1713',
                              color: '#fff',
                              border: 'none',
                              padding: '8px 16px',
                              borderRadius: '999px',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = '#3c2e27' }}
                            onMouseOut={(e) => { e.currentTarget.style.background = '#1f1713' }}
                          >
                            Thanh toán nốt ({formatPrice(order.remaining)})
                          </button>
                        )}

                        {canReview && reviewableCount > 0 && (
                          <button
                            type="button"
                            className="order-card__btn-feedback"
                            onClick={() => openFeedbackModal(order)}
                          >
                            Đánh giá
                          </button>
                        )}

                        {canReview && order.reviewTargets.length > 0 && reviewableCount === 0 && (
                          <span className="order-card__feedback-done">Đã đánh giá</span>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })
            )}
          </div>
        </div>

        <aside className="order-history-summary">
          <h2>Tổng quan</h2>

          <dl>
            <div><dt>Tổng đơn</dt><dd>{orders.length}</dd></div>
            <div><dt>Đang chờ</dt><dd>{pendingCount}</dd></div>
            <div><dt>Đã chi tiêu</dt><dd>{formatPrice(totalSpent)}</dd></div>
          </dl>

          <section className="order-next-card">
            <span>Lịch gần nhất</span>
            {loading ? (
              <div className="skeleton-box" style={{ width: '100%', height: 40, marginTop: 8 }} />
            ) : nextBooking ? (
              <>
                <strong>{nextBooking.serviceName}</strong>
                <p>{formatDateTime(nextBooking.bookingTime)}</p>
              </>
            ) : (
              <p>Chưa có lịch sắp tới.</p>
            )}
          </section>

          <a href="/" onClick={(event) => navigate(event, '/')}>
            Đặt thêm dịch vụ
          </a>
        </aside>
      </section>

      {feedbackModal && (
        <div className="order-feedback-modal" role="dialog" aria-modal="true" aria-labelledby="order-feedback-title">
          <form className="order-feedback-panel" onSubmit={handleSubmitFeedback}>
            <div className="order-feedback-panel__head">
              <span>Feedback</span>
              <h3 id="order-feedback-title">Đánh giá dịch vụ</h3>
              <p>{feedbackModal.order.orderCode} · {feedbackModal.target.name}</p>
            </div>

            <div className="order-feedback-stars" role="radiogroup" aria-label="Chọn số sao">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={star <= feedbackRating ? 'order-feedback-star--active' : ''}
                  aria-label={`${star} sao`}
                  aria-pressed={star === feedbackRating}
                  onClick={() => setFeedbackRating(star)}
                >
                  ★
                </button>
              ))}
            </div>

            <label className="order-feedback-field">
              <span>Nội dung đánh giá</span>
              <textarea
                value={feedbackDescription}
                onChange={(event) => setFeedbackDescription(event.target.value)}
                rows={4}
                maxLength={500}
                placeholder="Chia sẻ trải nghiệm của bạn..."
              />
            </label>

            <label className="order-feedback-field">
              <span>Ảnh minh họa (tùy chọn)</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFeedbackImageChange}
                disabled={submittingFeedback}
              />
              {feedbackImageFile && (
                <small className="order-feedback-file-name">{feedbackImageFile.name}</small>
              )}
            </label>

            {feedbackError && <p className="order-feedback-error">{feedbackError}</p>}

            <div className="order-feedback-actions">
              <button
                type="button"
                className="order-feedback-cancel"
                onClick={() => setFeedbackModal(null)}
                disabled={submittingFeedback}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="order-feedback-submit"
                disabled={submittingFeedback}
              >
                {submittingFeedback ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
            </div>
          </form>
        </div>
      )}

      {paymentAlert && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '24px',
            maxWidth: '480px',
            width: '100%',
            padding: '30px',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
            border: '1px solid #e2d7c9'
          }}>
            <span style={{
              fontSize: '48px',
              display: 'block',
              marginBottom: '16px'
            }}>
              {paymentAlert.status === 'success' ? '✅' : '❌'}
            </span>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '800',
              marginBottom: '12px',
              color: '#1f1713'
            }}>
              {paymentAlert.title ?? (paymentAlert.status === 'success' ? 'Thanh toán thành công' : 'Thanh toán thất bại')}
            </h3>
            <p style={{
              fontSize: '15px',
              color: '#6f6257',
              lineHeight: '1.6',
              marginBottom: '24px'
            }}>
              {paymentAlert.message}
            </p>
            <button
              type="button"
              onClick={() => setPaymentAlert(null)}
              style={{
                background: '#1f1713',
                color: '#fff',
                border: 'none',
                padding: '12px 30px',
                borderRadius: '999px',
                fontSize: '15px',
                fontWeight: '800',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}


      {qrPayment && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 20 }} onClick={handleCloseQr}>
          <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 460, padding: 28, textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.18)' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px', color: '#1f1713', fontSize: 22 }}>Quét QR để thanh toán</h3>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrPayment.qrCode)}`} alt="QR thanh toán payOS" style={{ width: 260, height: 260, maxWidth: '100%', border: '1px solid #eadfce', borderRadius: 16, padding: 10, background: '#fff' }} />
            <div style={{ marginTop: 16, display: 'grid', gap: 4 }}>
              <span style={{ color: '#7b6b5d', fontSize: 13 }}>Số tiền cần thanh toán</span>
              <strong style={{ color: '#0f1412', fontSize: 24 }}>{formatPrice(Number(qrPayment.amount ?? 0))}</strong>
            </div>
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 14, background: '#f7f1ea', display: 'inline-grid', gap: 2 }}>
              <span style={{ color: '#7b6b5d', fontSize: 12, fontWeight: 700 }}>Thời gian còn lại</span>
              <strong style={{ color: '#b24b2a', fontSize: 22 }}>{qrCountdown}</strong>
            </div>
            <div style={{ marginTop: 16, display: 'grid', gap: 10, textAlign: 'left', background: '#fbf9f6', border: '1px solid #eadfce', borderRadius: 16, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: '#7b6b5d' }}>Ngân hàng</span>
                <strong>{qrPayment?.bankName || 'BIDV'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: '#7b6b5d' }}>Số tài khoản</span>
                <strong 
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }} 
                  onClick={() => {
                    if (qrPayment?.accountNumber) {
                      navigator.clipboard.writeText(qrPayment.accountNumber);
                      alert('Đã sao chép số tài khoản ảo!');
                    }
                  }}
                  title="Bấm để sao chép"
                >
                  {qrPayment?.accountNumber || '—'} 📋
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: '#7b6b5d' }}>Thụ hưởng</span>
                <strong>{qrPayment?.accountName || 'Hoàng Huy Nhật'}</strong>
              </div>
              <div style={{ display: 'grid', gap: 4 }}>
                <span style={{ color: '#7b6b5d' }}>Nội dung giao dịch</span>
                <strong 
                  style={{ wordBreak: 'break-word', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  onClick={() => {
                    navigator.clipboard.writeText(qrTransferContent);
                    alert('Đã sao chép nội dung chuyển khoản!');
                  }}
                  title="Bấm để sao chép"
                >
                  {qrTransferContent} 📋
                </strong>
              </div>
            </div>            <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
              <button type="button" onClick={handleCloseQr} style={{ flex: 1, border: 0, borderRadius: 999, padding: '12px 16px', background: '#1f1713', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Đóng QR</button>
            </div>
          </div>
        </div>
      )}

      {paymentResult && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 20 }} onClick={() => setPaymentResult(null)}>
          <div style={{ background: '#fff', borderRadius: 22, width: '100%', maxWidth: 420, padding: 28, textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.16)' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 10px', color: '#1f1713' }}>{paymentResult.title}</h3>
            <p style={{ color: '#6f6257', lineHeight: 1.6 }}>{paymentResult.message}</p>
            <button type="button" onClick={() => setPaymentResult(null)} style={{ width: '100%', border: 0, borderRadius: 999, padding: '12px 20px', background: '#1f1713', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Đóng</button>
          </div>
        </div>
      )}
      {payingOrder && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '24px',
            maxWidth: '480px',
            width: '100%',
            padding: '30px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
            border: '1px solid #e2d7c9'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '800',
              marginBottom: '16px',
              color: '#1f1713'
            }}>
              Thanh toán số tiền còn lại
            </h3>
            <p style={{
              fontSize: '15px',
              color: '#6f6257',
              lineHeight: '1.6',
              marginBottom: '20px'
            }}>
              Bạn có chắc chắn muốn thanh toán số tiền còn lại cho đơn hàng <strong>{payingOrder.orderCode}</strong>?
            </p>
            <div style={{
              background: '#fcfbf9',
              border: '1px solid #e2d7c9',
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#8c7e74' }}>Dịch vụ:</span>
                <span style={{ fontWeight: '600', color: '#1f1713' }}>{payingOrder.serviceName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#8c7e74' }}>Số tiền còn lại:</span>
                <span style={{ fontWeight: '800', color: '#b24b2a' }}>{formatPrice(payingOrder.remaining)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setPayingOrder(null)}
                disabled={processingPayment}
                style={{
                  background: '#f5f0eb',
                  color: '#6f6257',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '999px',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmPayRemaining}
                disabled={processingPayment}
                style={{
                  background: '#1f1713',
                  color: '#fff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '999px',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                {processingPayment ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {payingUnpaidOrder && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '24px',
            maxWidth: '480px',
            width: '100%',
            padding: '30px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
            border: '1px solid #e2d7c9',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '800',
              marginBottom: '16px',
              color: '#1f1713'
            }}>
              Thanh toán đơn hàng
            </h3>
            <p style={{
              fontSize: '15px',
              color: '#6f6257',
              lineHeight: '1.6',
              marginBottom: '20px'
            }}>
              Vui lòng chọn hình thức thanh toán cho đơn hàng <strong>{payingUnpaidOrder.orderCode}</strong> ({payingUnpaidOrder.serviceName}):
            </p>

            {/* Price breakdown */}
            <div className="sd-modal__price-breakdown" style={{
              background: '#fbf9f6',
              border: '1.5px solid #e8decb',
              borderRadius: '20px',
              padding: '16px',
              marginBottom: '20px',
              display: 'grid',
              gap: '10px'
            }}>
              <div className="sd-price-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#6c584c' }}>
                <span>Tổng tiền:</span>
                <span>{formatPrice(payingUnpaidOrder.price)}</span>
              </div>
              {payingUnpaidOrder.discount > 0 && (
                <div className="sd-price-row sd-price-row--discount" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#c0392b', fontWeight: '700' }}>
                  <span>Giảm giá:</span>
                  <span>-{formatPrice(payingUnpaidOrder.discount)}</span>
                </div>
              )}
              <div className="sd-price-row sd-price-row--total" style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #e8decb', paddingTop: '10px', marginTop: '4px', color: '#161310', fontSize: '15px', fontWeight: '700' }}>
                <span>Thành tiền:</span>
                <strong style={{ fontSize: '18px', color: '#009b72' }}>{formatPrice(payingUnpaidOrder.netPrice)}</strong>
              </div>
              <div className="sd-price-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#6c584c' }}>
                <span>Đã thanh toán:</span>
                <span>{formatPrice(payingUnpaidOrder.paidAmount)}</span>
              </div>
              <div className="sd-price-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#6c584c' }}>
                <span>Còn lại:</span>
                <span>{formatPrice(payingUnpaidOrder.remaining)}</span>
              </div>
            </div>

            {/* Promo Container */}
            <div className="sd-modal__promo-container" style={{
              marginBottom: '24px',
              padding: '14px 16px',
              background: '#fff',
              border: '1.5px dashed #d6c5b0',
              borderRadius: '20px'
            }}>
              {!payingUnpaidOrder.promotionCode ? (
                <>
                  <form
                    className="sd-modal__promo-form"
                    onSubmit={(e) => {
                      e.preventDefault()
                      const code = promoCode.trim().toUpperCase()
                      if (code) handleApplyPromoToBooking(code)
                    }}
                    style={{ display: 'flex', gap: '10px' }}
                  >
                    <input
                      type="text"
                      placeholder="Nhập mã giảm giá (VD: MATCHAFREE)..."
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      disabled={validatingPromo}
                      style={{
                        flex: 1,
                        minHeight: '40px',
                        border: '1px solid #d6c5b0',
                        borderRadius: '12px',
                        background: '#faf8f5',
                        padding: '0 12px',
                        fontSize: '13.5px',
                        color: '#1f1713',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}
                    />
                    <button
                      type="submit"
                      disabled={validatingPromo || !promoCode.trim()}
                      style={{
                        padding: '0 16px',
                        borderRadius: '12px',
                        border: 'none',
                        background: '#1f1713',
                        color: '#fff',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      {validatingPromo ? 'Áp dụng...' : 'Áp dụng'}
                    </button>
                  </form>

                  {/* List of selectable promos */}
                  <div className="sd-modal__promos-select" style={{ marginTop: '18px', borderTop: '1px dashed #efe8df', paddingTop: '16px' }}>
                    <h3 style={{ margin: '0 0 12px', fontSize: '13.5px', fontWeight: '700', color: '#69584c' }}>
                      Hoặc chọn mã giảm giá khả dụng:
                    </h3>
                    {loadingPromos ? (
                      <p className="sd-promos-loading" style={{ fontSize: '13px', color: '#9c8a7c', margin: 0, fontStyle: 'italic' }}>Đang tải mã giảm giá...</p>
                    ) : promotions.length === 0 ? (
                      <p className="sd-promos-empty" style={{ fontSize: '13px', color: '#9c8a7c', margin: 0, fontStyle: 'italic' }}>Chưa có mã giảm giá nào khả dụng.</p>
                    ) : (
                      <div className="sd-promos-coupon-grid" style={{ display: 'grid', gap: '10px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                        {promotions.map((promo) => (
                          <button
                            key={promo.id}
                            type="button"
                            className="sd-promo-coupon-card"
                            onClick={() => handleApplyPromoToBooking(promo.code)}
                            style={{
                              width: '100%',
                              display: 'flex',
                              background: '#fdfcfb',
                              border: '1px dashed #d6c5b0',
                              borderRadius: '12px',
                              padding: 0,
                              overflow: 'hidden',
                              cursor: 'pointer',
                              textAlign: 'left'
                            }}
                          >
                            <div className="sd-coupon-left" style={{
                              flex: 1,
                              padding: '12px 14px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              borderRight: '1px dashed #d6c5b0'
                            }}>
                              <strong style={{ fontSize: '14px', color: '#1f1713', letterSpacing: '0.03em' }}>{promo.code}</strong>
                              <span style={{ fontSize: '11px', color: '#7b6b5d', marginTop: '4px', lineHeight: 1.3 }}>{promo.description || 'Giảm giá đặc biệt'}</span>
                            </div>
                            <div className="sd-coupon-right" style={{
                              width: '90px',
                              padding: '12px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'rgba(0, 155, 114, 0.03)',
                              color: '#009b72',
                              flexShrink: 0
                            }}>
                              <strong style={{ fontSize: '14px', fontWeight: '800', display: 'block' }}>
                                {promo.discount_percentage > 0
                                  ? `-${promo.discount_percentage}%`
                                  : `-${formatPrice(promo.discount_amount)}`
                                }
                              </strong>
                              <span style={{
                                fontSize: '10px',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                marginTop: '4px',
                                letterSpacing: '0.05em',
                                background: '#009b72',
                                color: '#fff',
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}>Áp dụng</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="sd-modal__promo-active" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(0, 155, 114, 0.04)',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  border: '1px solid rgba(0, 155, 114, 0.12)'
                }}>
                  <div className="sd-promo-active-badge" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#007d5b',
                    fontSize: '13px'
                  }}>
                    <span>🏷️</span>
                    <strong>{payingUnpaidOrder.promotionCode}</strong>
                    <span style={{ color: '#009b72', marginLeft: '6px', fontWeight: 'bold' }}>(Đã áp dụng)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyPromoToBooking('')}
                    disabled={validatingPromo}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc2626',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      textDecoration: 'underline'
                    }}
                  >
                    {validatingPromo ? 'Đang gỡ...' : 'Gỡ'}
                  </button>
                </div>
              )}
              {promoError && <p className="sd-promo-error-msg" style={{ margin: '8px 0 0', fontSize: '12px', color: '#c0392b', fontWeight: '700', display: 'block' }}>{promoError}</p>}
            </div>

            <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
              <button
                type="button"
                onClick={() => handleConfirmPayUnpaid('deposit')}
                disabled={processingPayment}
                style={{
                  background: 'linear-gradient(135deg, #fffbf0 0%, #fff8e6 100%)',
                  border: '1.5px solid #f0d98e',
                  padding: '16px',
                  borderRadius: '16px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  width: '100%'
                }}
              >
                <strong style={{ display: 'block', fontSize: '15px', color: '#1f1713', marginBottom: '4px' }}>
                  Đặt cọc 30%
                </strong>
                <span style={{ fontSize: '18px', fontWeight: '800', color: '#b5860a' }}>
                  {formatPrice(payingUnpaidOrder.deposit)}
                </span>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#786658' }}>
                  Thanh toán phần còn lại sau khi xác nhận lịch chụp
                </p>
              </button>
              <button
                type="button"
                onClick={() => handleConfirmPayUnpaid('full')}
                disabled={processingPayment}
                style={{
                  background: 'linear-gradient(135deg, #f0fdf7 0%, #e6f9ef 100%)',
                  border: '1.5px solid #9de3b8',
                  padding: '16px',
                  borderRadius: '16px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  width: '100%'
                }}
              >
                <strong style={{ display: 'block', fontSize: '15px', color: '#1f1713', marginBottom: '4px' }}>
                  Thanh toán 100%
                </strong>
                <span style={{ fontSize: '18px', fontWeight: '800', color: '#08a86d' }}>
                  {formatPrice(payingUnpaidOrder.netPrice)}
                </span>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#786658' }}>
                  Thanh toán toàn bộ ngay để xác nhận lịch nhanh nhất
                </p>
              </button>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setPayingUnpaidOrder(null)}
                disabled={processingPayment}
                style={{
                  background: '#f5f0eb',
                  color: '#6f6257',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '999px',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {cancellingOrder && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '24px',
            maxWidth: '480px',
            width: '100%',
            padding: '30px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
            border: '1px solid #e2d7c9'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '800',
              marginBottom: '16px',
              color: '#1f1713'
            }}>
              Hủy đơn đặt lịch
            </h3>
            <p style={{
              fontSize: '15px',
              color: '#6f6257',
              lineHeight: '1.6',
              marginBottom: '20px'
            }}>
              Bạn có chắc chắn muốn hủy đơn đặt lịch <strong>{cancellingOrder.orderCode}</strong> cho dịch vụ <strong>{cancellingOrder.serviceName}</strong>? Hành động này không thể hoàn tác.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                disabled={processingCancel}
                style={{
                  background: '#f5f0eb',
                  color: '#6f6257',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '999px',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                Không, giữ lại
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={processingCancel}
                style={{
                  background: '#b24b2a',
                  color: '#fff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '999px',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                {processingCancel ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  )
}

export default OrderHistory







