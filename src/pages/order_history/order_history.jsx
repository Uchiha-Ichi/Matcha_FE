import { useEffect, useMemo, useState } from 'react'
import Footer from '../../components/Footer.jsx'
import Header from '../../components/Header.jsx'
import { getBookings, createPaymentUrl } from '../../utils/api.js'
import { getAuthUser } from '../../utils/auth.js'
import './order_history.css'

const statusMeta = {
  all:       { label: 'Tất cả' },
  pending:   { label: 'Chờ xác nhận', tone: 'warning' },
  confirmed: { label: 'Đã xác nhận',  tone: 'info'    },
  completed: { label: 'Hoàn tất',     tone: 'success'  },
  cancelled: { label: 'Đã hủy',       tone: 'muted'    },
}

const paymentMeta = {
  paid:          'Đã thanh toán',
  partially_paid:'Đã đặt cọc',
  unpaid:        'Chưa thanh toán',
}

const imageFallbacks = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
]

const formatPrice = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

const formatDateTime = (value) => {
  if (!value) return '—'
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
  const detail = booking.booking_details?.[0]
  const pc = detail?.partner_concept ?? {}
  const concept = pc.concept ?? {}
  const partner = booking.partner ?? {}
  const payment = booking.payment ?? null

  // pick image: partner concept image → partner cover → fallback
  const image =
    pc.image_des ||
    partner.cover_image ||
    imageFallbacks[index % imageFallbacks.length]

  return {
    id: booking.id,
    orderCode: `MTC-${String(booking.id).padStart(5, '0')}`,
    status: booking.status,
    paymentStatus: payment?.status ?? 'unpaid',
    serviceName: concept.name ?? 'Dịch vụ Matcha',
    partnerName: partner.band_name ?? 'Matcha Partner',
    partnerId: partner.id,
    location: partner.location_name ?? '—',
    bookingTime: booking.booking_time,
    price: Number(booking.price ?? 0),
    discount: Number(booking.price_discount ?? 0),
    deposit: Number(booking.price_deposit ?? 0),
    remaining: Number(booking.remaining_amount ?? 0),
    promotionCode: booking.promotion?.code ?? null,
    image,
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
  const [rawOrders, setRawOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeStatus, setActiveStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [paymentAlert, setPaymentAlert] = useState(null)
  const [paymentLoadingId, setPaymentLoadingId] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const paymentStatus = params.get('paymentStatus')
    const message = params.get('message')
    if (paymentStatus) {
      setPaymentAlert({
        status: paymentStatus,
        message: paymentStatus === 'success'
          ? 'Đặt cọc / Thanh toán đơn hàng thành công qua VNPay! Ekip đã ghi nhận lịch chụp.'
          : message || 'Thanh toán thất bại hoặc đã bị hủy.'
      })
      // Clear URL params so reload doesn't trigger alert again
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const handlePay = async (bookingId, paymentType) => {
    setPaymentLoadingId(`${bookingId}-${paymentType}`)
    try {
      const { url } = await createPaymentUrl(bookingId, paymentType)
      window.location.href = url
    } catch (err) {
      alert('Không thể khởi tạo thanh toán: ' + err.message)
      setPaymentLoadingId(null)
    }
  }

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
    if (!authUser) { setLoading(false); return }

    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const data = await getBookings()
        if (!cancelled) setRawOrders(Array.isArray(data) ? data : [])
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const orders = useMemo(
    () => rawOrders.map((b, i) => normaliseBooking(b, i)),
    [rawOrders],
  )

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = activeStatus === 'all' || order.status === activeStatus
    const hay = `${order.orderCode} ${order.serviceName} ${order.partnerName}`.toLowerCase()
    return matchesStatus && hay.includes(searchTerm.trim().toLowerCase())
  })

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
                return (
                  <article key={order.id} className="order-card">
                    <img src={order.image} alt={order.serviceName} />

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
                        {order.location !== '—' && <span>📍 {order.location}</span>}
                        <span>{paymentMeta[order.paymentStatus] ?? order.paymentStatus}</span>
                      </div>

                      <dl className="order-card__prices">
                        <div><dt>Tổng tiền</dt><dd>{formatPrice(order.price)}</dd></div>
                        <div><dt>Giảm giá</dt><dd>{formatPrice(order.discount)}</dd></div>
                        <div><dt>Đã đặt cọc</dt><dd>{formatPrice(order.deposit)}</dd></div>
                        <div><dt>Còn lại</dt><dd>{formatPrice(order.remaining)}</dd></div>
                      </dl>

                      <div className="order-card__actions" style={{ flexWrap: 'wrap', gap: '8px' }}>
                        {order.promotionCode && (
                          <span className="order-card__promo">Mã giảm: {order.promotionCode}</span>
                        )}
                        <a href="/chat" onClick={(event) => handleChatClick(event, order)}>
                          Nhắn ekip
                        </a>

                        {order.paymentStatus === 'unpaid' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handlePay(order.id, 'deposit')}
                              disabled={paymentLoadingId !== null}
                              style={{
                                background: '#c7f6c6',
                                color: '#1a5f1a',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '999px',
                                fontSize: '13px',
                                fontWeight: '800',
                                cursor: 'pointer'
                              }}
                            >
                              {paymentLoadingId === `${order.id}-deposit` ? 'Đang tải...' : 'Đặt cọc 30% VNPay'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePay(order.id, 'full')}
                              disabled={paymentLoadingId !== null}
                              style={{
                                background: '#1f1713',
                                color: '#fff',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '999px',
                                fontSize: '13px',
                                fontWeight: '800',
                                cursor: 'pointer'
                              }}
                            >
                              {paymentLoadingId === `${order.id}-full` ? 'Đang tải...' : 'Thanh toán 100%'}
                            </button>
                          </>
                        )}

                        {order.paymentStatus === 'partially_paid' && (
                          <button
                            type="button"
                            onClick={() => handlePay(order.id, 'full')}
                            disabled={paymentLoadingId !== null}
                            style={{
                              background: '#1f1713',
                              color: '#fff',
                              border: 'none',
                              padding: '8px 16px',
                              borderRadius: '999px',
                              fontSize: '13px',
                              fontWeight: '800',
                              cursor: 'pointer'
                            }}
                          >
                            {paymentLoadingId === `${order.id}-full` ? 'Đang tải...' : 'Thanh toán 70% còn lại'}
                          </button>
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
              {paymentAlert.status === 'success' ? 'Thanh toán thành công' : 'Thanh toán thất bại'}
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

      <Footer />
    </main>
  )
}

export default OrderHistory
