import { useState } from 'react'
import Footer from '../../components/Footer.jsx'
import Header from '../../components/Header.jsx'
import './service_detail.css'

const tabs = [
  { id: 'services', label: 'Dịch vụ & Portfolio' },
  { id: 'about', label: 'Giới thiệu' },
  { id: 'reviews', label: 'Đánh giá khách hàng' },
]

const packages = [
  {
    id: 'basic',
    name: 'Gói chụp cơ bản',
    price: 1200000,
    duration: '2 giờ',
    location: 'Hà Nội / Nội thành',
  },
  {
    id: 'outdoor',
    name: 'Chụp ảnh ngoài trời trọn gói',
    price: 3500000,
    duration: '5 giờ',
    location: 'Hà Nội / Ngoại thành',
  },
]

const portfolioImages = [
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80',
]

const reviews = [
  {
    id: 1,
    author: 'Khánh Linh',
    rating: '5.0',
    content:
      'Ảnh lên rất tự nhiên, bạn photographer hướng dẫn pose dễ hiểu và giữ cảm xúc rất tốt.',
  },
  {
    id: 2,
    author: 'Quỳnh Anh',
    rating: '4.9',
    content:
      'Lịch làm việc rõ ràng, trả ảnh đúng hẹn. Tone màu dịu và đúng tinh thần mình muốn.',
  },
]

const formatPrice = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

function ServiceDetail() {
  const [activeTab, setActiveTab] = useState('services')
  const [selectedPackageId, setSelectedPackageId] = useState(packages[0].id)

  const selectedPackage =
    packages.find((item) => item.id === selectedPackageId) ?? packages[0]

  return (
    <main className="service-detail-page">
      <Header />

      <section className="service-hero">
        <div className="service-hero__overlay" />
        <img
          src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80"
          alt="Minh Trần photographer cover"
          className="service-hero__image"
        />

        <div className="service-hero__content">
          <span className="service-hero__badge">NHIẾP ẢNH</span>

          <div className="service-hero__profile">
            <img
              src="https://i.pravatar.cc/160?u=minh-tran"
              alt="Minh Trần"
              className="service-hero__avatar"
            />

            <div>
              <h1>Minh Trần</h1>
              <p className="service-hero__tagline">
                <span className="service-hero__shield" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 3 18 5.2v5.5c0 4-2.4 7.6-6 9.3-3.6-1.7-6-5.3-6-9.3V5.2L12 3Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="m9.5 12.2 1.7 1.7 3.4-3.6"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                Chụp ảnh nàng thơ nhẹ nhàng
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="service-detail-layout">
        <div className="service-detail-main">
          <div className="service-tabs" role="tablist" aria-label="Nội dung dịch vụ">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`service-tabs__item ${
                  activeTab === tab.id ? 'service-tabs__item--active' : ''
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'services' && (
            <div className="service-panel">
              <p className="service-panel__intro">
                Gói dịch vụ được thiết kế theo phong cách chụp tự nhiên, ưu tiên cảm
                xúc thật và các khoảnh khắc có chiều sâu.
              </p>

              <section className="service-packages">
                <h2>Các gói dịch vụ</h2>

                <div className="service-packages__list">
                  {packages.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`service-package ${
                        selectedPackageId === item.id ? 'service-package--active' : ''
                      }`}
                      onClick={() => setSelectedPackageId(item.id)}
                    >
                      <div className="service-package__info">
                        <strong>{item.name}</strong>
                        <div className="service-package__meta">
                          <span>{item.duration}</span>
                          <span>{item.location}</span>
                        </div>
                      </div>
                      <span className="service-package__price">{formatPrice(item.price)}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="service-portfolio">
                <h2>Một vài khung hình tiêu biểu</h2>
                <div className="service-portfolio__grid">
                  {portfolioImages.map((image) => (
                    <img key={image} src={image} alt="Portfolio dịch vụ" />
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="service-panel">
              <section className="service-copy-block">
                <h2>Giới thiệu</h2>
                <p>
                  Minh Trần tập trung vào các bộ ảnh chân dung tự nhiên, ánh sáng mềm
                  và tương tác nhẹ để giữ được cảm xúc thật của khách hàng.
                </p>
                <p>
                  Quy trình làm việc gồm trao đổi moodboard, chốt địa điểm, hỗ trợ tạo
                  dáng và bàn giao ảnh theo đúng timeline đã thống nhất.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="service-panel">
              <section className="service-copy-block">
                <h2>Đánh giá khách hàng</h2>
                <div className="service-reviews">
                  {reviews.map((review) => (
                    <article key={review.id} className="service-review-card">
                      <div className="service-review-card__top">
                        <strong>{review.author}</strong>
                        <span>{review.rating}</span>
                      </div>
                      <p>{review.content}</p>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>

        <aside className="service-sidebar">
          <a className="service-sidebar__ghost" href="/login">
            <span aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M8.5 18.5c-2.8 0-5-2.1-5-4.8 0-2.7 2.2-4.8 5-4.8.6-3.3 3.5-5.7 7-5.7 3.9 0 7 3 7 6.7 0 3.7-3.1 6.7-7 6.7h-7Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            Đăng nhập để trao đổi
          </a>

          <button className="service-sidebar__cart" type="button">
            <span aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 5h2l1.5 8.3a2 2 0 0 0 2 1.7h7a2 2 0 0 0 1.9-1.5L19 7H7.3"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="10" cy="19" r="1.4" fill="currentColor" />
                <circle cx="16" cy="19" r="1.4" fill="currentColor" />
              </svg>
            </span>
            Thêm vào giỏ hàng
          </button>

          <section className="service-summary">
            <h2>Tổng quan</h2>

            <dl className="service-summary__list">
              <div>
                <dt>Gói đã chọn</dt>
                <dd>{selectedPackage.name}</dd>
              </div>
              <div>
                <dt>Giá</dt>
                <dd>{formatPrice(selectedPackage.price)}</dd>
              </div>
              <div>
                <dt>Thời lượng</dt>
                <dd>{selectedPackage.duration}</dd>
              </div>
              <div>
                <dt>Địa điểm</dt>
                <dd>{selectedPackage.location}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </section>

      <Footer />
    </main>
  )
}

export default ServiceDetail
