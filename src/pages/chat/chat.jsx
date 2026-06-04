import { useMemo, useState } from 'react'
import Header from '../../components/Header.jsx'
import './chat.css'

const conversations = [
  {
    id: 1,
    name: 'Minh Lens Studio',
    role: 'Nhiếp ảnh',
    status: 'Đang online',
    lastMessage: 'Mình gửi bạn moodboard trước buổi chụp nhé.',
    time: '20:08',
    unread: 2,
    avatar: 'https://i.pravatar.cc/120?u=chat-minh-lens',
    booking: 'Gói chụp nàng thơ ngoài trời',
    messages: [
      {
        id: 1,
        from: 'partner',
        text: 'Chào bạn, mình đã nhận được ý tưởng nàng thơ ở Hồ Tây rồi nhé.',
        time: '19:42',
      },
      {
        id: 2,
        from: 'me',
        text: 'Mình muốn tone ảnh nhẹ, hơi vintage và ưu tiên ánh hoàng hôn.',
        time: '19:45',
      },
      {
        id: 3,
        from: 'partner',
        text: 'Hợp lắm. Mình đề xuất chụp từ 16:30, chuẩn bị váy trắng hoặc be sẽ lên màu rất đẹp.',
        time: '19:48',
      },
      {
        id: 4,
        from: 'partner',
        text: 'Mình gửi bạn moodboard trước buổi chụp nhé.',
        time: '20:08',
      },
    ],
  },
  {
    id: 2,
    name: 'Lan Beauty',
    role: 'Makeup Artist',
    status: 'Trả lời trong vài phút',
    lastMessage: 'Tone makeup trong trẻo sẽ hợp concept này.',
    time: '18:21',
    unread: 0,
    avatar: 'https://i.pravatar.cc/120?u=chat-lan-beauty',
    booking: 'Makeup tone trong trẻo',
    messages: [
      {
        id: 1,
        from: 'partner',
        text: 'Tone makeup trong trẻo sẽ hợp concept này.',
        time: '18:21',
      },
      {
        id: 2,
        from: 'me',
        text: 'Bạn có thể dùng son màu hồng đất nhẹ được không?',
        time: '18:24',
      },
    ],
  },
  {
    id: 3,
    name: 'Matcha Support',
    role: 'Hỗ trợ',
    status: 'Luôn sẵn sàng',
    lastMessage: 'Bạn cần mình hỗ trợ ghép ekip không?',
    time: 'Hôm qua',
    unread: 0,
    avatar: 'https://i.pravatar.cc/120?u=chat-matcha-support',
    booking: 'Tư vấn đặt lịch',
    messages: [
      {
        id: 1,
        from: 'partner',
        text: 'Bạn cần mình hỗ trợ ghép ekip không?',
        time: 'Hôm qua',
      },
    ],
  },
]

const navigate = (event, path) => {
  event.preventDefault()

  if (window.location.pathname === path) {
    return
  }

  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function Chat() {
  const [activeConversationId, setActiveConversationId] = useState(conversations[0].id)
  const [draft, setDraft] = useState('')
  const [localMessages, setLocalMessages] = useState({})

  const activeConversation = conversations.find((item) => item.id === activeConversationId)

  const messages = useMemo(() => {
    if (!activeConversation) return []
    return [
      ...activeConversation.messages,
      ...(localMessages[activeConversation.id] ?? []),
    ]
  }, [activeConversation, localMessages])

  const handleSend = (event) => {
    event.preventDefault()

    const cleanDraft = draft.trim()
    if (!cleanDraft || !activeConversation) return

    const now = new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date())

    setLocalMessages((current) => ({
      ...current,
      [activeConversation.id]: [
        ...(current[activeConversation.id] ?? []),
        {
          id: `${activeConversation.id}-${Date.now()}`,
          from: 'me',
          text: cleanDraft,
          time: now,
        },
      ],
    }))
    setDraft('')
  }

  return (
    <main className="chat-page">
      <Header />

      <section className="chat-shell">
        <aside className="chat-sidebar">
          <div className="chat-sidebar__heading">
            <div>
              <span>Tin nhắn</span>
              <h1>Chat</h1>
            </div>
            <a
              className="chat-sidebar__back"
              href="/"
              aria-label="Về trang chủ"
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

          <label className="chat-search">
            <span aria-hidden="true">⌕</span>
            <input type="text" placeholder="Tìm studio, makeup, hỗ trợ..." />
          </label>

          <div className="chat-conversation-list">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                className={`chat-conversation ${
                  conversation.id === activeConversationId ? 'chat-conversation--active' : ''
                }`}
                onClick={() => setActiveConversationId(conversation.id)}
              >
                <img src={conversation.avatar} alt={conversation.name} />
                <div>
                  <strong>{conversation.name}</strong>
                  <p>{conversation.lastMessage}</p>
                </div>
                <span>{conversation.time}</span>
                {conversation.unread > 0 && <em>{conversation.unread}</em>}
              </button>
            ))}
          </div>
        </aside>

        {activeConversation && (
          <section className="chat-panel">
            <header className="chat-panel__header">
              <div className="chat-panel__profile">
                <img src={activeConversation.avatar} alt={activeConversation.name} />
                <div>
                  <h2>{activeConversation.name}</h2>
                  <p>
                    {activeConversation.role} · {activeConversation.status}
                  </p>
                </div>
              </div>

              <div className="chat-panel__tools">
                <button type="button" aria-label="Gọi thoại">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M8 5.5 10.2 10l-1.5 1.2c1 2 2.6 3.6 4.6 4.6l1.2-1.5L19 16.5v2.1c0 1-.8 1.8-1.8 1.7C9.6 19.8 4.2 14.4 3.7 6.8 3.6 5.8 4.4 5 5.4 5H8Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button type="button" aria-label="Thông tin đặt lịch">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 11v5m0-8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </header>

            <div className="chat-booking-strip">
              <span>Đang trao đổi về</span>
              <strong>{activeConversation.booking}</strong>
              <a href="/service-detail" onClick={(event) => navigate(event, '/service-detail')}>
                Xem dịch vụ
              </a>
            </div>

            <div className="chat-messages">
              <div className="chat-day-divider">Hôm nay</div>
              {messages.map((message) => (
                <article
                  key={message.id}
                  className={`chat-bubble ${
                    message.from === 'me' ? 'chat-bubble--me' : 'chat-bubble--partner'
                  }`}
                >
                  <p>{message.text}</p>
                  <span>{message.time}</span>
                </article>
              ))}
            </div>

            <form className="chat-composer" onSubmit={handleSend}>
              <button type="button" aria-label="Đính kèm ảnh">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 14.5 13.6 7a3.2 3.2 0 0 1 4.5 4.5l-8.2 8.2a4.6 4.6 0 0 1-6.5-6.5l8.4-8.4"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <input
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Nhập tin nhắn..."
              />
              <button className="chat-composer__send" type="submit" aria-label="Gửi tin nhắn">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="m5 12 14-7-4 14-3-5-7-2Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </form>
          </section>
        )}
      </section>
    </main>
  )
}

export default Chat
