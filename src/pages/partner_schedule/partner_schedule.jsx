import { useEffect, useState } from 'react'
import { getAuthUser } from '../../utils/auth.js'
import {
  getDateBlocks,
  getMyPartner,
  createDateBlock,
  deleteDateBlock,
} from '../../utils/api.js'
import { PartnerDashboardHeader } from '../partner_dashboard/partner_dashboard.jsx'
import LoadingScreen from '../../components/LoadingScreen.jsx'
import '../partner_dashboard/partner_dashboard.css'
import '../partner_bookings/partner_bookings.css'
import './partner_schedule.css'

const formatDate = (value) => {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(value))
  } catch {
    return value
  }
}

function PartnerSchedule() {
  const authUser = getAuthUser()
  const [partner, setPartner] = useState(null)
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newDate, setNewDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [adding, setAdding] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [myPartner, allBlocks] = await Promise.all([
          getMyPartner(),
          getDateBlocks(),
        ])

        setPartner(myPartner ?? null)

        if (myPartner) {
          const myBlocks = (allBlocks || []).filter(
            (b) => b.partner?.id === myPartner.id || b.partner_id === myPartner.id,
          )
          setBlocks(myBlocks)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [authUser?.id])

  const showSuccess = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const addDateBlock = async (event) => {
    event.preventDefault()
    if (!newDate || !partner) return

    if (startTime && endTime && startTime >= endTime) {
      alert('Giờ kết thúc phải sau giờ bắt đầu!')
      return
    }
    if ((startTime && !endTime) || (!startTime && endTime)) {
      alert('Vui lòng nhập cả giờ bắt đầu và kết thúc, hoặc để trống cả hai để chặn cả ngày!')
      return
    }

    setAdding(true)
    try {
      const created = await createDateBlock(partner.id, newDate, startTime, endTime)
      setBlocks((prev) => [...prev, created])
      setNewDate('')
      setStartTime('')
      setEndTime('')
      showSuccess('Đã thêm lịch chặn.')
    } catch (err) {
      alert(`Thêm thất bại: ${err.message}`)
    } finally {
      setAdding(false)
    }
  }

  const removeBlock = async (id) => {
    try {
      await deleteDateBlock(id)
      setBlocks((prev) => prev.filter((b) => b.id !== id))
      showSuccess('Đã bỏ chặn.')
    } catch (err) {
      alert(`Xóa thất bại: ${err.message}`)
    }
  }

  return (
    <main className="partner-dashboard-page">
      <PartnerDashboardHeader partner={partner} activePath="/partner-schedule" />

      <section className="partner-workspace">
        <div className="partner-workspace__heading">
          <div>
            <span>DATE BLOCK</span>
            <h1>Lịch chặn</h1>
            <p>Quản lý các ngày không nhận booking.</p>
          </div>
        </div>

        {successMsg && (
          <div
            style={{
              background: '#d4edda',
              border: '1px solid #c3e6cb',
              color: '#155724',
              borderRadius: '8px',
              padding: '0.75rem 1.25rem',
              marginBottom: '1rem',
              fontWeight: 600,
            }}
          >
            {successMsg}
          </div>
        )}

        {loading && <LoadingScreen text="Đang tải dữ liệu..." />}
        {error && <p style={{ color: 'crimson' }}>Lỗi: {error}</p>}

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
                required
              />
            </label>

            <div className="partner-time-fields" style={{ display: 'flex', gap: '1rem', margin: '1rem 0' }}>
              <label style={{ flex: 1, margin: 0 }}>
                <span style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.25rem', display: 'block' }}>Giờ bắt đầu (tùy chọn)</span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ced4da' }}
                />
              </label>

              <label style={{ flex: 1, margin: 0 }}>
                <span style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.25rem', display: 'block' }}>Giờ kết thúc (tùy chọn)</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ced4da' }}
                />
              </label>
            </div>
            
            <p style={{ fontSize: '0.8rem', color: '#6c757d', margin: '-0.5rem 0 1rem 0' }}>
              * Để trống cả 2 ô giờ để chặn cả ngày.
            </p>

            <button type="submit" disabled={adding || !partner}>
              {adding ? 'Đang thêm…' : 'Thêm lịch chặn'}
            </button>
          </form>

          <div className="partner-date-list">
            {blocks.map((block) => (
              <article key={block.id}>
                <div>
                  <span>BLOCK #{block.id}</span>
                  <strong>
                    {formatDate(block.date_block)}{' '}
                    {block.start_time && block.end_time ? (
                      <span className="ps-block-time" style={{ color: '#dc3545', fontWeight: 600 }}>
                        ({block.start_time.slice(0, 5)} - {block.end_time.slice(0, 5)})
                      </span>
                    ) : (
                      <span className="ps-block-time" style={{ color: '#dc3545', fontWeight: 600 }}>
                        (Cả ngày)
                      </span>
                    )}
                  </strong>
                  <p>
                    {block.start_time && block.end_time
                      ? `Partner không nhận booking từ ${block.start_time.slice(0, 5)} đến ${block.end_time.slice(0, 5)}.`
                      : 'Partner không nhận booking trong ngày này.'}
                  </p>
                </div>
                <button type="button" onClick={() => removeBlock(block.id)}>
                  Bỏ chặn
                </button>
              </article>
            ))}
            {!loading && blocks.length === 0 && (
              <p className="partner-empty-text">Chưa có ngày chặn nào.</p>
            )}
          </div>
        </section>
      </section>
    </main>
  )
}

export default PartnerSchedule
