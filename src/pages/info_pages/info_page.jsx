import Header from '../../components/Header.jsx'
import Footer from '../../components/Footer.jsx'
import './info_page.css'

const pages = {
  terms: {
    eyebrow: 'ĐIỀU KHOẢN DỊCH VỤ',
    title: 'Điều khoản dịch vụ',
    intro:
      'Các điều khoản này giúp Matcha, khách hàng và partner phối hợp rõ ràng khi đặt lịch, thanh toán và sử dụng dịch vụ chụp hình.',
    sections: [
      {
        title: '1. Phạm vi dịch vụ',
        body: 'Matcha là nền tảng kết nối khách hàng với studio, nhiếp ảnh gia, makeup artist và các partner cung cấp concept chụp hình. Thông tin dịch vụ, giá, thời lượng và lịch trống được hiển thị để khách hàng tham khảo trước khi đặt lịch.',
      },
      {
        title: '2. Đặt lịch và thanh toán',
        body: 'Khách hàng cần cung cấp thông tin chính xác khi đặt lịch. Một số dịch vụ có thể yêu cầu đặt cọc hoặc thanh toán trước. Lịch hẹn chỉ được xác nhận khi hệ thống hoặc partner xác nhận trạng thái đơn.',
      },
      {
        title: '3. Thay đổi hoặc hủy lịch',
        body: 'Việc đổi lịch hoặc hủy lịch cần được thực hiện sớm để partner có thể sắp xếp lại nhân sự, địa điểm và concept. Các khoản phí phát sinh, nếu có, sẽ phụ thuộc vào chính sách của từng dịch vụ.',
      },
      {
        title: '4. Trách nhiệm của người dùng',
        body: 'Người dùng không được cung cấp thông tin giả, lạm dụng hệ thống, đặt lịch ảo hoặc thực hiện hành vi ảnh hưởng đến trải nghiệm của khách hàng và partner khác.',
      },
    ],
  },
  privacy: {
    eyebrow: 'CHÍNH SÁCH BẢO MẬT',
    title: 'Chính sách bảo mật',
    intro:
      'Matcha tôn trọng quyền riêng tư của người dùng và chỉ sử dụng dữ liệu cá nhân để vận hành dịch vụ đặt lịch, thanh toán và chăm sóc khách hàng.',
    sections: [
      {
        title: '1. Thông tin được thu thập',
        body: 'Matcha có thể thu thập họ tên, email, số điện thoại, ảnh đại diện, lịch đặt dịch vụ, thông tin thanh toán và nội dung trao đổi cần thiết để xử lý đơn hàng.',
      },
      {
        title: '2. Mục đích sử dụng',
        body: 'Dữ liệu được dùng để xác thực tài khoản, tạo và quản lý đơn đặt lịch, hỗ trợ thanh toán, gửi thông báo liên quan đến dịch vụ và cải thiện trải nghiệm sử dụng nền tảng.',
      },
      {
        title: '3. Chia sẻ dữ liệu',
        body: 'Thông tin cần thiết của đơn đặt lịch có thể được chia sẻ với partner phụ trách dịch vụ. Matcha không bán thông tin cá nhân của người dùng cho bên thứ ba.',
      },
      {
        title: '4. Bảo vệ dữ liệu',
        body: 'Matcha áp dụng các biện pháp kỹ thuật phù hợp để hạn chế truy cập trái phép, mất mát hoặc thay đổi dữ liệu. Người dùng nên bảo mật tài khoản và không chia sẻ mật khẩu cho người khác.',
      },
    ],
  },
  process: {
    eyebrow: 'QUY TRÌNH CHỤP HÌNH',
    title: 'Quy trình chụp hình',
    intro:
      'Quy trình này giúp khách hàng hình dung rõ các bước từ chọn concept đến nhận sản phẩm cuối cùng.',
    sections: [
      {
        title: '1. Chọn concept và dịch vụ',
        body: 'Khách hàng xem các concept, studio, makeup, nhiếp ảnh và thông tin giá trên Matcha để chọn gói phù hợp với nhu cầu.',
      },
      {
        title: '2. Đặt lịch và xác nhận',
        body: 'Sau khi chọn dịch vụ, khách hàng gửi yêu cầu đặt lịch. Partner kiểm tra lịch trống, xác nhận đơn và trao đổi thêm nếu cần chuẩn bị trang phục, địa điểm hoặc phụ kiện.',
      },
      {
        title: '3. Thanh toán',
        body: 'Khách hàng thực hiện thanh toán hoặc đặt cọc theo yêu cầu của dịch vụ. Khi thanh toán thành công, trạng thái đơn được cập nhật để partner chuẩn bị buổi chụp.',
      },
      {
        title: '4. Thực hiện buổi chụp',
        body: 'Khách hàng đến đúng thời gian đã hẹn. Ekip sẽ hỗ trợ setup, makeup, hướng dẫn tạo dáng và thực hiện chụp theo concept đã thống nhất.',
      },
      {
        title: '5. Bàn giao kết quả',
        body: 'Sau buổi chụp, partner xử lý hậu kỳ theo gói dịch vụ và gửi link kết quả cho khách hàng khi hoàn tất.',
      },
    ],
  },
}

function InfoPage({ type }) {
  const content = pages[type] ?? pages.terms

  return (
    <main className="info-page">
      <Header />
      <section className="info-hero">
        <div>
          <span>{content.eyebrow}</span>
          <h1>{content.title}</h1>
          <p>{content.intro}</p>
        </div>
      </section>

      <section className="info-content">
        {content.sections.map((section) => (
          <article key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </article>
        ))}
      </section>
      <Footer />
    </main>
  )
}

export default InfoPage
