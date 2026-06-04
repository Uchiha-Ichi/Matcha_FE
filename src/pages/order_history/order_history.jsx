import { useMemo, useState } from 'react'
import Footer from '../../components/Footer.jsx'
import Header from '../../components/Header.jsx'
import {
  mockBookingDetails,
  mockBookings,
  mockConcepts,
  mockPartnerConcepts,
  mockPartners,
  mockPayments,
  mockPromotions,
} from '../../../mockdata.js'
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
  unpaid: 'Chưa thanh toán',
}

const orderImages = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
]

const fixVnText = (text) => {
  if (typeof text !== 'string') return text
  try {
    return decodeURIComponent(escape(text))
  } catch {
    return text
  }
}

const formatPrice = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

const formatDateTime = (value) =>
  new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value.replace(' ', 'T')))

const navigate = (event, path) => {
  event.preventDefault()

  if (window.location.pathname === path) {
    return
  }

  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

const buildOrderItems = () => {
  const partnerById = new Map(mockPartners.map((partner) => [partner.id, partner]))
  const paymentByBookingId = new Map(
    mockPayments.map((payment) => [payment.booking_id, payment]),
  )
  const promotionById = new Map(
    mockPromotions.map((promotion) => [promotion.id, promotion]),
  )
  const partnerConceptById = new Map(
    mockPartnerConcepts.map((item) => [item.id, item]),
  )
  const conceptById = new Map(mockConcepts.map((concept) => [concept.id, concept]))
  const detailByBookingId = new Map(
    mockBookingDetails.map((detail) => [detail.booking_id, detail]),
  )

  return mockBookings.map((booking, index) => {
    const partner = partnerById.get(booking.partner_id)
    const payment = paymentByBookingId.get(booking.id)
    const promotion = promotionById.get(booking.promotion_id)
    const detail = detailByBookingId.get(booking.id)
    const partnerConcept = detail
      ? partnerConceptById.get(detail.partner_concept_id)
      : null
    const concept = partnerConcept ? conceptById.get(partnerConcept.concept_id) : null

    return {
      id: booking.id,
      orderCode: `MTC-${String(booking.id).padStart(5, '0')}`,
      status: booking.status,
      paymentStatus: payment?.status ?? 'unpaid',
      serviceName: fixVnText(concept?.name) ?? 'Dịch vụ Matcha',
      partnerName: fixVnText(partner?.band_name) ?? 'Matcha Partner',
      location: fixVnText(partner?.location_name) ?? 'Việt Nam',
      bookingTime: booking.booking_time,
      price: booking.price,
      discount: booking.price_discount,
      deposit: booking.price_deposit,
      remaining: booking.remaining_amount,
      promotionCode: promotion?.code ?? null,
      image: orderImages[index % orderImages.length],
    }
  })
}

function OrderHistory() {
  const [activeStatus, setActiveStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const orders = useMemo(() => buildOrderItems(), [])

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = activeStatus === 'all' || order.status === activeStatus
    const searchValue = `${order.orderCode} ${order.serviceName} ${order.partnerName}`.toLowerCase()
    const matchesSearch = searchValue.includes(searchTerm.trim().toLowerCase())
    return matchesStatus && matchesSearch
  })

  const totalSpent = orders
    .filter((order) => order.status === 'completed')
    .reduce((total, order) => total + order.price - order.discount, 0)

  const pendingCount = orders.filter((order) => order.status === 'pending').length
  const nextBooking = orders
    .filter((order) => order.status === 'confirmed' || order.status === 'pending')
    .sort((first, second) => new Date(first.bookingTime) - new Date(second.bookingTime))[0]

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

          <div className="order-history-list">
            {filteredOrders.length === 0 ? (
              <section className="order-history-empty">
                <h2>Không tìm thấy đơn hàng</h2>
                <p>Thử đổi bộ lọc hoặc từ khóa tìm kiếm để xem các đơn khác.</p>
              </section>
            ) : (
              filteredOrders.map((order) => {
                const status = statusMeta[order.status] ?? statusMeta.pending

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
                        <span className={`order-status order-status--${status.tone}`}>
                          {status.label}
                        </span>
                      </div>

                      <div className="order-card__meta">
                        <span>{formatDateTime(order.bookingTime)}</span>
                        <span>{order.location}</span>
                        <span>{paymentMeta[order.paymentStatus]}</span>
                      </div>

                      <dl className="order-card__prices">
                        <div>
                          <dt>Tổng tiền</dt>
                          <dd>{formatPrice(order.price)}</dd>
                        </div>
                        <div>
                          <dt>Giảm giá</dt>
                          <dd>{formatPrice(order.discount)}</dd>
                        </div>
                        <div>
                          <dt>Đã đặt cọc</dt>
                          <dd>{formatPrice(order.deposit)}</dd>
                        </div>
                        <div>
                          <dt>Còn lại</dt>
                          <dd>{formatPrice(order.remaining)}</dd>
                        </div>
                      </dl>

                      <div className="order-card__actions">
                        {order.promotionCode && (
                          <span className="order-card__promo">Mã giảm: {order.promotionCode}</span>
                        )}
                        <a
                          href="/service-detail"
                          onClick={(event) => navigate(event, '/service-detail')}
                        >
                          Xem chi tiết
                        </a>
                        <a href="/chat" onClick={(event) => navigate(event, '/chat')}>
                          Nhắn ekip
                        </a>
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
            <div>
              <dt>Tổng đơn</dt>
              <dd>{orders.length}</dd>
            </div>
            <div>
              <dt>Đang chờ</dt>
              <dd>{pendingCount}</dd>
            </div>
            <div>
              <dt>Đã chi tiêu</dt>
              <dd>{formatPrice(totalSpent)}</dd>
            </div>
          </dl>

          <section className="order-next-card">
            <span>Lịch gần nhất</span>
            {nextBooking ? (
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

      <Footer />
    </main>
  )
}

export default OrderHistory
