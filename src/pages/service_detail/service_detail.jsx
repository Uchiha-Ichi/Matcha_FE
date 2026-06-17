import { useEffect, useState, useMemo } from 'react'
import Footer from '../../components/Footer.jsx'
import Header from '../../components/Header.jsx'
import { getPartnerConcept, getPartner, getFeedbacks, addCartItem, clearCart, checkoutCart, validatePromoCode, getPromotions, createPaymentUrl, getPayment, closePaymentQr, getPartnerCalendar } from '../../utils/api.js'
import { getAuthUser } from '../../utils/auth.js'
import { extractCityOrProvince } from '../../utils/helpers.js'
import './service_detail.css'

const tabs = [
  { id: 'services', label: 'Dịch vụ & Portfolio' },
  { id: 'about', label: 'Giới thiệu' },
  { id: 'reviews', label: 'Đánh giá khách hàng' },
]

const formatPrice = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

const parseDurationMinutes = (value) => {
  if (!value) return 0
  const text = String(value).toLowerCase().replace(',', '.')
  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*(h|giờ|gio|hour)/)
  const minuteMatch = text.match(/(\d+(?:\.\d+)?)\s*(m|phút|phut|min)/)

  if (hourMatch) return Math.round(Number(hourMatch[1]) * 60)
  if (minuteMatch) return Math.round(Number(minuteMatch[1]))

  const numberOnly = Number(text.match(/\d+(?:\.\d+)?/)?.[0] ?? 0)
  return numberOnly > 0 ? Math.round(numberOnly * 60) : 0
}

const addMinutesToTime = (time, minutes) => {
  if (!time || !minutes) return ''
  const [hours, mins] = time.split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(mins)) return ''
  const total = hours * 60 + mins + minutes
  const endHours = String(Math.floor(total / 60) % 24).padStart(2, '0')
  const endMins = String(total % 60).padStart(2, '0')
  return `${endHours}:${endMins}`
}

const timeToMinutes = (time) => {
  if (!time) return null
  const [hours, mins] = String(time).split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(mins)) return null
  return hours * 60 + mins
}

const rangesOverlap = (startA, endA, startB, endB) =>
  startA < endB && endA > startB

const formatBlockTime = (block) => {
  if (!block.start_time || !block.end_time) return 'Ca ngay'
  return `${String(block.start_time).slice(0, 5)} - ${String(block.end_time).slice(0, 5)}`
}

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

const imageFallbacks = [
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80',
]

function StarRating({ rating }) {
  const stars = Math.round(Number(rating))
  return (
    <span className="star-rating" aria-label={`${rating} sao`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < stars ? 'star star--filled' : 'star'}>★</span>
      ))}
      <span className="star-value">{Number(rating).toFixed(1)}</span>
    </span>
  )
}

function LoadingSkeleton() {
  return (
    <main className="service-detail-page">
      <Header />
      <section className="service-hero service-hero--skeleton">
        <div className="skeleton-hero-bg" />
        <div className="service-hero__content">
          <div className="skeleton-badge" />
          <div className="service-hero__profile">
            <div className="skeleton-avatar" />
            <div>
              <div className="skeleton-line" style={{ width: 220, height: 36, marginBottom: 12 }} />
              <div className="skeleton-line" style={{ width: 180, height: 20 }} />
            </div>
          </div>
        </div>
      </section>
      <section className="service-detail-layout">
        <div className="service-detail-main">
          <div className="service-tabs">
            {tabs.map((t) => (
              <div key={t.id} className="skeleton-line" style={{ width: 120, height: 24 }} />
            ))}
          </div>
          <div style={{ marginTop: 32, display: 'grid', gap: 16 }}>
            {[1, 2].map((i) => (
              <div key={i} className="service-package">
                <div>
                  <div className="skeleton-line" style={{ width: 200, height: 20 }} />
                  <div className="skeleton-line" style={{ width: 140, height: 14, marginTop: 10 }} />
                </div>
                <div className="skeleton-line" style={{ width: 100, height: 20 }} />
              </div>
            ))}
          </div>
        </div>
        <aside className="service-sidebar" style={{ paddingTop: 36 }}>
          <div className="skeleton-line" style={{ width: '100%', height: 64, borderRadius: 24 }} />
          <div className="skeleton-line" style={{ width: '100%', height: 64, borderRadius: 24, marginTop: 16 }} />
        </aside>
      </section>
      <Footer />
    </main>
  )
}

