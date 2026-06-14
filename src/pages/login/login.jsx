import { useState, useEffect } from 'react'
import { setAuthUser, getAuthUser } from '../../utils/auth.js'
import { signIn, signUp, updateMe, getMe, getMyPartner, sendSignUpOtp } from '../../utils/api.js'
import { API_BASE_URL } from '../../utils/config.js'
import './login.css'

const tabs = [
  { id: 'login', label: 'Đăng nhập' },
  { id: 'register', label: 'Đăng ký' },
]

const roles = [
  { id: 'customer', label: 'Customer' },
  { id: 'partner', label: 'Đối tác' },
]

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^(0|\+84)\d{9}$/

const translateError = (msg) => {
  if (!msg) return msg
  const msgLower = msg.toString().toLowerCase().trim()
  if (msgLower === 'invalid credentials') {
    return 'Tài khoản hoặc mật khẩu không chính xác'
  }
  return msg
}

const getErrorText = (message) => {
  if (Array.isArray(message)) {
    return message.map(translateError).join('\n')
  }
  return translateError(message)
}

const getRegisterValidationError = ({ fullName, email, phone, password, confirmPassword, acceptedTerms, otp }) => {
  if (!fullName || fullName.trim().length < 2) return 'Vui lòng nhập họ tên tối thiểu 2 ký tự'
  if (!emailPattern.test(email)) return 'Email không đúng định dạng'
  if (!otp || otp.trim().length < 6) return 'Vui lòng nhập mã xác thực gồm 6 ký tự'
  if (phone && !phonePattern.test(phone)) return 'Số điện thoại không đúng định dạng. Ví dụ: 0912345678'
  if (!password || password.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự'
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Mật khẩu phải có cả chữ và số'
  if (password !== confirmPassword) return 'Mật khẩu xác nhận không khớp'
  if (!acceptedTerms) return 'Vui lòng đồng ý với điều khoản sử dụng'
  return null
}
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
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const accessToken = params.get('accessToken')
    const refreshToken = params.get('refreshToken')
    if (accessToken && refreshToken) {
      window.history.replaceState({}, document.title, window.location.pathname)
      
      const processGoogleLogin = async () => {
        setLoading(true)
        setError(null)
        try {
          setAuthUser({ accessToken, refreshToken })
          const me = await getMe()
          const userData = {
            id: me.id,
            fullName: me.full_name || me.email.split('@')[0],
            email: me.email,
            phone: me.phone || '',
            role: me.role?.name || 'Customer',
            avatar: me.avatar_src || `https://i.pravatar.cc/100?u=matcha-${me.id}`,
            accessToken,
            refreshToken,
          }
          setAuthUser(userData)
          
          if (userData.role === 'Partner') {
            try {
              const partnerProfile = await getMyPartner()
              if (partnerProfile) {
                navigateTo('/partner-dashboard')
              } else {
                navigateTo('/partner-setup')
              }
            } catch {
              navigateTo('/partner-setup')
            }
          } else if (userData.role === 'Customer') {
            navigateTo('/')
          } else {
            navigateTo('/admin-dashboard')
          }
        } catch (err) {
          setError(getErrorText(err.message) || 'Lỗi đăng nhập Google. Vui lòng thử lại.')
        } finally {
          setLoading(false)
        }
      }
      processGoogleLogin()
    }
  }, [])

  const handleGoogleLogin = () => {
    setLoading(true)
    window.location.href = `${API_BASE_URL}/auth/signin/google`
  }

  const isRegister = activeTab === 'register'
  const isPartner = activeRole === 'partner'

  const handleSendRegisterOtp = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!email) {
      setError('Vui lòng nhập email trước')
      return
    }
    if (!emailPattern.test(email)) {
      setError('Email không đúng định dạng')
      return
    }

    setOtpLoading(true)
    try {
      const res = await sendSignUpOtp(email)
      setOtpSent(true)
      setSuccessMessage(res.message || 'Mã xác thực đã được gửi đến email của bạn')
    } catch (err) {
      setError(getErrorText(err.message) || 'Không thể gửi mã xác thực. Vui lòng thử lại.')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const emailVal = isRegister ? email : formData.get('email')?.toString().trim().toLowerCase()
    const password = formData.get('password')?.toString()

    if (!emailVal || !password) {
      setError('Vui lòng điền đầy đủ email và mật khẩu')
      setLoading(false)
      return
    }

    if (!emailPattern.test(emailVal)) {
      setError('Email không đúng định dạng')
      setLoading(false)
      return
    }
    try {
      let authData;
      if (isRegister) {
        const fullName = formData.get('fullName')?.toString().trim()
        const phone = formData.get('phone')?.toString().trim()
        const confirmPassword = formData.get('confirmPassword')?.toString()
        const otpVal = formData.get('otp')?.toString().trim()

        const acceptedTerms = formData.get('termsAccepted') === 'on'
        const validationError = getRegisterValidationError({
          fullName,
          email: emailVal,
          phone,
          password,
          confirmPassword,
          acceptedTerms,
          otp: otpVal,
        })

        if (validationError) {
          setError(validationError)
          setLoading(false)
          return
        }

        // 1. Sign up
        authData = await signUp(fullName, emailVal, password, phone, isPartner ? 2 : 3, otpVal)

        // Save token temporarily so updateMe and getMe can use it via Authorization header
        if (authData?.accessToken) {
          setAuthUser({
            accessToken: authData.accessToken,
            refreshToken: authData.refreshToken,
          })
        }

        // 2. Cập nhật thông tin profile bổ sung (fullName, phone)
        const updateDto = {
          full_name: fullName,
          phone: phone || '',
        }
        await updateMe(updateDto)
      } else {
        // Sign in
        authData = await signIn(emailVal, password)

        // Save token temporarily so getMe can use it via Authorization header
        if (authData?.accessToken) {
          setAuthUser({
            accessToken: authData.accessToken,
            refreshToken: authData.refreshToken,
          })
        }
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
        accessToken: authData?.accessToken || getAuthUser()?.accessToken,
        refreshToken: authData?.refreshToken || getAuthUser()?.refreshToken,
      }

      setAuthUser(userData)
      if (userData.role === 'Partner') {
        // Kiểm tra đã có hồ sơ partner chưa
        try {
          const partnerProfile = await getMyPartner()
          if (partnerProfile) {
            navigateTo('/partner-dashboard')
          } else {
            navigateTo('/partner-setup')
          }
        } catch {
          navigateTo('/partner-setup')
        }
      } else if (userData.role === 'Customer') {
        navigateTo('/')
      } else {
        navigateTo('/admin-dashboard')
      }
    } catch (err) {
      setError(getErrorText(err.message) || 'Đã có lỗi xảy ra. Vui lòng thử lại.')
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
              className={`login-modal__tab ${activeTab === tab.id ? 'login-modal__tab--active' : ''
                }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="login-form__google-btn"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
            <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.57 5.57 0 0 1 8.35 13a5.57 5.57 0 0 1 5.64-5.514c1.458 0 2.78.502 3.82 1.332l3.1-3.1C18.847 3.738 15.65 2.5 12.24 2.5a10.5 10.5 0 0 0-10.5 10.5 10.5 10.5 0 0 0 10.5 10.5c5.786 0 9.617-3.96 9.617-9.614a9.72 9.72 0 0 0-.117-1.6H12.24z"/>
          </svg>
          Tiếp tục với Google
        </button>

        <div className="login-form__divider">
          <span>{isRegister ? 'hoặc đăng ký bằng email' : 'hoặc đăng nhập bằng email'}</span>
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

          {successMessage && (
            <div className="login-form__success" style={{
              background: 'rgba(46, 125, 50, 0.08)',
              border: '1px solid rgba(46, 125, 50, 0.2)',
              borderRadius: '12px',
              padding: '12px 16px',
              color: '#2e7d32',
              fontSize: '14px',
              marginBottom: '20px',
              textAlign: 'center',
              lineHeight: '1.4'
            }}>
              ✓ {successMessage}
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
                    className={`login-form__role ${activeRole === role.id ? 'login-form__role--active' : ''
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
            {isRegister ? (
              <div className="login-form__email-wrap">
                <input
                  type="email"
                  placeholder="Nhập email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setOtpSent(false)
                  }}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="login-form__email-btn"
                  onClick={handleSendRegisterOtp}
                  disabled={otpLoading || !email || loading}
                >
                  {otpLoading ? 'Đang gửi...' : otpSent ? 'Gửi lại mã' : 'Gửi mã'}
                </button>
              </div>
            ) : (
              <input type="email" name="email" placeholder="Nhập email" required />
            )}
          </label>

          {isRegister && (
            <label className="login-form__field">
              <span>Mã xác thực</span>
              <input
                type="text"
                name="otp"
                placeholder="Nhập mã gồm 6 chữ số"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                disabled={loading}
                required
              />
            </label>
          )}

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
              <input type="checkbox" key={isRegister ? 'terms' : 'remember'} name="termsAccepted" defaultChecked={!isRegister} />
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
