import './homepage.css'
import Footer from '../../components/Footer.jsx'
import Header from '../../components/Header.jsx'
import {
  mockCategories,
  mockConcepts,
  mockPartnerConcepts,
  mockPartners,
  mockUsers,
} from '../../../mockdata.js'

const imageFallbacks = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1487412912498-0447578fcca8?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80',
]

const formatPrice = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
    value,
  )

const fixVnText = (text) => {
  if (typeof text !== 'string') return text
  try {
    return decodeURIComponent(escape(text))
  } catch {
    return text
  }
}

function Homepage() {
  const partnerById = new Map(mockPartners.map((partner) => [partner.id, partner]))
  const conceptById = new Map(mockConcepts.map((concept) => [concept.id, concept]))
  const userById = new Map(mockUsers.map((user) => [user.id, user]))

  const serviceItems = mockPartnerConcepts.map((item, index) => {
    const partner = partnerById.get(item.partner_id)
    const concept = conceptById.get(item.concept_id)
    const owner = partner ? userById.get(partner.user_id) : null

    return {
      id: item.id,
      title: fixVnText(concept?.name) ?? 'Dịch vụ',
      studioName: fixVnText(partner?.band_name) ?? 'Matcha Studio',
      ownerName: fixVnText(owner?.full_name) ?? 'Đội ngũ Matcha',
      location: fixVnText(partner?.location_name) ?? 'Việt Nam',
      duration: item.time,
      price: item.price,
      image: imageFallbacks[index % imageFallbacks.length],
      ownerAvatar: owner?.avatar_src ?? `https://i.pravatar.cc/100?u=matcha-${index}`,
      badge: index % 3 === 0 ? 'Matcha gợi ý' : index % 3 === 1 ? 'Mới' : 'Phổ biến',
      rating: index % 2 === 0 ? '4.9' : '4.8',
    }
  })

  const categoryTags = mockCategories
    .filter((category) => category.is_active === 1)
    .slice(0, 4)
    .map((category) => fixVnText(category.name))

  const conceptTags = mockConcepts
    .slice(0, 3)
    .map((concept) => fixVnText(concept.name))

  const filterTags = ['Tất cả', ...categoryTags, ...conceptTags]

  const footerHighlights = [
    'Đối tác được xét duyệt kỹ trước khi xuất hiện trên Matcha',
    'Lịch trống cập nhật hằng ngày theo nhu cầu đặt lịch',
    'Tư vấn nhanh để ghép đúng studio, makeup và concept',
  ]

  return (
    <main className="homepage">
      <Header />

      <section className="hero-section">
        <div className="hero-overlay" />
        <video
          autoPlay
          loop
          muted
          playsInline
          src="https://www.pexels.com/download/video/29539460/"
        />

        <div className="hero-content">
          <h1>
            Mọi thứ bạn cần cho
            <br />
            một buổi chụp.
          </h1>
          <p>
            Nhiếp ảnh gia, chuyên gia trang điểm, thuê trang phục, người mẫu
            <br />
            và studio trong một nơi.
          </p>
          <div className="search-box">
            <div className="search-primary-row">
              <div className="search-field search-field-main">
                <span className="search-leading-icon">✦</span>
                <input
                  type="text"
                  readOnly
                  value="Mô tả ý tưởng... VD: Nàng thơ ở Hồ Tây"
                />
              </div>
              <button className="search-upload-btn" type="button">
                <span className="search-upload-icon">⌘</span>
                Tải ảnh
              </button>
              <button className="search-submit-btn" type="button">
                Lên ý tưởng
              </button>
            </div>

 
          </div>
        </div>
      </section>

      <section className="services-shell">
        <section className="services-section">
          <div className="section-heading">
            <div>
              <h2>Khám phá dịch vụ</h2>
            </div>
        
          </div>

          <div className="chips">
            {filterTags.map((tag, index) => (
              <button
                key={tag}
                className={`chip ${index === 0 ? 'chip-active' : ''}`}
                type="button"
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="catalog-search-bar" aria-hidden="true">
            <div className="catalog-search-input">
              <span className="catalog-search-icon">⌕</span>
              <span>Tìm dịch vụ, concept, studio hoặc địa điểm...</span>
            </div>
            <button className="catalog-search-button" type="button">
              Tìm kiếm
            </button>
          </div>

          <div className="cards-grid">
            {serviceItems.map((service) => (
              <article key={service.id} className="service-card">
                <div className="card-image-wrap">
                  <img src={service.image} alt={service.title} />
                  <span className="card-badge">{service.badge}</span>
                  <span className="card-save">♡</span>
                </div>

                <div className="card-body">
                  <div className="card-topline">
                    <span className="card-mini-tag">{service.duration}</span>
                    <span className="card-rating">{service.rating}</span>
                  </div>

                  <h3>{service.title}</h3>
                  <p className="card-studio">{service.studioName}</p>

                  <div className="card-owner-row">
                    <img src={service.ownerAvatar} alt={service.ownerName} />
                    <div>
                      <p className="card-owner">{service.ownerName}</p>
                      <p className="card-location">{service.location}</p>
                    </div>
                  </div>

                  <div className="card-meta">
                    <span>Từ</span>
                    <strong>{formatPrice(service.price)}</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="services-footer-notes">
            {footerHighlights.map((item) => (
              <div key={item} className="footer-note">
                <span className="footer-note-dot" />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </section>
      </section>

      <Footer />
    </main>
  )
}

export default Homepage
