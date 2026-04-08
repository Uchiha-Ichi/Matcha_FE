import './layout.css'

const getCurrentRoute = () => {
  const hash = window.location.hash || '#/'
  return hash.replace(/^#/, '') || '/'
}

function Header() {
  const currentRoute = getCurrentRoute()

  return (
    <header className="top-nav">
      <a className="brand" href="#/" aria-label="Trang chủ Matcha">
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
        <a href="#/" className={currentRoute === '/' ? 'menu-link-active' : ''}>
          Home
        </a>
        <a
          href="#/about-matcha"
          className={currentRoute === '/about-matcha' ? 'menu-link-active' : ''}
        >
          Về Matcha
        </a>
        <a href="#/">Lịch sử đơn hàng</a>
        <a href="#/">Blogs</a>
      </nav>

      <div className="menu-icons">
        <button className="nav-icon-btn" type="button" aria-label="Giỏ hàng">
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
        </button>

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

        <button className="nav-icon-btn" type="button" aria-label="Tin nhắn">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M20 12a7.8 7.8 0 0 1-7.8 7.8c-1.2 0-2.4-.3-3.5-.8l-4.2 1.3 1.3-4.2A7.8 7.8 0 1 1 20 12Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <button className="nav-icon-btn nav-avatar-btn" type="button" aria-label="Tài khoản">
          <img
            src="https://i.pravatar.cc/100?u=matcha-user"
            alt="Ảnh đại diện"
            className="nav-avatar"
          />
        </button>
      </div>
    </header>
  )
}

export default Header
