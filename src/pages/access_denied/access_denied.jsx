import { clearAuthUser } from '../../utils/auth.js'
import './access_denied.css'

export default function AccessDenied({ requiredRole = '' }) {
  const navigate = (event, path) => {
    event.preventDefault()
    window.history.pushState({}, '', path)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  const handleSwitchAccount = () => {
    clearAuthUser()
    window.history.pushState({}, '', '/login')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return (
    <main className="access-denied-page">
      <div className="access-denied-card">
        <span className="access-denied-badge">403 Forbidden</span>

        <div className="access-denied-icon-wrap">
          <div className="access-denied-glow" />
          <svg
            className="access-denied-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h1 className="access-denied-title">Quyền truy cập bị cấm</h1>
        <p className="access-denied-desc">
          Tài khoản của bạn không được cấp quyền để truy cập trang này. Vui lòng kiểm tra lại quyền hạn hoặc liên hệ quản trị viên.
        </p>

        {requiredRole && (
          <div className="access-denied-role-badge">
            Yêu cầu vai trò: <strong>{requiredRole}</strong>
          </div>
        )}

        <div className="access-denied-actions">
          <button
            type="button"
            className="access-denied-btn access-denied-btn--secondary"
            onClick={handleSwitchAccount}
          >
            Đổi tài khoản
          </button>
          <a
            href="/"
            className="access-denied-btn access-denied-btn--primary"
            onClick={(e) => navigate(e, '/')}
          >
            Về Trang Chủ
          </a>
        </div>
      </div>
    </main>
  )
}
