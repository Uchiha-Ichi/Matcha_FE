import { useState } from 'react'
import { mockDateBlocks, mockPartners } from '../../../mockdata.js'
import { PartnerDashboardHeader } from '../partner_dashboard/partner_dashboard.jsx'
import '../partner_dashboard/partner_dashboard.css'
import '../partner_bookings/partner_bookings.css'
import './partner_schedule.css'

const fixVnText = (text) => {
  if (typeof text !== 'string') return text
  try {
    return decodeURIComponent(escape(text))
  } catch {
    return text
  }
}

const formatDate = (value) =>
  new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value.replace(' ', 'T')))

function PartnerSchedule() {
  const partner = { ...mockPartners[0], band_name: fixVnText(mockPartners[0].band_name) }
  const [blocks, setBlocks] = useState(
    mockDateBlocks.filter((block) => block.partner_id === partner.id),
  )
  const [newDate, setNewDate] = useState('')

  const addDateBlock = (event) => {
    event.preventDefault()
    if (!newDate) return

    setBlocks((current) => [
      ...current,
      {
        id: Date.now(),
        partner_id: partner.id,
        date_block: `${newDate} 00:00:00`,
      },
    ])
    setNewDate('')
  }

  return (
    <main className="partner-dashboard-page">
      <PartnerDashboardHeader partner={partner} activePath="/partner-schedule" />

      <section className="partner-workspace">
        <div className="partner-workspace__heading">
          <div>
            <span>DATE BLOCK</span>
            <h1>Lịch chặn</h1>
            <p>Quản lý các ngày không nhận booking theo bảng Date_Block.</p>
          </div>
        </div>

        <section className="partner-schedule-layout">
          <form className="partner-date-form" onSubmit={addDateBlock}>
            <span>THÊM DATE_BLOCK</span>
            <h2>Chặn ngày mới</h2>
            <label>
              <span>Ngày cần chặn</span>
              <input
                type="date"
                value={newDate}
                onChange={(event) => setNewDate(event.target.value)}
              />
            </label>
            <button type="submit">Thêm lịch chặn</button>
          </form>

          <div className="partner-date-list">
            {blocks.map((block) => (
              <article key={block.id}>
                <div>
                  <span>BLOCK #{block.id}</span>
                  <strong>{formatDate(block.date_block)}</strong>
                  <p>Partner không nhận booking trong ngày này.</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setBlocks((current) => current.filter((item) => item.id !== block.id))
                  }
                >
                  Bỏ chặn
                </button>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}

export default PartnerSchedule
