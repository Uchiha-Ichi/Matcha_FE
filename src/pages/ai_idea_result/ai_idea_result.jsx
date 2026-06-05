import { useEffect, useState, useMemo } from 'react'
import { generateAiIdea } from '../../utils/api.js'
import LoadingScreen from '../../components/LoadingScreen.jsx'
import './ai_idea_result.css'

const moodboardSets = {
  vintage: [
    'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80',
  ],
  modern: [
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1487412912498-0447578fcca8?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=80',
  ],
  nature: [
    'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80',
  ]
}

const formatPrice = (value) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value)

const navigate = (event, path) => {
  event.preventDefault()

  if (window.location.pathname === path) {
    return
  }

  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function AiIdeaResult() {
  const [ideaData, setIdeaData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const queryParams = useMemo(() => new URLSearchParams(window.location.search), [])
  const query = useMemo(() => queryParams.get('query') || '', [queryParams])

  useEffect(() => {
    if (!query) {
      setError('Vui lòng quay lại trang chủ và nhập ý tưởng chụp ảnh.')
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(null)

        const res = await generateAiIdea(query)
        if (cancelled) return

        if (!res.isValid) {
          setError(res.errorMessage || 'Ý tưởng không thuộc chủ đề chụp ảnh. Vui lòng thử lại!')
        } else {
          setIdeaData(res)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Không thể liên kết với máy chủ AI.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [query])

  const moodboardImages = useMemo(() => {
    if (!ideaData) return moodboardSets.modern
    const titleLower = (ideaData.title || '').toLowerCase()
    const tagsLower = (ideaData.tags || []).map((t) => t.toLowerCase())

    const isVintage =
      titleLower.includes('vintage') ||
      titleLower.includes('cổ') ||
      tagsLower.includes('vintage') ||
      tagsLower.includes('hoài niệm')
    const isNature =
      titleLower.includes('hồ') ||
      titleLower.includes('ngoại cảnh') ||
      titleLower.includes('phố') ||
      tagsLower.includes('hồ tây') ||
      tagsLower.includes('thiên nhiên')

    if (isVintage) return moodboardSets.vintage
    if (isNature) return moodboardSets.nature
    return moodboardSets.modern
  }, [ideaData])

  // RENDER LOADING STATE
  if (loading) {
    return (
      <main className="ai-idea-page">
        <header className="ai-idea-topbar">
          <div className="ai-idea-topbar__left">
            <a
              className="ai-idea-brand"
              href="/"
              onClick={(event) => navigate(event, '/')}
            >
              <span className="ai-idea-brand__icon">✦</span>
              <span>MATCHA</span>
            </a>
          </div>
          <strong className="ai-idea-query">"{query}"</strong>
        </header>

        <LoadingScreen text="Matcha AI đang phân tích ý tưởng, thiết kế concept, gợi ý trang phục, tạo dáng và lựa chọn ekip đối tác phù hợp..." />
      </main>
    )
  }

  // RENDER ERROR / INVALID PROMPT STATE
  if (error) {
    return (
      <main className="ai-idea-page">
        <header className="ai-idea-topbar">
          <div className="ai-idea-topbar__left">
            <a
              className="ai-idea-brand"
              href="/"
              onClick={(event) => navigate(event, '/')}
            >
              <span className="ai-idea-brand__icon">✦</span>
              <span>MATCHA</span>
            </a>
          </div>
          <strong className="ai-idea-query">"{query}"</strong>
        </header>

        <div className="ai-idea-shell" style={{ padding: '40px 16px' }}>
          <section className="ai-idea-card" style={{ textAlign: 'center', padding: '40px 30px' }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>⚠️</span>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#181512', marginBottom: '16px' }}>
              Từ chối lên ý tưởng
            </h1>
            <p style={{
              fontSize: '15px',
              color: '#63574d',
              lineHeight: '1.7',
              maxWidth: '520px',
              margin: '0 auto 28px'
            }}>
              {error}
            </p>
            <button
              type="button"
              onClick={(event) => navigate(event, '/')}
              style={{
                background: '#1f1713',
                color: '#fff',
                border: 'none',
                padding: '12px 36px',
                borderRadius: '999px',
                fontSize: '15px',
                fontWeight: '800',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Quay về trang chủ
            </button>
          </section>
        </div>
      </main>
    )
  }

  // RENDER SUCCESS DATA STATE
  return (
    <main className="ai-idea-page">
      <header className="ai-idea-topbar">
        <div className="ai-idea-topbar__left">
          <a
            className="ai-idea-brand"
            href="/"
            aria-label="Trang chủ Matcha"
            onClick={(event) => navigate(event, '/')}
          >
            <span className="ai-idea-brand__icon" aria-hidden="true">
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
            <span>MATCHA</span>
          </a>

          <a
            className="ai-idea-round-btn"
            href="/"
            aria-label="Quay lại"
            onClick={(event) => navigate(event, '/')}
          >
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M15 6 9 12l6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>

        <strong className="ai-idea-query">"{query}"</strong>

        <a
          className="ai-idea-round-btn"
          href="/cart"
          aria-label="Giỏ hàng"
          onClick={(event) => navigate(event, '/cart')}
        >
          <svg viewBox="0 0 24 24" fill="none">
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
        </a>
      </header>

      <div className="ai-idea-shell">
        <section className="ai-idea-card">
          <div className="ai-idea-card__copy">
            <div className="ai-idea-tags">
              {(ideaData.tags || []).map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>

            <h1>{ideaData.title}</h1>
            <p>"{ideaData.description}"</p>
          </div>

          <span className="ai-idea-wand" aria-hidden="true">
            <svg viewBox="0 0 72 72" fill="none">
              <path
                d="m23 50 31-31M45 14l13 13M18 19v10M13 24h10M56 42v10M51 47h10"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>

          <div className="ai-idea-insights">
            <article>
              <span aria-hidden="true">✣</span>
              <div>
                <p>VIBE & CẢM HỨNG</p>
                <strong>{ideaData.vibe}</strong>
              </div>
            </article>
            <article>
              <span aria-hidden="true">✣</span>
              <div>
                <p>MAKEUP & TRANG PHỤC</p>
                <strong>{ideaData.makeupAndCostume}</strong>
              </div>
            </article>
          </div>
        </section>

        <section className="ai-section">
          <h2>
            <span aria-hidden="true">⌘</span>
            Moodboard Gợi Ý
          </h2>

          <div className="ai-moodboard">
            {moodboardImages.map((image) => (
              <img key={image} src={image} alt="Moodboard" />
            ))}
          </div>

          <div className="ai-info-grid">
            <div className="ai-info-pill ai-info-pill--wide">
              <span aria-hidden="true">⌖</span>
              Đề xuất địa điểm: {ideaData.locationRecommendation}
            </div>
            <div className="ai-info-pill">
              <span aria-hidden="true">☼</span>
              Thời gian đẹp nhất: {ideaData.bestLightTime}
            </div>
            <div className="ai-info-pill">
              <span aria-hidden="true">▭</span>
              Budget ước tính: {ideaData.suggestedBudget}
            </div>
          </div>
        </section>

        <section className="ai-section">
          <h2>
            <span aria-hidden="true">✣</span>
            Hướng Dẫn Tạo Dáng (Posing)
          </h2>

          <div className="ai-posing-grid">
            {(ideaData.posingIdeas || []).map((idea) => (
              <article key={idea.title}>
                <h3>{idea.title}</h3>
                <p>{idea.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="ai-section ai-team-section">
          <h2>
            <span aria-hidden="true">✣</span>
            Ekip Đề Xuất
          </h2>
          <p>Dưới đây là các đối tác có sẵn trên hệ thống Matcha phù hợp nhất với phong cách của bạn.</p>

          <div className="ai-team-grid">
            {(ideaData.recommendedTeam || []).map((member) => (
              <article key={member.id} className="ai-team-card">
                <div className="ai-team-card__image">
                  <img src={member.image} alt={member.title} />
                  <span className="ai-team-card__rating">★ {member.rating}</span>
                  <span className="ai-team-card__role">{member.role}</span>
                </div>

                <div className="ai-team-card__body">
                  <img src={member.avatar} alt={member.partner} />
                  <div>
                    <h3>{member.title}</h3>
                    <p>{member.partner}</p>
                    <span>ID {member.partnerId}</span>
                  </div>
                </div>

                <div className="ai-team-card__bottom">
                  <strong>{formatPrice(member.price)} đ</strong>
                  <a
                    href={`/service-detail/${member.partnerConceptId}`}
                    onClick={(event) => navigate(event, `/service-detail/${member.partnerConceptId}`)}
                  >
                    Xem chi tiết
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

export default AiIdeaResult
