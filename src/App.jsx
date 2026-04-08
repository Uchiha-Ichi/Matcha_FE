import { useEffect, useState } from 'react'
import AboutMatcha from './pages/about_matcha/about_matcha.jsx'
import Homepage from './pages/homepage/homepage.jsx'

const getCurrentRoute = () => {
  const hash = window.location.hash || '#/'
  return hash.replace(/^#/, '') || '/'
}

function App() {
  const [route, setRoute] = useState(getCurrentRoute)

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(getCurrentRoute())
      window.scrollTo({ top: 0, behavior: 'auto' })
    }

    if (!window.location.hash) {
      window.location.hash = '#/'
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  if (route === '/about-matcha') {
    return <AboutMatcha />
  }

  return <Homepage />
}

export default App
