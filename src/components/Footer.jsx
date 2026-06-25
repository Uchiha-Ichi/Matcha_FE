import './layout.css'

const navigate = (event, path) => {
  event.preventDefault()
  if (window.location.pathname === path) return
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function Footer() {
  return (
    <footer className="home-footer">
      <div className="home-footer__grid">
        <section className="footer-section">
          <h3>Thông tin & Trợ giúp</h3>
          <nav className="footer-links" aria-label="Thông tin và trợ giúp">
            <a href="/about-matcha" onClick={(event) => navigate(event, '/about-matcha')}>
              Về Matcha
            </a>
            <a href="/terms-of-service" onClick={(event) => navigate(event, '/terms-of-service')}>
              Điều khoản dịch vụ
            </a>
            <a href="/privacy-policy" onClick={(event) => navigate(event, '/privacy-policy')}>
              Chính sách bảo mật
            </a>
            <a href="/photo-process" onClick={(event) => navigate(event, '/photo-process')}>
              Quy trình chụp hình
            </a>
          </nav>
        </section>

        <section className="footer-section footer-contact">
          <h3>Liên hệ</h3>
          <p>(+84) 94 7172 004</p>
          <p>matcha.photographer@gmail.com</p>
        </section>
      </div>
    </footer>
  )
}

export default Footer
