import { useEffect, useState } from 'react'
import { getAuthUser } from '../../utils/auth.js'
import { getBookings, getMyPartner, updateBookingStatus, updateBooking } from '../../utils/api.js'
import { PartnerDashboardHeader } from '../partner_dashboard/partner_dashboard.jsx'
import LoadingScreen from '../../components/LoadingScreen.jsx'
import '../partner_dashboard/partner_dashboard.css'
import './partner_bookings.css'

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
  window.history.pushState(state, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

const STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
}

function PartnerBookings() {
  const authUser = getAuthUser()
  const [partner, setPartner] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [updatingLink, setUpdatingLink] = useState(null)

  const isPhotoshootOrStudio =
    !partner?.category?.name ||
    partner.category.name.toLowerCase().includes('chụp') ||
    partner.category.name.toLowerCase().includes('chup') ||
    partner.category.name.toLowerCase().includes('studio')

  const handleSaveResultLink = async (bookingId) => {
    const inputEl = document.getElementById(`result-link-${bookingId}`)
    const url = inputEl?.value?.trim() ?? ''

    setUpdatingLink(bookingId)
    try {
      await updateBooking(bookingId, { result_link: url })
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, result_link: url } : b)),
      )
      alert('Đã cập nhật link sản phẩm thành công!')
    } catch (err) {
      alert(`Cập nhật link thất bại: ${err.message}`)
    } finally {
      setUpdatingLink(null)
    }
  }

  useEffect(() => {
    const load = async () => {
      try {
        const [myPartner, allBookings] = await Promise.all([
          getMyPartner(),
          getBookings(),
        ])

        setPartner(myPartner ?? null)

        // Backend đã filter đúng theo role partner — chỉ cần sort
        const sorted = (allBookings || [])
          .sort((a, b) => new Date(b.booking_time) - new Date(a.booking_time))
        setBookings(sorted)
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

  const displayed = filterStatus === 'all' ? bookings : bookings.filter((b) => b.status === filterStatus)

  return (
    <main className="partner-dashboard-page">
      <PartnerDashboardHeader partner={partner} activePath="/partner-bookings" />

      <section className="partner-workspace">
        <div className="partner-workspace__heading">
          <div>
            <span>BOOKING MANAGEMENT</span>
            <h1>Đơn đặt lịch</h1>
            <p>Quản lý trạng thái booking, thanh toán và trao đổi nhanh với khách hàng.</p>
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStatus(s)}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: '999px',
                border: '1.5px solid',
                cursor: 'pointer',
                fontWeight: filterStatus === s ? 700 : 400,
                borderColor: filterStatus === s ? 'var(--color-primary, #5b3cf7)' : '#ddd',
                background: filterStatus === s ? 'var(--color-primary, #5b3cf7)' : 'transparent',
                color: filterStatus === s ? '#fff' : 'inherit',
                transition: 'all 0.2s',
              }}
            >
              {s === 'all'
                ? 'Tất cả'
                : (statusMeta[s]?.label ?? s)}
            </button>
          ))}
        </div>

        {loading && <LoadingScreen text="Đang tải dữ liệu..." />}
        {error && <p style={{ color: 'crimson' }}>Lỗi: {error}</p>}

        <section className="partner-booking-table">
          {displayed.map((booking) => {
            const status = statusMeta[booking.status] ?? statusMeta.pending
            const payment = booking.payments?.[0]
            const paymentStatus = payment?.status ?? 'unpaid'
            const conceptName =
              booking.details?.[0]?.partner_concept?.concept?.name ?? 'Dịch vụ'
            const code = `MTC-${String(booking.id).padStart(5, '0')}`
            const transitions = STATUS_TRANSITIONS[booking.status] ?? []

            const showResultLinkInput = (booking.status === 'completed') && isPhotoshootOrStudio

            return (
              <div key={booking.id} className="partner-booking-card">
                <article className="partner-booking-row">
                  <img
                    src={booking.user?.avatar ?? `https://i.pravatar.cc/80?u=${booking.id}`}
                    alt={booking.user?.full_name ?? 'Khách hàng'}
                  />
                  <div>
                    <span>{code}</span>
                    <strong>{booking.user?.full_name ?? 'Khách hàng'}</strong>
                    <p>{conceptName}</p>
                  </div>
                  <div>
                    <span>Thời gian</span>
                    <strong>{formatDateTime(booking.booking_time)}</strong>
                    <p>{paymentLabel[paymentStatus]}</p>
                  </div>
                  <div>
                    <span>Giá trị</span>
                    <strong>{formatPrice(Number(booking.price) - Number(booking.price_discount))}</strong>
                    <p>Cọc {formatPrice(booking.price_deposit)}</p>
                  </div>
                  <div className="partner-booking-row__actions">
                    <span className={`partner-status partner-status--${status.tone}`}>
                      {status.label}
                    </span>
                    <a href="/chat" onClick={(event) => navigate(event, '/chat', { userId: booking.user?.id, bookingId: booking.id })}>
                      Nhắn khách
                    </a>
                    {transitions.map((t) => (
                      <button
                        key={t}
                        type="button"
                        disabled={updatingId === booking.id}
                        onClick={() => handleUpdateStatus(booking.id, t)}
                        style={{
                          background: t === 'cancelled' ? 'crimson' : undefined,
                        }}
                      >
                        {updatingId === booking.id
                          ? '…'
                          : t === 'confirmed'
                            ? 'Xác nhận'
                            : t === 'completed'
                              ? 'Hoàn thành'
                              : 'Hủy đơn'}
                      </button>
                    ))}
                  </div>
                </article>

                {showResultLinkInput && (
                  <div className="partner-booking-result-link">
                    <label>🔗 LINK KẾT QUẢ SẢN PHẨM (GOOGLE DRIVE / DROPBOX):</label>
                    <div className="partner-booking-result-link-input-group">
                      <input
                        type="url"
                        placeholder="Nhập link sản phẩm gửi khách..."
                        defaultValue={booking.result_link || ''}
                        id={`result-link-${booking.id}`}
                      />
                      <button
                        type="button"
                        disabled={updatingLink === booking.id}
                        onClick={() => handleSaveResultLink(booking.id)}
                      >
                        {updatingLink === booking.id ? 'Đang lưu…' : 'Cập nhật link'}
                      </button>
                    </div>
                    {booking.result_link && (
                      <div className="partner-booking-result-current">
                        Đã gửi khách: <a href={booking.result_link} target="_blank" rel="noopener noreferrer">{booking.result_link}</a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
          {!loading && displayed.length === 0 && (
            <p className="partner-empty-text">Không có đơn nào.</p>
          )}
        </section>
      </section>
    </main>
  )
}

export default PartnerBookings
