import { useEffect, useState } from 'react'
import { clearAuthUser } from '../../utils/auth.js'
import {
  getAdminStats,
  getUsers,
  getPartners,
  getBookings,
  getCategories,
  getConcepts,
  getFeedbacks,
  updateBookingStatus,
  deleteUser,
  updateUser,
  createCategory,
  updateCategory,
  deleteCategory,
  createConcept,
  updateConcept,
  deleteConcept,
  updateFeedback,
  deleteFeedback,
} from '../../utils/api.js'
import LoadingScreen from '../../components/LoadingScreen.jsx'
import './admin_dashboard.css'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const formatPrice = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value ?? 0)

const formatDateTime = (value) => {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(value))
  } catch { return value }
}

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

const statusMeta = {
  pending:   { label: 'Chờ xác nhận', color: '#f59e0b' },
  confirmed: { label: 'Đã xác nhận',  color: '#3b82f6' },
  completed: { label: 'Hoàn tất',     color: '#10b981' },
  cancelled: { label: 'Đã hủy',       color: '#6b7280' },
}
const paymentLabel = { paid: 'Đã thanh toán', partially_paid: 'Đã cọc', unpaid: 'Chưa TT' }

// ─────────────────────────────────────────────────────────────────────────────
// Inline Alert / Toast
// ─────────────────────────────────────────────────────────────────────────────
function Toast({ msg, type = 'success' }) {
  if (!msg) return null
  const bg = type === 'error' ? '#f8d7da' : '#d4edda'
  const color = type === 'error' ? '#721c24' : '#155724'
  const border = type === 'error' ? '#f5c6cb' : '#c3e6cb'
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, color, borderRadius: 10, padding: '0.7rem 1.2rem', marginBottom: '1rem', fontWeight: 700 }}>
      {msg}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────────────────────────────────────
const TABS = ['Dashboard', 'Users', 'Partners', 'Bookings', 'Categories', 'Concepts', 'Feedbacks']

function AdminHeader({ activeTab, setActiveTab }) {
  return (
    <header className="admin-header">
      <a className="admin-brand" href="/admin-dashboard" onClick={(e) => navigate(e, '/admin-dashboard')}>
        <span aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 3 18 5.2v5.5c0 4-2.4 7.6-6 9.3-3.6-1.7-6-5.3-6-9.3V5.2L12 3Z"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="m9.5 12.2 1.7 1.7 3.4-3.6"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div>
          <strong>MATCHA ADMIN</strong>
          <em>System console</em>
        </div>
      </a>

      <nav className="admin-nav" aria-label="Admin navigation">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? 'admin-nav__active' : ''}
            onClick={() => setActiveTab(tab)}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {tab}
          </button>
        ))}
      </nav>

      <div className="admin-actions">
        <a href="/" onClick={(e) => navigate(e, '/')}>Về website</a>
        <button type="button" onClick={handleLogout}>Đăng xuất</button>
      </div>
    </header>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Dashboard (stats + recent bookings + partners)