function ServiceDetail({ partnerConceptId }) {
  const [activeTab, setActiveTab] = useState('services')
  const [partnerConcept, setPartnerConcept] = useState(null)
  const [partner, setPartner] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cartStatus, setCartStatus] = useState(null) // 'adding' | 'success' | 'error' | null
  const [bookingStatus, setBookingStatus] = useState(null) // 'booking' | null
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showSuccessScreen, setShowSuccessScreen] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(null) // null | { type, amount }
  const [pendingBooking, setPendingBooking] = useState(null) // booking data after checkout
  const [qrPayment, setQrPayment] = useState(null)
  const [paymentResult, setPaymentResult] = useState(null)
  const [paymentNow, setPaymentNow] = useState(Date.now())
  const [partnerCalendar, setPartnerCalendar] = useState([])
  const authUser = getAuthUser()

  const price = Number(partnerConcept?.price ?? 0)
  const durationMinutes = parseDurationMinutes(partnerConcept?.time)
  const bookingEndTime = addMinutesToTime(bookingTime, durationMinutes)
  const calendarPartnerId = partner?.id ?? partnerConcept?.partner?.id ?? partnerConcept?.partner_id
  const blocksOnSelectedDate = useMemo(() => (
    (partnerCalendar ?? []).filter((event) => event.type === 'blocked' && event.date === bookingDate)
  ), [partnerCalendar, bookingDate])
  const isWholeDayBlocked = blocksOnSelectedDate.some((block) => !block.start_time || !block.end_time)
  const selectedStartMinutes = timeToMinutes(bookingTime)
  const selectedEndMinutes = selectedStartMinutes !== null && durationMinutes > 0
    ? selectedStartMinutes + durationMinutes
    : selectedStartMinutes
  const isSelectedTimeBlocked = Boolean(
    bookingDate &&
    bookingTime &&
    (
      isWholeDayBlocked ||
      blocksOnSelectedDate.some((block) => {
        const blockStart = timeToMinutes(block.start_time)
        const blockEnd = timeToMinutes(block.end_time)
        if (blockStart === null || blockEnd === null || selectedStartMinutes === null) return false
        if (selectedEndMinutes === null || selectedEndMinutes === selectedStartMinutes) {
          return selectedStartMinutes >= blockStart && selectedStartMinutes <= blockEnd
        }
        return rangesOverlap(selectedStartMinutes, selectedEndMinutes, blockStart, blockEnd)
      })
    )
  )

  const [promoCode, setPromoCode] = useState('')
  const [appliedPromo, setAppliedPromo] = useState(null)
  const [promoError, setPromoError] = useState(null)
  const [validatingPromo, setValidatingPromo] = useState(false)
  const [promotions, setPromotions] = useState([])
  const [loadingPromos, setLoadingPromos] = useState(false)

  const discount = useMemo(() => {
    if (!appliedPromo) return 0
    let amt = 0
    if (appliedPromo.discount_percentage > 0) {
      amt = price * (appliedPromo.discount_percentage / 100)
    } else if (appliedPromo.discount_amount > 0) {
      amt = Number(appliedPromo.discount_amount)
    }
    if (appliedPromo.max_discount && amt > Number(appliedPromo.max_discount)) {
      amt = Number(appliedPromo.max_discount)
    }
    if (amt > price) amt = price
    return Math.round(amt)
  }, [appliedPromo, price])

  const netTotal = price - discount
  const deposit = Math.round(netTotal * 0.3)
  const remaining = netTotal - deposit

  useEffect(() => {
    if (!partnerConceptId) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(null)

        // Load partner concept (now includes embedded partner + concept relations)
        const pc = await getPartnerConcept(partnerConceptId)
        if (cancelled) return
        setPartnerConcept(pc)

        // Use embedded partner if available, else fetch separately
        if (pc.partner) {
          setPartner(pc.partner)
        } else {
          const partnerId = pc.partner_id
          if (partnerId) {
            try {
              const p = await getPartner(partnerId)
              if (!cancelled) setPartner(p)
            } catch {
              // partner load failed, continue with what we have
            }
          }
        }

        // Load feedbacks filtered by this partner concept
        try {
          const allFeedbacks = await getFeedbacks()
          if (!cancelled) {
            const filtered = (allFeedbacks ?? []).filter(
              (fb) =>
                fb.booking_detail?.partner_concept?.id === pc.id,
            )
            setReviews(filtered)
          }
        } catch {
          // feedbacks load failed, show empty
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [partnerConceptId])

  useEffect(() => {
    if (!calendarPartnerId) {
      setPartnerCalendar([])
      return
    }

    let cancelled = false
    getPartnerCalendar(calendarPartnerId)
      .then((events) => {
        if (!cancelled) setPartnerCalendar(events ?? [])
      })
      .catch(() => {
        if (!cancelled) setPartnerCalendar([])
      })

    return () => { cancelled = true }
  }, [calendarPartnerId])

  const handleAddToCart = async () => {
    if (!authUser) {
      window.history.pushState({}, '', '/login')
      window.dispatchEvent(new PopStateEvent('popstate'))
      return
    }

    if (!bookingDate || !bookingTime) {
      alert('Vui lòng chọn đầy đủ ngày và giờ chụp ảnh trước khi thêm vào giỏ hàng!')
      return
    }

    if (isSelectedTimeBlocked) {
      alert('Khung gio nay trung voi lich nghi cua doi tac. Vui long chon gio khac!')
      return
    }

    setCartStatus('adding')
    try {
      await addCartItem(partnerConcept?.id || partnerConceptId, 1)
      // Lưu thông tin booking time vào localStorage theo partnerConceptId
      const bookingTimeIso = new Date(`${bookingDate}T${bookingTime}:00`).toISOString()
      const stored = JSON.parse(localStorage.getItem('matcha_booking_times') ?? '{}')
      stored[partnerConcept?.id || partnerConceptId] = {
        date: bookingDate,
        time: bookingTime,
        endTime: bookingEndTime,
        durationMinutes,
        iso: bookingTimeIso,
      }
      localStorage.setItem('matcha_booking_times', JSON.stringify(stored))

      setCartStatus('success')
      window.dispatchEvent(new CustomEvent('matcha-cart-change'))
      setTimeout(() => setCartStatus(null), 3000)
    } catch (err) {
      setCartStatus('error')
      setTimeout(() => setCartStatus(null), 3000)
    }
  }

  const handleDirectBooking = async () => {
    if (!authUser) {
      window.history.pushState({}, '', '/login')
      window.dispatchEvent(new PopStateEvent('popstate'))
      return
    }

    if (!bookingDate || !bookingTime) {
      alert('Vui lòng chọn đầy đủ ngày và giờ chụp ảnh!')
      return
    }

    if (isSelectedTimeBlocked) {
      alert('Khung gio nay trung voi lich nghi cua doi tac. Vui long chon gio khac!')
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
    setBookingStatus('booking')
    setPaymentResult(null)
    try {
      await clearCart()
      await addCartItem(partnerConcept?.id || partnerConceptId, 1)

      const bookingTimeIso = new Date(`${bookingDate}T${bookingTime}:00`).toISOString()
      const bookings = await checkoutCart({ 
        booking_time: bookingTimeIso,
        promotion_id: appliedPromo ? appliedPromo.id : undefined
      })

      if (!bookings || bookings.length === 0) {
        throw new Error('Không tạo được đơn đặt lịch')
      }

      const createdBooking = bookings[0]
      setPendingBooking(createdBooking)
      window.dispatchEvent(new CustomEvent('matcha-cart-change'))

      const amount = type === 'deposit' ? deposit : netTotal
      const paymentData = await createPaymentUrl(createdBooking.id, type)
      setQrPayment({
        ...paymentData,
        type,
        bookingId: createdBooking.id,
        amount: paymentData.amount ?? amount,
      })
    } catch (err) {
      alert('Đặt lịch thất bại: ' + err.message)
    } finally {
      setBookingStatus(null)
      setAppliedPromo(null)
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
    }
  }

  const handleCheckQrPayment = async () => {
    if (!qrPayment?.payment?.id) return
    try {
      const payload = await getPayment(qrPayment.payment.id)
      const payment = payload?.payment ?? payload
      const status = payment?.status
      if (status === 'paid' || status === 'partially_paid') {
        setPaymentSuccess({ type: qrPayment.type, amount: Number(payment.amount_paid ?? qrPayment.amount), total: netTotal })
        setQrPayment(null)
        setShowSuccessScreen(true)
        return
      }
      setPaymentResult({
        title: 'Chưa ghi nhận thanh toán',
        message: 'Giao dịch vẫn đang chờ xác nhận. Nếu bạn đã chuyển khoản, vui lòng thử kiểm tra lại sau vài giây.',
      })
    } catch (err) {
      setQrPayment(null)
      setPaymentResult({
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

        setPaymentSuccess({ type: qrPayment.type, amount: Number(payment.amount_paid ?? qrPayment.amount), total: netTotal })
        setQrPayment(null)
        setShowSuccessScreen(true)
      } catch (err) {
        if (!cancelled && Date.now() >= getQrExpiresAt(qrPayment)) {
          setQrPayment(null)
          setPaymentResult({
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
  }, [qrPayment, netTotal])
  const qrExpiresAt = getQrExpiresAt(qrPayment)
  const qrCountdown = formatCountdown(qrExpiresAt - paymentNow)
  const qrTransferContent = qrPayment?.payment?.raw_response?.data?.description
    ?? qrPayment?.payment?.description
    ?? qrPayment?.description
    ?? `Matcha booking ${qrPayment?.bookingId ?? ''}`
  const handleChatWithPartner = (event) => {
    event.preventDefault()
    if (!authUser) {
      window.history.pushState({}, '', '/login')
      window.dispatchEvent(new PopStateEvent('popstate'))
      return
    }

    window.history.pushState({
      partnerId: partner?.id || partnerConcept?.partner_id,
      partnerConceptId: partnerConceptId,
      serviceName: conceptName,
      partnerName: partnerName
    }, '', '/chat')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  if (loading) return <LoadingSkeleton />

  if (error) {
    return (
      <main className="service-detail-page">
        <Header />
        <div className="service-error">
          <h2>Không thể tải thông tin dịch vụ</h2>
          <p>{error}</p>
          <button onClick={() => window.history.back()} type="button">
            Quay lại
          </button>
        </div>
        <Footer />
      </main>
    )
  }

  if (!partnerConcept && !partnerConceptId) {
    return (
      <main className="service-detail-page">
        <Header />
        <div className="service-error">
          <h2>Dịch vụ không tồn tại</h2>
          <p>Vui lòng chọn dịch vụ từ trang chủ.</p>
          <button
            onClick={(e) => {
              e.preventDefault()
              window.history.pushState({}, '', '/')
              window.dispatchEvent(new PopStateEvent('popstate'))
            }}
            type="button"
          >
            Về trang chủ
          </button>
        </div>
        <Footer />
      </main>
    )
  }

  // Derive data from API response
  const conceptName = partnerConcept?.concept?.name ?? 'Dịch vụ'
  const partnerName = partner?.band_name ?? partnerConcept?.partner?.band_name ?? 'Matcha Studio'
  const description = partner?.description ?? partnerConcept?.concept?.description ?? ''
  const tagline = partnerConcept?.concept?.description ?? `Dịch vụ ${conceptName} chuyên nghiệp`
  const locationName = extractCityOrProvince(partner?.location_name)
  const ratingAvg = partner?.rating_avg > 0 ? Number(partner.rating_avg).toFixed(1) : null
  const ratingCount = partner?.rating_count ?? 0

  // Hero image: partner cover → partner concept image → fallback
  const heroImage =
    partner?.cover_image ||
    partner?.images?.[0]?.image_src ||
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80'

  // Avatar
  const avatar = partner?.images?.find(i => i.is_primary)?.image_src
    ?? `https://i.pravatar.cc/160?u=partner-${partner?.id ?? partnerConcept?.id ?? partnerConceptId}`

  // Portfolio images from partner concept images
  const portfolioImages =
    partnerConcept?.images?.filter(i => i.image_src).map(i => i.image_src)?.length > 0
      ? partnerConcept.images.filter(i => i.image_src).map(i => i.image_src)
      : imageFallbacks

  // The single "package" is the partner concept itself
  const packageInfo = {
    id: partnerConcept?.id,
    name: conceptName,
    price: partnerConcept?.price ?? 0,
    duration: partnerConcept?.time ?? '—',
    location: locationName,
    image: partnerConcept?.image_des || portfolioImages[0],
  }

  const scheduleReady = bookingDate && bookingTime && !isSelectedTimeBlocked

  return (
    <main className="service-detail-page">
      <Header />

      <section className="service-hero">
        <div className="service-hero__overlay" />
        <img
          src={heroImage}
          alt={`${partnerName} cover`}
          className="service-hero__image"
        />

        <div className="service-hero__content">
          <span className="service-hero__badge">
            {partnerConcept?.concept?.name?.toUpperCase() ?? 'DỊCH VỤ'}
          </span>

          <div className="service-hero__profile">
            <img
              src={avatar}
              alt={partnerName}
              className="service-hero__avatar"
            />

            <div>
              <h1>{partnerName}</h1>
              <p className="service-hero__tagline">
                <span className="service-hero__shield" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 3 18 5.2v5.5c0 4-2.4 7.6-6 9.3-3.6-1.7-6-5.3-6-9.3V5.2L12 3Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="m9.5 12.2 1.7 1.7 3.4-3.6"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                {tagline}
              </p>

              {ratingAvg && (
                <div className="service-hero__rating">
                  <StarRating rating={ratingAvg} />
                  {ratingCount > 0 && (
                    <span className="service-hero__rating-count">({ratingCount} đánh giá)</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="service-detail-layout">
        <div className="service-detail-main">
          <div className="service-tabs" role="tablist" aria-label="Nội dung dịch vụ">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`service-tabs__item ${activeTab === tab.id ? 'service-tabs__item--active' : ''
                  }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'services' && (
            <div className="service-panel">
              {description && (
                <p className="service-panel__intro">{description}</p>
              )}

              <section className="service-packages">
                <h2>Gói dịch vụ</h2>

                <div className="service-packages__list">
                  <div className="service-package service-package--active">
                    <div className="service-package__info">
                      <strong>{packageInfo.name}</strong>
                      <div className="service-package__meta">
                        {packageInfo.duration && packageInfo.duration !== '—' && (
                          <span>{packageInfo.duration}</span>
                        )}
                        {packageInfo.location && (
                          <span>{packageInfo.location}</span>
                        )}
                      </div>
                    </div>
                    <span className="service-package__price">
                      {formatPrice(packageInfo.price)}
                    </span>
                  </div>
                </div>
              </section>

              <section className="service-portfolio">
                <h2>Một vài khung hình tiêu biểu</h2>
                <div className="service-portfolio__grid">
                  {portfolioImages.slice(0, 6).map((image, i) => (
                    <img key={`${image}-${i}`} src={image} alt={`Portfolio ${i + 1}`} />
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="service-panel">
              <section className="service-copy-block">
                <h2>Giới thiệu</h2>
                {description ? (
                  <p>{description}</p>
                ) : (
                  <>
                    <p>
                      {partnerName} là đối tác chuyên nghiệp trên Matcha, chuyên cung cấp dịch vụ{' '}
                      {conceptName} chất lượng cao.
                    </p>
                    <p>
                      Quy trình làm việc bao gồm trao đổi moodboard, chốt địa điểm, hỗ trợ tạo
                      dáng và bàn giao sản phẩm theo đúng timeline đã thống nhất.
                    </p>
                  </>
                )}

                {locationName && (
                  <div className="service-info-row">
                    <span className="service-info-icon">📍</span>
                    <span>{locationName}</span>
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="service-panel">
              <section className="service-copy-block">
                <h2>Đánh giá khách hàng</h2>

                {reviews.length === 0 ? (
                  <div className="service-no-reviews">
                    <p>Chưa có đánh giá nào. Hãy là người đầu tiên trải nghiệm!</p>
                  </div>
                ) : (
                  <div className="service-reviews">
                    {reviews.map((review) => (
                      <article key={review.id} className="service-review-card">
                        <div className="service-review-card__top">
                          <strong>
                            {review.user?.full_name ?? review.user?.email ?? 'Khách hàng'}
                          </strong>
                          <StarRating rating={review.rating} />
                        </div>
                        {review.description && <p>{review.description}</p>}
                        {review.image && (
                          <img
                            src={review.image}
                            alt="Ảnh đánh giá"
                            className="service-review-card__img"
                          />
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>

        <aside className="service-sidebar">
          {/* Widget chọn lịch chụp – bắt buộc chọn trước khi thêm giỏ */}
          <div className="service-sidebar__scheduler" style={{
            background: '#fff',
            border: '1px solid #ddd1c4',
            borderRadius: '24px',
            padding: '20px',
            marginBottom: '16px',
            boxShadow: '0 12px 28px rgba(110, 83, 43, 0.04)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '4px', color: '#1f1713', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🗓</span> Chọn lịch chụp ảnh
            </h3>
            <p style={{ fontSize: '12px', color: '#9b8070', fontWeight: '600', marginBottom: '14px', marginTop: 0 }}>
              Bắt buộc chọn trước khi thêm vào giỏ hàng
            </p>

            <label style={{ display: 'grid', gap: '6px', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#735f52' }}>Chọn ngày</span>
              <input
                type="date"
                value={bookingDate}
                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                onChange={(e) => setBookingDate(e.target.value)}
                style={{
                  minHeight: '44px',
                  borderRadius: '12px',
                  border: '1px solid #e2d7c9',
                  padding: '0 12px',
                  background: '#fcfaf6',
                  fontFamily: 'inherit',
                  fontWeight: '700'
                }}
              />
            </label>

            <label style={{ display: 'grid', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#735f52' }}>Chọn giờ bắt đầu</span>
              <input
                type="time"
                value={bookingTime}
                min="06:00"
                max="22:00"
                step="900"
                disabled={isWholeDayBlocked}
                onChange={(e) => setBookingTime(e.target.value)}
                style={{
                  minHeight: '44px',
                  borderRadius: '12px',
                  border: '1px solid #e2d7c9',
                  padding: '0 12px',
                  background: isWholeDayBlocked ? '#f2ece6' : '#fcfaf6',
                  fontFamily: 'inherit',
                  fontWeight: '800',
                  color: '#1f1713',
                  cursor: isWholeDayBlocked ? 'not-allowed' : 'auto',
                }}
              />
              {bookingTime && (
                <small style={{ color: '#7b6b5d', fontWeight: '700', lineHeight: 1.5 }}>
                  Kết thúc dự kiến: {bookingEndTime || 'chưa xác định'}
                  {partnerConcept?.time ? ` (${partnerConcept.time})` : ''}
                </small>
              )}
            </label>

            {bookingDate && blocksOnSelectedDate.length > 0 && (
              <div style={{
                marginTop: '12px',
                padding: '10px 12px',
                background: '#fff6ed',
                border: '1px solid #f0c9a2',
                borderRadius: '10px',
                color: '#8a4f16',
                fontSize: '12px',
                fontWeight: '700',
                lineHeight: 1.5,
              }}>
                Partner nghi trong ngay nay: {blocksOnSelectedDate.map(formatBlockTime).join(', ')}
              </div>
            )}

            {isSelectedTimeBlocked && (
              <div style={{
                marginTop: '12px',
                padding: '10px 12px',
                background: '#fff0f0',
                border: '1px solid #f3b2ad',
                borderRadius: '10px',
                color: '#a23930',
                fontSize: '12px',
                fontWeight: '800',
                lineHeight: 1.5,
              }}>
                Khung gio {bookingTime}{bookingEndTime ? ` - ${bookingEndTime}` : ''} trung lich nghi. Vui long chon gio khac.
              </div>
            )}

            {scheduleReady && (
              <div style={{
                marginTop: '12px',
                padding: '10px 14px',
                background: '#e6f9ef',
                border: '1px solid #9de3b8',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '700',
                color: '#1a6e3a',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>✓</span>
                <span>
                  {new Date(bookingDate).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' })} · {bookingTime}{bookingEndTime ? ` - ${bookingEndTime}` : ''}
                </span>
              </div>
            )}
          </div>

          {authUser ? (
            <div style={{ display: 'grid', gap: '12px' }}>
              <button
                className={`service-sidebar__cart ${cartStatus === 'adding' ? 'service-sidebar__cart--loading' : ''}`}
                type="button"
                disabled={cartStatus === 'adding' || isSelectedTimeBlocked}
                onClick={handleAddToCart}
              >
                <span aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3 5h2l1.5 8.3a2 2 0 0 0 2 1.7h7a2 2 0 0 0 1.9-1.5L19 7H7.3"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="10" cy="19" r="1.4" fill="currentColor" />
                    <circle cx="16" cy="19" r="1.4" fill="currentColor" />
                  </svg>
                </span>
                {cartStatus === 'adding'
                  ? 'Đang thêm...'
                  : cartStatus === 'success'
                    ? '✓ Đã thêm vào giỏ!'
                    : cartStatus === 'error'
                      ? '✗ Thêm thất bại'
                      : 'Thêm vào giỏ hàng'}
              </button>

              <button
                type="button"
                disabled={bookingStatus === 'booking' || isSelectedTimeBlocked}
                onClick={handleDirectBooking}
                style={{
                  minHeight: '52px',
                  borderRadius: '999px',
                  background: '#1f1713',
                  color: '#fff',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  transition: 'all 0.2s'
                }}
              >
                <span>⚡</span>
                {bookingStatus === 'booking' ? 'Đang xử lý...' : 'Đặt lịch & Thanh toán cọc'}
              </button>

              <button
                type="button"
                onClick={handleChatWithPartner}
                style={{
                  minHeight: '52px',
                  borderRadius: '999px',
                  background: '#fcfaf6',
                  color: '#1f1713',
                  border: '1.5px solid #ded2c3',
                  fontSize: '16px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = '#1f1713' }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = '#ded2c3' }}
              >
                <span>💬</span> Nhắn tin tư vấn
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              <a className="service-sidebar__ghost" href="/login" style={{ display: 'flex', width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                <span aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M8.5 18.5c-2.8 0-5-2.1-5-4.8 0-2.7 2.2-4.8 5-4.8.6-3.3 3.5-5.7 7-5.7 3.9 0 7 3 7 6.7 0 3.7-3.1 6.7-7 6.7h-7Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                Đăng nhập để đặt dịch vụ
              </a>
              <button
                type="button"
                onClick={handleChatWithPartner}
                style={{
                  minHeight: '52px',
                  borderRadius: '999px',
                  background: '#fcfaf6',
                  color: '#1f1713',
                  border: '1.5px solid #ded2c3',
                  fontSize: '16px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = '#1f1713' }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = '#ded2c3' }}
              >
                <span>💬</span> Nhắn tin tư vấn
              </button>
            </div>
          )}

          {cartStatus === 'success' && (
            <a
              className="service-sidebar__goto-cart"
              href="/cart"
              onClick={(e) => {
                e.preventDefault()
                window.history.pushState({}, '', '/cart')
                window.dispatchEvent(new PopStateEvent('popstate'))
              }}
            >
              Xem giỏ hàng →
            </a>
          )}

          <section className="service-summary">
            <h2>Tổng quan</h2>

            <dl className="service-summary__list">
              <div>
                <dt>Dịch vụ</dt>
                <dd>{packageInfo.name}</dd>
              </div>
              <div>
                <dt>Giá</dt>
                <dd>{formatPrice(packageInfo.price)}</dd>
              </div>
              {packageInfo.duration && packageInfo.duration !== '—' && (
                <div>
                  <dt>Thời lượng</dt>
                  <dd>{packageInfo.duration}</dd>
                </div>
              )}
              <div>
                <dt>Địa điểm</dt>
                <dd>{packageInfo.location}</dd>
              </div>
              {ratingAvg && (
                <div>
                  <dt>Đánh giá</dt>
                  <dd>{ratingAvg} ⭐ ({ratingCount})</dd>
                </div>
              )}
            </dl>
          </section>
        </aside>
      </section>

      <Footer />

      {/* ── Processing Overlay ───────────────────────────────────────── */}
      {bookingStatus === 'booking' && (
        <div className="sd-processing-overlay">
          <div className="sd-processing-box">
            <div className="sd-processing-spinner" />
            <p>Đang tạo đơn đặt lịch...</p>
          </div>
        </div>
      )}

      {/* ── Payment Modal ────────────────────────────────────────────── */}
      {showPaymentModal && (
        <div className="sd-modal-overlay" onClick={() => { setShowPaymentModal(false); setAppliedPromo(null); setPromoCode(''); setPromoError(null); }}>
          <div className="sd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sd-modal__header">
              <h2>Chọn hình thức thanh toán</h2>
              <button
                className="sd-modal__close"
                type="button"
                onClick={() => { setShowPaymentModal(false); setAppliedPromo(null); setPromoCode(''); setPromoError(null); }}
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <div className="sd-modal__price-breakdown">
              <div className="sd-price-row">
                <span>Tổng tiền:</span>
                <span>{formatPrice(price)}</span>
              </div>
              {discount > 0 && (
                <div className="sd-price-row sd-price-row--discount">
                  <span>Giảm giá:</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="sd-price-row sd-price-row--total">
                <span>Thành tiền:</span>
                <strong>{formatPrice(netTotal)}</strong>
              </div>
            </div>

            {/* Khung nhập mã giảm giá */}
            <div className="sd-modal__promo-container">
              {!appliedPromo ? (
                <>
                  <form className="sd-modal__promo-form" onSubmit={handleApplyPromo}>
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
                  <div className="sd-modal__promos-select">
                    <h3>Hoặc chọn mã giảm giá khả dụng:</h3>
                    {loadingPromos ? (
                      <p className="sd-promos-loading">Đang tải mã giảm giá...</p>
                    ) : promotions.length === 0 ? (
                      <p className="sd-promos-empty">Chưa có mã giảm giá nào khả dụng.</p>
                    ) : (
                      <div className="sd-promos-coupon-grid">
                        {promotions.map((promo) => (
                          <button
                            key={promo.id}
                            type="button"
                            className="sd-promo-coupon-card"
                            onClick={() => {
                              setAppliedPromo(promo);
                              setPromoError(null);
                            }}
                          >
                            <div className="sd-coupon-left">
                              <strong>{promo.code}</strong>
                              <span>{promo.description || 'Giảm giá đặc biệt'}</span>
                            </div>
                            <div className="sd-coupon-right">
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
                <div className="sd-modal__promo-active">
                  <div className="sd-promo-active-badge">
                    <span>🏷️</span>
                    <strong>{appliedPromo.code}</strong>
                    <span className="sd-promo-active-discount">
                      (-{appliedPromo.discount_percentage > 0 
                        ? `${appliedPromo.discount_percentage}%` 
                        : formatPrice(appliedPromo.discount_amount)})
                    </span>
                  </div>
                  <button type="button" onClick={handleRemovePromo} className="sd-promo-active-remove">
                    ✕ Gỡ
                  </button>
                </div>
              )}
              {promoError && <p className="sd-promo-error-msg">{promoError}</p>}
            </div>

            <div className="sd-modal__options">
              {/* Đặt cọc 30% */}
              <button
                type="button"
                className="sd-pay-option sd-pay-option--deposit"
                onClick={() => handleConfirmPayment('deposit')}
              >
                <span className="sd-pay-option__icon">💰</span>
                <div className="sd-pay-option__body">
                  <strong>Đặt cọc 30%</strong>
                  <span>{formatPrice(deposit)}</span>
                  <p>Thanh toán số còn lại {formatPrice(remaining)} sau khi xác nhận lịch</p>
                </div>
                <span className="sd-pay-option__arrow">→</span>
              </button>

              {/* Thanh toán 100% */}
              <button
                type="button"
                className="sd-pay-option sd-pay-option--full"
                onClick={() => handleConfirmPayment('full')}
              >
                <span className="sd-pay-option__icon">✅</span>
                <div className="sd-pay-option__body">
                  <strong>Thanh toán 100%</strong>
                  <span>{formatPrice(netTotal)}</span>
                  <p>Thanh toán toàn bộ ngay, ưu tiên xếp lịch sớm hơn</p>
                </div>
                <span className="sd-pay-option__arrow">→</span>
              </button>
            </div>

            <p className="sd-modal__note">🔒 Thanh toán được bảo mật và xử lý an toàn</p>
          </div>
        </div>
      )}

      {/* ── Success Screen ───────────────────────────────────────────── */}

      {qrPayment && (
        <div className="sd-modal-overlay" onClick={handleCloseQr}>
          <div className="sd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sd-modal__header">
              <h2>Quét QR để thanh toán</h2>
              <button className="sd-modal__close" type="button" onClick={handleCloseQr} aria-label="Đóng">×</button>
            </div>
            <div style={{ display: 'grid', gap: 16, justifyItems: 'center', textAlign: 'center' }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrPayment.qrCode)}`}
                alt="QR thanh toán payOS"
                style={{ width: 260, height: 260, maxWidth: '100%', border: '1px solid #eadfce', borderRadius: 16, padding: 10, background: '#fff' }}
              />
              <div style={{ display: 'grid', gap: 4 }}>
                <span style={{ color: '#7b6b5d', fontSize: 13 }}>Số tiền cần thanh toán</span>
                <strong style={{ color: '#0f1412', fontSize: 24 }}>{formatPrice(Number(qrPayment.amount ?? 0))}</strong>
              </div>
              <div style={{ padding: '10px 14px', borderRadius: 14, background: '#f7f1ea', display: 'grid', gap: 2 }}>
                <span style={{ color: '#7b6b5d', fontSize: 12, fontWeight: 700 }}>Thời gian còn lại</span>
                <strong style={{ color: '#b24b2a', fontSize: 22 }}>{qrCountdown}</strong>
              </div>
              <div style={{ width: '100%', display: 'grid', gap: 10, textAlign: 'left', background: '#fbf9f6', border: '1px solid #eadfce', borderRadius: 16, padding: 14 }}>
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
              </div>              <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                <button type="button" onClick={handleCloseQr} style={{ flex: 1, border: 0, borderRadius: 999, padding: '12px 16px', background: '#1f1713', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Đóng QR</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {paymentResult && !showSuccessScreen && (
        <div className="sd-modal-overlay" onClick={() => setPaymentResult(null)}>
          <div className="sd-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420, textAlign: 'center' }}>
            <h2>{paymentResult.title}</h2>
            <p style={{ color: '#6f6257', lineHeight: 1.6 }}>{paymentResult.message}</p>
            <button type="button" onClick={() => setPaymentResult(null)} style={{ width: '100%', border: 0, borderRadius: 999, padding: '12px 20px', background: '#1f1713', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Đóng</button>
          </div>
        </div>
      )}
      {showSuccessScreen && paymentSuccess && (
        <div className="sd-success-overlay">
          <div className="sd-success-card">
            <div className="sd-success-icon">
              <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="26" cy="26" r="25" stroke="#1bc48f" strokeWidth="2" fill="rgba(27,196,143,0.08)" />
                <path d="M15 26.5l8 8 14-16" stroke="#1bc48f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="sd-checkmark" />
              </svg>
            </div>
            <h2>Thanh toán thành công!</h2>
            <p className="sd-success-type">
              {paymentSuccess.type === 'deposit' ? '💰 Đặt cọc 30%' : '✅ Thanh toán 100%'}
            </p>
            <div className="sd-success-amount">
              <span>Số tiền</span>
              <strong>{formatPrice(paymentSuccess.amount)}</strong>
            </div>
            <p className="sd-success-note">
              🎉 Đặt lịch thành công! Ekip của chúng tôi sẽ liên hệ xác nhận lịch chụp sớm nhất.
            </p>
            <div className="sd-success-actions">
              <button
                type="button"
                className="sd-success-btn sd-success-btn--primary"
                onClick={() => setShowSuccessScreen(false)}
              >
                Tiếp tục xem dịch vụ
              </button>
              <a
                href="/"
                className="sd-success-btn sd-success-btn--secondary"
                onClick={(e) => {
                  e.preventDefault()
                  setShowSuccessScreen(false)
                  window.history.pushState({}, '', '/')
                  window.dispatchEvent(new PopStateEvent('popstate'))
                }}
              >
                Về trang chủ
              </a>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default ServiceDetail
