import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useStore } from './store/useStore'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import Home from './pages/Home'
import SellDevice from './pages/SellDevice'
import MyRequests from './pages/MyRequests'
import RequestDetail from './pages/RequestDetail'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Register from './pages/Register'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import AboutUs from './pages/AboutUs'
import DeleteAccount from './pages/DeleteAccount'

function ProtectedRoute({ children }) {
  const { isAuthenticated, checkAuth } = useStore()
  const [isChecking, setIsChecking] = useState(true)
  const location = useLocation()

  useEffect(() => {
    checkAuth().finally(() => setIsChecking(false))
  }, [checkAuth])

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  
  return children
}

// Redirect component for old admin/agent URLs to proper subdomains
function ExternalRedirect({ to }) {
  useEffect(() => {
    window.location.href = to
  }, [to])
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/delete-account" element={<DeleteAccount />} />
        
        {/* Redirect old admin/agent URLs to proper subdomains */}
        <Route path="/infra-control/*" element={<ExternalRedirect to="https://control.buybackelite.com" />} />
        <Route path="/field-tech/*" element={<ExternalRedirect to="https://field.buybackelite.com" />} />
        
        {/* Protected Routes - Login required */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="sell" element={<SellDevice />} />
          <Route path="requests" element={<MyRequests />} />
          <Route path="requests/:id" element={<RequestDetail />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        
        {/* Legacy route redirects */}
        <Route path="/sell" element={<Navigate to="/dashboard/sell" replace />} />
        <Route path="/requests" element={<Navigate to="/dashboard/requests" replace />} />
        <Route path="/profile" element={<Navigate to="/dashboard/profile" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
