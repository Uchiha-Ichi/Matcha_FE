import { clearAuthUser, getAuthUser } from '../../utils/auth.js'
import {
  mockBookingDetails,
  mockBookings,
  mockConcepts,
  mockConversations,
  mockNotifications,
  mockPartnerConcepts,
  mockPartners,
  mockPayments,
  mockUsers,
} from '../../../mockdata.js'
import './partner_dashboard.css'

const statusMeta = {
  pending: { label: 'Chờ xác nhận', tone: 'warning' },
  confirmed: { label: 'Đã xác nhận', tone: 'info' },
  completed: { label: 'Hoàn tất', tone: 'success' },
  cancelled: { label: 'Đã hủy', tone: 'muted' },
}

const paymentLabel = {
  paid: 'Đã thanh toán',
  partially_paid: 'Đã đặt cọc',
  unpaid: 'Chưa thanh toán',
}

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

const handleLogout = () => {
  clearAuthUser()
  window.history.pushState({}, '', '/')
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function PartnerDashboardHeader({ partner, activePath = '/partner-dashboard' }) {
  const authUser = getAuthUser()

  return (
    <header className="partner-admin-header">
      <a
        className="partner-admin-brand"
        href="/partner-dashboard"
        onClick={(event) => navigate(event, '/partner-dashboard')}
      >
        <span aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M9 6.5 10.2 5h3.6L15 6.5h2.3A1.7 1.7 0 0 1 19 8.2v7.1a1.7 1.7 0 0 1-1.7 1.7H6.7A1.7 1.7 0 0 1 5 15.3V8.2a1.7 1.7 0 0 1 1.7-1.7H9Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="11.8" r="2.5" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </span>
        <div>
          <strong>MATCHA PARTNER</strong>
          <em>{partner.band_name}</em>
        </div>
      </a>

      <nav className="partner-admin-nav" aria-label="Partner dashboard navigation">
        <a
          className={activePath === '/partner-dashboard' ? 'partner-admin-nav__active' : ''}
          href="/partner-dashboard"
          onClick={(event) => navigate(event, '/partner-dashboard')}
        >
          Dashboard
        </a>
        <a
          className={activePath === '/partner-bookings' ? 'partner-admin-nav__active' : ''}
          href="/partner-bookings"
          onClick={(event) => navigate(event, '/partner-bookings')}
        >
          Đơn đặt lịch
        </a>
        <a
          className={activePath === '/partner-services' ? 'partner-admin-nav__active' : ''}
          href="/partner-services"
          onClick={(event) => navigate(event, '/partner-services')}
        >
          Dịch vụ
        </a>
        <a
          className={activePath === '/partner-schedule' ? 'partner-admin-nav__active' : ''}
          href="/partner-schedule"
          onClick={(event) => navigate(event, '/partner-schedule')}
        >
          Lịch chặn
        </a>
        <a href="/chat" onClick={(event) => navigate(event, '/chat')}>
          Tin nhắn
        </a>
      </nav>

      <div className="partner-admin-actions">
        <a href="/profile" onClick={(event) => navigate(event, '/profile')}>
          <img
            src={authUser?.avatar ?? 'https://i.pravatar.cc/100?u=partner-admin'}
            alt={authUser?.fullName ?? 'Partner'}
          />
          <span>{authUser?.fullName ?? 'Partner'}</span>
        </a>
        <button type="button" aria-label="Đăng xuất" onClick={handleLogout}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M10 5H6.8A1.8 1.8 0 0 0 5 6.8v10.4A1.8 1.8 0 0 0 6.8 19H10m4-4 3-3m0 0-3-3m3 3H9"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </header>
  )
}

const buildPartnerDashboardData = () => {
  const partner = mockPartners[0]
  const userById = new Map(mockUsers.map((user) => [user.id, user]))
  const paymentByBookingId = new Map(
    mockPayments.map((payment) => [payment.booking_id, payment]),
  )
  const detailByBookingId = new Map(
    mockBookingDetails.map((detail) => [detail.booking_id, detail]),
  )
  const partnerConceptById = new Map(
    mockPartnerConcepts.map((item) => [item.id, item]),
  )
  const conceptById = new Map(mockConcepts.map((concept) => [concept.id, concept]))

  const partnerConcepts = mockPartnerConcepts
    .filter((item) => item.partner_id === partner.id)
    .map((item) => ({
      ...item,
      conceptName: fixVnText(conceptById.get(item.concept_id)?.name) ?? 'Concept',
    }))

  const bookings = mockBookings
    .filter((booking) => booking.partner_id === partner.id)
    .map((booking) => {
      const detail = detailByBookingId.get(booking.id)
      const partnerConcept = detail
        ? partnerConceptById.get(detail.partner_concept_id)
        : null
      const concept = partnerConcept ? conceptById.get(partnerConcept.concept_id) : null
      const customer = userById.get(booking.user_id)
      const payment = paymentByBookingId.get(booking.id)

      return {
        ...booking,
        customerName: fixVnText(customer?.full_name) ?? 'Khách hàng',
        customerAvatar: customer?.avatar_src,
        serviceName: fixVnText(concept?.name) ?? 'Dịch vụ',
        paymentStatus: payment?.status ?? 'unpaid',
      }
    })
    .sort((first, second) => new Date(second.booking_time) - new Date(first.booking_time))

  const revenue = bookings
    .filter((booking) => booking.status === 'completed')
    .reduce((total, booking) => total + booking.price - booking.price_discount, 0)

  const conversations = mockConversations
    .filter((conversation) => conversation.partner_id === partner.id)
    .map((conversation) => ({
      ...conversation,
      customerName: fixVnText(userById.get(conversation.user_id)?.full_name) ?? 'Khách hàng',
    }))

  const notifications = mockNotifications.filter(
    (notification) => notification.user_id === partner.user_id,
  )

  return {
    partner: {
      ...partner,
      band_name: fixVnText(partner.band_name),
      description: fixVnText(partner.description),
      location_name: fixVnText(partner.location_name),
    },
    bookings,
    partnerConcepts,
    conversations,
    notifications,
    stats: {
      totalBookings: bookings.length,
      pendingBookings: bookings.filter((booking) => booking.status === 'pending').length,
      confirmedBookings: bookings.filter((booking) => booking.status === 'confirmed').length,
      revenue,
    },
  }
}

function PartnerDashboard() {
  const dashboard = buildPartnerDashboardData()

  return (
    <main className="partner-dashboard-page">
      <PartnerDashboardHeader partner={dashboard.partner} />

      <section className="partner-dashboard-hero">
        <img src={dashboard.partner.cover_image} alt={dashboard.partner.band_name} />
        <div className="partner-dashboard-hero__overlay" />
        <div className="partner-dashboard-hero__content">
          <span>PARTNER DASHBOARD</span>
          <h1>{dashboard.partner.band_name}</h1>
          <p>{dashboard.partner.description}</p>
          <div>
            <strong>{dashboard.partner.location_name}</strong>
            <a href="/partner-setup" onClick={(event) => navigate(event, '/partner-setup')}>
              Chỉnh sửa hồ sơ
            </a>
          </div>
        </div>
      </section>

      <section className="partner-dashboard-layout">
        <div className="partner-dashboard-main">
          <div className="partner-stats-grid">
            <article>
              <span>Tổng đơn</span>
              <strong>{dashboard.stats.totalBookings}</strong>
            </article>
            <article>
              <span>Chờ xác nhận</span>
              <strong>{dashboard.stats.pendingBookings}</strong>
            </article>
            <article>
              <span>Đã xác nhận</span>
              <strong>{dashboard.stats.confirmedBookings}</strong>
            </article>
            <article>
              <span>Doanh thu hoàn tất</span>
              <strong>{formatPrice(dashboard.stats.revenue)}</strong>
            </article>
          </div>

          <section className="partner-panel">
            <div className="partner-panel__heading">
              <div>
                <span>BOOKING</span>
                <h2>Đơn đặt lịch gần đây</h2>
              </div>
              <button type="button">Xuất báo cáo</button>
            </div>

            <div className="partner-booking-list">
              {dashboard.bookings.map((booking) => {
                const status = statusMeta[booking.status] ?? statusMeta.pending

                return (
                  <article key={booking.id} className="partner-booking-card">
                    <img src={booking.customerAvatar} alt={booking.customerName} />
                    <div>
                      <div className="partner-booking-card__top">
                        <div>
                          <strong>{booking.customerName}</strong>
                          <p>{booking.serviceName}</p>
                        </div>
                        <span className={`partner-status partner-status--${status.tone}`}>
                          {status.label}
                        </span>
                      </div>

                      <div className="partner-booking-card__meta">
                        <span>{formatDateTime(booking.booking_time)}</span>
                        <span>{paymentLabel[booking.paymentStatus]}</span>
                        <span>{formatPrice(booking.price - booking.price_discount)}</span>
                      </div>

                      <div className="partner-booking-card__actions">
                        <a href="/chat" onClick={(event) => navigate(event, '/chat')}>
                          Nhắn khách
                        </a>
                        <button type="button">Cập nhật trạng thái</button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>

          <section className="partner-panel">
            <div className="partner-panel__heading">
              <div>
                <span>SERVICE</span>
                <h2>Dịch vụ đang bán</h2>
              </div>
              <button type="button">Thêm dịch vụ</button>
            </div>

            <div className="partner-service-grid">
              {dashboard.partnerConcepts.map((service) => (
                <article key={service.id}>
                  <span>{service.time}</span>
                  <h3>{service.conceptName}</h3>
                  <p>{service.image_des}</p>
                  <strong>{formatPrice(service.price)}</strong>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="partner-dashboard-side">
          <section className="partner-side-card">
            <span>CHAT</span>
            <h2>Hội thoại mới</h2>
            <div className="partner-chat-list">
              {dashboard.conversations.map((conversation) => (
                <a key={conversation.id} href="/chat" onClick={(event) => navigate(event, '/chat')}>
                  <strong>{conversation.customerName}</strong>
                  <p>{fixVnText(conversation.last_message)}</p>
                  <span>{formatDateTime(conversation.updated_at)}</span>
                </a>
              ))}
            </div>
          </section>

          <section className="partner-side-card">
            <span>NOTIFICATION</span>
            <h2>Thông báo</h2>
            {dashboard.notifications.length > 0 ? (
              <div className="partner-notification-list">
                {dashboard.notifications.map((notification) => (
                  <article key={notification.id}>
                    <strong>{fixVnText(notification.name)}</strong>
                    <p>{fixVnText(notification.description)}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="partner-empty-text">Chưa có thông báo mới.</p>
            )}
          </section>
        </aside>
      </section>
    </main>
  )
}

export default PartnerDashboard
