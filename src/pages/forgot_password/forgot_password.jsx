import { useState } from 'react'
import './forgot_password.css'

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
        <p className="forgot-card__intro">
          Giao diện này chỉ phục vụ front end. Các bước gửi mã và cập nhật mật khẩu
          sẽ được nối backend sau.
        </p>

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

        {step === 0 && (
          <form className="forgot-form">
            <label className="forgot-form__field">
              <span>Email</span>
              <input type="email" placeholder="Nhập email đã đăng ký" />
            </label>

            <p className="forgot-form__hint">
              Sau khi backend hoàn tất, email này sẽ nhận mã OTP hoặc link đặt lại
              mật khẩu.
            </p>

            <button type="button" className="forgot-form__submit" onClick={() => setStep(1)}>
              Gửi mã xác thực
            </button>
          </form>
        )}

        {step === 1 && (
          <form className="forgot-form">
            <label className="forgot-form__field">
              <span>Mã xác thực</span>
              <input type="text" placeholder="Nhập mã gồm 6 ký tự" />
            </label>

            <label className="forgot-form__field">
              <span>Email</span>
              <input type="email" placeholder="you@example.com" />
            </label>

            <div className="forgot-form__actions">
              <button type="button" className="forgot-form__ghost">
                Gửi lại mã
              </button>
              <button type="button" className="forgot-form__submit" onClick={() => setStep(2)}>
                Xác nhận mã
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form className="forgot-form">
            <label className="forgot-form__field">
              <span>Mật khẩu mới</span>
              <input type="password" placeholder="Tạo mật khẩu mới" />
            </label>

            <label className="forgot-form__field">
              <span>Xác nhận mật khẩu mới</span>
              <input type="password" placeholder="Nhập lại mật khẩu mới" />
            </label>

            <div className="forgot-form__actions">
              <button type="button" className="forgot-form__ghost" onClick={() => setStep(1)}>
                Quay lại
              </button>
              <a
                className="forgot-form__submit forgot-form__submit--link"
                href="/login"
                onClick={(event) => navigate(event, '/login')}
              >
                Hoàn tất
              </a>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}

export default ForgotPassword
