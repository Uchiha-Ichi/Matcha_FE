import { useEffect, useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import AboutMatcha from './pages/about_matcha/about_matcha.jsx'
import AdminDashboard from './pages/admin_dashboard/admin_dashboard.jsx'
import AiIdeaResult from './pages/ai_idea_result/ai_idea_result.jsx'
import Cart from './pages/cart/cart.jsx'
import Chat from './pages/chat/chat.jsx'
import ForgotPassword from './pages/forgot_password/forgot_password.jsx'
import Homepage from './pages/homepage/homepage.jsx'
import InfoPage from './pages/info_pages/info_page.jsx'
import Login from './pages/login/login.jsx'
import OrderHistory from './pages/order_history/order_history.jsx'
import PartnerBookings from './pages/partner_bookings/partner_bookings.jsx'
import PartnerDashboard from './pages/partner_dashboard/partner_dashboard.jsx'
import PartnerSchedule from './pages/partner_schedule/partner_schedule.jsx'
import PartnerServices from './pages/partner_services/partner_services.jsx'
import PartnerServiceDetail from './pages/partner_service_detail/partner_service_detail.jsx'
import PartnerSetup from './pages/partner_setup/partner_setup.jsx'
import Profile from './pages/profile/profile.jsx'
import ServiceDetail from './pages/service_detail/service_detail.jsx'
import AccessDenied from './pages/access_denied/access_denied.jsx'
import { getAuthUser } from './utils/auth.js'

const getCurrentRoute = () => window.location.pathname || '/'

function extractServiceDetailSlugOrId(path) {
  const match = path.match(/^\/service-detail\/([^/]+)$/)
  return match ? match[1] : null
}

function extractBookingId(path) {
  const match = path.match(/^\/bookings\/(\d+)$/)
  return match ? Number(match[1]) : null
}

function extractPartnerServiceDetailId(path) {
  const match = path.match(/^\/partner-services\/(\d+)$/)
  return match ? Number(match[1]) : null
}

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

  const authUser = getAuthUser()
  const isLoggedIn = !!authUser
  const userRole = authUser?.role

  if (route === '/about-matcha') {
    return (
      <>
        <AboutMatcha />
        <Analytics />
      </>
    )
  }

  if (route === '/terms-of-service') {
    return (
      <>
        <InfoPage type="terms" />
        <Analytics />
      </>
    )
  }

  if (route === '/privacy-policy') {
    return (
      <>
        <InfoPage type="privacy" />
        <Analytics />
      </>
    )
  }

  if (route === '/photo-process') {
    return (
      <>
        <InfoPage type="process" />
        <Analytics />
      </>
    )
  }

  if (route === '/login') {
    return (
      <>
        <Login />
        <Analytics />
      </>
    )
  }

  if (route === '/forgot-password') {
    return (
      <>
        <ForgotPassword />
        <Analytics />
      </>
    )
  }

  const serviceDetailParam = extractServiceDetailSlugOrId(route)
  if (serviceDetailParam !== null) {
    return (
      <>
        <ServiceDetail partnerConceptId={serviceDetailParam} />
        <Analytics />
      </>
    )
  }
  if (route === '/service-detail') {
    return (
      <>
        <ServiceDetail />
        <Analytics />
      </>
    )
  }

  if (route === '/cart') {
    return (
      <>
        <Cart />
        <Analytics />
      </>
    )
  }

  if (route === '/ai-idea') {
    return (
      <>
        <AiIdeaResult />
        <Analytics />
      </>
    )
  }

  if (route === '/chat') {
    if (!isLoggedIn) return (
      <>
        <Login closeHref="/chat" />
        <Analytics />
      </>
    )
    return (
      <>
        <Chat />
        <Analytics />
      </>
    )
  }

  const bookingId = extractBookingId(route)
  if (bookingId !== null) {
    if (!isLoggedIn) return (
      <>
        <Login closeHref={`/bookings/${bookingId}`} />
        <Analytics />
      </>
    )
    return (
      <>
        <OrderHistory bookingId={bookingId} />
        <Analytics />
      </>
    )
  }

  if (route === '/order-history') {
    if (!isLoggedIn) return (
      <>
        <Login closeHref="/order-history" />
        <Analytics />
      </>
    )
    return (
      <>
        <OrderHistory />
        <Analytics />
      </>
    )
  }

  if (route === '/profile') {
    if (!isLoggedIn) return (
      <>
        <Login closeHref="/profile" />
        <Analytics />
      </>
    )
    return (
      <>
        <Profile />
        <Analytics />
      </>
    )
  }

  if (route === '/partner-setup') {
    if (!isLoggedIn) return (
      <>
        <Login closeHref="/partner-setup" />
        <Analytics />
      </>
    )
    return (
      <>
        <PartnerSetup />
        <Analytics />
      </>
    )
  }

  if (route === '/partner-dashboard') {
    if (!isLoggedIn) return (
      <>
        <Login closeHref="/partner-dashboard" />
        <Analytics />
      </>
    )
    if (userRole !== 'Partner') return (
      <>
        <AccessDenied requiredRole="Đối tác (Partner)" />
        <Analytics />
      </>
    )
    return (
      <>
        <PartnerDashboard />
        <Analytics />
      </>
    )
  }

  if (route === '/partner-bookings') {
    if (!isLoggedIn) return (
      <>
        <Login closeHref="/partner-bookings" />
        <Analytics />
      </>
    )
    if (userRole !== 'Partner') return (
      <>
        <AccessDenied requiredRole="Đối tác (Partner)" />
        <Analytics />
      </>
    )
    return (
      <>
        <PartnerBookings />
        <Analytics />
      </>
    )
  }

  const partnerServiceDetailId = extractPartnerServiceDetailId(route)
  if (partnerServiceDetailId !== null) {
    if (!isLoggedIn) return (
      <>
        <Login closeHref={`/partner-services/${partnerServiceDetailId}`} />
        <Analytics />
      </>
    )
    if (userRole !== 'Partner') return (
      <>
        <AccessDenied requiredRole="Đối tác (Partner)" />
        <Analytics />
      </>
    )
    return (
      <>
        <PartnerServiceDetail partnerConceptId={partnerServiceDetailId} />
        <Analytics />
      </>
    )
  }

  if (route === '/partner-services') {
    if (!isLoggedIn) return (
      <>
        <Login closeHref="/partner-services" />
        <Analytics />
      </>
    )
    if (userRole !== 'Partner') return (
      <>
        <AccessDenied requiredRole="Đối tác (Partner)" />
        <Analytics />
      </>
    )
    return (
      <>
        <PartnerServices />
        <Analytics />
      </>
    )
  }

  if (route === '/partner-schedule') {
    if (!isLoggedIn) return (
      <>
        <Login closeHref="/partner-schedule" />
        <Analytics />
      </>
    )
    if (userRole !== 'Partner') return (
      <>
        <AccessDenied requiredRole="Đối tác (Partner)" />
        <Analytics />
      </>
    )
    return (
      <>
        <PartnerSchedule />
        <Analytics />
      </>
    )
  }

  if (route === '/admin-dashboard') {
    if (!isLoggedIn) return (
      <>
        <Login closeHref="/admin-dashboard" />
        <Analytics />
      </>
    )
    if (userRole !== 'Admin') return (
      <>
        <AccessDenied requiredRole="Quản trị viên (Admin)" />
        <Analytics />
      </>
    )
    return (
      <>
        <AdminDashboard />
        <Analytics />
      </>
    )
  }

  return (
    <>
      <Homepage />
      <Analytics />
    </>
  )
}

export default App
