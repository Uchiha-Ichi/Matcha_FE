import { useMemo, useState } from 'react'
import Footer from '../../components/Footer.jsx'
import Header from '../../components/Header.jsx'
import './cart.css'

const initialCartItems = [
  {
    id: 1,
    serviceName: 'Gói chụp nàng thơ ngoài trời',
    partnerName: 'Minh Lens Studio',
    category: 'Nhiếp ảnh',
    location: 'Hoàn Kiếm, Hà Nội',
    schedule: '20/04/2026 - 09:00',
    duration: '3 giờ',
    price: 1200000,
    quantity: 1,
    selected: true,
    image:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 2,
    serviceName: 'Makeup tone trong trẻo',
    partnerName: 'Lan Beauty',
    category: 'Makeup',
    location: 'Quận 1, TP.HCM',
    schedule: '22/04/2026 - 14:00',
    duration: '1.5 giờ',
    price: 500000,
    quantity: 1,
    selected: true,
    image:
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 3,
    serviceName: 'Concept street style',
    partnerName: 'Minh Lens Studio',
    category: 'Nhiếp ảnh',
    location: 'Hoàn Kiếm, Hà Nội',
    schedule: '25/04/2026 - 16:00',
    duration: '2 giờ',
    price: 900000,
    quantity: 1,
    selected: false,
    image:
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
  },
]

const formatPrice = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

const navigate = (event, path) => {
  event.preventDefault()

  if (window.location.pathname === path) {
    return
  }

  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function Cart() {
  const [cartItems, setCartItems] = useState(initialCartItems)
  const [note, setNote] = useState('')

  const selectedItems = cartItems.filter((item) => item.selected)
  const allSelected = cartItems.length > 0 && selectedItems.length === cartItems.length

  const subtotal = useMemo(
    () =>
      selectedItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      ),
    [selectedItems],
  )
  const deposit = Math.round(subtotal * 0.3)
  const remaining = subtotal - deposit

  const toggleItem = (itemId) => {
    setCartItems((items) =>
      items.map((item) =>
        item.id === itemId ? { ...item, selected: !item.selected } : item,
      ),
    )
  }

  const toggleAll = () => {
    setCartItems((items) =>
      items.map((item) => ({ ...item, selected: !allSelected })),
    )
  }

  const updateQuantity = (itemId, direction) => {
    setCartItems((items) =>
      items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity: Math.max(1, item.quantity + direction),
            }
          : item,
      ),
    )
  }

  const removeItem = (itemId) => {
    setCartItems((items) => items.filter((item) => item.id !== itemId))
  }

  return (
    <main className="cart-page">
      <Header />

      <section className="cart-hero">
        <div className="cart-hero__overlay" />
        <img
          src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1600&q=80"
          alt="Matcha cart cover"
          className="cart-hero__image"
        />
        <div className="cart-hero__content">
          <span className="cart-hero__badge">MATCHA CART</span>
          <h1>Giỏ hàng</h1>
          <p>Chọn các dịch vụ bạn muốn đặt lịch và kiểm tra tổng chi phí trước khi thanh toán.</p>
        </div>
      </section>

      <section className="cart-layout">
        <div className="cart-main">
          <div className="cart-toolbar">
            <label className="cart-check">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                disabled={cartItems.length === 0}
              />
              <span>Chọn tất cả</span>
            </label>
            <p>{selectedItems.length} dịch vụ đang được chọn</p>
          </div>

          {cartItems.length === 0 ? (
            <section className="cart-empty">
              <h2>Giỏ hàng đang trống</h2>
              <p>Hãy quay lại trang chủ để chọn thêm dịch vụ phù hợp với ý tưởng chụp ảnh của bạn.</p>
              <a href="/" onClick={(event) => navigate(event, '/')}>
                Khám phá dịch vụ
              </a>
            </section>
          ) : (
            <div className="cart-list">
              {cartItems.map((item) => (
                <article key={item.id} className="cart-item">
                  <label className="cart-item__select" aria-label={`Chon ${item.serviceName}`}>
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={() => toggleItem(item.id)}
                    />
                  </label>

                  <img src={item.image} alt={item.serviceName} className="cart-item__image" />

                  <div className="cart-item__body">
                    <div className="cart-item__heading">
                      <div>
                        <span className="cart-item__tag">{item.category}</span>
                        <h2>{item.serviceName}</h2>
                        <p>{item.partnerName}</p>
                      </div>
                      <strong>{formatPrice(item.price)}</strong>
                    </div>

                    <div className="cart-item__meta">
                      <span>{item.location}</span>
                      <span>{item.schedule}</span>
                      <span>{item.duration}</span>
                    </div>

                    <div className="cart-item__actions">
                      <div className="cart-stepper" aria-label="So luong">
                        <button type="button" onClick={() => updateQuantity(item.id, -1)}>
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item.id, 1)}>
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        className="cart-remove"
                        onClick={() => removeItem(item.id)}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="cart-summary">
          <h2>Tổng quan đơn hàng</h2>

          <dl className="cart-summary__list">
            <div>
              <dt>Dịch vụ đã chọn</dt>
              <dd>{selectedItems.length}</dd>
            </div>
            <div>
              <dt>Tạm tính</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div>
              <dt>Đặt cọc 30%</dt>
              <dd>{formatPrice(deposit)}</dd>
            </div>
            <div>
              <dt>Còn lại</dt>
              <dd>{formatPrice(remaining)}</dd>
            </div>
          </dl>

          <label className="cart-note">
            <span>Ghi chú cho ekip</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="VD: Mình muốn chụp tone nhẹ, ưu tiên ảnh tự nhiên..."
            />
          </label>

          <button className="cart-checkout" type="button" disabled={selectedItems.length === 0}>
            Tiếp tục đặt lịch
          </button>
          <a className="cart-continue" href="/" onClick={(event) => navigate(event, '/')}>
            Chọn thêm dịch vụ
          </a>
        </aside>
      </section>

      <Footer />
    </main>
  )
}

export default Cart
