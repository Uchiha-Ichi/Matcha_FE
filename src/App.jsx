import { useEffect, useState } from 'react'
import AboutMatcha from './pages/about_matcha/about_matcha.jsx'
import AiIdeaResult from './pages/ai_idea_result/ai_idea_result.jsx'
import Cart from './pages/cart/cart.jsx'
import Chat from './pages/chat/chat.jsx'
import ForgotPassword from './pages/forgot_password/forgot_password.jsx'
import Homepage from './pages/homepage/homepage.jsx'
import Login from './pages/login/login.jsx'
import OrderHistory from './pages/order_history/order_history.jsx'
import Profile from './pages/profile/profile.jsx'
import ServiceDetail from './pages/service_detail/service_detail.jsx'

const getCurrentRoute = () => window.location.pathname || '/'

function App() {
  const [route, setRoute] = useState(getCurrentRoute)

  useEffect(() => {
    const handleRouteChange = () => {
      setRoute(getCurrentRoute())
      window.scrollTo({ top: 0, behavior: 'auto' })
    }

    window.addEventListener('popstate', handleRouteChange)
    return () => window.removeEventListener('popstate', handleRouteChange)
  }, [])

  if (route === '/about-matcha') {
    return <AboutMatcha />
  }

  if (route === '/login') {
    return <Login />
  }

  if (route === '/forgot-password') {
    return <ForgotPassword />
  }

  if (route === '/service-detail') {
    return <ServiceDetail />
  }

  if (route === '/cart') {
    return <Cart />
  }

  if (route === '/ai-idea') {
    return <AiIdeaResult />
  }

  if (route === '/chat') {
    return <Chat />
  }

  if (route === '/order-history') {
    return <OrderHistory />
  }

  if (route === '/profile') {
    return <Profile />
  }

  return <Homepage />
}

export default App
