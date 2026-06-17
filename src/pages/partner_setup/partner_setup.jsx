import { useEffect, useRef, useState } from 'react'
import Header from '../../components/Header.jsx'
import { getAuthUser } from '../../utils/auth.js'
import { getCategories, getMyPartner, createPartner, updatePartner } from '../../utils/api.js'
import './partner_setup.css'

const navigateTo = (path) => {
  if (window.location.pathname === path) return
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

const STEPS = [
  { id: 1, label: 'Thông tin cơ bản', icon: '🏷️' },
  { id: 2, label: 'Mô tả & Hình ảnh', icon: '🖼️' },
  { id: 3, label: 'Xác nhận', icon: '✅' },
]

const VN_CITIES = [
  'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
  'Huế', 'Nha Trang', 'Đà Lạt', 'Vũng Tàu', 'Quy Nhơn',
  'Hội An', 'Buôn Ma Thuột', 'Vinh', 'Biên Hòa', 'Thủ Dầu Một',
]

const FALLBACK_HERO = 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1400&q=80'

function StepIndicator({ current }) {
  return (
    <div className="ps-steps">
      {STEPS.map((step, idx) => {
        const state = step.id < current ? 'done' : step.id === current ? 'active' : 'upcoming'
        return (
          <div key={step.id} className={`ps-steps__item ps-steps__item--${state}`}>
            <div className="ps-steps__dot">
              {state === 'done' ? '✓' : <span>{step.icon}</span>}
            </div>
            <div className="ps-steps__info">
              <p className="ps-steps__num">Bước {step.id}</p>
              <p className="ps-steps__label">{step.label}</p>
            </div>
            {idx < STEPS.length - 1 && <div className="ps-steps__line" />}
          </div>
        )
      })}
    </div>
  )
}

function PartnerSetup() {
  const authUser = getAuthUser()
  const [step, setStep] = useState(1)
  const [categories, setCategories] = useState([])
  const [existingPartner, setExistingPartner] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [errors, setErrors] = useState({})
  const [globalError, setGlobalError] = useState(null)
  const fileInputRef = useRef(null)

  // GPS state
  const [gpsStatus, setGpsStatus] = useState(null) // null | 'loading' | 'success' | 'error'
  const [gpsError, setGpsError] = useState(null)
  const [locationGps, setLocationGps] = useState(null) // "POINT(lng lat)" hoặc null

  // Form state
  const [form, setForm] = useState({
    band_name: '',
    categories_id: '',
    location_name: '',
    location_city: '',
    description: '',
    cover_image: '',
    cover_image_name: '',
  })

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))
  const clearErr = (field) => setErrors(e => { const n = { ...e }; delete n[field]; return n })

  // Load dữ liệu ban đầu
  useEffect(() => {
    const load = async () => {
      try {
        // getMyPartner có thể trả 403 với tài khoản mới (JWT chưa có role) — treat như "chưa có hồ sơ"
        const [cats, mine] = await Promise.all([
          getCategories(),
          getMyPartner().catch(() => null),
        ])
        const active = (cats || []).filter(c => c.is_active === 1 || c.is_active === true)
        setCategories(active)

        if (mine) {
          setExistingPartner(mine)
          setForm({
            band_name: mine.band_name ?? '',
            categories_id: mine.categories_id ?? mine.category?.id ?? active[0]?.id ?? '',
            location_name: mine.location_name ?? '',
            location_city: mine.location_name ?? '',
            description: mine.description ?? '',
            cover_image: mine.cover_image ?? '',
            cover_image_name: mine.cover_image ? 'Ảnh bìa hiện tại' : '',
          })
        } else if (active.length > 0) {
          set('categories_id', active[0].id)
        }
      } catch (err) {
        setGlobalError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Validate từng step
  const validate = (s) => {
    const errs = {}
    if (s === 1) {
      if (!form.band_name.trim()) errs.band_name = 'Vui lòng nhập tên thương hiệu'
      if (!form.location_name.trim()) errs.location_name = 'Vui lòng nhập tên khu vực'
    }
    if (s === 2) {
      if (!form.description.trim()) errs.description = 'Vui lòng mô tả dịch vụ của bạn'
      if (form.description.trim().length < 30) errs.description = 'Mô tả cần ít nhất 30 ký tự'
    }
    return errs
  }

  const goNext = () => {
    const errs = validate(step)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setStep(s => s + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goBack = () => {
    setErrors({})
    setStep(s => s - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      set('cover_image', reader.result?.toString() ?? '')
      set('cover_image_name', file.name)
    }
    reader.readAsDataURL(file)
  }

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('error')
      setGpsError('Trình duyệt không hỗ trợ định vị GPS.')
      return
    }
    setGpsStatus('loading')
    setGpsError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setLocationGps(`POINT(${longitude} ${latitude})`)
        setGpsStatus('success')
      },
      (err) => {
        setGpsStatus('error')
        setGpsError(
          err.code === 1
            ? 'Bạn đã từ chối cấp quyền vị trí. Vui lòng bật trong cài đặt trình duyệt.'
            : 'Không lấy được vị trí, vui lòng thử lại.'
        )
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleSubmit = async () => {
    if (!authUser?.id) return
    setSaving(true)
    setGlobalError(null)

    const cityVal = form.location_city || form.location_name.trim() || 'Hà Nội'

    // Ưu tiên GPS thật, fallback về tọa độ trung tâm thành phố
    const cityCoords = {
      'Hà Nội': 'POINT(105.8342 21.0245)',
      'TP. Hồ Chí Minh': 'POINT(106.6297 10.8231)',
      'Đà Nẵng': 'POINT(108.2022 16.0544)',
      'Hải Phòng': 'POINT(106.6881 20.8449)',
      'Cần Thơ': 'POINT(105.7469 10.0452)',
      'Huế': 'POINT(107.5905 16.4637)',
      'Nha Trang': 'POINT(109.1967 12.2388)',
      'Đà Lạt': 'POINT(108.4583 11.9404)',
      'Vũng Tàu': 'POINT(107.0843 10.3460)',
    }
    const fallbackGps = cityCoords[cityVal] ?? 'POINT(105.8342 21.0245)'

    const payload = {
      user_id: authUser.id,
      band_name: form.band_name.trim(),
      categories_id: form.categories_id ? Number(form.categories_id) : undefined,
      description: form.description.trim(),
      location_gps: locationGps ?? fallbackGps,
      location_name: cityVal,
      cover_image: form.cover_image || undefined,
      is_active: true,
    }

    try {
      if (existingPartner) {
        await updatePartner(existingPartner.id, payload)
      } else {
        const created = await createPartner(payload)
        setExistingPartner(created)
      }
      setDone(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setGlobalError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const selectedCat = categories.find(c => c.id === Number(form.categories_id))
  const previewImage = form.cover_image || FALLBACK_HERO

  if (loading) {
    return (
      <main className="ps-page">
        <Header />
        <div className="ps-loading">
          <div className="ps-loading__spinner" />
          <p>Đang tải thông tin...</p>
        </div>
      </main>
    )
  }

  if (done) {
    return (
      <main className="ps-page">
        <Header />
        <div className="ps-done">
          <div className="ps-done__card">
            <div className="ps-done__icon">🎉</div>
            <h1>Hồ sơ đã được {existingPartner && !done ? 'cập nhật' : 'tạo'} thành công!</h1>
            <p>
              Matcha đã ghi nhận thông tin đối tác của bạn.
              Bạn có thể vào Dashboard để quản lý dịch vụ và xem lịch đặt.
            </p>
            <div className="ps-done__actions">
              <button
                type="button"
                className="ps-done__primary"
                onClick={() => navigateTo('/partner-dashboard')}
              >
                Vào Partner Dashboard →
              </button>
              <button
                type="button"
                className="ps-done__secondary"
                onClick={() => navigateTo('/partner-services')}
              >
                Thêm dịch vụ
              </button>
            </div>

            <div className="ps-done__preview">
              <img src={previewImage} alt="cover" className="ps-done__cover" />
              <div className="ps-done__info">
                <span className="ps-done__cat">{selectedCat?.name ?? '—'}</span>
                <h2>{form.band_name}</h2>
                <p>📍 {form.location_name || form.location_city}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="ps-page">
      <Header />

      {/* Hero */}
      <section className="ps-hero" style={{ '--hero-img': `url('${previewImage}')` }}>
        <div className="ps-hero__overlay" />
        <div className="ps-hero__content">
          <span className="ps-hero__badge">PARTNER ONBOARDING</span>
          <h1>
            {existingPartner ? 'Cập nhật hồ sơ' : 'Đăng ký đối tác'}
          </h1>
          <p>
            {existingPartner
              ? 'Chỉnh sửa thông tin hồ sơ đối tác của bạn trên Matcha.'
              : 'Hoàn thiện hồ sơ để Matcha hiển thị studio, photographer hoặc dịch vụ của bạn tới hàng nghìn khách hàng.'}
          </p>
        </div>
      </section>

      <div className="ps-body">
        {/* Step indicator */}
        <StepIndicator current={step} />

        <div className="ps-layout">
          {/* Main form */}
          <div className="ps-form-card">
            {/* Global error */}
            {globalError && (
              <div className="ps-alert ps-alert--error">
                <span>⚠</span> {globalError}
              </div>
            )}

            {/* ── STEP 1: Thông tin cơ bản ── */}
            {step === 1 && (
              <div className="ps-step">
                <div className="ps-step__head">
                  <span className="ps-step__icon">🏷️</span>
                  <div>
                    <p className="ps-step__label">Bước 1 / 3</p>
                    <h2>Thông tin cơ bản</h2>
                    <p className="ps-step__sub">Cho Matcha biết bạn là ai và bạn hoạt động ở đâu.</p>
                  </div>
                </div>

                <div className="ps-fields">
                  <div className="ps-field ps-field--full">
                    <label htmlFor="ps-band-name">
                      Tên thương hiệu <span className="ps-required">*</span>
                    </label>
                    <input
                      id="ps-band-name"
                      type="text"
                      placeholder="VD: Minh Lens Studio, Hana Makeup..."
                      value={form.band_name}
                      onChange={e => { set('band_name', e.target.value); clearErr('band_name') }}
                      className={errors.band_name ? 'ps-input--error' : ''}
                    />
                    {errors.band_name && <p className="ps-field__error">{errors.band_name}</p>}
                    <p className="ps-field__hint">Tên sẽ hiển thị công khai trên Matcha</p>
                  </div>


                  <div className="ps-field">
                    <label htmlFor="ps-city">
                      Thành phố hoạt động <span className="ps-required">*</span>
                    </label>
                    <div className="ps-select-wrap">
                      <select
                        id="ps-city"
                        value={form.location_city}
                        onChange={e => {
                          set('location_city', e.target.value)
                          set('location_name', e.target.value)
                          clearErr('location_name')
                        }}
                      >
                        <option value="">Chọn thành phố...</option>
                        {VN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <span className="ps-select-arrow">▾</span>
                    </div>
                  </div>

                  <div className="ps-field ps-field--full">
                    <label htmlFor="ps-location">
                      Địa chỉ / khu vực cụ thể <span className="ps-required">*</span>
                    </label>
                    <input
                      id="ps-location"
                      type="text"
                      placeholder="VD: Quận Hoàn Kiếm, Hà Nội"
                      value={form.location_name}
                      onChange={e => { set('location_name', e.target.value); clearErr('location_name') }}
                      className={errors.location_name ? 'ps-input--error' : ''}
                    />
                    {errors.location_name && <p className="ps-field__error">{errors.location_name}</p>}
                    <p className="ps-field__hint">Dùng để khách hàng biết bạn hoạt động ở đâu</p>
                  </div>

                  {/* GPS Location */}
                  <div className="ps-field ps-field--full">
                    <label>Vị trí GPS <span style={{ color: '#9b8a7b', fontWeight: 400 }}>(khuyến nghị)</span></label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className={`ps-btn ${
                          gpsStatus === 'success' ? 'ps-btn--ghost' : 'ps-btn--primary'
                        }`}
                        onClick={handleGetLocation}
                        disabled={gpsStatus === 'loading'}
                        style={{ minWidth: 200 }}
                      >
                        {gpsStatus === 'loading' && <span className="ps-btn__spinner" />}
                        {gpsStatus === 'loading' && ' Đang lấy vị trí...'}
                        {gpsStatus === 'success' && '✓ Đã lấy vị trí thành công'}
                        {gpsStatus === 'error' && '🔄 Thử lại'}
                        {!gpsStatus && '📍 Lấy vị trí hiện tại'}
                      </button>
                      {gpsStatus === 'success' && locationGps && (
                        <span style={{ fontSize: 12, color: '#5a8a5a', fontFamily: 'monospace' }}>
                          {locationGps}
                        </span>
                      )}
                    </div>
                    {gpsStatus === 'error' && gpsError && (
                      <p className="ps-field__error" style={{ marginTop: 8 }}>{gpsError}</p>
                    )}
                    <p className="ps-field__hint">
                      Cho phép Matcha xác định chính xác studio của bạn trên bản đồ,
                      giúp khách hàng tìm kiếm theo khu vực gần họ.
                    </p>
                  </div>
                </div>

                <div className="ps-nav">
                  <span />
                  <button type="button" className="ps-btn ps-btn--primary" onClick={goNext}>
                    Tiếp theo <span>→</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: Mô tả & Hình ảnh ── */}
            {step === 2 && (
              <div className="ps-step">
                <div className="ps-step__head">
                  <span className="ps-step__icon">🖼️</span>
                  <div>
                    <p className="ps-step__label">Bước 2 / 3</p>
                    <h2>Mô tả & Hình ảnh</h2>
                    <p className="ps-step__sub">Giới thiệu phong cách và ảnh bìa đại diện.</p>
                  </div>
                </div>

                <div className="ps-fields">
                  <div className="ps-field ps-field--full">
                    <label htmlFor="ps-desc">
                      Mô tả dịch vụ <span className="ps-required">*</span>
                    </label>
                    <textarea
                      id="ps-desc"
                      rows={6}
                      placeholder="Hãy chia sẻ về phong cách chụp ảnh, kinh nghiệm, thế mạnh và điểm khác biệt của bạn. Ví dụ: Chuyên chụp ảnh cưới phong cách documentary, hơn 5 năm kinh nghiệm..."
                      value={form.description}
                      onChange={e => { set('description', e.target.value); clearErr('description') }}
                      className={errors.description ? 'ps-input--error' : ''}
                    />
                    <div className="ps-field__footer">
                      {errors.description
                        ? <p className="ps-field__error">{errors.description}</p>
                        : <p className="ps-field__hint">Ít nhất 30 ký tự · Hiển thị trên trang đối tác của bạn</p>
                      }
                      <span className={`ps-char-count ${form.description.length < 30 ? 'ps-char-count--low' : ''}`}>
                        {form.description.length} ký tự
                      </span>
                    </div>
                  </div>

                  <div className="ps-field ps-field--full">
                    <label>Ảnh bìa (tùy chọn)</label>
                    <div
                      className="ps-upload"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {form.cover_image ? (
                        <>
                          <img src={form.cover_image} alt="preview" className="ps-upload__preview" />
                          <div className="ps-upload__overlay">
                            <span>🔄 Đổi ảnh</span>
                          </div>
                        </>
                      ) : (
                        <div className="ps-upload__placeholder">
                          <span className="ps-upload__icon">📷</span>
                          <strong>Tải ảnh bìa lên</strong>
                          <p>JPG, PNG, WEBP · Nên dùng ảnh ngang, độ phân giải cao</p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleImageChange}
                    />
                    {form.cover_image_name && (
                      <p className="ps-field__hint" style={{ marginTop: 8 }}>
                        ✓ {form.cover_image_name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="ps-nav">
                  <button type="button" className="ps-btn ps-btn--ghost" onClick={goBack}>
                    <span>←</span> Quay lại
                  </button>
                  <button type="button" className="ps-btn ps-btn--primary" onClick={goNext}>
                    Xem trước <span>→</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Xem trước & Xác nhận ── */}
            {step === 3 && (
              <div className="ps-step">
                <div className="ps-step__head">
                  <span className="ps-step__icon">✅</span>
                  <div>
                    <p className="ps-step__label">Bước 3 / 3</p>
                    <h2>Xem trước & Xác nhận</h2>
                    <p className="ps-step__sub">Kiểm tra lại thông tin trước khi hoàn tất.</p>
                  </div>
                </div>

                {/* Preview card */}
                <div className="ps-preview-card">
                  <div className="ps-preview-card__img-wrap">
                    <img src={previewImage} alt="cover preview" className="ps-preview-card__img" />
                    <div className="ps-preview-card__img-overlay" />
                    <div className="ps-preview-card__img-content">
                      <span className="ps-preview-card__cat">{selectedCat?.name ?? '—'}</span>
                      <h3 className="ps-preview-card__name">{form.band_name || 'Tên thương hiệu'}</h3>
                    </div>
                  </div>
                  <div className="ps-preview-card__body">
                    <dl className="ps-preview-card__dl">
                      <div>
                        <dt>Danh mục</dt>
                        <dd>{selectedCat?.name ?? '—'}</dd>
                      </div>
                      <div>
                        <dt>Khu vực</dt>
                        <dd>📍 {form.location_name || '—'}</dd>
                      </div>
                      <div>
                        <dt>Mô tả</dt>
                        <dd className="ps-preview-card__desc">
                          {form.description || '—'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {globalError && (
                  <div className="ps-alert ps-alert--error" style={{ marginTop: 16 }}>
                    <span>⚠</span> {globalError}
                  </div>
                )}

                <div className="ps-nav">
                  <button type="button" className="ps-btn ps-btn--ghost" onClick={goBack}>
                    <span>←</span> Chỉnh sửa
                  </button>
                  <button
                    type="button"
                    className="ps-btn ps-btn--submit"
                    onClick={handleSubmit}
                    disabled={saving}
                  >
                    {saving ? (
                      <><span className="ps-btn__spinner" /> Đang lưu...</>
                    ) : (
                      <>{existingPartner ? '💾 Cập nhật hồ sơ' : '🚀 Hoàn tất đăng ký'}</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar tips */}
          <aside className="ps-sidebar">
            <div className="ps-tips">
              <h3>💡 Mẹo để nổi bật</h3>
              <ul>
                <li>
                  <span className="ps-tips__icon">📝</span>
                  <p>Viết mô tả chân thực, nêu rõ phong cách và thế mạnh</p>
                </li>
                <li>
                  <span className="ps-tips__icon">📸</span>
                  <p>Dùng ảnh bìa chất lượng cao thể hiện tác phẩm tốt nhất</p>
                </li>
                <li>
                  <span className="ps-tips__icon">📍</span>
                  <p>Ghi rõ khu vực hoạt động để khách hàng dễ tìm kiếm</p>
                </li>
                <li>
                  <span className="ps-tips__icon">⭐</span>
                  <p>Sau khi tạo hồ sơ, thêm các gói dịch vụ trong Partner Services</p>
                </li>
              </ul>
            </div>

            {existingPartner && (
              <div className="ps-sidebar__existing">
                <p>✓ Bạn đã có hồ sơ partner</p>
                <button type="button" onClick={() => navigateTo('/partner-dashboard')}>
                  Vào Dashboard
                </button>
              </div>
            )}

            <div className="ps-sidebar__steps">
              <h4>Sau khi hoàn tất</h4>
              <ol>
                <li>Vào <strong>Partner Services</strong> → thêm gói dịch vụ</li>
                <li>Thiết lập <strong>lịch trống</strong> trong Partner Schedule</li>
                <li>Chờ khách hàng đặt lịch và nhận thông báo</li>
              </ol>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default PartnerSetup
