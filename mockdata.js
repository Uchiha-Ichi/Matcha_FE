// src/mocks/mockData.js

// 1. Roles
export const mockRoles = [
  { id: 1, name: 'Admin', description: 'Quản trị hệ thống toàn diện' },
  { id: 2, name: 'Partner', description: 'Nhà cung cấp dịch vụ (Thợ ảnh, Makeup, Studio)' },
  { id: 3, name: 'Customer', description: 'Khách hàng sử dụng dịch vụ' },
];

// 2. Categories
export const mockCategories = [
  { id: 1, name: 'Nhiếp ảnh', description: 'Chụp ngoại cảnh, sự kiện, phóng sự', is_active: 1, icon_src: 'camera.svg' },
  { id: 2, name: 'Makeup', description: 'Trang điểm chuyên nghiệp', is_active: 1, icon_src: 'brush.svg' },
  { id: 3, name: 'Studio', description: 'Phòng chụp chuyên dụng', is_active: 1, icon_src: 'home.svg' },
  { id: 4, name: 'Cho thuê đồ', description: 'Váy cưới, cổ phục, vest', is_active: 1, icon_src: 'shirt.svg' },
];

// 3. Concepts
export const mockConcepts = [
  { id: 1, name: 'Kỷ yếu', description: 'Lưu giữ kỷ niệm học sinh', is_active: 1 },
  { id: 2, name: 'Nàng thơ', description: 'Phong cách nhẹ nhàng, trong trẻo', is_active: 1 },
  { id: 3, name: 'Cưới hỏi', description: 'Phóng sự cưới, ảnh cổng', is_active: 1 },
  { id: 4, name: 'Street Style', description: 'Phong cách đường phố năng động', is_active: 1 },
  { id: 5, name: 'High Fashion', description: 'Thời trang cao cấp, tạp chí', is_active: 1 },
];

// 4. Users
export const mockUsers = [
  { id: 1, full_name: 'Hoàng Admin', email: 'admin@system.com', phone: '0900000001', role_id: 1, is_active: 1, avatar_src: 'https://i.pravatar.cc/150?u=1' },
  { id: 2, full_name: 'Minh Nhiếp Ảnh', email: 'minhphoto@gmail.com', phone: '0988888881', role_id: 2, is_active: 1, avatar_src: 'https://i.pravatar.cc/150?u=2' },
  { id: 3, full_name: 'Lan Makeup', email: 'lanmake@gmail.com', phone: '0988888882', role_id: 2, is_active: 1, avatar_src: 'https://i.pravatar.cc/150?u=3' },
  { id: 4, full_name: 'Khách Hàng A', email: 'userA@gmail.com', phone: '0911111111', role_id: 3, is_active: 1, avatar_src: 'https://i.pravatar.cc/150?u=4' },
  { id: 5, full_name: 'Khách Hàng B', email: 'userB@gmail.com', phone: '0911111112', role_id: 3, is_active: 1, avatar_src: 'https://i.pravatar.cc/150?u=5' },
  { id: 6, full_name: 'Khách Hàng C', email: 'userC@gmail.com', phone: '0911111113', role_id: 3, is_active: 1, avatar_src: 'https://i.pravatar.cc/150?u=6' },
];

// 5. Partners
export const mockPartners = [
  {
    id: 1,
    user_id: 2,
    categories_id: 1,
    band_name: 'Minh Lens Studio',
    description: 'Chuyên trị các dòng ảnh street style và nghệ thuật.',
    location_gps: 'POINT(21.0285 105.8542)',
    is_active: 1,
    cover_image: 'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?w=800',
    location_name: 'Hoàn Kiếm, Hà Nội',
  },
  {
    id: 2,
    user_id: 3,
    categories_id: 2,
    band_name: 'Lan Beauty',
    description: 'Tận tâm trong từng nét cọ, giúp bạn tỏa sáng nhất.',
    location_gps: 'POINT(10.7626 106.6602)',
    is_active: 1,
    cover_image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800',
    location_name: 'Quận 1, TP.HCM',
  }
];

// 6. Partner Concepts
export const mockPartnerConcepts = [
  { id: 1, partner_id: 1, concept_id: 1, price: 1200000, time: '3h', image_des: 'ky-yeu.jpg' },
  { id: 2, partner_id: 1, concept_id: 4, price: 900000, time: '2h', image_des: 'street.jpg' },
  { id: 3, partner_id: 1, concept_id: 5, price: 3000000, time: '5h', image_des: 'fashion.jpg' },
  { id: 4, partner_id: 2, concept_id: 2, price: 500000, time: '1.5h', image_des: 'muae.jpg' },
  { id: 5, partner_id: 2, concept_id: 3, price: 2500000, time: '4h', image_des: 'wedding.jpg' },
];

