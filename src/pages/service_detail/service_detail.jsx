import { useEffect, useState } from 'react'
import Footer from '../../components/Footer.jsx'
import Header from '../../components/Header.jsx'
import { getPartnerConcept, getPartner, getFeedbacks, addCartItem, clearCart, checkoutCart, createPaymentUrl } from '../../utils/api.js'
import { getAuthUser } from '../../utils/auth.js'
import './service_detail.css'

const tabs = [
  { id: 'services', label: 'Dịch vụ & Portfolio' },
  { id: 'about', label: 'Giới thiệu' },
  { id: 'reviews', label: 'Đánh giá khách hàng' },
]

const formatPrice = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

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
  const authUser = getAuthUser()

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
                fb.booking_detail?.partner_concept?.id === partnerConceptId,
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

    setCartStatus('adding')
    try {
      await addCartItem(partnerConceptId, 1)
      // Lưu thông tin booking time vào localStorage theo partnerConceptId
      const bookingTimeIso = new Date(`${bookingDate}T${bookingTime}:00`).toISOString()
      const stored = JSON.parse(localStorage.getItem('matcha_booking_times') ?? '{}')
      stored[partnerConceptId] = { date: bookingDate, time: bookingTime, iso: bookingTimeIso }
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

    setBookingStatus('booking')
    try {
      // 1. Dọn giỏ hàng để tránh checkout nhầm các gói khác đang có trong giỏ
      await clearCart()

      // 2. Thêm gói dịch vụ hiện tại vào giỏ hàng
      await addCartItem(partnerConceptId, 1)

      // 3. Thực hiện checkout
      const bookingTimeIso = new Date(`${bookingDate}T${bookingTime}:00`).toISOString()
      const bookings = await checkoutCart({ booking_time: bookingTimeIso })

      if (!bookings || bookings.length === 0) {
        throw new Error('Không tạo được đơn đặt lịch')
      }

      const newBooking = bookings[0]

      // 4. Lấy link thanh toán cọc VNPay (30%)
      const { url } = await createPaymentUrl(newBooking.id, 'deposit')

      // 5. Phát sự kiện cập nhật giỏ hàng cho Header (giỏ hiện đang trống)
      window.dispatchEvent(new CustomEvent('matcha-cart-change'))

      // 6. Chuyển hướng trình duyệt sang cổng thanh toán VNPay
      window.location.href = url
    } catch (err) {
      alert('Đặt lịch thất bại: ' + err.message)
      setBookingStatus(null)
    }
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
  const locationName = partner?.location_name ?? 'Việt Nam'
  const ratingAvg = partner?.rating_avg > 0 ? Number(partner.rating_avg).toFixed(1) : null
  const ratingCount = partner?.rating_count ?? 0

  // Hero image: partner cover → partner concept image → fallback
  const heroImage =
    partner?.cover_image ||
    partner?.images?.[0]?.image_src ||
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80'

  // Avatar
  const avatar = partner?.images?.find(i => i.is_primary)?.image_src
    ?? `https://i.pravatar.cc/160?u=partner-${partner?.id ?? partnerConceptId}`

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

  const scheduleReady = bookingDate && bookingTime

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
                className={`service-tabs__item ${
                  activeTab === tab.id ? 'service-tabs__item--active' : ''
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
                      background: bookingTime === slot ? '#1f1713' : '#fcfaf6',
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
                  {new Date(bookingDate).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' })} · {bookingTime}
                </span>
              </div>
            )}
          </div>

          {authUser ? (
            <div style={{ display: 'grid', gap: '12px' }}>
              <button
                className={`service-sidebar__cart ${cartStatus === 'adding' ? 'service-sidebar__cart--loading' : ''}`}
                type="button"
                disabled={cartStatus === 'adding'}
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
                disabled={bookingStatus === 'booking'}
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
            </div>
          ) : (
            <a className="service-sidebar__ghost" href="/login">
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
    </main>
  )
}

export default ServiceDetail
