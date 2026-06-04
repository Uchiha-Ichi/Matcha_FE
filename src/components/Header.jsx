import { useEffect, useState } from 'react'
import { clearAuthUser, getAuthUser, subscribeAuthChange } from '../utils/auth.js'
import './layout.css'

const getCurrentRoute = () => window.location.pathname || '/'

const navigate = (event, path) => {
  event.preventDefault()

  if (window.location.pathname === path) {
    return
  }

  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function Header() {
  const currentRoute = getCurrentRoute()
  const [authUser, setAuthUserState] = useState(getAuthUser)

  useEffect(() => subscribeAuthChange(setAuthUserState), [])

  const handleLogout = () => {
    clearAuthUser()

    if (window.location.pathname === '/profile') {
      window.history.pushState({}, '', '/')
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }

  return (
    <header className="top-nav">
      <a
        className="brand"
        href="/"
        aria-label="Trang chủ Matcha"
        onClick={(event) => navigate(event, '/')}
      >
        <span className="brand-camera" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M9 6.5 10.2 5h3.6L15 6.5h2.3A1.7 1.7 0 0 1 19 8.2v7.1a1.7 1.7 0 0 1-1.7 1.7H6.7A1.7 1.7 0 0 1 5 15.3V8.2a1.7 1.7 0 0 1 1.7-1.7H9Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="11.8" r="2.5" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </span>
        <span className="brand-text">MATCHA</span>
      </a>

      <nav className="menu-links">
        <a
          href="/"
          className={currentRoute === '/' ? 'menu-link-active' : ''}
          onClick={(event) => navigate(event, '/')}
        >
          Home
        </a>
        <a
          href="/about-matcha"
          className={currentRoute === '/about-matcha' ? 'menu-link-active' : ''}
          onClick={(event) => navigate(event, '/about-matcha')}
        >
          Về Matcha
        </a>
        <a
          href="/order-history"
          className={currentRoute === '/order-history' ? 'menu-link-active' : ''}
          onClick={(event) => navigate(event, '/order-history')}
        >
          Lịch sử đơn hàng
        </a>
        <a href="/" onClick={(event) => navigate(event, '/')}>
          Blogs
        </a>
      </nav>

      <div className="menu-icons">
        <a
          className={`nav-icon-btn nav-cart-btn ${
            currentRoute === '/cart' ? 'nav-icon-btn-active' : ''
          }`}
          href="/cart"
          aria-label="Giỏ hàng"
          onClick={(event) => navigate(event, '/cart')}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M3 5h2l1.6 8.2a2 2 0 0 0 2 1.6h6.9a2 2 0 0 0 2-1.5L19 7H7.1"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="10" cy="19" r="1.5" fill="currentColor" />
            <circle cx="16" cy="19" r="1.5" fill="currentColor" />
          </svg>
          <span className="nav-cart-badge">3</span>
        </a>

        <button className="nav-icon-btn" type="button" aria-label="Thông báo">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M15 17H9m8-1v-4.2a5 5 0 1 0-10 0V16l-1.3 1.4c-.5.6-.1 1.6.7 1.6h11.2c.8 0 1.2-1 .7-1.6L17 16Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <a
          className={`nav-icon-btn ${currentRoute === '/chat' ? 'nav-icon-btn-active' : ''}`}
          href="/chat"
          aria-label="Tin nhắn"
          onClick={(event) => navigate(event, '/chat')}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M20 12a7.8 7.8 0 0 1-7.8 7.8c-1.2 0-2.4-.3-3.5-.8l-4.2 1.3 1.3-4.2A7.8 7.8 0 1 1 20 12Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>

        <a
          className={`nav-icon-btn nav-avatar-btn ${
            currentRoute === '/profile' ? 'nav-icon-btn-active' : ''
          }`}
          href={authUser ? '/profile' : '/login'}
          aria-label="Tài khoản"
          onClick={(event) => navigate(event, authUser ? '/profile' : '/login')}
        >
          <img
            src={authUser?.avatar ?? 'https://i.pravatar.cc/100?u=matcha-guest'}
            alt="Ảnh đại diện"
            className="nav-avatar"
          />
        </a>

        {!authUser && (
          <a
            className={`nav-login-link ${currentRoute === '/login' ? 'nav-login-link-active' : ''}`}
            href="/login"
            onClick={(event) => navigate(event, '/login')}
          >
            Đăng nhập
          </a>
        )}

        {authUser && (
          <button
            className="nav-icon-btn nav-logout-btn"
            type="button"
            aria-label="Đăng xuất"
            onClick={handleLogout}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M10 5H6.8A1.8 1.8 0 0 0 5 6.8v10.4A1.8 1.8 0 0 0 6.8 19H10m4-4 3-3m0 0-3-3m3 3H9"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
    </header>
  )
}

export default Header
