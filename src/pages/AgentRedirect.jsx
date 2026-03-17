import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'

export default function AgentRedirect() {
  const navigate = useNavigate()
  const { user, isAuthenticated, checkAuth } = useStore()

  useEffect(() => {
    const checkAgentAccess = async () => {
      await checkAuth()
      
      // Check if user is authenticated
      if (!isAuthenticated) {
        navigate('/login')
        return
      }

      // Redirect to agent panel URL (localhost for now, update for production)
      const agentUrl = import.meta.env.VITE_AGENT_PANEL_URL || 'http://localhost:3002'
      window.location.href = agentUrl
    }

    checkAgentAccess()
  }, [isAuthenticated, navigate, checkAuth])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to Agent Panel...</p>
      </div>
    </div>
  )
}