// ─────────────────────────────────────────────────────────────────────────────
function DashboardTab({ stats, bookings, partners, users, onStatusUpdate }) {
  return (
    <>
      <div className="admin-stats-grid">
        <article><span>Tổng đơn</span><strong>{stats?.total_bookings ?? 0}</strong></article>
        <article><span>Chờ xác nhận</span><strong>{stats?.bookings_by_status?.pending ?? 0}</strong></article>
        <article><span>Đã xác nhận</span><strong>{stats?.bookings_by_status?.confirmed ?? 0}</strong></article>
        <article><span>Hoàn tất</span><strong>{stats?.bookings_by_status?.completed ?? 0}</strong></article>
        <article><span>Doanh thu thực</span><strong style={{ fontSize: 16 }}>{formatPrice(stats?.total_revenue)}</strong></article>
        <article><span>Doanh thu kỳ vọng</span><strong style={{ fontSize: 16 }}>{formatPrice(stats?.expected_revenue)}</strong></article>
      </div>

      <div className="admin-grid">
        {/* Recent Bookings */}
        <div className="admin-panel admin-panel--wide">
          <div className="admin-panel__heading">
            <div><span>BOOKING</span><h2>Đơn hàng gần đây</h2></div>
          </div>
          <div className="admin-booking-list">
            {bookings.slice(0, 8).map((booking) => {
              const sm = statusMeta[booking.status] ?? statusMeta.pending
              const payment = booking.payments?.[0]
              const partnerName = booking.partner?.band_name ?? '—'
              const customerName = booking.user?.full_name ?? '—'
              return (
                <article key={booking.id}>
                  <div>
                    <span>#{String(booking.id).padStart(5,'0')}</span>
                    <strong>{customerName}</strong>
                    <p>{partnerName}</p>
                  </div>
                  <div>
                    <span>Status</span>
                    <strong style={{ color: sm.color }}>{sm.label}</strong>
                    <p>{paymentLabel[payment?.status ?? 'unpaid']}</p>
                  </div>
                  <div>
                    <span>Total</span>
                    <strong>{formatPrice(Number(booking.price) - Number(booking.price_discount))}</strong>
                    <p>Cọc {formatPrice(booking.price_deposit)}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {booking.status === 'pending' && (
                      <button type="button" onClick={() => onStatusUpdate(booking.id, 'confirmed')}>Xác nhận</button>
                    )}
                    {booking.status === 'confirmed' && (
                      <button type="button" onClick={() => onStatusUpdate(booking.id, 'completed')}>Hoàn tất</button>
                    )}
                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                      <button type="button" style={{ background: '#dc2626' }} onClick={() => onStatusUpdate(booking.id, 'cancelled')}>Hủy</button>
                    )}
                  </div>
                </article>
              )
            })}
            {bookings.length === 0 && <p style={{ color: '#888' }}>Chưa có đơn nào.</p>}
          </div>
        </div>

        {/* Partners */}
        <div className="admin-panel">
          <div className="admin-panel__heading">
            <div><span>PARTNER</span><h2>Đối tác ({partners.length})</h2></div>
          </div>
          <div className="admin-partner-list">
            {partners.slice(0, 6).map((partner) => (
              <article key={partner.id}>
                <img src={partner.cover_image ?? `https://i.pravatar.cc/70?u=p${partner.id}`} alt={partner.band_name} />
                <div>
                  <strong>{partner.band_name}</strong>
                  <p>{partner.category?.name ?? partner.location_name}</p>
                  <span>{partner.user?.full_name ?? `User #${partner.user?.id}`}</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Users */}
        <div className="admin-panel">
          <div className="admin-panel__heading">
            <div><span>USER</span><h2>Tài khoản ({users.length})</h2></div>
          </div>
          <div className="admin-user-list">
            {users.slice(0, 6).map((user) => (
              <article key={user.id}>
                <img src={user.avatar ?? `https://i.pravatar.cc/52?u=${user.id}`} alt={user.full_name} />
                <div>
                  <strong>{user.full_name ?? user.email}</strong>
                  <p>{user.email}</p>
                </div>
                <span>{user.roles?.[0]?.name ?? user.role?.name ?? 'user'}</span>
              </article>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Users
// ─────────────────────────────────────────────────────────────────────────────
function UsersTab({ users, onRefresh }) {
  const [toast, setToast] = useState({ msg: '', type: 'success' })
  const [busyId, setBusyId] = useState(null)
  const [search, setSearch] = useState('')

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '' }), 3000)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Xoá user này?')) return
    setBusyId(id)
    try {
      await deleteUser(id)
      showToast('Đã xoá user.')
      onRefresh('users')
    } catch (err) { showToast(err.message, 'error') }
    finally { setBusyId(null) }
  }

  const handleToggleActive = async (user) => {
    setBusyId(user.id)
    try {
      await updateUser(user.id, { is_active: !user.is_active })
      showToast('Đã cập nhật trạng thái.')
      onRefresh('users')
    } catch (err) { showToast(err.message, 'error') }
    finally { setBusyId(null) }
  }

  const filtered = users.filter((u) =>
    (u.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="admin-panel admin-panel--wide">
      <div className="admin-panel__heading">
        <div><span>USER MANAGEMENT</span><h2>Tài khoản ({users.length})</h2></div>
      </div>
      <Toast msg={toast.msg} type={toast.type} />
      <input
        placeholder="Tìm kiếm theo tên, email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 12, border: '1.5px solid #ddd', marginBottom: '1rem', fontSize: 14 }}
      />
      <div className="admin-booking-list">
        {filtered.map((user) => (
          <article key={user.id}>
            <div>
              <span>#{user.id}</span>
              <strong>{user.full_name ?? '—'}</strong>
              <p>{user.email}</p>
            </div>
            <div>
              <span>Role</span>
              <strong>{user.roles?.[0]?.name ?? user.role?.name ?? 'user'}</strong>
              <p style={{ color: user.is_active ? '#10b981' : '#ef4444' }}>
                {user.is_active ? 'Hoạt động' : 'Bị khoá'}
              </p>
            </div>
            <div>
              <span>Tham gia</span>
              <strong>{formatDateTime(user.created_at)}</strong>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                disabled={busyId === user.id}
                onClick={() => handleToggleActive(user)}
                style={{ background: user.is_active ? '#f59e0b' : '#10b981' }}
              >
                {user.is_active ? 'Khoá' : 'Mở khoá'}
              </button>
              <button
                type="button"
                disabled={busyId === user.id}
                onClick={() => handleDelete(user.id)}
                style={{ background: '#dc2626' }}
              >
                Xoá
              </button>
            </div>
          </article>
        ))}
        {filtered.length === 0 && <p style={{ color: '#888' }}>Không có kết quả.</p>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Partners
// ─────────────────────────────────────────────────────────────────────────────
function PartnersTab({ partners }) {
  const [search, setSearch] = useState('')
  const filtered = partners.filter((p) =>
    (p.band_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (p.location_name ?? '').toLowerCase().includes(search.toLowerCase())
  )
  return (
    <div className="admin-panel admin-panel--wide">
      <div className="admin-panel__heading">
        <div><span>PARTNER MANAGEMENT</span><h2>Đối tác ({partners.length})</h2></div>
      </div>
      <input
        placeholder="Tìm theo tên studio, địa điểm…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 12, border: '1.5px solid #ddd', marginBottom: '1rem', fontSize: 14 }}
      />
      <div className="admin-booking-list">
        {filtered.map((partner) => (
          <article key={partner.id}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <img
                src={partner.cover_image ?? `https://i.pravatar.cc/52?u=p${partner.id}`}
                alt={partner.band_name}
                style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }}
              />
              <div>
                <span>#{partner.id}</span>
                <strong>{partner.band_name}</strong>
                <p>{partner.location_name}</p>
              </div>
            </div>
            <div>
              <span>Danh mục</span>
              <strong>{partner.category?.name ?? '—'}</strong>
              <p>{partner.user?.full_name ?? partner.user?.email ?? '—'}</p>
            </div>
            <div>
              <span>Đánh giá</span>
              <strong>⭐ {Number(partner.rating_avg).toFixed(1)} ({partner.rating_count})</strong>
              <p style={{ color: partner.is_active ? '#10b981' : '#ef4444' }}>
                {partner.is_active ? 'Hoạt động' : 'Tạm ẩn'}
              </p>
            </div>
            <div />
          </article>
        ))}
        {filtered.length === 0 && <p style={{ color: '#888' }}>Không có kết quả.</p>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Bookings
// ─────────────────────────────────────────────────────────────────────────────
function BookingsTab({ bookings, onStatusUpdate }) {
  const [filterStatus, setFilterStatus] = useState('all')
  const displayed = filterStatus === 'all' ? bookings : bookings.filter((b) => b.status === filterStatus)

  return (
    <div className="admin-panel admin-panel--wide">
      <div className="admin-panel__heading">
        <div><span>BOOKING MANAGEMENT</span><h2>Đơn đặt lịch ({bookings.length})</h2></div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((s) => (
          <button
            key={s} type="button"
            onClick={() => setFilterStatus(s)}
            style={{
              padding: '0.35rem 1rem', borderRadius: 999, cursor: 'pointer',
              border: '1.5px solid', fontWeight: filterStatus === s ? 700 : 500,
              borderColor: filterStatus === s ? '#1f1713' : '#ddd',
              background: filterStatus === s ? '#1f1713' : 'transparent',
              color: filterStatus === s ? '#fff' : 'inherit',
            }}
          >
            {s === 'all' ? 'Tất cả' : statusMeta[s]?.label ?? s}
          </button>
        ))}
      </div>
      <div className="admin-booking-list">
        {displayed.map((booking) => {
          const sm = statusMeta[booking.status] ?? statusMeta.pending
          const payment = booking.payments?.[0]
          return (
            <article key={booking.id}>
              <div>
                <span>MTC-{String(booking.id).padStart(5,'0')}</span>
                <strong>{booking.user?.full_name ?? '—'}</strong>
                <p>{booking.partner?.band_name ?? '—'}</p>
              </div>
              <div>
                <span>Thời gian</span>
                <strong>{formatDateTime(booking.booking_time)}</strong>
                <p>{paymentLabel[payment?.status ?? 'unpaid']}</p>
              </div>
              <div>
                <span>Giá trị</span>
                <strong>{formatPrice(Number(booking.price) - Number(booking.price_discount))}</strong>
                <p style={{ color: sm.color }}>{sm.label}</p>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {booking.status === 'pending' && (
                  <button type="button" onClick={() => onStatusUpdate(booking.id, 'confirmed')}>Xác nhận</button>
                )}
                {booking.status === 'confirmed' && (
                  <button type="button" onClick={() => onStatusUpdate(booking.id, 'completed')}>Hoàn tất</button>
                )}
                {(booking.status === 'pending' || booking.status === 'confirmed') && (
                  <button type="button" style={{ background: '#dc2626' }} onClick={() => onStatusUpdate(booking.id, 'cancelled')}>Hủy</button>
                )}
              </div>
            </article>
          )
        })}
        {displayed.length === 0 && <p style={{ color: '#888' }}>Không có đơn nào.</p>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Categories
// ─────────────────────────────────────────────────────────────────────────────
function CategoriesTab({ categories, onRefresh }) {
  const [toast, setToast] = useState({ msg: '' })
  const [form, setForm] = useState({ name: '', description: '', is_active: true })
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '' }), 3000)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await createCategory(form)
      setForm({ name: '', description: '', is_active: true })
      showToast('Đã thêm danh mục mới!')
      onRefresh('categories')
    } catch (err) { showToast(err.message, 'error') }
    finally { setSaving(false) }
  }

  const handleUpdate = async (id) => {
    try {
      await updateCategory(id, editForm)
      setEditId(null)
      showToast('Đã cập nhật.')
      onRefresh('categories')
    } catch (err) { showToast(err.message, 'error') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Xoá danh mục này?')) return
    try {
      await deleteCategory(id)
      showToast('Đã xoá.')
      onRefresh('categories')
    } catch (err) { showToast(err.message, 'error') }
  }

  return (
    <div className="admin-panel admin-panel--wide">
      <div className="admin-panel__heading">
        <div><span>CATEGORY MANAGEMENT</span><h2>Danh mục ({categories.length})</h2></div>
      </div>
      <Toast msg={toast.msg} type={toast.type} />

      {/* Create form */}
      <form onSubmit={handleCreate} style={{ display: 'flex', gap: 10, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          placeholder="Tên danh mục" required value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          style={{ flex: 1, minWidth: 200, padding: '0.6rem 1rem', borderRadius: 12, border: '1.5px solid #ddd', fontSize: 14 }}
        />
        <input
          placeholder="Mô tả (tuỳ chọn)" value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          style={{ flex: 2, minWidth: 200, padding: '0.6rem 1rem', borderRadius: 12, border: '1.5px solid #ddd', fontSize: 14 }}
        />
        <button type="submit" disabled={saving} style={{ borderRadius: 999, padding: '0 1.5rem', border: 'none', background: '#1f1713', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
          {saving ? 'Đang lưu…' : '+ Thêm'}
        </button>
      </form>

      <div className="admin-chip-list" style={{ display: 'grid', gap: 10 }}>
        {categories.map((cat) => (
          <div key={cat.id} style={{ padding: '12px 16px', border: '1px solid #eee5d8', borderRadius: 16, background: '#fcfaf6', display: 'flex', alignItems: 'center', gap: 12 }}>
            {editId === cat.id ? (
              <>
                <input
                  value={editForm.name ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  style={{ flex: 1, padding: '0.4rem 0.8rem', borderRadius: 8, border: '1.5px solid #ddd', fontSize: 14 }}
                />
                <input
                  value={editForm.description ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  style={{ flex: 2, padding: '0.4rem 0.8rem', borderRadius: 8, border: '1.5px solid #ddd', fontSize: 14 }}
                />
                <button type="button" onClick={() => handleUpdate(cat.id)} style={{ padding: '0.4rem 0.8rem', borderRadius: 8, background: '#1f1713', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Lưu</button>
                <button type="button" onClick={() => setEditId(null)} style={{ padding: '0.4rem 0.8rem', borderRadius: 8, border: '1px solid #ddd', cursor: 'pointer' }}>Hủy</button>
              </>
            ) : (
              <>
                <strong style={{ flex: 1 }}>#{cat.id} {cat.name}</strong>
                <span style={{ flex: 2, color: '#888', fontSize: 13 }}>{cat.description}</span>
                <span style={{ color: cat.is_active ? '#10b981' : '#ef4444', fontSize: 12, fontWeight: 700 }}>{cat.is_active ? 'Active' : 'Ẩn'}</span>
                <button type="button" onClick={() => { setEditId(cat.id); setEditForm({ name: cat.name, description: cat.description }) }} style={{ padding: '0.4rem 0.8rem', borderRadius: 8, background: '#f59e0b', color: '#fff', border: 'none', cursor: 'pointer' }}>Sửa</button>
                <button type="button" onClick={() => handleDelete(cat.id)} style={{ padding: '0.4rem 0.8rem', borderRadius: 8, background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer' }}>Xoá</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Concepts
// ─────────────────────────────────────────────────────────────────────────────
function ConceptsTab({ concepts, onRefresh }) {
  const [toast, setToast] = useState({ msg: '' })
  const [form, setForm] = useState({ name: '', description: '' })
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '' }), 3000)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await createConcept(form)
      setForm({ name: '', description: '' })
      showToast('Đã thêm concept!')
      onRefresh('concepts')
    } catch (err) { showToast(err.message, 'error') }
    finally { setSaving(false) }
  }

  const handleUpdate = async (id) => {
    try {
      await updateConcept(id, editForm)
      setEditId(null)
      showToast('Đã cập nhật.')
      onRefresh('concepts')
    } catch (err) { showToast(err.message, 'error') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Xoá concept này?')) return
    try {
      await deleteConcept(id)
      showToast('Đã xoá.')
      onRefresh('concepts')
    } catch (err) { showToast(err.message, 'error') }
  }

  return (
    <div className="admin-panel admin-panel--wide">
      <div className="admin-panel__heading">
        <div><span>CONCEPT MANAGEMENT</span><h2>Concept ({concepts.length})</h2></div>
      </div>
      <Toast msg={toast.msg} type={toast.type} />

      <form onSubmit={handleCreate} style={{ display: 'flex', gap: 10, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          placeholder="Tên concept (VD: Kỷ yếu, Cưới…)" required value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          style={{ flex: 1, minWidth: 200, padding: '0.6rem 1rem', borderRadius: 12, border: '1.5px solid #ddd', fontSize: 14 }}
        />
        <input
          placeholder="Mô tả" value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          style={{ flex: 2, minWidth: 200, padding: '0.6rem 1rem', borderRadius: 12, border: '1.5px solid #ddd', fontSize: 14 }}
        />
        <button type="submit" disabled={saving} style={{ borderRadius: 999, padding: '0 1.5rem', border: 'none', background: '#1f1713', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
          {saving ? '…' : '+ Thêm'}
        </button>
      </form>

      <div style={{ display: 'grid', gap: 10 }}>
        {concepts.map((c) => (
          <div key={c.id} style={{ padding: '12px 16px', border: '1px solid #eee5d8', borderRadius: 16, background: '#fcfaf6', display: 'flex', alignItems: 'center', gap: 12 }}>
            {editId === c.id ? (
              <>
                <input value={editForm.name ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} style={{ flex: 1, padding: '0.4rem 0.8rem', borderRadius: 8, border: '1.5px solid #ddd', fontSize: 14 }} />
                <input value={editForm.description ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} style={{ flex: 2, padding: '0.4rem 0.8rem', borderRadius: 8, border: '1.5px solid #ddd', fontSize: 14 }} />
                <button type="button" onClick={() => handleUpdate(c.id)} style={{ padding: '0.4rem 0.8rem', borderRadius: 8, background: '#1f1713', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Lưu</button>
                <button type="button" onClick={() => setEditId(null)} style={{ padding: '0.4rem 0.8rem', borderRadius: 8, border: '1px solid #ddd', cursor: 'pointer' }}>Hủy</button>
              </>
            ) : (
              <>
                <strong style={{ flex: 1 }}>#{c.id} {c.name}</strong>
                <span style={{ flex: 2, color: '#888', fontSize: 13 }}>{c.description}</span>
                <button type="button" onClick={() => { setEditId(c.id); setEditForm({ name: c.name, description: c.description }) }} style={{ padding: '0.4rem 0.8rem', borderRadius: 8, background: '#f59e0b', color: '#fff', border: 'none', cursor: 'pointer' }}>Sửa</button>
                <button type="button" onClick={() => handleDelete(c.id)} style={{ padding: '0.4rem 0.8rem', borderRadius: 8, background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer' }}>Xoá</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Feedbacks
// ─────────────────────────────────────────────────────────────────────────────
function FeedbacksTab({ feedbacks, onRefresh }) {
  const [toast, setToast] = useState({ msg: '' })

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '' }), 3000)
  }

  const handleToggleVisible = async (fb) => {
    try {
      await updateFeedback(fb.id, { status: fb.status === 'visible' ? 'hidden' : 'visible' })
      showToast('Đã cập nhật trạng thái hiển thị.')
      onRefresh('feedbacks')
    } catch (err) { showToast(err.message, 'error') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Xoá feedback này?')) return
    try {
      await deleteFeedback(id)
      showToast('Đã xoá feedback.')
      onRefresh('feedbacks')
    } catch (err) { showToast(err.message, 'error') }
  }

  return (
    <div className="admin-panel admin-panel--wide">
      <div className="admin-panel__heading">
        <div><span>FEEDBACK MANAGEMENT</span><h2>Đánh giá ({feedbacks.length})</h2></div>
      </div>
      <Toast msg={toast.msg} type={toast.type} />
      <div className="admin-booking-list">
        {feedbacks.map((fb) => (
          <article key={fb.id}>
            <div>
              <span>#{fb.id}</span>
              <strong>{fb.user?.full_name ?? `User #${fb.user_id}`}</strong>
              <p>Partner #{fb.partner_id ?? fb.partner?.id}</p>
            </div>
            <div>
              <span>Rating</span>
              <strong>{'⭐'.repeat(Math.min(5, fb.rating ?? 0))} {fb.rating}/5</strong>
              <p style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fb.comment}</p>
            </div>
            <div>
              <span>Trạng thái</span>
              <strong style={{ color: fb.status === 'visible' ? '#10b981' : '#6b7280' }}>
                {fb.status === 'visible' ? 'Hiển thị' : 'Đã ẩn'}
              </strong>
              <p>{formatDateTime(fb.created_at)}</p>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" onClick={() => handleToggleVisible(fb)} style={{ background: fb.status === 'visible' ? '#f59e0b' : '#10b981' }}>
                {fb.status === 'visible' ? 'Ẩn' : 'Hiện'}
              </button>
              <button type="button" onClick={() => handleDelete(fb.id)} style={{ background: '#dc2626' }}>
                Xoá
              </button>
            </div>
          </article>
        ))}
        {feedbacks.length === 0 && <p style={{ color: '#888' }}>Chưa có đánh giá nào.</p>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [data, setData] = useState({
    stats: null,
    users: [],
    partners: [],
    bookings: [],
    categories: [],
    concepts: [],
    feedbacks: [],
  })
  const [loading, setLoading] = useState(true)
  const [globalError, setGlobalError] = useState(null)

  const loadAll = async () => {
    setLoading(true)
    try {
      const [stats, users, partners, bookings, categories, concepts, feedbacks] = await Promise.all([
        getAdminStats().catch(() => null),
        getUsers().catch(() => []),
        getPartners().catch(() => []),
        getBookings().catch(() => []),
        getCategories().catch(() => []),
        getConcepts().catch(() => []),
        getFeedbacks().catch(() => []),
      ])
      setData({ stats, users: users || [], partners: partners || [], bookings: bookings || [], categories: categories || [], concepts: concepts || [], feedbacks: feedbacks || [] })
    } catch (err) {
      setGlobalError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  const handleRefresh = (section) => {
    // Partial refresh: reload specific data
    const loaders = {
      users: () => getUsers().then((u) => setData((d) => ({ ...d, users: u || [] }))),
      partners: () => getPartners().then((p) => setData((d) => ({ ...d, partners: p || [] }))),
      bookings: () => getBookings().then((b) => setData((d) => ({ ...d, bookings: b || [] }))),
      categories: () => getCategories().then((c) => setData((d) => ({ ...d, categories: c || [] }))),
      concepts: () => getConcepts().then((c) => setData((d) => ({ ...d, concepts: c || [] }))),
      feedbacks: () => getFeedbacks().then((f) => setData((d) => ({ ...d, feedbacks: f || [] }))),
    }
    loaders[section]?.().catch((err) => console.error(err))
  }

  const handleStatusUpdate = async (bookingId, status) => {
    try {
      await updateBookingStatus(bookingId, status)
      handleRefresh('bookings')
      // Also refresh stats
      getAdminStats().then((s) => setData((d) => ({ ...d, stats: s }))).catch(() => {})
    } catch (err) {
      alert(`Lỗi: ${err.message}`)
    }
  }

  return (
    <main className="admin-dashboard-page">
      <AdminHeader activeTab={activeTab} setActiveTab={setActiveTab} />

      <section className="admin-shell">
        <div className="admin-heading">
          <div>
            <span>ADMIN OVERVIEW</span>
            <h1>Dashboard quản trị</h1>
            <p>Giám sát người dùng, partner, booking, thanh toán và nội dung hệ thống.</p>
          </div>
          <button type="button" onClick={loadAll} disabled={loading}>
            {loading ? 'Đang tải…' : '↻ Làm mới'}
          </button>
        </div>

        {globalError && <Toast msg={`Lỗi tải dữ liệu: ${globalError}`} type="error" />}

        {loading && <LoadingScreen text="Đang tải dữ liệu..." />}

        {!loading && (
          <>
            {activeTab === 'Dashboard' && (
              <DashboardTab
                stats={data.stats}
                bookings={data.bookings}
                partners={data.partners}
                users={data.users}
                onStatusUpdate={handleStatusUpdate}
              />
            )}
            {activeTab === 'Users' && (
              <UsersTab users={data.users} onRefresh={handleRefresh} />
            )}
            {activeTab === 'Partners' && (
              <PartnersTab partners={data.partners} />
            )}
            {activeTab === 'Bookings' && (
              <BookingsTab bookings={data.bookings} onStatusUpdate={handleStatusUpdate} />
            )}
            {activeTab === 'Categories' && (
              <CategoriesTab categories={data.categories} onRefresh={handleRefresh} />
            )}
            {activeTab === 'Concepts' && (
              <ConceptsTab concepts={data.concepts} onRefresh={handleRefresh} />
            )}
            {activeTab === 'Feedbacks' && (
              <FeedbacksTab feedbacks={data.feedbacks} onRefresh={handleRefresh} />
            )}
          </>
        )}
      </section>
    </main>
  )
}

export default AdminDashboard
