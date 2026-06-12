import { useState } from 'react'
import './forgot_password.css'
import { sendForgotPasswordOtp, verifyForgotPasswordOtp, resetPassword } from '../../utils/api.js'

const navigate = (event, path) => {
  event.preventDefault()

  if (window.location.pathname === path) {
    return
  }

  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

const steps = [
  'Nhập email',
  'Xác thực mã',
  'Đặt mật khẩu mới',
]

function ForgotPassword() {
  const [step, setStep] = useState(0)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!email) {
      setError('Email không được để trống')
      return
    }

    setLoading(true)
    try {
      const res = await sendForgotPasswordOtp(email)
      setSuccess(res.message || 'Mã xác thực đã được gửi!')
      setTimeout(() => {
        setSuccess('')
        setStep(1)
      }, 1500)
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra, vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!otp) {
      setError('Mã xác thực không được để trống')
      return
    }

    setLoading(true)
    try {
      const res = await verifyForgotPasswordOtp(email, otp)
      setSuccess(res.message || 'Mã xác thực hợp lệ!')
      setTimeout(() => {
        setSuccess('')
        setStep(2)
      }, 1500)
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra, vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!password) {
      setError('Mật khẩu mới không được để trống')
      return
    }
    if (password.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự')
      return
    }
    if (password !== confirmPassword) {
      setError('Xác nhận mật khẩu mới không khớp')
      return
    }

    setLoading(true)
    try {
      const res = await resetPassword(email, otp, password)
      setSuccess(res.message || 'Đặt lại mật khẩu thành công! Đang chuyển hướng...')
      setTimeout(() => {
        navigate(e, '/login')
      }, 2000)
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra, vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="forgot-page">
      <div className="forgot-page__backdrop" aria-hidden="true">
        <div className="forgot-page__ambient forgot-page__ambient--left" />
        <div className="forgot-page__ambient forgot-page__ambient--right" />
      </div>

      <div className="forgot-card">
        <a
          className="forgot-card__back"
          href="/login"
          onClick={(event) => navigate(event, '/login')}
        >
          ← Quay lại đăng nhập
        </a>

        <p className="forgot-card__eyebrow">KHÔI PHỤC TÀI KHOẢN</p>
        <h1>Quên mật khẩu</h1>
        <p style={{ marginTop: '16px' }}></p>

        <div className="forgot-steps" aria-label="Tiến trình khôi phục mật khẩu">
          {steps.map((item, index) => (
            <div
              key={item}
              className={`forgot-steps__item ${
                index === step
                  ? 'forgot-steps__item--active'
                  : index < step
                    ? 'forgot-steps__item--done'
                    : ''
              }`}
            >
              <span>{index + 1}</span>
              <strong>{item}</strong>
            </div>
          ))}
        </div>

        {error && <p className="forgot-form__error">{error}</p>}
        {success && <p className="forgot-form__success">{success}</p>}

        {step === 0 && (
          <form className="forgot-form" onSubmit={handleSendOtp}>
            <label className="forgot-form__field">
              <span>Email</span>
              <input
                type="email"
                placeholder="Nhập email đã đăng ký"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </label>

            <p className="forgot-form__hint">
              Hệ thống sẽ gửi mã OTP gồm 6 chữ số đến email này để xác thực tài khoản của bạn.
            </p>

            <button
              type="submit"
              className="forgot-form__submit"
              disabled={loading}
            >
              {loading ? 'Đang gửi...' : 'Gửi mã xác thực'}
            </button>
          </form>
        )}

        {step === 1 && (
          <form className="forgot-form" onSubmit={handleVerifyOtp}>
            <label className="forgot-form__field">
              <span>Mã xác thực</span>
              <input
                type="text"
                placeholder="Nhập mã gồm 6 chữ số"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={loading}
                maxLength={6}
                required
              />
            </label>

            <label className="forgot-form__field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                readOnly
                disabled
              />
            </label>

            <div className="forgot-form__actions">
              <button
                type="button"
                className="forgot-form__ghost"
                onClick={handleSendOtp}
                disabled={loading}
              >
                Gửi lại mã
              </button>
              <button
                type="submit"
                className="forgot-form__submit"
                disabled={loading}
              >
                {loading ? 'Đang xác nhận...' : 'Xác nhận mã'}
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form className="forgot-form" onSubmit={handleResetPassword}>
            <label className="forgot-form__field">
              <span>Mật khẩu mới</span>
              <input
                type="password"
                placeholder="Tạo mật khẩu mới"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </label>

            <label className="forgot-form__field">
              <span>Xác nhận mật khẩu mới</span>
              <input
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
            </label>

            <div className="forgot-form__actions">
              <button
                type="button"
                className="forgot-form__ghost"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                Quay lại
              </button>
              <button
                type="submit"
                className="forgot-form__submit"
                disabled={loading}
              >
                {loading ? 'Đang cập nhật...' : 'Hoàn tất'}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}

export default ForgotPassword
