import Header from '../../components/Header.jsx'
import Footer from '../../components/Footer.jsx'
import './about_matcha.css'

const categories = [
  {
    id: 1,
    title: 'Cá nhân',
    desc: 'Ghi lại chân dung nhẹ nhàng, thời trang hoặc profile chuyên nghiệp.',
    tone: 'peach',
  },
  {
    id: 2,
    title: 'Cặp đôi',
    desc: 'Lưu lại câu chuyện tình cảm theo phong cách tự nhiên và giàu cảm xúc.',
    tone: 'amber',
  },
  {
    id: 3,
    title: 'Gia đình',
    desc: 'Khoảnh khắc ấm áp, gần gũi để cả nhà luôn có kỷ niệm đẹp cùng nhau.',
    tone: 'green',
  },
  {
    id: 4,
    title: 'Bạn bè',
    desc: 'Những bộ ảnh vui tươi, trẻ trung để đánh dấu một giai đoạn thật đáng nhớ.',
    tone: 'blue',
  },
  {
    id: 5,
    title: 'Kỷ yếu',
    desc: 'Concept thanh xuân, đồng phục, trường lớp và những bức ảnh đầy năng lượng.',
    tone: 'rose',
  },
  {
    id: 6,
    title: 'Sự kiện',
    desc: 'Gói chụp linh hoạt cho workshop, khai trương, tiệc cưới hay các dịp đặc biệt.',
    tone: 'mint',
  },
]

function AboutMatcha() {
  return (
    <main className="about-matcha-page">
      <Header />

      <section className="about-hero">
        <div className="about-hero-grid">
          <div className="about-portrait-card">
            <div className="portrait-surface">
              <div className="portrait-photo" />
            </div>
          </div>

          <div className="about-intro-card">
            <h1 className="about-kicker">Xin chào,</h1>
            <h1>Đây là Matcha.</h1>
            <p>
              Chúng tôi tạo ra một không gian nơi mọi ý tưởng chụp ảnh đều có thể
              được kết nối với đúng ekip thực hiện, đúng phong cách và đúng năng
              lượng mà bạn đang tìm kiếm.
            </p>
            <p>
              Từ ảnh cá nhân, gia đình, cặp đôi đến sự kiện, Matcha mong muốn
              biến từng khoảnh khắc thành một trải nghiệm được chuẩn bị chỉn chu
              và giàu cảm xúc.
            </p>
           
          </div>
        </div>

        <div className="about-quote">
          <span className="quote-mark">”</span>
          <p>Matcha - Your Moments, Our Passion!</p>
        </div>
      </section>

      <section className="about-story">
        <h2>Chuyện của Matcha</h2>
        <div className="story-grid">
          <article className="story-copy">
            <p>
              Matcha bắt đầu như một nỗ lực nhỏ nhằm làm cho việc đặt lịch chụp
              trở nên đơn giản hơn. Không chỉ là tìm một nhiếp ảnh gia, mà là tìm
              được người thật sự hiểu câu chuyện bạn muốn kể.
            </p>
            <p>
              Chúng tôi tin rằng một buổi chụp đẹp không chỉ đến từ máy ảnh tốt,
              mà còn đến từ cách ekip làm bạn thấy thoải mái, tự tin và được là
              chính mình trong từng khung hình.
            </p>
            <p>
              Vì vậy Matcha tập trung xây dựng một trải nghiệm mượt mà: chọn
              concept, ghép ekip, xem dịch vụ, đặt lịch và nhận tư vấn nhanh trong
              cùng một nơi.
            </p>
          </article>

          <div className="story-photo-card">
            <div className="story-photo" />
          </div>
        </div>
      </section>

  
      <Footer />
    </main>
  )
}

export default AboutMatcha
