import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'

export default function AdminRedirect() {
  const navigate = useNavigate()
  const { user, isAuthenticated, checkAuth } = useStore()

  useEffect(() => {
    const checkAdminAccess = async () => {
      await checkAuth()
      
      // Check if user is authenticated and is admin
      if (!isAuthenticated) {
        navigate('/login')
        return
      }

      // Redirect to admin panel URL (localhost for now, update for production)
      const adminUrl = import.meta.env.VITE_ADMIN_PANEL_URL || 'http://localhost:3000'
      window.location.href = adminUrl
    }

    checkAdminAccess()
  }, [isAuthenticated, navigate, checkAuth])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to Admin Panel...</p>
      </div>
    </div>
  )
}
