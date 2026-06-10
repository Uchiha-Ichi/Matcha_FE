import { useEffect, useState } from 'react'
import { getAuthUser } from '../../utils/auth.js'
import {
  getPartnerConcept,
  getMyPartner,
  updatePartnerConcept,
  deleteImage,
  setPrimaryImage,
  addImageToTarget,
} from '../../utils/api.js'
import { PartnerDashboardHeader } from '../partner_dashboard/partner_dashboard.jsx'
import LoadingScreen from '../../components/LoadingScreen.jsx'
import '../partner_dashboard/partner_dashboard.css'
import './partner_service_detail.css'

const formatPrice = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value ?? 0)

const navigate = (event, path) => {
  event.preventDefault()
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export default function PartnerServiceDetail({ partnerConceptId }) {
  const authUser = getAuthUser()
  const [partner, setPartner] = useState(null)
  const [concept, setConcept] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [price, setPrice] = useState('')
  const [time, setTime] = useState('')
  const [updating, setUpdating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const showSuccess = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const loadData = async () => {
    try {
      const [myPartner, pc] = await Promise.all([
        getMyPartner(),
        getPartnerConcept(partnerConceptId),
      ])
      setPartner(myPartner ?? null)
      setConcept(pc ?? null)
      if (pc) {
        setPrice(pc.price)
        setTime(pc.time ?? '')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (partnerConceptId) {
      loadData()
    }
  }, [partnerConceptId, authUser?.id])

  const handleUpdateDetails = async (event) => {
    event.preventDefault()
    if (!price || !time) {
      alert('Vui lòng điền đầy đủ giá và thời lượng!')
      return
    }
    setUpdating(true)
    try {
      await updatePartnerConcept(partnerConceptId, {
        price: Number(price),
        time: time,
      })
      showSuccess('Cập nhật thông tin dịch vụ thành công!')
      // Refresh local data
      await loadData()
    } catch (err) {
      alert(`Lỗi cập nhật: ${err.message}`)
    } finally {
      setUpdating(false)
    }
  }

  const handleUploadImage = async (event) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return
    setUploading(true)
    try {
      let count = 0
      for (const file of files) {
        await addImageToTarget('partner_concept', partnerConceptId, file)
        count++
      }
      showSuccess(`Tải lên ${count} hình ảnh thành công!`)
      // Refresh local data
      await loadData()
    } catch (err) {
      alert(`Lỗi tải ảnh lên: ${err.message}`)
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handleDeleteImg = async (imgId) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa hình ảnh này khỏi portfolio?')) return
    setLoading(true)
    try {
      await deleteImage(imgId)
      showSuccess('Đã xóa hình ảnh.')
      await loadData()
    } catch (err) {
      alert(`Lỗi xóa ảnh: ${err.message}`)
      setLoading(false)
    }
  }

  const handleSetPrimaryImg = async (imgId) => {
    setLoading(true)
    try {
      await setPrimaryImage(imgId, 'partner_concept', partnerConceptId)
      showSuccess('Đã thiết lập làm ảnh đại diện chính.')
      await loadData()
    } catch (err) {
      alert(`Lỗi thiết lập ảnh chính: ${err.message}`)
      setLoading(false)
    }
  }

  if (loading) return <LoadingScreen text="Đang tải thông tin dịch vụ..." />

  if (error || !concept) {
    return (
      <main className="partner-dashboard-page">
        <Header />
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Không thể tải thông tin dịch vụ</h2>
          <p style={{ color: 'red' }}>{error || 'Dịch vụ không tồn tại.'}</p>
          <button onClick={(e) => navigate(e, '/partner-services')} style={{ marginTop: '1rem', padding: '0.5rem 1rem', borderRadius: '8px' }}>
            Quay lại danh sách
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="partner-dashboard-page">
      <PartnerDashboardHeader partner={partner} activePath="/partner-services" />

      <section className="partner-workspace">
        <div className="partner-workspace__heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span>CONCEPT DETAILS</span>
            <h1>Chi tiết phong cách</h1>
            <p>Quản lý hình ảnh và cấu hình chi tiết cho phong cách {concept.concept?.name}.</p>
          </div>
          <button
            type="button"
            className="ps-back-btn"
            onClick={(e) => navigate(e, '/partner-services')}
          >
            ← Quay lại danh sách
          </button>
        </div>

        {successMsg && (
          <div
            style={{
              background: '#d4edda',
              border: '1px solid #c3e6cb',
              color: '#155724',
              borderRadius: '8px',
              padding: '0.75rem 1.25rem',
              marginBottom: '1.5rem',
              fontWeight: 600,
            }}
          >
            {successMsg}
          </div>
        )}

        <div className="partner-service-detail-grid">
          {/* Cấu hình cơ bản */}
          <form className="partner-service-config-form" onSubmit={handleUpdateDetails}>
            <h2>Cấu hình gói chụp</h2>
            <label>
              <span>Tên Concept</span>
              <input type="text" value={concept.concept?.name ?? ''} disabled style={{ background: '#f1ebd9', color: '#666' }} />
            </label>

            <label>
              <span>Giá gói (VND)</span>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="1200000"
                required
              />
            </label>

            <label>
              <span>Thời lượng chụp</span>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
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

            <button type="submit" disabled={updating} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {updating ? (
                <>
                  <span className="spinner-loader"></span>
                  Đang cập nhật…
                </>
              ) : (
                'Cập nhật gói chụp'
              )}
            </button>
          </form>

          {/* Quản lý ảnh Portfolio */}
          <div className="partner-service-image-manager">
            <div className="ps-image-manager-header">
              <h2>Hình ảnh Portfolio ({concept.images?.length || 0})</h2>
              
              <label className="ps-upload-image-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: uploading ? 'not-allowed' : 'pointer' }}>
                {uploading ? (
                  <>
                    <span className="spinner-loader" style={{ border: '2px solid #6f584b', borderBottomColor: 'transparent' }}></span>
                    Đang tải lên…
                  </>
                ) : (
                  <>
                    <span>+ Thêm hình ảnh</span>
                    <input type="file" accept="image/*" onChange={handleUploadImage} style={{ display: 'none' }} disabled={uploading} multiple />
                  </>
                )}
              </label>
            </div>

            <div className="ps-images-gallery-grid">
              {concept.images && concept.images.length > 0 ? (
                concept.images.map((img) => (
                  <article key={img.id} className={`ps-image-card ${img.is_primary ? 'is-primary' : ''}`}>
                    <img src={img.image_src} alt="Portfolio item" />
                    
                    {img.is_primary ? (
                      <span className="ps-primary-badge">★ Ảnh chính</span>
                    ) : (
                      <div className="ps-image-actions-overlay">
                        <button type="button" onClick={() => handleSetPrimaryImg(img.id)} className="ps-action-btn-primary" title="Đặt làm ảnh đại diện chính">
                          Đặt làm ảnh chính
                        </button>
                        <button type="button" onClick={() => handleDeleteImg(img.id)} className="ps-action-btn-delete" title="Xóa hình ảnh này">
                          Xóa
                        </button>
                      </div>
                    )}
                  </article>
                ))
              ) : (
                <p className="ps-gallery-empty">Chưa có hình ảnh nào trong portfolio. Hãy tải lên ảnh đầu tiên!</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
