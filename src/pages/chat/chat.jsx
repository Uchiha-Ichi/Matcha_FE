import { useEffect, useMemo, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import { SOCKET_URL } from '../../utils/config.js'
import Header from '../../components/Header.jsx'
import { getAuthUser } from '../../utils/auth.js'
import { getMyPartner } from '../../utils/api.js'
import { PartnerDashboardHeader } from '../partner_dashboard/partner_dashboard.jsx'
import './chat.css'

const navigate = (event, path) => {
  event.preventDefault()

  if (window.location.pathname === path) {
    return
  }

  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function Chat() {
  const authUser = getAuthUser()
  const authUserId = authUser?.id
  const socketRef = useRef(null)
  const messagesEndRef = useRef(null)

  const [conversations, setConversations] = useState([])
  const [activeConversationId, setActiveConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [connected, setConnected] = useState(false)
  const [loadingConv, setLoadingConv] = useState(true)
  const [loadingMsg, setLoadingMsg] = useState(false)
  const [partner, setPartner] = useState(null)

  useEffect(() => {
    if (authUser?.role?.toLowerCase() === 'partner') {
      getMyPartner().then(setPartner).catch(console.error)
    }
  }, [authUserId, authUser?.role])

  // Đọc state redirect từ OrderHistory hoặc ServiceDetail
  const redirectState = useMemo(() => {
    try {
      return window.history.state || null
    } catch {
      return null
    }
  }, [])

  const activeConversationIdRef = useRef(activeConversationId)

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId
  }, [activeConversationId])

  // 1. Kết nối Socket.io
  useEffect(() => {
    if (!authUserId) {
      window.history.pushState({}, '', '/login')
      window.dispatchEvent(new PopStateEvent('popstate'))
      return
    }

    setLoadingConv(true)
    // Dev: kết nối về cùng origin qua Vite proxy (SOCKET_URL = undefined)
    // Production: kết nối thẳng tới Railway backend
    const socketTarget = SOCKET_URL ? `${SOCKET_URL}/chat` : '/chat'
    const socket = io(socketTarget, {
      transports: ['websocket'],
      withCredentials: true,
      auth: {
        token: authUser?.accessToken
      }
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      console.log('[Chat] Connected to server socket successfully')

      // Nếu có redirectState chuyển từ trang khác sang (muốn tạo/tìm room chat)
      if (redirectState && (redirectState.partnerId || redirectState.userId)) {
        console.log('[Chat] Creating or getting conversation. Partner ID:', redirectState.partnerId, 'User ID:', redirectState.userId)
        socket.emit('create_conversation', {
          partner_id: redirectState.partnerId ? Number(redirectState.partnerId) : undefined,
          user_id: redirectState.userId ? Number(redirectState.userId) : undefined,
          booking_id: redirectState.bookingId ? Number(redirectState.bookingId) : undefined
        })
      } else {
        // Lấy danh sách hội thoại
        console.log('[Chat] Getting conversations list')
        socket.emit('get_conversations')
      }
    })

    socket.on('disconnect', (reason) => {
      setConnected(false)
      console.warn('[Chat] Disconnected from socket server:', reason)
    })

    socket.on('connect_error', (error) => {
      console.error('[Chat] Socket connection error:', error)
    })

    socket.on('exception', (error) => {
      console.error('[Chat] Socket exception from server:', error)
    })

    // Nhận danh sách conversations
    socket.on('conversations_list', (data) => {
      console.log('[Chat] Received conversations_list payload:', data)
      if (!data) {
        console.warn('[Chat] conversations_list received null/undefined data')
        setLoadingConv(false)
        return
      }
      const convs = data.conversations || []
      setConversations(convs)
      setLoadingConv(false)

      const currentActiveId = activeConversationIdRef.current
      if (convs.length > 0 && !currentActiveId && (!redirectState || (!redirectState.partnerId && !redirectState.userId))) {
        setActiveConversationId(convs[0].id)
      }
    })

    // Nhận conversation vừa tạo
    socket.on('conversation_ready', (data) => {
      console.log('[Chat] Received conversation_ready payload:', data)
      if (!data) {
        console.warn('[Chat] conversation_ready received null/undefined data')
        setLoadingConv(false)
        return
      }
      const newConv = data.conversation
      if (newConv) {
        setConversations(prev => {
          const filtered = prev.filter(c => c.id !== newConv.id)
          return [newConv, ...filtered]
        })
        setActiveConversationId(newConv.id)
      }
      setLoadingConv(false)
      // Clear state so reload doesn't trigger creation again
      window.history.replaceState(null, '')
    })

    // Nhận lịch sử tin nhắn
    socket.on('messages_history', (data) => {
      console.log('[Chat] Received messages_history payload:', data)
      if (!data) {
        console.warn('[Chat] messages_history received null/undefined data')
        setLoadingMsg(false)
        return
      }
      // Vì tin nhắn trả về order desc (mới nhất trước), ta reverse để render từ cũ -> mới
      const history = [...(data.messages || [])].reverse()
      setMessages(history)
      setLoadingMsg(false)
    })

    // Nhận tin nhắn mới
    socket.on('new_message', (message) => {
      console.log('[Chat] Received new_message payload:', message)
      if (!message) return
      const currentActiveId = activeConversationIdRef.current
      const isIncoming = message.user?.id !== authUserId
      if (message.conversation_id === currentActiveId) {
        setMessages(prev => [...prev, message])
        // Tự động mark read
        if (isIncoming) {
          socket.emit('mark_read', { conversation_id: currentActiveId })
          window.dispatchEvent(new CustomEvent('matcha-chat-unread-change'))
        }
      }
      if (message.conversation_id !== currentActiveId && isIncoming) {
        window.dispatchEvent(new CustomEvent('matcha-chat-unread-change'))
      }

      // Cập nhật last message trong danh sách conversations
      setConversations(prev => {
        return prev.map(c => {
          if (c.id === message.conversation_id) {
            return {
              ...c,
              last_message: message.content,
              updated_at: new Date().toISOString(),
              unread_count: isIncoming && message.conversation_id !== currentActiveId
                ? Number(c.unread_count ?? 0) + 1
                : Number(c.unread_count ?? 0),
            }
          }
          return c
        }).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      })
    })

    socket.on('messages_read', (payload) => {
      if (!payload?.conversation_id) return

      setMessages(prev => prev.map((message) => {
        if (message.conversation_id !== payload.conversation_id || message.user?.id === payload.user_id) {
          return message
        }
        return { ...message, is_read: true }
      }))

      setConversations(prev => prev.map((conversation) => (
        conversation.id === payload.conversation_id && payload.user_id === authUserId
          ? { ...conversation, unread_count: 0 }
          : conversation
      )))

      window.dispatchEvent(new CustomEvent('matcha-chat-unread-change'))
    })

    return () => {
      console.log('[Chat] Cleaning up socket connection')
      socket.disconnect()
    }
  }, [authUserId])

  const activeConversation = useMemo(() => {
    return conversations.find((item) => item.id === activeConversationId)
  }, [conversations, activeConversationId])

  // 2. Khi activeConversationId thay đổi -> Join room & Lấy tin nhắn
  useEffect(() => {
    if (!socketRef.current || !activeConversationId) return

    setLoadingMsg(true)
    const socket = socketRef.current

    // Join room mới
    socket.emit('join_room', { conversation_id: activeConversationId })
    // Lấy tin nhắn
    socket.emit('get_messages', { conversation_id: activeConversationId, page: 1 })
    // Đánh dấu đã đọc
    socket.emit('mark_read', { conversation_id: activeConversationId })
    setConversations(prev => prev.map((conversation) => (
      conversation.id === activeConversationId ? { ...conversation, unread_count: 0 } : conversation
    )))
    window.dispatchEvent(new CustomEvent('matcha-chat-unread-change'))

    return () => {
      // Rời room cũ
      socket.emit('leave_room', { conversation_id: activeConversationId })
    }
  }, [activeConversationId])

  // Tự động cuộn xuống cuối danh sách tin nhắn khi có cập nhật
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
  }, [messages])

  // 3. Gửi tin nhắn
  const handleSend = (event) => {
    event.preventDefault()

    const cleanDraft = draft.trim()
    if (!cleanDraft || !activeConversationId || !socketRef.current) return

    socketRef.current.emit('send_message', {
      conversation_id: activeConversationId,
      content: cleanDraft,
      type: 'text'
    })

    setDraft('')
  }

  // Phân tích thông tin hiển thị của đối phương trong conversation
  const getPartnerDisplay = (conv) => {
    if (!conv) return { name: 'Người dùng', avatar: 'https://i.pravatar.cc/120', role: '—' }
    
    // Nếu user hiện tại là customer, hiển thị đối tác (partner) và ngược lại
    const isCurrentUserCustomer = authUser?.role?.toLowerCase() !== 'partner'
    
    if (isCurrentUserCustomer) {
      const partner = conv.partner || {}
      const user = partner.user || {}
      return {
        name: partner.band_name || user.full_name || 'Matcha Partner',
        avatar: user.avatar_src || `https://i.pravatar.cc/120?u=partner-${partner.id}`,
        role: 'Ekip Matcha'
      }
    } else {
      const client = conv.user || {}
      return {
        name: client.full_name || client.email || 'Khách hàng',
        avatar: client.avatar_src || `https://i.pravatar.cc/120?u=client-${client.id}`,
        role: 'Khách hàng'
      }
    }
  }

  if (!authUser) return null

  return (
    <main className="chat-page">
      {authUser?.role?.toLowerCase() === 'partner' ? (
        <PartnerDashboardHeader partner={partner} activePath="/chat" />
      ) : (
        <Header />
      )}

      <section className="chat-shell">
        <aside className="chat-sidebar">
          <div className="chat-sidebar__heading">
            <div>
              <span>Tin nhắn</span>
              <h1>Chat {connected ? '' : '(Mất kết nối)'}</h1>
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
            <input type="text" placeholder="Tìm kiếm hội thoại..." />
          </label>

          <div className="chat-conversation-list">
            {loadingConv ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#6f6257' }}>
                Đang tải danh sách hội thoại...
              </div>
            ) : conversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#6f6257', fontSize: '14px' }}>
                Chưa có hội thoại nào. Bạn có thể nhắn tin bằng cách click "Nhắn ekip" ở đơn đặt lịch.
              </div>
            ) : (
              conversations.map((conversation) => {
                const partner = getPartnerDisplay(conversation)
                const unreadCount = Number(conversation.unread_count ?? 0)
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    className={`chat-conversation ${
                      conversation.id === activeConversationId ? 'chat-conversation--active' : ''
                    }`}
                    onClick={() => setActiveConversationId(conversation.id)}
                  >
                    <img src={partner.avatar} alt={partner.name} />
                    <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <strong>{partner.name}</strong>
                        {conversation.booking && (
                          <span style={{
                            fontSize: '10px',
                            background: '#f2eae1',
                            color: '#b24b2a',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            fontWeight: '600'
                          }}>
                            MTC-{String(conversation.booking.id).padStart(5, '0')}
                          </span>
                        )}
                      </div>
                      {conversation.booking?.details?.[0]?.partner_concept?.concept?.name && (
                        <div style={{
                          fontSize: '11px',
                          color: '#8c7e74',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '180px',
                          marginTop: '2px',
                          marginBottom: '2px'
                        }}>
                          Dịch vụ: {conversation.booking.details[0].partner_concept.concept.name}
                        </div>
                      )}
                      <p style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '180px'
                      }}>
                        {conversation.last_message || 'Chưa có tin nhắn'}
                      </p>
                    </div>
                    <span>
                      {conversation.updated_at
                        ? new Date(conversation.updated_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </span>
                    {unreadCount > 0 && <em>{unreadCount > 9 ? '9+' : unreadCount}</em>}
                  </button>
                )
              })
            )}
          </div>
        </aside>

        {activeConversation ? (
          <section className="chat-panel">
            <header className="chat-panel__header">
              <div className="chat-panel__profile">
                <img
                  src={getPartnerDisplay(activeConversation).avatar}
                  alt={getPartnerDisplay(activeConversation).name}
                />
                <div>
                  <h2>{getPartnerDisplay(activeConversation).name}</h2>
                  <p>
                    {getPartnerDisplay(activeConversation).role} · Đang hoạt động
                  </p>
                </div>
              </div>
            </header>

            {(activeConversation.booking || (redirectState?.serviceName && (activeConversation.partner?.id === Number(redirectState.partnerId) || activeConversation.partner_id === Number(redirectState.partnerId)))) && (
              <div className="chat-booking-strip">
                <span>Đang trao đổi về</span>
                <strong>
                  {activeConversation.booking?.details?.[0]?.partner_concept?.concept?.name || 
                   redirectState.serviceName}
                </strong>
                {activeConversation.booking ? (
                  <a
                    href={authUser?.role?.toLowerCase() === 'partner' ? '/partner-bookings' : '/order-history'}
                    onClick={(event) => navigate(event, authUser?.role?.toLowerCase() === 'partner' ? '/partner-bookings' : '/order-history')}
                  >
                    Xem đơn hàng
                  </a>
                ) : (
                  <a
                    href={`/services/${redirectState.partnerConceptId}`}
                    onClick={(event) => navigate(event, `/services/${redirectState.partnerConceptId}`)}
                  >
                    Xem dịch vụ
                  </a>
                )}
              </div>
            )}

            <div className="chat-messages">
              {loadingMsg ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#6f6257' }}>
                  Đang tải tin nhắn...
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6f6257', fontSize: '14px' }}>
                  Bắt đầu cuộc trò chuyện. Hãy gửi tin nhắn đầu tiên!
                </div>
              ) : (
                <>
                  {messages.map((message) => {
                    const isMe = message.user?.id === authUser.id
                    const messageTime = new Date(message.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                    return (
                      <article
                        key={message.id}
                        className={`chat-bubble ${isMe ? 'chat-bubble--me' : 'chat-bubble--partner'}`}
                      >
                        <p>{message.content}</p>
                        <span>
                          {messageTime}
                          {isMe && (
                            <strong className="chat-read-state">
                              {message.is_read ? 'Đã đọc' : 'Chưa đọc'}
                            </strong>
                          )}
                        </span>
                      </article>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
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
        ) : (
          <section className="chat-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6f6257' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>💬</span>
              <h3>Không có cuộc hội thoại nào đang mở</h3>
              <p style={{ fontSize: '14px', marginTop: '8px' }}>Chọn một hội thoại ở bên trái để bắt đầu nhắn tin.</p>
            </div>
          </section>
        )}
      </section>
    </main>
  )
}

export default Chat