// 7. Date Blocks
export const mockDateBlocks = [
  { id: 1, partner_id: 1, date_block: '2026-04-15 00:00:00' },
  { id: 2, partner_id: 1, date_block: '2026-04-20 00:00:00' },
  { id: 3, partner_id: 2, date_block: '2026-05-01 00:00:00' },
];

// 8. Promotions
export const mockPromotions = [
  { id: 1, code: 'NEWBIE', description: 'Giảm 50k cho đơn đầu', discount_percentage: 0, discount_amount: 50000, max_discount: 50000, expired_at: '2026-12-31', is_active: 1 },
  { id: 2, code: 'HE2026', description: 'Giảm 15% mùa hè', discount_percentage: 15, discount_amount: 0, max_discount: 500000, expired_at: '2026-07-31', is_active: 1 },
];

// 9. Bookings
export const mockBookings = [
  { id: 1, user_id: 4, partner_id: 1, promotion_id: 2, price: 1200000, price_discount: 180000, status: 'completed', price_deposit: 300000, booking_time: '2026-04-10 09:00:00', remaining_amount: 720000 },
  { id: 2, user_id: 5, partner_id: 2, promotion_id: null, price: 500000, price_discount: 0, status: 'confirmed', price_deposit: 100000, booking_time: '2026-04-12 14:00:00', remaining_amount: 400000 },
  { id: 3, user_id: 6, partner_id: 1, promotion_id: 1, price: 900000, price_discount: 50000, status: 'pending', price_deposit: 0, booking_time: '2026-04-18 10:00:00', remaining_amount: 850000 },
];

// 10. Booking Details
export const mockBookingDetails = [
  { id: 1, booking_id: 1, partner_concept_id: 1, price: 1200000 },
  { id: 2, booking_id: 2, partner_concept_id: 4, price: 500000 },
  { id: 3, booking_id: 3, partner_concept_id: 2, price: 900000 },
];

// 11. Payments
export const mockPayments = [
  { id: 1, booking_id: 1, status: 'paid' },
  { id: 2, booking_id: 2, status: 'partially_paid' },
  { id: 3, booking_id: 3, status: 'unpaid' },
];

// 12. Feedbacks
export const mockFeedbacks = [
  { id: 1, user_id: 4, booking_detail_id: 1, description: 'Ảnh rất đẹp, thợ nhiệt tình!', image: 'feedback1.jpg', status: 'visible' },
  { id: 2, user_id: 5, booking_detail_id: 2, description: 'Makeup tự nhiên, mình rất thích.', image: null, status: 'visible' },
];

// 13. Conversations
export const mockConversations = [
  { id: 1, user_id: 4, partner_id: 1, booking_id: 1, last_message: 'Hẹn gặp bạn vào sáng mai nhé!', updated_at: '2026-04-09 20:00:00' },
  { id: 2, user_id: 5, partner_id: 2, booking_id: 2, last_message: 'Bạn có cần chuẩn bị gì không?', updated_at: '2026-04-11 10:00:00' },
];

// 14. Messages
export const mockMessages = [
  { id: 1, conversation_id: 1, user_id: 4, type: 'text', content: 'Chào bạn, mình muốn hỏi về gói kỷ yếu.', is_read: 1 },
  { id: 2, conversation_id: 1, user_id: 2, type: 'text', content: 'Chào bạn, gói này bên mình bao gồm...', is_read: 1 },
  { id: 3, conversation_id: 1, user_id: 2, type: 'image', content: 'sample-photo.jpg', is_read: 1 },
  { id: 4, conversation_id: 2, user_id: 5, type: 'text', content: 'Địa chỉ studio ở đâu vậy ạ?', is_read: 0 },
];

// 15. Notifications
export const mockNotifications = [
  { id: 1, booking_id: 1, user_id: 4, name: 'Thanh toán thành công', description: 'Bạn đã hoàn tất thanh toán cho đơn hàng #1', status: 'read', time: '2026-04-10 12:00:00' },
  { id: 2, booking_id: 2, user_id: 5, name: 'Nhắc lịch hẹn', description: 'Bạn có lịch makeup vào 14:00 ngày mai', status: 'unread', time: '2026-04-11 08:00:00' },
  { id: 3, booking_id: 3, user_id: 2, name: 'Đơn hàng mới', description: 'Khách hàng C vừa đặt lịch chụp Street Style', status: 'unread', time: '2026-04-12 15:00:00' },
];