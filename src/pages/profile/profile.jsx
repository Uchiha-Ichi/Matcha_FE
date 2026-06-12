import { useRef, useEffect, useState } from 'react'
import Footer from '../../components/Footer.jsx'
import Header from '../../components/Header.jsx'
import { getMe, updateMe, getBookings, uploadImage, getMyPartner } from '../../utils/api.js'
import { PartnerDashboardHeader } from '../partner_dashboard/partner_dashboard.jsx'
import { getAuthUser, setAuthUser } from '../../utils/auth.js'
import './profile.css'

const navigate = (event, path) => {
  event.preventDefault()

  if (window.location.pathname === path) {
    return
  }

  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function ProfileHeader({ isPartner, partner }) {
  return isPartner ? <PartnerDashboardHeader partner={partner} activePath="/profile" /> : <Header />
}

function ProfileSkeleton() {
  const authUser = getAuthUser()
  const isPartner = authUser?.role === 'Partner'
  return (
    <main className="profile-page">
      <ProfileHeader isPartner={isPartner} partner={null} />
      <section className="profile-hero">
        <div className="profile-skeleton-bg" style={{ position: 'absolute', inset: 0 }} />
        <div className="profile-hero__overlay" />
        <div className="profile-hero__content">
          <span className="profile-skeleton-text" style={{ width: 100, height: 12 }} />
          <h1 className="profile-skeleton-text" style={{ width: 350, height: 48, marginTop: 14, display: 'block' }} />
          <p className="profile-skeleton-text" style={{ width: '50%', height: 20, marginTop: 16, display: 'block' }} />
        </div>
      </section>

      <section className="profile-layout">
        <aside className="profile-sidebar">
          <div className="profile-card">
            <div className="profile-skeleton-avatar" style={{ width: 118, height: 118, margin: '0 auto' }} />
            <div className="profile-skeleton-text" style={{ width: 140, height: 24, marginTop: 16 }} />
            <div className="profile-skeleton-text" style={{ width: '80%', height: 16, marginTop: 10 }} />
            <div className="profile-skeleton-text" style={{ width: 80, height: 20, marginTop: 14, borderRadius: 999 }} />
            <div className="profile-card__actions">
              <div className="profile-skeleton-text" style={{ height: 46, borderRadius: 999 }} />
              <div className="profile-skeleton-text" style={{ height: 46, borderRadius: 999 }} />
            </div>
          </div>

          <div className="profile-stats">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ display: 'grid', gap: 6 }}>
                <span className="profile-skeleton-text" style={{ width: 40, height: 24 }} />
                <span className="profile-skeleton-text" style={{ width: 60, height: 12 }} />
              </div>
            ))}
          </div>
        </aside>

        <div className="profile-main">
          <section className="profile-section">
            <div className="profile-section__heading">
              <div style={{ display: 'grid', gap: 6 }}>
                <span className="profile-skeleton-text" style={{ width: 80, height: 12 }} />
                <span className="profile-skeleton-text" style={{ width: 180, height: 24 }} />
              </div>
            </div>
            <div className="profile-form-grid">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{ display: 'grid', gap: 8 }}>
                  <span className="profile-skeleton-text" style={{ width: 100, height: 13 }} />
                  <div className="profile-skeleton-text" style={{ height: 50, borderRadius: 18 }} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
      <Footer />
    </main>
  )
}

