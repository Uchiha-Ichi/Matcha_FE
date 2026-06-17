/**
 * Trích xuất tên Tỉnh/Thành phố từ chuỗi địa chỉ chi tiết ở Việt Nam.
 * Trả về dạng ngắn gọn như "Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng",...
 */
export const extractCityOrProvince = (address) => {
  if (!address) return 'Việt Nam'

  const cities = [
    'Hồ Chí Minh', 'Sài Gòn', 'Hà Nội', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
    'Bình Dương', 'Đồng Nai', 'Khánh Hòa', 'Lâm Đồng', 'Quảng Nam',
    'Bà Rịa - Vũng Tàu', 'Thừa Thiên Huế', 'Huế', 'Nha Trang', 'Đà Lạt',
    'Vũng Tàu', 'Quy Nhơn', 'Hội An', 'Buôn Ma Thuột', 'Vinh',
    'Biên Hòa', 'Thủ Dầu Một'
  ]

  for (const city of cities) {
    if (address.toLowerCase().includes(city.toLowerCase())) {
      if (city === 'Hồ Chí Minh' || city === 'Sài Gòn') return 'TP. Hồ Chí Minh'
      return city
    }
  }

  // Fallback thông minh: Dựa vào tên Phường/Quận đặc trưng để nhận diện Hà Nội hoặc TP.HCM
  const lower = address.toLowerCase()
  const hnKeywords = [
    'nam từ liêm', 'bắc từ liêm', 'cầu giấy', 'đại mỗ', 'mỹ đình',
    'hoàn kiếm', 'đống đa', 'ba đình', 'hai bà trưng', 'tây hồ',
    'thanh xuân', 'hà đông', 'thanh trì', 'gia lâm', 'long biên'
  ]
  const hcmKeywords = [
    'quận 1', 'quận 3', 'quận 4', 'quận 5', 'quận 7', 'quận 10',
    'bình thạnh', 'thủ đức', 'tân bình', 'gò vấp', 'phú nhuận',
    'tân phú', 'bình tân', 'nhà bè', 'hóc môn'
  ]

  if (hnKeywords.some(kw => lower.includes(kw))) {
    return 'Hà Nội'
  }
  if (hcmKeywords.some(kw => lower.includes(kw))) {
    return 'TP. Hồ Chí Minh'
  }

  // Fallback cuối: Split dấu phẩy, lấy phần gần cuối
  const parts = address.split(',').map(p => p.trim())
  if (parts.length >= 2) {
    const last = parts[parts.length - 1]
    if (last.toLowerCase() === 'việt nam' && parts.length >= 3) {
      return parts[parts.length - 2]
    }
    return last
  }

  return address
}
