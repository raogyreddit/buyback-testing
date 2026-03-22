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

// Admin Panel imports
import { useStore as useAdminStore } from './admin/store/useStore'
import AdminLayout from './admin/components/Layout'
import AdminLogin from './admin/pages/Login'
import AdminDashboard from './admin/pages/Dashboard'
import AdminRequests from './admin/pages/Requests'
import AdminPriceEngine from './admin/pages/PriceEngine'
import AdminConditionDeductions from './admin/pages/ConditionDeductions'
import AdminFraudAlerts from './admin/pages/FraudAlerts'

// Agent Panel imports
import { useStore as useAgentStore } from './agent/store/useStore'
import AgentLayout from './agent/components/Layout'
import AgentLogin from './agent/pages/Login'
import AgentDashboard from './agent/pages/Dashboard'
import AgentPickups from './agent/pages/Pickups'
import AgentPickupDetail from './agent/pages/PickupDetail'
import AgentHistory from './agent/pages/History'
import AgentProfile from './agent/pages/Profile'

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

// Admin Protected Route - uses admin store
function AdminProtectedRoute({ children }) {
  const { isAuthenticated, checkAuth } = useAdminStore()
  const [isChecking, setIsChecking] = useState(true)
  const location = useLocation()

  useEffect(() => {
    console.log('[AdminProtectedRoute] Checking auth...')
    checkAuth()
      .then(result => console.log('[AdminProtectedRoute] checkAuth result:', result))
      .finally(() => setIsChecking(false))
  }, [checkAuth])

  console.log('[AdminProtectedRoute] isChecking:', isChecking, 'isAuthenticated:', isAuthenticated)

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Admin...</p>
        </div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    console.log('[AdminProtectedRoute] Not authenticated, redirecting to /infra-control/login')
    return <Navigate to="/infra-control/login" state={{ from: location }} replace />
  }
  
  return children
}

// Agent Protected Route - uses agent store
function AgentProtectedRoute({ children }) {
  const { isAuthenticated, checkAuth } = useAgentStore()
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
    return <Navigate to="/field-tech/login" state={{ from: location }} replace />
  }
  
  return children
}

function App() {
  // Debug logging
  useEffect(() => {
    console.log('App component mounted')
    console.log('Environment variables:')
    console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
    console.log('VITE_APP_URL:', import.meta.env.VITE_APP_URL)
  }, [])

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
        
        {/* Admin Panel Routes - All under /infra-control */}
        <Route path="/infra-control">
          {/* Public admin login */}
          <Route path="login" element={<AdminLogin />} />
          {/* Protected admin routes */}
          <Route
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="requests" element={<AdminRequests />} />
            <Route path="price-engine" element={<AdminPriceEngine />} />
            <Route path="condition-deductions" element={<AdminConditionDeductions />} />
            <Route path="fraud-alerts" element={<AdminFraudAlerts />} />
          </Route>
        </Route>
        
        {/* Agent Panel Routes - All under /field-tech */}
        <Route path="/field-tech">
          {/* Public agent login */}
          <Route path="login" element={<AgentLogin />} />
          {/* Protected agent routes */}
          <Route
            element={
              <AgentProtectedRoute>
                <AgentLayout />
              </AgentProtectedRoute>
            }
          >
            <Route index element={<AgentDashboard />} />
            <Route path="pickups" element={<AgentPickups />} />
            <Route path="pickups/:id" element={<AgentPickupDetail />} />
            <Route path="history" element={<AgentHistory />} />
            <Route path="profile" element={<AgentProfile />} />
          </Route>
        </Route>
        
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