function Profile() {
  const authUser = getAuthUser()
  const authUserId = authUser?.id
  const avatarInputRef = useRef(null)
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: '',
    avatar: '',
    cover: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80',
    bio: '',
    location: '',
    birthday: '',
    stats: {
      bookings: 0,
      completed: 0,
      savedServices: 0,
      reviews: 0,
    },
    recentBooking: null,
  })

  const [activeConcepts, setActiveConcepts] = useState(['Nàng thơ', 'Vintage', 'Street Style', 'Hoàng hôn'])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saveStatus, setSaveStatus] = useState(null) // 'saving' | 'success' | 'error' | null
  const [partnerProfile, setPartnerProfile] = useState(null)
  const [avatarStatus, setAvatarStatus] = useState(null) // 'uploading' | 'success' | 'error' | null
  const [avatarError, setAvatarError] = useState(null)

  useEffect(() => {
    if (!authUserId) {
      window.history.pushState({}, '', '/login')
      window.dispatchEvent(new PopStateEvent('popstate'))
      return
    }

    let cancelled = false

    async function loadProfile() {
      try {
        setLoading(true)
        setError(null)
        const [me, bookingsList] = await Promise.all([
          getMe(),
          getBookings({ role: 'customer' }).catch(() => []),
        ])
        const myPartner = me.role?.name === 'Partner' ? await getMyPartner().catch(() => null) : null

        if (cancelled) return

        setPartnerProfile(myPartner)

        // Calculate stats
        const totalBookings = bookingsList.length
        const completedBookings = bookingsList.filter(
          (b) =>
            b.status?.toLowerCase() === 'completed' ||
            b.status === 'Đã hoàn thành',
        ).length

        let recentBooking = null
        if (bookingsList.length > 0) {
          // Sort by created_at desc
          const sortedBookings = [...bookingsList].sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at),
          )
          const recent = sortedBookings[0]
          const detail = recent.details?.[0]

          recentBooking = {
            serviceName: detail?.partner_concept?.concept?.name || 'Dịch vụ chụp ảnh',
            partnerName: detail?.partner_concept?.partner?.band_name || 'Matcha Studio',
            time: new Date(recent.created_at).toLocaleString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            status: recent.status || 'Chờ xác nhận',
          }
        }

        const extraKey = `matcha_profile_extra_${me.id}`
        let extra = { location: '', birthday: '', bio: '' }
        try {
          const stored = localStorage.getItem(extraKey)
          if (stored) extra = JSON.parse(stored)
        } catch {
          // Ignore parse errors
        }

        setProfile({
          id: me.id,
          fullName: me.full_name || '',
          email: me.email || '',
          phone: me.phone || '',
          role: me.role?.name || 'Customer',
          location: extra.location || '',
          birthday: extra.birthday || '',
          avatar: me.avatar_src || `https://i.pravatar.cc/220?u=matcha-${me.id}`,
          cover:
            'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80',
          bio: extra.bio || 'Chưa cập nhật giới thiệu bản thân.',
          googleId: me.google_id || '',
          stats: {
            bookings: totalBookings,
            completed: completedBookings,
            savedServices: 0,
            reviews: 0,
          },
          recentBooking,
        })
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadProfile()
    return () => {
      cancelled = true
    }
  }, [authUserId])

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

  const handleSave = async () => {
    setSaveStatus('saving')
    try {
      const dto = {
        full_name: profile.fullName,
        phone: profile.phone || '',
      }
      await updateMe(dto)

      // Save extra non-db fields to localstorage
      const extraKey = `matcha_profile_extra_${profile.id}`
      localStorage.setItem(extraKey, JSON.stringify({
        location: profile.location,
        birthday: profile.birthday,
        bio: profile.bio,
      }))

      // Update local storage auth user
      const updatedAuthUser = {
        ...authUser,
        fullName: profile.fullName,
        phone: profile.phone,
      }
      setAuthUser(updatedAuthUser)

      setSaveStatus('success')
      setTimeout(() => setSaveStatus(null), 3000)
    } catch {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus(null), 3000)
    }
  }

  const handleAvatarFileChange = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setAvatarStatus('error')
      setAvatarError('Vui lòng chọn file ảnh hợp lệ.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarStatus('error')
      setAvatarError('Ảnh tối đa 5MB.')
      return
    }

    setAvatarStatus('uploading')
    setAvatarError(null)
    try {
      const payload = await uploadImage(file)
      const avatarUrl = payload?.url
      if (!avatarUrl) throw new Error('Không nhận được URL ảnh sau khi upload.')

      await updateMe({ avatar_src: avatarUrl })

      setProfile((current) => ({
        ...current,
        avatar: avatarUrl,
      }))

      setAuthUser({
        ...authUser,
        avatar: avatarUrl,
      })

      setAvatarStatus('success')
      setTimeout(() => setAvatarStatus(null), 2500)
    } catch (err) {
      setAvatarStatus('error')
      setAvatarError(err.message || 'Không thể cập nhật ảnh đại diện.')
    }
  }

  if (loading) return <ProfileSkeleton />

  const isPartnerProfile = profile.role === 'Partner' || authUser?.role === 'Partner'

  if (error) {
    return (
      <main className="profile-page">
        <ProfileHeader isPartner={isPartnerProfile} partner={partnerProfile} />
        <div style={{ maxWidth: 600, margin: '120px auto', textAlign: 'center', padding: 24 }}>
          <h2 style={{ fontSize: 24, marginBottom: 12 }}>Không thể tải hồ sơ cá nhân</h2>
          <p style={{ color: '#6f6257', marginBottom: 24 }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            type="button"
            style={{
              padding: '12px 24px',
              background: '#1f1713',
              color: '#fff',
              border: 'none',
              borderRadius: 999,
              cursor: 'pointer',
            }}
          >
            Thử lại
          </button>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="profile-page">
      <ProfileHeader isPartner={isPartnerProfile} partner={partnerProfile} />

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
            <div className="profile-card__avatar-wrap">
              <img src={profile.avatar} alt={profile.fullName} className="profile-card__avatar" />
              <button
                type="button"
                className="profile-card__avatar-edit"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarStatus === 'uploading'}
              >
                {avatarStatus === 'uploading' ? 'Đang tải...' : 'Đổi ảnh'}
              </button>
              <input
                ref={avatarInputRef}
                className="profile-card__avatar-input"
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
              />
            </div>
            {avatarStatus === 'success' && (
              <span className="profile-card__avatar-note profile-card__avatar-note--success">Đã cập nhật ảnh</span>
            )}
            {avatarStatus === 'error' && (
              <span className="profile-card__avatar-note profile-card__avatar-note--error">{avatarError}</span>
            )}
            <h2>{profile.fullName || profile.email.split('@')[0]}</h2>
            <p>{profile.bio}</p>
            <span className="profile-card__role">{profile.role}</span>

            <div className="profile-card__actions">
              {profile.role === 'Partner' && (
                <a
                  href="/partner-dashboard"
                  onClick={(event) => navigate(event, '/partner-dashboard')}
                >
                  Dashboard đối tác
                </a>
              )}
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
              <button type="button" onClick={handleSave} disabled={saveStatus === 'saving'}>
                {saveStatus === 'saving'
                  ? 'Đang lưu...'
                  : saveStatus === 'success'
                  ? '✓ Đã lưu'
                  : saveStatus === 'error'
                  ? '✗ Lỗi khi lưu'
                  : 'Lưu thay đổi'}
              </button>
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
                <input type="email" value={profile.email} disabled style={{ opacity: 0.7, cursor: 'not-allowed' }} />
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
            {profile.recentBooking ? (
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
            ) : (
              <article className="profile-section profile-mini-panel">
                <span>LỊCH GẦN NHẤT</span>
                <h2>Chưa có lịch hẹn nào</h2>
                <p style={{ marginTop: 12, color: '#6f6257', fontSize: '14px' }}>
                  Hãy khám phá các dịch vụ nổi bật ngoài trang chủ và đặt lịch hẹn đầu tiên.
                </p>
                <a
                  href="/"
                  onClick={(e) => navigate(e, '/')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    marginTop: 18,
                    fontWeight: '800',
                    fontSize: '14px',
                    color: '#1f1713',
                    textDecoration: 'underline',
                  }}
                >
                  Khám phá dịch vụ →
                </a>
              </article>
            )}

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
              {!profile.googleId && (
                <a href="/forgot-password" onClick={(event) => navigate(event, '/forgot-password')}>
                  Đổi mật khẩu
                </a>
              )}
            </article>
          </section>
        </div>
      </section>

      <Footer />
    </main>
  )
}

export default Profile
