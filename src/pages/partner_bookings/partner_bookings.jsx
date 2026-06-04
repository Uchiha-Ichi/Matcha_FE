import {
  mockBookingDetails,
  mockBookings,
  mockConcepts,
  mockPartnerConcepts,
  mockPartners,
  mockPayments,
  mockUsers,
} from '../../../mockdata.js'
import { PartnerDashboardHeader } from '../partner_dashboard/partner_dashboard.jsx'
import '../partner_dashboard/partner_dashboard.css'
import './partner_bookings.css'

const statusMeta = {
  pending: { label: 'Chờ xác nhận', tone: 'warning' },
  confirmed: { label: 'Đã xác nhận', tone: 'info' },
  completed: { label: 'Hoàn tất', tone: 'success' },
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
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

const buildBookingRows = () => {
  const partner = mockPartners[0]
  const userById = new Map(mockUsers.map((user) => [user.id, user]))
  const detailByBookingId = new Map(mockBookingDetails.map((detail) => [detail.booking_id, detail]))
  const partnerConceptById = new Map(mockPartnerConcepts.map((item) => [item.id, item]))
  const conceptById = new Map(mockConcepts.map((concept) => [concept.id, concept]))
  const paymentByBookingId = new Map(mockPayments.map((payment) => [payment.booking_id, payment]))

  return {
    partner: { ...partner, band_name: fixVnText(partner.band_name) },
    bookings: mockBookings
      .filter((booking) => booking.partner_id === partner.id)
      .map((booking) => {
        const detail = detailByBookingId.get(booking.id)
        const partnerConcept = detail ? partnerConceptById.get(detail.partner_concept_id) : null
        const concept = partnerConcept ? conceptById.get(partnerConcept.concept_id) : null
        const customer = userById.get(booking.user_id)
        const payment = paymentByBookingId.get(booking.id)

        return {
          ...booking,
          code: `MTC-${String(booking.id).padStart(5, '0')}`,
          customerName: fixVnText(customer?.full_name) ?? 'Khách hàng',
          customerAvatar: customer?.avatar_src,
          serviceName: fixVnText(concept?.name) ?? 'Dịch vụ',
          paymentStatus: payment?.status ?? 'unpaid',
        }
      }),
  }
}

function PartnerBookings() {
  const { partner, bookings } = buildBookingRows()

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
          <button type="button">Tạo lịch thủ công</button>
        </div>

        <section className="partner-booking-table">
          {bookings.map((booking) => {
            const status = statusMeta[booking.status] ?? statusMeta.pending

            return (
              <article key={booking.id} className="partner-booking-row">
                <img src={booking.customerAvatar} alt={booking.customerName} />
                <div>
                  <span>{booking.code}</span>
                  <strong>{booking.customerName}</strong>
                  <p>{booking.serviceName}</p>
                </div>
                <div>
                  <span>Thời gian</span>
                  <strong>{formatDateTime(booking.booking_time)}</strong>
                  <p>{paymentLabel[booking.paymentStatus]}</p>
                </div>
                <div>
                  <span>Giá trị</span>
                  <strong>{formatPrice(booking.price - booking.price_discount)}</strong>
                  <p>Cọc {formatPrice(booking.price_deposit)}</p>
                </div>
                <div className="partner-booking-row__actions">
                  <span className={`partner-status partner-status--${status.tone}`}>
                    {status.label}
                  </span>
                  <a href="/chat" onClick={(event) => navigate(event, '/chat')}>
                    Nhắn khách
                  </a>
                  <button type="button">Cập nhật</button>
                </div>
              </article>
            )
          })}
        </section>
      </section>
    </main>
  )
}

export default PartnerBookings
