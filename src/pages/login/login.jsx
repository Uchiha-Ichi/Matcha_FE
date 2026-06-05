import { useState } from 'react'
import { setAuthUser } from '../../utils/auth.js'
import { signIn, signUp, updateMe, getMe } from '../../utils/api.js'
import './login.css'

const tabs = [
  { id: 'login', label: 'Đăng nhập' },
  { id: 'register', label: 'Đăng ký' },
]

const roles = [
  { id: 'customer', label: 'Customer' },
  { id: 'partner', label: 'Đối tác' },
]

const navigate = (event, path) => {
  event.preventDefault()
  navigateTo(path)
}

const navigateTo = (path) => {
  if (window.location.pathname === path) {
    return
  }

  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function Login({ closeHref = '/' }) {
  const [activeTab, setActiveTab] = useState('login')
  const [activeRole, setActiveRole] = useState('customer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const isRegister = activeTab === 'register'
  const isPartner = activeRole === 'partner'

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email')?.toString().trim()
    const password = formData.get('password')?.toString()

    if (!email || !password) {
      setError('Vui lòng điền đầy đủ email và mật khẩu')
      setLoading(false)
      return
    }

    try {
      if (isRegister) {
        const fullName = formData.get('fullName')?.toString().trim()
        const phone = formData.get('phone')?.toString().trim()
        const confirmPassword = formData.get('confirmPassword')?.toString()

        if (!fullName) {
          setError('Vui lòng nhập họ và tên')
          setLoading(false)
          return
        }

        if (password !== confirmPassword) {
          setError('Mật khẩu xác nhận không khớp')
          setLoading(false)
          return
        }

        // 1. Sign up
        await signUp(email, password)

        // 2. Cập nhật thông tin profile bổ sung (fullName, phone)
        const updateDto = {
          full_name: fullName,
          phone: phone || '',
        }
        await updateMe(updateDto)
      } else {
        // Sign in
        await signIn(email, password)
      }

      // 3. Fetch detailed user profile to save in frontend auth state
      const me = await getMe()
      const userData = {
        id: me.id,
        fullName: me.full_name || me.email.split('@')[0],
        email: me.email,
        phone: me.phone || '',
        role: me.role?.name || 'Customer',
        avatar: me.avatar_src || `https://i.pravatar.cc/100?u=matcha-${me.id}`,
      }

      setAuthUser(userData)
      navigateTo('/profile')
    } catch (err) {
      setError(err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="login-overlay">
      <div className="login-overlay__blur" aria-hidden="true">
        <div className="login-overlay__panel login-overlay__panel--left">
          <span className="login-overlay__tag">Matcha Studio</span>
          <h2>Matcha</h2>
          <p>
            Kết nối nhiếp ảnh gia, makeup artist, studio và concept chụp ảnh trong
            cùng một nơi.
          </p>
        </div>

        <div className="login-overlay__panel login-overlay__panel--right">
          <div className="login-overlay__card">
            <span>Concept nổi bật</span>
            <strong>Glow Portrait</strong>
          </div>
          <div className="login-overlay__card login-overlay__card--dark">
            <span>Lịch đang mở</span>
            <strong>12 khung giờ tuần này</strong>
          </div>
        </div>
      </div>

      <div className="login-modal" role="dialog" aria-labelledby="login-title" aria-modal="true">
        <a
          className="login-modal__close"
          href={closeHref}
          aria-label="Đóng"
          onClick={(event) => navigate(event, closeHref)}
        >
          ×
        </a>

        <p className="login-modal__eyebrow">TÀI KHOẢN NGƯỜI DÙNG</p>
        <h1 id="login-title">{isRegister ? 'Đăng ký' : 'Đăng nhập'}</h1>

        <div className="login-modal__tabs" role="tablist" aria-label="Chế độ tài khoản">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`login-modal__tab ${
                activeTab === tab.id ? 'login-modal__tab--active' : ''
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form
          className={`login-form ${isRegister ? 'login-form--register' : ''}`}
          onSubmit={handleSubmit}
        >
          {error && (
            <div className="login-form__error" style={{
              background: 'rgba(255, 77, 79, 0.08)',
              border: '1px solid rgba(255, 77, 79, 0.2)',
              borderRadius: '12px',
              padding: '12px 16px',
              color: '#ff4d4f',
              fontSize: '14px',
              marginBottom: '20px',
              textAlign: 'center',
              lineHeight: '1.4'
            }}>
              ⚠ {error}
            </div>
          )}

          {isRegister && (
            <div className="login-form__section">
              <p className="login-form__section-title">Bạn đăng ký với vai trò</p>
              <div className="login-form__role-grid">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    className={`login-form__role ${
                      activeRole === role.id ? 'login-form__role--active' : ''
                    }`}
                    onClick={() => setActiveRole(role.id)}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isRegister && (
            <label className="login-form__field">
              <span>Họ và tên</span>
              <input type="text" name="fullName" placeholder="Nhập họ và tên" required />
            </label>
          )}

          <label className="login-form__field">
            <span>Email</span>
            <input type="email" name="email" placeholder="Nhập email" required />
          </label>

          {isRegister && (
            <label className="login-form__field">
              <span>Số điện thoại</span>
              <input type="tel" name="phone" placeholder="Nhập số điện thoại" />
            </label>
          )}

          {isRegister && isPartner && (
            <label className="login-form__field">
              <span>Danh mục đối tác</span>
              <div className="login-form__select-wrap">
                <select name="partnerCategory" defaultValue="">
                  <option value="" disabled>
                    Chọn danh mục
                  </option>
                  <option value="studio">Studio</option>
                  <option value="photographer">Nhiếp ảnh gia</option>
                  <option value="makeup">Makeup Artist</option>
                  <option value="costume">Trang phục</option>
                </select>
              </div>
            </label>
          )}

          <label className="login-form__field">
            <span>Mật khẩu</span>
            <input
              type="password"
              name="password"
              placeholder={isRegister ? 'Tạo mật khẩu' : 'Nhập mật khẩu'}
              required
            />
          </label>

          {isRegister && (
            <label className="login-form__field">
              <span>Xác nhận mật khẩu</span>
              <input type="password" name="confirmPassword" placeholder="Nhập lại mật khẩu" required />
            </label>
          )}

          <div className="login-form__meta">
            <label className="login-form__check">
              <input type="checkbox" defaultChecked={!isRegister} />
              <span>
                {isRegister ? 'Tôi đồng ý với điều khoản sử dụng' : 'Ghi nhớ đăng nhập'}
              </span>
            </label>

            {!isRegister && (
              <a
                className="login-form__link"
                href="/forgot-password"
                onClick={(event) => navigate(event, '/forgot-password')}
              >
                Quên mật khẩu?
              </a>
            )}
          </div>

          <button className="login-form__submit" type="submit" disabled={loading}>
            {loading ? 'Đang xử lý...' : isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </section>
  )
}

export default Login
