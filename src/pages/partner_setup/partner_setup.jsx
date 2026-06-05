import { useEffect, useState } from 'react'
import Header from '../../components/Header.jsx'
import { getAuthUser } from '../../utils/auth.js'
import { getCategories, getMyPartner, createPartner, updatePartner } from '../../utils/api.js'
import './partner_setup.css'

const defaultForm = {
  categories_id: '',
  band_name: '',
  description: '',
  location: '',
  location_name: '',
  cover_image: '',
  is_active: 1,
}

const navigateTo = (path) => {
  if (window.location.pathname === path) return
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

const navigate = (event, path) => {
  event.preventDefault()
  navigateTo(path)
}

function PartnerSetup() {
  const authUser = getAuthUser()
  const [form, setForm] = useState(defaultForm)
  const [categories, setCategories] = useState([])
  const [coverImageName, setCoverImageName] = useState('')
  const [existingPartner, setExistingPartner] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [cats, mine] = await Promise.all([
          getCategories(),
          getMyPartner(),
        ])

        const activeCategories = (cats || []).filter((c) => c.is_active === 1 || c.is_active === true)
        setCategories(activeCategories)
        if (activeCategories.length > 0 && !form.categories_id) {
          setForm((f) => ({ ...f, categories_id: activeCategories[0].id }))
        }

        if (mine) {
          setExistingPartner(mine)
          setForm({
            categories_id: mine.categories_id ?? mine.categories?.id ?? mine.category?.id ?? activeCategories[0]?.id ?? '',
            band_name: mine.band_name ?? '',
            description: mine.description ?? '',
            location: mine.location ?? mine.location_gps ?? '',
            location_name: mine.location_name ?? '',
            cover_image: mine.cover_image ?? '',
            is_active: mine.is_active ?? 1,
          })
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [authUser?.id])

  const previewImage =
    form.cover_image ||
    'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?auto=format&fit=crop&w=1200&q=80'

  const updateField = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  const handleCoverImageChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setCoverImageName(file.name)
      updateField('cover_image', reader.result?.toString() ?? '')
    }
    reader.readAsDataURL(file)
  }

  const showSuccess = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!authUser?.id) {
      alert('Bạn chưa đăng nhập.')
      return
    }
    setSaving(true)
    setError(null)

    const payload = {
      user_id: authUser.id,
      categories_id: Number(form.categories_id),
      band_name: form.band_name.trim(),
      description: form.description.trim(),
      location_gps: form.location.trim() || undefined,
      location_name: form.location_name.trim(),
      cover_image: form.cover_image || undefined,
      is_active: Number(form.is_active),
    }

    try {
      if (existingPartner) {
        await updatePartner(existingPartner.id, payload)
        showSuccess('Đã cập nhật hồ sơ partner thành công!')
      } else {
        const created = await createPartner(payload)
        setExistingPartner(created)
        showSuccess('Đã tạo hồ sơ partner thành công! Bạn có thể vào Dashboard để quản lý.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const selectedCategory = categories.find((c) => c.id === Number(form.categories_id))

  return (
    <main className="partner-setup-page">
      <Header />

      <section className="partner-setup-hero">
        <div className="partner-setup-hero__overlay" />
        <img src={previewImage} alt="Partner cover preview" />
        <div className="partner-setup-hero__content">
          <span>PARTNER ONBOARDING</span>
          <h1>Thông tin đối tác</h1>
          <p>
            Hoàn thiện hồ sơ nhà cung cấp dịch vụ để Matcha có thể hiển thị studio,
            photographer, makeup artist hoặc đơn vị cho thuê của bạn.
          </p>
        </div>
      </section>

      <section className="partner-setup-layout">
        <form className="partner-setup-form" onSubmit={handleSubmit}>
          <div className="partner-setup-form__heading">
            <div>
              <span>PARTNER TABLE</span>
              <h2>{existingPartner ? 'Cập nhật hồ sơ partner' : 'Tạo hồ sơ partner'}</h2>
            </div>
            <button type="submit" disabled={saving || loading}>
              {saving ? 'Đang lưu…' : existingPartner ? 'Cập nhật' : 'Lưu hồ sơ'}
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
                marginBottom: '1rem',
                fontWeight: 600,
              }}
            >
              {successMsg}
              {existingPartner && (
                <>
                  {' '}
                  <a
                    href="/partner-dashboard"
                    onClick={(e) => navigate(e, '/partner-dashboard')}
                    style={{ color: '#155724', textDecoration: 'underline' }}
                  >
                    Vào Dashboard →
                  </a>
                </>
              )}
            </div>
          )}

          {error && (
            <div
              style={{
                background: '#f8d7da',
                border: '1px solid #f5c6cb',
                color: '#721c24',
                borderRadius: '8px',
                padding: '0.75rem 1.25rem',
                marginBottom: '1rem',
              }}
            >
              Lỗi: {error}
            </div>
          )}

          <div className="partner-setup-grid">
            <label>
              <span>User ID</span>
              <input value={authUser?.id ?? 'Chưa đăng nhập'} readOnly />
            </label>

            <label>
              <span>Danh mục dịch vụ</span>
              <select
                value={form.categories_id}
                onChange={(event) => updateField('categories_id', event.target.value)}
              >
                {loading ? (
                  <option>Đang tải…</option>
                ) : (
                  categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))
                )}
              </select>
            </label>

            <label className="partner-setup-grid__wide">
              <span>Tên thương hiệu / band_name</span>
              <input
                type="text"
                value={form.band_name}
                onChange={(event) => updateField('band_name', event.target.value)}
                placeholder="VD: Minh Lens Studio"
                required
              />
            </label>

            <label className="partner-setup-grid__wide partner-cover-upload">
              <span>Mô tả / description</span>
              <textarea
                value={form.description}
                onChange={(event) => updateField('description', event.target.value)}
                placeholder="Giới thiệu phong cách, kinh nghiệm, thế mạnh dịch vụ..."
                required
              />
            </label>

            <label>
              <span>Tọa độ / location_gps</span>
              <input
                type="text"
                value={form.location}
                onChange={(event) => updateField('location', event.target.value)}
                placeholder="POINT(21.0285 105.8542)"
              />
            </label>

            <label>
              <span>Tên địa điểm / location_name</span>
              <input
                type="text"
                value={form.location_name}
                onChange={(event) => updateField('location_name', event.target.value)}
                placeholder="Hoàn Kiếm, Hà Nội"
                required
              />
            </label>

            <label className="partner-setup-grid__wide">
              <span>Ảnh bìa / cover_image</span>
              <input type="file" accept="image/*" onChange={handleCoverImageChange} />
              <div className="partner-cover-upload__box">
                <strong>{coverImageName || 'Tải ảnh bìa lên'}</strong>
                <p>Hỗ trợ JPG, PNG, WEBP.</p>
              </div>
            </label>

            <label>
              <span>Trạng thái / is_active</span>
              <select
                value={form.is_active}
                onChange={(event) => updateField('is_active', event.target.value)}
              >
                <option value={1}>Hoạt động</option>
                <option value={0}>Tạm ẩn</option>
              </select>
            </label>
          </div>
        </form>

        <aside className="partner-setup-preview">
          <img src={previewImage} alt="Partner preview" />
          <div className="partner-setup-preview__body">
            <span>PREVIEW</span>
            <h2>{form.band_name || 'Tên thương hiệu'}</h2>
            <p>{form.description || 'Mô tả ngắn về dịch vụ của partner sẽ hiển thị ở đây.'}</p>
            <dl>
              <div>
                <dt>Danh mục</dt>
                <dd>{selectedCategory?.name ?? '—'}</dd>
              </div>
              <div>
                <dt>Khu vực</dt>
                <dd>{form.location_name || 'Chưa nhập'}</dd>
              </div>
              <div>
                <dt>Trạng thái</dt>
                <dd>{Number(form.is_active) === 1 ? 'Hoạt động' : 'Tạm ẩn'}</dd>
              </div>
            </dl>

            <a href="/profile" onClick={(event) => navigate(event, '/profile')}>
              Về hồ sơ
            </a>
          </div>
        </aside>
      </section>
    </main>
  )
}

export default PartnerSetup
