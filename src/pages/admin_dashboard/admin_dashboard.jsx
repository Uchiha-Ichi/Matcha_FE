import { clearAuthUser } from '../../utils/auth.js'
import {
  mockBookings,
  mockCategories,
  mockConcepts,
  mockFeedbacks,
  mockNotifications,
  mockPartners,
  mockPayments,
  mockRoles,
  mockUsers,
} from '../../../mockdata.js'
import './admin_dashboard.css'

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

const navigate = (event, path) => {
  event.preventDefault()

  if (window.location.pathname === path) return

  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

const handleLogout = () => {
  clearAuthUser()
  window.history.pushState({}, '', '/')
  window.dispatchEvent(new PopStateEvent('popstate'))
}

const buildAdminDashboardData = () => {
  const roleById = new Map(mockRoles.map((role) => [role.id, role]))
  const userById = new Map(mockUsers.map((user) => [user.id, user]))
  const categoryById = new Map(mockCategories.map((category) => [category.id, category]))
  const paymentByBookingId = new Map(
    mockPayments.map((payment) => [payment.booking_id, payment]),
  )

  const completedRevenue = mockBookings
    .filter((booking) => booking.status === 'completed')
    .reduce((total, booking) => total + booking.price - booking.price_discount, 0)

  const users = mockUsers.map((user) => ({
    ...user,
    full_name: fixVnText(user.full_name),
    roleName: roleById.get(user.role_id)?.name ?? 'User',
  }))

  const partners = mockPartners.map((partner) => ({
    ...partner,
    band_name: fixVnText(partner.band_name),
    location_name: fixVnText(partner.location_name),
    categoryName: fixVnText(categoryById.get(partner.categories_id)?.name) ?? 'Danh mục',
    ownerName: fixVnText(userById.get(partner.user_id)?.full_name) ?? 'Partner',
  }))

  const bookings = mockBookings.map((booking) => ({
    ...booking,
    customerName: fixVnText(userById.get(booking.user_id)?.full_name) ?? 'Khách hàng',
    partnerName: fixVnText(
      mockPartners.find((partner) => partner.id === booking.partner_id)?.band_name,
    ) ?? 'Partner',
    paymentStatus: paymentByBookingId.get(booking.id)?.status ?? 'unpaid',
  }))

  return {
    stats: {
      users: mockUsers.length,
      partners: mockPartners.length,
      bookings: mockBookings.length,
      revenue: completedRevenue,
      unreadNotifications: mockNotifications.filter((item) => item.status === 'unread').length,
      visibleFeedbacks: mockFeedbacks.filter((item) => item.status === 'visible').length,
    },
    users,
    partners,
    bookings,
    categories: mockCategories.map((category) => ({
      ...category,
      name: fixVnText(category.name),
      description: fixVnText(category.description),
    })),
    concepts: mockConcepts.map((concept) => ({
      ...concept,
      name: fixVnText(concept.name),
      description: fixVnText(concept.description),
    })),
    notifications: mockNotifications.map((notification) => ({
      ...notification,
      name: fixVnText(notification.name),
      description: fixVnText(notification.description),
    })),
  }
}

function AdminHeader() {
  return (
    <header className="admin-header">
      <a
        className="admin-brand"
        href="/admin-dashboard"
        onClick={(event) => navigate(event, '/admin-dashboard')}
      >
        <span aria-hidden="true">
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
        <div>
          <strong>MATCHA ADMIN</strong>
          <em>System console</em>
        </div>
      </a>

      <nav className="admin-nav" aria-label="Admin navigation">
        <a className="admin-nav__active" href="/admin-dashboard" onClick={(event) => navigate(event, '/admin-dashboard')}>
          Dashboard
        </a>
        <a href="/admin-dashboard" onClick={(event) => navigate(event, '/admin-dashboard')}>
          Users
        </a>
        <a href="/admin-dashboard" onClick={(event) => navigate(event, '/admin-dashboard')}>
          Partners
        </a>
        <a href="/admin-dashboard" onClick={(event) => navigate(event, '/admin-dashboard')}>
          Bookings
        </a>
        <a href="/admin-dashboard" onClick={(event) => navigate(event, '/admin-dashboard')}>
          Content
        </a>
      </nav>

      <div className="admin-actions">
        <a href="/" onClick={(event) => navigate(event, '/')}>
          Về website
        </a>
        <button type="button" onClick={handleLogout}>
          Đăng xuất
        </button>
      </div>
    </header>
  )
}

function AdminDashboard() {
  const dashboard = buildAdminDashboardData()

  return (
    <main className="admin-dashboard-page">
      <AdminHeader />

      <section className="admin-shell">
        <div className="admin-heading">
          <div>
            <span>ADMIN OVERVIEW</span>
            <h1>Dashboard quản trị</h1>
            <p>Giám sát người dùng, partner, booking, thanh toán và nội dung hệ thống.</p>
          </div>
          <button type="button">Xuất báo cáo</button>
        </div>

        <div className="admin-stats-grid">
          <article>
            <span>Users</span>
            <strong>{dashboard.stats.users}</strong>
          </article>
          <article>
            <span>Partners</span>
            <strong>{dashboard.stats.partners}</strong>
          </article>
          <article>
            <span>Bookings</span>
            <strong>{dashboard.stats.bookings}</strong>
          </article>
          <article>
            <span>Revenue</span>
            <strong>{formatPrice(dashboard.stats.revenue)}</strong>
          </article>
          <article>
            <span>Unread notifications</span>
            <strong>{dashboard.stats.unreadNotifications}</strong>
          </article>
          <article>
            <span>Visible feedbacks</span>
            <strong>{dashboard.stats.visibleFeedbacks}</strong>
          </article>
        </div>

        <section className="admin-grid">
          <div className="admin-panel admin-panel--wide">
            <div className="admin-panel__heading">
              <div>
                <span>BOOKING</span>
                <h2>Đơn hàng gần đây</h2>
              </div>
              <button type="button">Quản lý booking</button>
            </div>

            <div className="admin-booking-list">
              {dashboard.bookings.map((booking) => (
                <article key={booking.id}>
                  <div>
                    <span>#{booking.id}</span>
                    <strong>{booking.customerName}</strong>
                    <p>{booking.partnerName}</p>
                  </div>
                  <div>
                    <span>Status</span>
                    <strong>{booking.status}</strong>
                    <p>{booking.paymentStatus}</p>
                  </div>
                  <div>
                    <span>Total</span>
                    <strong>{formatPrice(booking.price - booking.price_discount)}</strong>
                    <p>Cọc {formatPrice(booking.price_deposit)}</p>
                  </div>
                  <button type="button">Chi tiết</button>
                </article>
              ))}
            </div>
          </div>

          <div className="admin-panel">
            <div className="admin-panel__heading">
              <div>
                <span>PARTNER</span>
                <h2>Đối tác</h2>
              </div>
            </div>
            <div className="admin-partner-list">
              {dashboard.partners.map((partner) => (
                <article key={partner.id}>
                  <img src={partner.cover_image} alt={partner.band_name} />
                  <div>
                    <strong>{partner.band_name}</strong>
                    <p>{partner.categoryName}</p>
                    <span>{partner.ownerName}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="admin-panel">
            <div className="admin-panel__heading">
              <div>
                <span>USER</span>
                <h2>Tài khoản</h2>
              </div>
            </div>
            <div className="admin-user-list">
              {dashboard.users.slice(0, 5).map((user) => (
                <article key={user.id}>
                  <img src={user.avatar_src} alt={user.full_name} />
                  <div>
                    <strong>{user.full_name}</strong>
                    <p>{user.email}</p>
                  </div>
                  <span>{user.roleName}</span>
                </article>
              ))}
            </div>
          </div>

          <div className="admin-panel">
            <div className="admin-panel__heading">
              <div>
                <span>CATEGORY</span>
                <h2>Danh mục</h2>
              </div>
            </div>
            <div className="admin-chip-list">
              {dashboard.categories.map((category) => (
                <button key={category.id} type="button">
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          <div className="admin-panel">
            <div className="admin-panel__heading">
              <div>
                <span>CONCEPT</span>
                <h2>Concept</h2>
              </div>
            </div>
            <div className="admin-chip-list">
              {dashboard.concepts.map((concept) => (
                <button key={concept.id} type="button">
                  {concept.name}
                </button>
              ))}
            </div>
          </div>

          <div className="admin-panel admin-panel--wide">
            <div className="admin-panel__heading">
              <div>
                <span>NOTIFICATION</span>
                <h2>Thông báo hệ thống</h2>
              </div>
            </div>
            <div className="admin-notification-list">
              {dashboard.notifications.map((notification) => (
                <article key={notification.id}>
                  <strong>{notification.name}</strong>
                  <p>{notification.description}</p>
                  <span>{notification.status}</span>
                </article>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  )
}

export default AdminDashboard
