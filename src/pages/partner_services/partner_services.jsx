import { useEffect, useState } from 'react'
import { getAuthUser } from '../../utils/auth.js'
import {
  getConcepts,
  getMyPartner,
  getPartnerConcepts,
  createPartnerConcept,
  updatePartnerConcept,
  deletePartnerConcept,
} from '../../utils/api.js'
import { PartnerDashboardHeader } from '../partner_dashboard/partner_dashboard.jsx'
import LoadingScreen from '../../components/LoadingScreen.jsx'
import '../partner_dashboard/partner_dashboard.css'
import '../partner_bookings/partner_bookings.css'
import './partner_services.css'

const formatPrice = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value ?? 0)

const navigate = (event, path) => {
  event.preventDefault()
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

const defaultDraft = {
  concept_id: '',
  price: '',
  time: '',
  image_des: '',
  files: [],
}

function PartnerServices() {
  const authUser = getAuthUser()
  const [partner, setPartner] = useState(null)
  const [services, setServices] = useState([])
  const [concepts, setConcepts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [draft, setDraft] = useState(defaultDraft)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState({})
  const [fileInputRef] = useState(() => ({ current: null }))
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [myPartner, allConcepts, allServices] = await Promise.all([
          getMyPartner(),
          getConcepts(),
          getPartnerConcepts(),
        ])

        setPartner(myPartner ?? null)
        setConcepts(allConcepts || [])

        if (myPartner) {
          const myConcepts = (allServices || []).filter(
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

  const showSuccess = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const updateDraft = (field, value) => setDraft((d) => ({ ...d, [field]: value }))

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || [])
    setDraft((d) => ({ ...d, files }))
  }

  const handleCreate = async (event) => {
    event.preventDefault()
    if (!draft.concept_id || !draft.price) {
      alert('Vui lòng chọn concept và nhập giá')
      return
    }
    if (!partner) {
      alert('Không tìm thấy thông tin partner')
      return
    }
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('price', String(Number(draft.price)))
      formData.append('time', draft.time)
      formData.append('concept_id', String(draft.concept_id))
      formData.append('partner_id', String(partner.id))
      if (draft.files && draft.files.length > 0) {
        draft.files.forEach((file) => {
          formData.append('files', file)
        })
      } else if (draft.image_des) {
        formData.append('image_des', draft.image_des)
      }

      const created = await createPartnerConcept(formData)
      // Reload services to get full relations
      const fresh = await getPartnerConcepts()
      const myConcepts = (fresh || []).filter(
        (c) => c.partner?.id === partner.id || c.partner_id === partner.id,
      )
      setServices(myConcepts)
      setDraft(defaultDraft)
      showSuccess('Đã thêm dịch vụ mới!')
    } catch (err) {
      alert(`Lưu thất bại: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa dịch vụ này?')) return
    try {
      await deletePartnerConcept(id)
      setServices((prev) => prev.filter((s) => s.id !== id))
      showSuccess('Đã xóa dịch vụ.')
    } catch (err) {
      alert(`Xóa thất bại: ${err.message}`)
    }
  }

  const startEdit = (service) => {
    setEditingId(service.id)
    setEditDraft({ price: service.price, time: service.time ?? '', image_des: service.image_des ?? '' })
  }

  const handleUpdate = async (id) => {
    try {
      await updatePartnerConcept(id, {
        price: Number(editDraft.price),
        time: editDraft.time,
        image_des: editDraft.image_des,
      })
      setServices((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, price: editDraft.price, time: editDraft.time, image_des: editDraft.image_des } : s,
        ),
      )
      setEditingId(null)
      showSuccess('Đã cập nhật dịch vụ.')
    } catch (err) {
      alert(`Cập nhật thất bại: ${err.message}`)
    }
  }

  return (
    <main className="partner-dashboard-page">
      <PartnerDashboardHeader partner={partner} activePath="/partner-services" />

      <section className="partner-workspace">
        <div className="partner-workspace__heading">
          <div>
            <span>SERVICE MANAGEMENT</span>
            <h1>Dịch vụ của partner</h1>
            <p>Quản lý các gói dịch vụ Partner_Concept của bạn.</p>
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

        <section className="partner-services-layout">
          <div className="partner-service-management-grid">
            {services.map((service) => (
              <article key={service.id} className="partner-service-manage-card">
                {editingId === service.id ? (
                  <>
                    <label>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Giá</span>
                      <input
                        type="number"
                        value={editDraft.price}
                        onChange={(e) => setEditDraft((d) => ({ ...d, price: e.target.value }))}
                        style={{ width: '100%', marginBottom: '0.5rem' }}
                      />
                    </label>
                    <label>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Thời lượng</span>
                      <select
                        value={editDraft.time}
                        onChange={(e) => setEditDraft((d) => ({ ...d, time: e.target.value }))}
                        style={{ width: '100%', marginBottom: '0.5rem', minHeight: '36px', borderRadius: '8px', border: '1px solid #ced4da', padding: '0 8px' }}
                      >
                        <option value="1h">1 giờ</option>
                        <option value="1.5h">1.5 giờ</option>
                        <option value="2h">2 giờ</option>
                        <option value="2.5h">2.5 giờ</option>
                        <option value="3h">3 giờ</option>
                        <option value="4h">4 giờ</option>
                        <option value="5h">5 giờ</option>
                        <option value="Cả ngày">Cả ngày</option>
                      </select>
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button type="button" onClick={() => handleUpdate(service.id)}>
                        Lưu
                      </button>
                      <button type="button" onClick={() => setEditingId(null)}>
                        Hủy
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span>{service.time}</span>
                    <h2
                      className="clickable"
                      onClick={(e) => navigate(e, `/partner-services/${service.id}`)}
                      title="Xem chi tiết phong cách này"
                    >
                      {service.concept?.name ?? 'Concept'}
                    </h2>
                    {service.images && service.images.length > 0 ? (
                      <div
                        className="partner-service-images clickable"
                        onClick={(e) => navigate(e, `/partner-services/${service.id}`)}
                        title="Xem chi tiết phong cách này"
                      >
                        {service.images.map((img) => (
                          <img
                            key={img.id}
                            src={img.image_src}
                            alt={service.concept?.name}
                            className="partner-service-img"
                          />
                        ))}
                      </div>
                    ) : service.image_des ? (
                      <div
                        className="partner-service-images clickable"
                        onClick={(e) => navigate(e, `/partner-services/${service.id}`)}
                        title="Xem chi tiết phong cách này"
                      >
                        <img
                          src={service.image_des}
                          alt={service.concept?.name}
                          className="partner-service-img"
                        />
                      </div>
                    ) : null}
                    <strong>{formatPrice(service.price)}</strong>
                    <div>
                      <button type="button" onClick={() => startEdit(service)}>
                        Sửa
                      </button>
                      <button type="button" onClick={() => handleDelete(service.id)}>
                        Xóa
                      </button>
                    </div>
                  </>
                )}
              </article>
            ))}
            {!loading && services.length === 0 && (
              <p className="partner-empty-text">Chưa có dịch vụ nào.</p>
            )}
          </div>

          <form className="partner-service-form" onSubmit={handleCreate}>
            <span>THÊM PARTNER_CONCEPT</span>
            <h2>Dịch vụ mới</h2>

            <label>
              <span>Concept</span>
              <select
                value={draft.concept_id}
                onChange={(event) => updateDraft('concept_id', event.target.value)}
                required
              >
                <option value="">— Chọn concept —</option>
                {concepts.map((concept) => (
                  <option key={concept.id} value={concept.id}>
                    {concept.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Giá</span>
              <input
                type="number"
                value={draft.price}
                onChange={(event) => updateDraft('price', event.target.value)}
                placeholder="1200000"
                required
              />
            </label>

            <label>
              <span>Thời lượng</span>
              <select
                value={draft.time}
                onChange={(event) => updateDraft('time', event.target.value)}
                required
              >
                <option value="">— Chọn thời lượng —</option>
                <option value="1h">1 giờ</option>
                <option value="1.5h">1.5 giờ</option>
                <option value="2h">2 giờ</option>
                <option value="2.5h">2.5 giờ</option>
                <option value="3h">3 giờ</option>
                <option value="4h">4 giờ</option>
                <option value="5h">5 giờ</option>
                <option value="Cả ngày">Cả ngày</option>
              </select>
            </label>

            <label>
              <span>Ảnh minh họa (tối đa nhiều file)</span>
              <input type="file" accept="image/*" onChange={handleFileChange} multiple />
            </label>

            <label>
              <span>Hoặc nhập URL ảnh</span>
              <input
                value={draft.image_des}
                onChange={(event) => updateDraft('image_des', event.target.value)}
                placeholder="https://... hoặc để trống"
                disabled={draft.files && draft.files.length > 0}
              />
            </label>

            <button type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {saving ? (
                <>
                  <span className="spinner-loader"></span>
                  Đang lưu…
                </>
              ) : (
                'Lưu dịch vụ'
              )}
            </button>
          </form>
        </section>
      </section>
    </main>
  )
}

export default PartnerServices
