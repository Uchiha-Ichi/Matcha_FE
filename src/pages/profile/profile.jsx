import { useState } from 'react'
import Footer from '../../components/Footer.jsx'
import Header from '../../components/Header.jsx'
import { getAuthUser } from '../../utils/auth.js'
import './profile.css'

const mockProfile = {
  id: 4,
  fullName: 'Khách Hàng A',
  email: 'userA@gmail.com',
  phone: '0911111111',
  role: 'Customer',
  location: 'Hà Nội, Việt Nam',
  birthday: '2002-09-18',
  avatar: 'https://i.pravatar.cc/220?u=matcha-user',
  cover:
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80',
  bio: 'Thích những bộ ảnh tự nhiên, ánh sáng mềm và concept có câu chuyện rõ ràng.',
  favoriteConcepts: ['Nàng thơ', 'Vintage', 'Street Style', 'Hoàng hôn'],
  stats: {
    bookings: 8,
    completed: 5,
    savedServices: 12,
    reviews: 4,
  },
  recentBooking: {
    serviceName: 'Gói chụp nàng thơ ngoài trời',
    partnerName: 'Minh Lens Studio',
    time: '20/04/2026 - 09:00',
    status: 'Đã xác nhận',
  },
}

const navigate = (event, path) => {
  event.preventDefault()

  if (window.location.pathname === path) {
    return
  }

  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function Profile() {
  const [profile, setProfile] = useState(() => ({
    ...mockProfile,
    ...(getAuthUser() ?? {}),
  }))
  const [activeConcepts, setActiveConcepts] = useState(mockProfile.favoriteConcepts)

  const updateProfileField = (field, value) => {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const toggleConcept = (concept) => {
    setActiveConcepts((current) =>
      current.includes(concept)
        ? current.filter((item) => item !== concept)
        : [...current, concept],
    )
  }

  return (
    <main className="profile-page">
      <Header />

      <section className="profile-hero">
        <img src={profile.cover} alt="Matcha profile cover" />
        <div className="profile-hero__overlay" />
        <div className="profile-hero__content">
          <span>MY PROFILE</span>
          <h1>Hồ sơ cá nhân</h1>
          <p>Quản lý thông tin tài khoản, sở thích chụp ảnh và các cài đặt cá nhân.</p>
        </div>
      </section>

      <section className="profile-layout">
        <aside className="profile-sidebar">
          <div className="profile-card">
            <img src={profile.avatar} alt={profile.fullName} className="profile-card__avatar" />
            <h2>{profile.fullName}</h2>
            <p>{profile.bio}</p>
            <span className="profile-card__role">{profile.role}</span>

            <div className="profile-card__actions">
              <a href="/order-history" onClick={(event) => navigate(event, '/order-history')}>
                Lịch sử đơn hàng
              </a>
              <a href="/chat" onClick={(event) => navigate(event, '/chat')}>
                Tin nhắn
              </a>
            </div>
          </div>

          <div className="profile-stats">
            <div>
              <strong>{profile.stats.bookings}</strong>
              <span>Tổng đơn</span>
            </div>
            <div>
              <strong>{profile.stats.completed}</strong>
              <span>Hoàn tất</span>
            </div>
            <div>
              <strong>{profile.stats.savedServices}</strong>
              <span>Đã lưu</span>
            </div>
            <div>
              <strong>{profile.stats.reviews}</strong>
              <span>Đánh giá</span>
            </div>
          </div>
        </aside>

        <div className="profile-main">
          <section className="profile-section">
            <div className="profile-section__heading">
              <div>
                <span>THÔNG TIN</span>
                <h2>Thông tin cá nhân</h2>
              </div>
              <button type="button">Lưu thay đổi</button>
            </div>

            <div className="profile-form-grid">
              <label>
                <span>Họ và tên</span>
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(event) => updateProfileField('fullName', event.target.value)}
                />
              </label>
              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(event) => updateProfileField('email', event.target.value)}
                />
              </label>
              <label>
                <span>Số điện thoại</span>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(event) => updateProfileField('phone', event.target.value)}
                />
              </label>
              <label>
                <span>Ngày sinh</span>
                <input
                  type="date"
                  value={profile.birthday}
                  onChange={(event) => updateProfileField('birthday', event.target.value)}
                />
              </label>
              <label className="profile-form-grid__wide">
                <span>Địa chỉ</span>
                <input
                  type="text"
                  value={profile.location}
                  onChange={(event) => updateProfileField('location', event.target.value)}
                />
              </label>
              <label className="profile-form-grid__wide">
                <span>Giới thiệu ngắn</span>
                <textarea
                  value={profile.bio}
                  onChange={(event) => updateProfileField('bio', event.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="profile-section">
            <div className="profile-section__heading">
              <div>
                <span>SỞ THÍCH</span>
                <h2>Concept yêu thích</h2>
              </div>
            </div>

            <div className="profile-concepts">
              {['Nàng thơ', 'Vintage', 'Street Style', 'Hoàng hôn', 'Kỷ yếu', 'Cưới hỏi'].map(
                (concept) => (
                  <button
                    key={concept}
                    type="button"
                    className={activeConcepts.includes(concept) ? 'profile-concept--active' : ''}
                    onClick={() => toggleConcept(concept)}
                  >
                    {concept}
                  </button>
                ),
              )}
            </div>
          </section>

          <section className="profile-two-column">
            <article className="profile-section profile-mini-panel">
              <span>LỊCH GẦN NHẤT</span>
              <h2>{profile.recentBooking.serviceName}</h2>
              <p>{profile.recentBooking.partnerName}</p>
              <dl>
                <div>
                  <dt>Thời gian</dt>
                  <dd>{profile.recentBooking.time}</dd>
                </div>
                <div>
                  <dt>Trạng thái</dt>
                  <dd>{profile.recentBooking.status}</dd>
                </div>
              </dl>
            </article>

            <article className="profile-section profile-security">
              <span>BẢO MẬT</span>
              <h2>Tài khoản</h2>
              <label>
                <input type="checkbox" defaultChecked />
                <span>Nhận thông báo lịch hẹn qua email</span>
              </label>
              <label>
                <input type="checkbox" defaultChecked />
                <span>Nhận tin nhắn từ ekip đã đặt lịch</span>
              </label>
              <a href="/forgot-password" onClick={(event) => navigate(event, '/forgot-password')}>
                Đổi mật khẩu
              </a>
            </article>
          </section>
        </div>
      </section>

      <Footer />
    </main>
  )
}

export default Profile
