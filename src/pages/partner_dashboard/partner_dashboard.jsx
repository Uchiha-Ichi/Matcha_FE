import { useEffect, useState } from 'react'
import { clearAuthUser, getAuthUser } from '../../utils/auth.js'
import { getBookings, getMyPartner, getPartnerConcepts, updateBookingStatus } from '../../utils/api.js'
import LoadingScreen from '../../components/LoadingScreen.jsx'
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

const formatPrice = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value ?? 0)

const formatDateTime = (value) => {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return value
  }
}

const navigate = (event, path, state = {}) => {
  event.preventDefault()
  if (window.location.pathname === path) return
  window.history.pushState(state, '', path)
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
          <em>{partner?.band_name ?? '…'}</em>
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

function PartnerDashboard() {
  const authUser = getAuthUser()
  const [partner, setPartner] = useState(null)
  const [bookings, setBookings] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [myPartner, allBookings, allConcepts] = await Promise.all([
          getMyPartner(),
          getBookings(),
          getPartnerConcepts(),
        ])

        if (myPartner) {
          setPartner(myPartner)

          const myBookings = (allBookings || [])
            .filter((b) => b.partner?.id === myPartner.id || b.partner_id === myPartner.id)
            .sort((a, b) => new Date(b.booking_time) - new Date(a.booking_time))
          setBookings(myBookings)

          const myConcepts = (allConcepts || []).filter(
            (c) => c.partner?.id === myPartner.id || c.partner_id === myPartner.id,
          )
          setServices(myConcepts)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [authUser?.id])

  const handleUpdateStatus = async (bookingId, newStatus) => {
    setUpdatingId(bookingId)
    try {
      await updateBookingStatus(bookingId, newStatus)
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b)),
      )
    } catch (err) {
      alert(`Cập nhật thất bại: ${err.message}`)
    } finally {
      setUpdatingId(null)
    }
  }

  const stats = {
    totalBookings: bookings.length,
    pendingBookings: bookings.filter((b) => b.status === 'pending').length,
    confirmedBookings: bookings.filter((b) => b.status === 'confirmed').length,
    revenue: bookings
      .filter((b) => b.status === 'completed')
      .reduce((sum, b) => sum + (Number(b.price) - Number(b.price_discount)), 0),
  }

  if (loading) {
    return (
      <main className="partner-dashboard-page">
        <PartnerDashboardHeader partner={partner} />
        <LoadingScreen text="Đang tải dữ liệu..." />
      </main>
    )
  }

  if (error) {
    return (
      <main className="partner-dashboard-page">
        <PartnerDashboardHeader partner={partner} />
        <div style={{ padding: '2rem', color: 'crimson' }}>Lỗi: {error}</div>
      </main>
    )
  }

  return (
    <main className="partner-dashboard-page">
      <PartnerDashboardHeader partner={partner} />

      <section className="partner-dashboard-hero">
        <img src={partner?.cover_image} alt={partner?.band_name} />
        <div className="partner-dashboard-hero__overlay" />
        <div className="partner-dashboard-hero__content">
          <span>PARTNER DASHBOARD</span>
          <h1>{partner?.band_name ?? 'Studio của bạn'}</h1>
          <p>{partner?.description}</p>
          <div>
            <strong>{partner?.location_name}</strong>
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
              <strong>{stats.totalBookings}</strong>
            </article>
            <article>
              <span>Chờ xác nhận</span>
              <strong>{stats.pendingBookings}</strong>
            </article>
            <article>
              <span>Đã xác nhận</span>
              <strong>{stats.confirmedBookings}</strong>
            </article>
            <article>
              <span>Doanh thu hoàn tất</span>
              <strong>{formatPrice(stats.revenue)}</strong>
            </article>
          </div>

          <section className="partner-panel">
            <div className="partner-panel__heading">
              <div>
                <span>BOOKING</span>
                <h2>Đơn đặt lịch gần đây</h2>
              </div>
              <a href="/partner-bookings" onClick={(event) => navigate(event, '/partner-bookings')}>
                Xem tất cả
              </a>
            </div>

            <div className="partner-booking-list">
              {bookings.slice(0, 5).map((booking) => {
                const status = statusMeta[booking.status] ?? statusMeta.pending
                const payment = booking.payments?.[0]
                const paymentStatus = payment?.status ?? 'unpaid'
                const conceptName =
                  booking.details?.[0]?.partner_concept?.concept?.name ?? 'Dịch vụ'

                // Next valid status transitions
                const nextStatus =
                  booking.status === 'pending'
                    ? 'confirmed'
                    : booking.status === 'confirmed'
                      ? 'completed'
                      : null

                return (
                  <article key={booking.id} className="partner-booking-card">
                    <img
                      src={booking.user?.avatar ?? `https://i.pravatar.cc/80?u=${booking.id}`}
                      alt={booking.user?.full_name ?? 'Khách hàng'}
                    />
                    <div>
                      <div className="partner-booking-card__top">
                        <div>
                          <strong>{booking.user?.full_name ?? 'Khách hàng'}</strong>
                          <p>{conceptName}</p>
                        </div>
                        <span className={`partner-status partner-status--${status.tone}`}>
                          {status.label}
                        </span>
                      </div>

                      <div className="partner-booking-card__meta">
                        <span>{formatDateTime(booking.booking_time)}</span>
                        <span>{paymentLabel[paymentStatus]}</span>
                        <span>{formatPrice(Number(booking.price) - Number(booking.price_discount))}</span>
                      </div>

                      <div className="partner-booking-card__actions">
                        <a href="/chat" onClick={(event) => navigate(event, '/chat', { userId: booking.user?.id, bookingId: booking.id })}>
                          Nhắn khách
                        </a>
                        {nextStatus && (
                          <button
                            type="button"
                            disabled={updatingId === booking.id}
                            onClick={() => handleUpdateStatus(booking.id, nextStatus)}
                          >
                            {updatingId === booking.id
                              ? 'Đang cập nhật…'
                              : nextStatus === 'confirmed'
                                ? 'Xác nhận'
                                : 'Hoàn thành'}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
              {bookings.length === 0 && (
                <p className="partner-empty-text">Chưa có đơn đặt lịch nào.</p>
              )}
            </div>
          </section>

          <section className="partner-panel">
            <div className="partner-panel__heading">
              <div>
                <span>SERVICE</span>
                <h2>Dịch vụ đang bán</h2>
              </div>
              <a href="/partner-services" onClick={(event) => navigate(event, '/partner-services')}>
                Quản lý
              </a>
            </div>

            <div className="partner-service-grid">
              {services.map((service) => (
                <article key={service.id}>
                  <span>{service.time}</span>
                  <h3>{service.concept?.name ?? 'Concept'}</h3>
                  <p>{service.image_des}</p>
                  <strong>{formatPrice(service.price)}</strong>
                </article>
              ))}
              {services.length === 0 && (
                <p className="partner-empty-text">Chưa có dịch vụ nào.</p>
              )}
            </div>
          </section>
        </div>

        <aside className="partner-dashboard-side">
          <section className="partner-side-card">
            <span>NOTIFICATION</span>
            <h2>Thông báo</h2>
            <p className="partner-empty-text">Chưa có thông báo mới.</p>
          </section>
        </aside>
      </section>
    </main>
  )
}

export default PartnerDashboard
