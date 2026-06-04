import './ai_idea_result.css'

const moodboardImages = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80',
]

const posingIdeas = [
  {
    title: 'Bước chậm dọc bờ hồ',
    description:
      'Thả lỏng vai, mắt nhìn xa và để tà váy hoặc tóc chuyển động theo gió để khung hình tự nhiên hơn.',
  },
  {
    title: 'Ngồi nghiêng nhẹ trên ghế đá',
    description:
      'Giữ lưng thẳng, tay đặt hờ trên váy hoặc bó hoa, gương mặt nghiêng 30 độ để lên nét mềm mại.',
  },
  {
    title: 'Chạm tay vào nón hoặc hoa',
    description:
      'Dùng đạo cụ như bó cúc nhỏ, mũ cói hoặc khăn lụa để tạo điểm nhấn và giúp tay không bị cứng.',
  },
]

const recommendedTeam = [
  {
    id: 1,
    role: 'NHIẾP ẢNH',
    title: 'Chụp ảnh nàng thơ nhẹ nhàng',
    partner: 'Minh Trần',
    partnerId: '#1',
    rating: '4.9',
    price: 1200000,
    image:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
    avatar: 'https://i.pravatar.cc/100?u=ai-minh-tran',
  },
  {
    id: 2,
    role: 'NHIẾP ẢNH',
    title: 'Chụp ảnh',
    partner: 'partner',
    partnerId: '#7',
    rating: '5',
    price: 500000,
    image:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80',
    avatar: 'https://i.pravatar.cc/100?u=ai-partner',
  },
  {
    id: 3,
    role: 'MAKEUP',
    title: 'Chuyên gia Trang điểm',
    partner: 'Hoa Nguyễn MUA',
    partnerId: '#2',
    rating: '5',
    price: 600000,
    image:
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80',
    avatar: 'https://i.pravatar.cc/100?u=ai-hoa-nguyen',
  },
]

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

        <strong className="ai-idea-query">"nàng thơ ở hồ tây"</strong>

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
              {['NÀNG THƠ', 'HỒ TÂY', 'VINTAGE', 'LÃNG MẠN', 'HOÀNG HÔN', 'HÀ NỘI'].map(
                (tag) => (
                  <span key={tag}>{tag}</span>
                ),
              )}
            </div>

            <h1>Nàng Thơ Bên Bờ Hồ Tây</h1>
            <p>
              "Câu chuyện về một cô gái mang tâm hồn thi sĩ, tìm đến vẻ đẹp tĩnh lặng
              của Hồ Tây vào buổi chiều tà để trốn khỏi sự ồn ào của phố thị, hòa mình
              vào ánh hoàng hôn nhuộm đỏ mặt hồ."
            </p>
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
                <strong>Thơ mộng, nhẹ nhàng, hoài niệm và đậm chất điện ảnh Pháp</strong>
              </div>
            </article>
            <article>
              <span aria-hidden="true">✣</span>
              <div>
                <p>MAKEUP & TRANG PHỤC</p>
                <strong>
                  Váy maxi trắng nhẹ nhàng, chất liệu lụa hoặc voan, kết hợp cùng mũ
                  cói và sandal quai mảnh.
                </strong>
              </div>
            </article>
          </div>
        </section>

        <section className="ai-section">
          <h2>
            <span aria-hidden="true">⌘</span>
            Moodboard Trực Quan
          </h2>

          <div className="ai-moodboard">
            {moodboardImages.map((image) => (
              <img key={image} src={image} alt="Moodboard nàng thơ Hồ Tây" />
            ))}
          </div>

          <div className="ai-info-grid">
            <div className="ai-info-pill ai-info-pill--wide">
              <span aria-hidden="true">⌖</span>
              Đề xuất: Bến Hàn Quốc và các cung đường ven Hồ Tây, Hà Nội
            </div>
            <div className="ai-info-pill">
              <span aria-hidden="true">☼</span>
              Ánh sáng tốt nhất: 16:00 - 18:30 (khung giờ vàng hoàng hôn)
            </div>
            <div className="ai-info-pill">
              <span aria-hidden="true">▭</span>
              Budget tổng: 2.500.000 - 4.500.000 VND
            </div>
          </div>
        </section>

        <section className="ai-section">
          <h2>
            <span aria-hidden="true">✣</span>
            Posing Gợi Ý
          </h2>

          <div className="ai-posing-grid">
            {posingIdeas.map((idea) => (
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
            "Dream Team" Đề Xuất
          </h2>
          <p>AI đã chọn lọc những đối tác phù hợp nhất với phong cách và ngân sách của bạn.</p>

          <div className="ai-team-grid">
            {recommendedTeam.map((member) => (
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
                  <a href="/service-detail" onClick={(event) => navigate(event, '/service-detail')}>
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
