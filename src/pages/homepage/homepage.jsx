import { useEffect, useState, useCallback } from 'react'
import './homepage.css'
import Footer from '../../components/Footer.jsx'
import Header from '../../components/Header.jsx'
import { getPartnerConcepts, getPartners, getConcepts, getCategories, searchPartnersNearby } from '../../utils/api.js'
import { extractCityOrProvince } from '../../utils/helpers.js'

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
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

const navigate = (event, path, state = {}) => {
  event.preventDefault()
  if (window.location.pathname === path && !state) return
  window.history.pushState(state, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

const badges = ['Matcha gợi ý', 'Mới', 'Phổ biến']

const normalizeText = (value) =>
  String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

function SkeletonCard() {
  return (
    <article className="service-card skeleton-card">
      <div className="card-image-wrap skeleton-image" />
      <div className="card-body">
        <div className="skeleton-line" style={{ width: '60%', height: 14 }} />
        <div className="skeleton-line" style={{ width: '90%', height: 20, marginTop: 10 }} />
        <div className="skeleton-line" style={{ width: '70%', height: 14, marginTop: 8 }} />
        <div className="skeleton-line" style={{ width: '50%', height: 18, marginTop: 16 }} />
      </div>
    </article>
  )
}

function Homepage() {
  const [serviceItems, setServiceItems] = useState([])
  const [filterTags, setFilterTags] = useState(['Tất cả'])
  const [activeTag, setActiveTag] = useState('Tất cả')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [aiQuery, setAiQuery] = useState('')
  const [catalogSearchInput, setCatalogSearchInput] = useState('')
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('')

  // State for Nearby Filter
  const [isNearbyFilterActive, setIsNearbyFilterActive] = useState(false)
  const [nearbyPartnerIds, setNearbyPartnerIds] = useState(new Map())
  const [nearbyLoading, setNearbyLoading] = useState(false)
  const [nearbyError, setNearbyError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(null)

        const [partnerConcepts, partners, concepts, categories] = await Promise.all([
          getPartnerConcepts().catch(() => []),
          getPartners().catch(() => []),
          getConcepts().catch(() => []),
          getCategories().catch(() => []),
        ])

        if (cancelled) return

        // Build lookup maps
        const partnerById = new Map((partners ?? []).map((p) => [p.id, p]))
        const conceptById = new Map((concepts ?? []).map((c) => [c.id, c]))

        const items = (partnerConcepts ?? []).map((pc, index) => {
          const partner = partnerById.get(pc.partner?.id ?? pc.partner_id)
          const concept = conceptById.get(pc.concept?.id ?? pc.concept_id)
          const categoryName = partner?.category?.name ?? pc.partner?.category?.name ?? ''
          const conceptName = concept?.name ?? pc.concept?.name ?? ''
          const title = conceptName || 'Dịch vụ'

          // Resolve image: API image_des → partner cover → fallback
          const image =
            pc.image_des ||
            pc.images?.[0]?.image_src ||
            partner?.cover_image ||
            imageFallbacks[index % imageFallbacks.length]

          return {
            id: pc.id,
            title,
            studioName: partner?.band_name ?? 'Matcha Studio',
            location: extractCityOrProvince(partner?.location_name),
            duration: pc.time ?? '—',
            price: pc.price,
            image,
            rating: partner?.rating_avg > 0 ? Number(partner.rating_avg).toFixed(1) : '5.0',
            badge: badges[index % badges.length],
            partnerConceptId: pc.id,
            partnerId: partner?.id || pc.partner_id || pc.partner?.id,
            categoryName,
            conceptName,
            searchableText: normalizeText([
              title,
              categoryName,
              conceptName,
              partner?.band_name,
              partner?.location_name,
              pc.time,
              pc.price,
            ].join(' ')),
          }
        })

        setServiceItems(items)

        // Build filter tags from categories + concepts
        const categoryNames = (categories ?? [])
          .filter((c) => c.is_active)
          .slice(0, 4)
          .map((c) => c.name)
        const conceptNames = (concepts ?? []).slice(0, 3).map((c) => c.name)
        setFilterTags(['Tất cả', ...categoryNames, ...conceptNames])
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  const formatDistance = (meters) => {
    if (meters === undefined || meters === null) return ''
    if (meters < 1000) return `Cách ${Math.round(meters)}m`
    return `Cách ${(meters / 1000).toFixed(1)}km`
  }

  const handleNearbyToggle = () => {
    if (isNearbyFilterActive) {
      setIsNearbyFilterActive(false)
      setNearbyError(null)
      return
    }

    if (navigator.geolocation) {
      setNearbyLoading(true)
      setNearbyError(null)
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          try {
            const nearbyPartners = await searchPartnersNearby(latitude, longitude, 15) // Bán kính 15km
            const nearbyMap = new Map()
            nearbyPartners.forEach(p => {
              nearbyMap.set(p.id, p.distance_meters)
            })
            setNearbyPartnerIds(nearbyMap)
            setIsNearbyFilterActive(true)
          } catch (err) {
            setNearbyError('Không thể tìm kiếm các studio lân cận.')
          } finally {
            setNearbyLoading(false)
          }
        },
        (err) => {
          setNearbyError(
            err.code === 1
              ? 'Vui lòng cấp quyền truy cập vị trí trong cài đặt trình duyệt.'
              : 'Không thể định vị vị trí hiện tại của bạn.'
          )
          setNearbyLoading(false)
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    } else {
      setNearbyError('Trình duyệt không hỗ trợ định vị GPS.')
    }
  }

  const footerHighlights = [
    'Đối tác được xét duyệt kỹ trước khi xuất hiện trên Matcha',
    'Lịch trống cập nhật hằng ngày theo nhu cầu đặt lịch',
    'Tư vấn nhanh để ghép đúng studio, makeup và concept',
  ]

  const baseFilteredItems = serviceItems.filter((service) => {
    const activeFilter = normalizeText(activeTag)
    const isAllFilter = activeTag === filterTags[0]
    const matchesTag =
      isAllFilter ||
      normalizeText(service.categoryName) === activeFilter ||
      normalizeText(service.conceptName) === activeFilter ||
      normalizeText(service.title) === activeFilter

    const query = normalizeText(catalogSearchTerm)
    const matchesSearch = !query || service.searchableText.includes(query)

    // Lọc theo vị trí lân cận nếu filter active
    const matchesNearby = !isNearbyFilterActive || (service.partnerId && nearbyPartnerIds.has(service.partnerId))

    return matchesTag && matchesSearch && matchesNearby
  })

  const filteredServiceItems = isNearbyFilterActive
    ? [...baseFilteredItems].sort((a, b) => {
        const distA = nearbyPartnerIds.get(a.partnerId) ?? 9999999
        const distB = nearbyPartnerIds.get(b.partnerId) ?? 9999999
        return distA - distB
      })
    : baseFilteredItems

  const handleCatalogSearch = (event) => {
    event.preventDefault()
    setCatalogSearchTerm(catalogSearchInput)
  }

  return (
    <main className="homepage">
      <Header />

      <section className="hero-section">
        <div className="hero-overlay" />
        <video autoPlay loop muted playsInline src="https://www.pexels.com/download/video/29539460/" />
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
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  placeholder="Mô tả ý tưởng của bạn... VD: Nàng thơ ở Hồ Tây"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const q = aiQuery.trim()
                      if (q) {
                        navigate(e, `/ai-idea?query=${encodeURIComponent(q)}`)
                      }
                    }
                  }}
                />
              </div>
              <button className="search-upload-btn" type="button">
                <span className="search-upload-icon">⌘</span>
                Tải ảnh
              </button>
              <button
                className="search-submit-btn"
                type="button"
                onClick={(event) => {
                  const q = aiQuery.trim()
                  if (!q) {
                    alert('Vui lòng nhập ý tưởng chụp ảnh của bạn!')
                    return
                  }
                  navigate(event, `/ai-idea?query=${encodeURIComponent(q)}`)
                }}
              >
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

          <div className="chips" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {filterTags.map((tag) => (
              <button
                key={tag}
                className={`chip ${activeTag === tag ? 'chip-active' : ''}`}
                type="button"
                onClick={() => setActiveTag(tag)}
              >
                {tag}
              </button>
            ))}
            <button
              className={`chip ${isNearbyFilterActive ? 'chip-active' : ''}`}
              type="button"
              onClick={handleNearbyToggle}
              disabled={nearbyLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderColor: isNearbyFilterActive ? '#1f1713' : '#ded2c3',
                background: isNearbyFilterActive ? '#1f1713' : 'transparent',
                color: isNearbyFilterActive ? '#fff' : '#1f1713',
                marginLeft: 'auto',
              }}
            >
              {nearbyLoading ? '⏳ Đang định vị...' : '📍 Gần tôi'}
            </button>
          </div>

          {nearbyError && (
            <div className="api-error" style={{ marginBottom: 16 }}>
              <span>⚠ {nearbyError}</span>
            </div>
          )}

          <form className="catalog-search-bar" onSubmit={handleCatalogSearch}>
            <div className="catalog-search-input">
              <span className="catalog-search-icon">⌕</span>
              <input
                type="search"
                value={catalogSearchInput}
                onChange={(event) => {
                  setCatalogSearchInput(event.target.value)
                  if (!event.target.value.trim()) {
                    setCatalogSearchTerm('')
                  }
                }}
                placeholder="Tìm dịch vụ, concept, studio hoặc địa điểm..."
                aria-label="Tìm dịch vụ"
              />
            </div>
            <button className="catalog-search-button" type="submit">
              Tìm kiếm
            </button>
          </form>

          {error && (
            <div className="api-error">
              <span>⚠ Không thể tải dữ liệu: {error}</span>
            </div>
          )}

          <div className="cards-grid">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              : filteredServiceItems.map((service) => (
                  <article
                    key={service.id}
                    className="service-card"
                    role="link"
                    tabIndex={0}
                    onClick={(event) =>
                      navigate(event, `/service-detail/${service.partnerConceptId}`, {
                        partnerConceptId: service.partnerConceptId,
                      })
                    }
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        navigate(event, `/service-detail/${service.partnerConceptId}`, {
                          partnerConceptId: service.partnerConceptId,
                        })
                      }
                    }}
                  >
                    <div className="card-image-wrap">
                      <img src={service.image} alt={service.title} />
                      <span className="card-badge">{service.badge}</span>
                      <span className="card-save">♡</span>
                    </div>

                    <div className="card-body">
                      <div className="card-topline">
                        <span className="card-mini-tag">{service.duration}</span>
                        <span className="card-rating">⭐ {service.rating}</span>
                      </div>

                      <h3>{service.title}</h3>
                      <p className="card-studio">{service.studioName}</p>

                      <div className="card-owner-row">
                        <div>
                          <p className="card-location">
                            📍 {service.location}
                            {isNearbyFilterActive && service.partnerId && nearbyPartnerIds.has(service.partnerId) && (
                              <span style={{ marginLeft: 6, color: '#1bc48f', fontWeight: 800 }}>
                                ({formatDistance(nearbyPartnerIds.get(service.partnerId))})
                              </span>
                            )}
                          </p>
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

          {!loading && serviceItems.length === 0 && !error && (
            <div className="empty-state">
              <p>Chưa có dịch vụ nào. Hãy quay lại sau nhé!</p>
            </div>
          )}

          {!loading && serviceItems.length > 0 && filteredServiceItems.length === 0 && !error && (
            <div className="empty-state">
              <p>Không tìm thấy dịch vụ phù hợp với bộ lọc hiện tại.</p>
            </div>
          )}

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
