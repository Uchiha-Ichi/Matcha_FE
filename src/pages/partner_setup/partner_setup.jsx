import { useMemo, useState } from 'react'
import Header from '../../components/Header.jsx'
import { getAuthUser } from '../../utils/auth.js'
import { mockCategories } from '../../../mockdata.js'
import './partner_setup.css'

const PARTNER_DRAFT_KEY = 'matcha_partner_profile_draft'

const defaultPartnerForm = {
  categories_id: 1,
  band_name: '',
  description: '',
  location: '',
  location_name: '',
  cover_image: '',
  is_active: 1,
}

const fixVnText = (text) => {
  if (typeof text !== 'string') return text
  try {
    return decodeURIComponent(escape(text))
  } catch {
    return text
  }
}

const navigateTo = (path) => {
  if (window.location.pathname === path) {
    return
  }

  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

const navigate = (event, path) => {
  event.preventDefault()
  navigateTo(path)
}

const buildPartnerPayload = (form, authUser) => ({
  user_id: authUser?.id ?? null,
  categories_id: Number(form.categories_id),
  band_name: form.band_name.trim(),
  description: form.description.trim(),
  location: form.location.trim(),
  location_name: form.location_name.trim(),
  is_active: Number(form.is_active),
  cover_image: form.cover_image.trim(),
})

function PartnerSetup() {
  const authUser = getAuthUser()
  const [form, setForm] = useState(defaultPartnerForm)
  const [coverImageName, setCoverImageName] = useState('')
  const [savedPayload, setSavedPayload] = useState(null)

  const categories = useMemo(
    () => mockCategories.filter((category) => category.is_active === 1),
    [],
  )

  const previewImage =
    form.cover_image ||
    'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?auto=format&fit=crop&w=1200&q=80'

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

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

  const handleSubmit = (event) => {
    event.preventDefault()

    const partnerPayload = buildPartnerPayload(form, authUser)
    window.localStorage.setItem(PARTNER_DRAFT_KEY, JSON.stringify(partnerPayload))
    setSavedPayload(partnerPayload)
  }

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
              <h2>Nhập dữ liệu partner</h2>
            </div>
            <button type="submit">Lưu hồ sơ</button>
          </div>

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
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {fixVnText(category.name)}
                  </option>
                ))}
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
              <span>Tọa độ / location</span>
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
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverImageChange}
              />
              <div className="partner-cover-upload__box">
                <strong>{coverImageName || 'Tải ảnh bìa lên'}</strong>
                <p>Hỗ trợ JPG, PNG, WEBP. Khi nối backend, field này có thể gửi bằng FormData.</p>
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

          {savedPayload && (
            <div className="partner-setup-success">
              <strong>Đã lưu draft partner profile</strong>
              <p>Dữ liệu đã được lưu vào localStorage để mô phỏng response trước khi nối backend.</p>
            </div>
          )}
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
                <dd>
                  {fixVnText(
                    categories.find((category) => category.id === Number(form.categories_id))
                      ?.name,
                  )}
                </dd>
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
