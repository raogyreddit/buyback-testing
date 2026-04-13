import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import {
  Package, Clock, Navigation, CheckCircle2, IndianRupee,
  ArrowRight, Laptop, Tablet, MapPin, Phone, RefreshCw
} from 'lucide-react'

export default function Dashboard() {
  const { agent, assignedPickups, stats, fetchAssignedPickups, isLoading } = useStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchAssignedPickups()
  }, [])

  const displayName = agent?.name || agent?.email?.split('@')[0] || 'Agent'

  // Get urgent pickups (scheduled for today or overdue)
  const today = new Date().toDateString()
  const urgentPickups = assignedPickups.filter(p => {
    if (!p.pickup_scheduled_time) return false
    const pickupDate = new Date(p.pickup_scheduled_time).toDateString()
    return pickupDate === today || new Date(p.pickup_scheduled_time) < new Date()
  })

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Welcome Banner - Compact */}
      <div className="gradient-agent rounded-xl p-4 text-white relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">
              Hello, {displayName}!
            </h1>
            <p className="text-white/80 text-xs">
              <span className="font-bold">{assignedPickups.length}</span> active pickups
            </p>
          </div>
          <button
            onClick={() => fetchAssignedPickups()}
            disabled={isLoading}
            className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-lg text-sm hover:bg-white/30 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards - Compact */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
        <StatCard
          icon={Clock}
          label="Pending"
          value={stats.pending}
          color="orange"
          onClick={() => navigate('/field-tech/pickups')}
        />
        <StatCard
          icon={Navigation}
          label="En Route"
          value={stats.enRoute}
          color="blue"
          onClick={() => navigate('/field-tech/pickups')}
        />
        <StatCard
          icon={MapPin}
          label="Arrived"
          value={stats.arrived}
          color="purple"
          onClick={() => navigate('/field-tech/pickups')}
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={stats.completed}
          color="green"
          onClick={() => navigate('/field-tech/history')}
        />
        <StatCard
          icon={IndianRupee}
          label="Earnings"
          value={`₹${stats.totalEarnings.toLocaleString('en-IN')}`}
          color="emerald"
          className="col-span-2 lg:col-span-1"
        />
      </div>

      {/* Urgent Pickups */}
      {urgentPickups.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              Today's Pickups
            </h2>
            <button
              onClick={() => navigate('/field-tech/pickups')}
              className="text-sm text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2">
            {urgentPickups.slice(0, 3).map((pickup) => (
              <PickupCard key={pickup.id} pickup={pickup} onClick={() => navigate(`/field-tech/pickups/${pickup.id}`)} />
            ))}
          </div>
        </div>
      )}

      {/* All Active Pickups */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">Active Pickups</h2>
          <button
            onClick={() => navigate('/field-tech/pickups')}
            className="text-sm text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        {assignedPickups.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900 text-sm mb-1">No Active Pickups</h3>
            <p className="text-xs text-gray-500">No pickups assigned yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {assignedPickups.slice(0, 5).map((pickup) => (
              <PickupCard key={pickup.id} pickup={pickup} onClick={() => navigate(`/field-tech/pickups/${pickup.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, onClick, className = '' }) {
  const colors = {
    orange: 'bg-orange-100 text-orange-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    emerald: 'bg-emerald-100 text-emerald-600',
  }

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg p-3 border border-gray-200 hover:shadow-sm transition-all ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900">{value}</p>
          <p className="text-[10px] text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  )
}

function PickupCard({ pickup, onClick }) {
  const user = pickup.users || {}
  const isMac = pickup.device_type === 'MacBook'

  const statusConfig = {
    'Pickup_Scheduled': { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Scheduled' },
    'Offer_Accepted': { bg: 'bg-green-100', text: 'text-green-700', label: 'Ready' },
    'Agent_Assigned': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Assigned' },
    'Agent_En_Route': { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'En Route' },
    'Agent_Arrived': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Arrived' },
    'Picked_Up': { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Picked Up' },
  }
  const status = statusConfig[pickup.status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: pickup.status }

  const formatTime = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm hover:border-primary-200 transition-all cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center ${
          isMac ? 'bg-indigo-100' : 'bg-emerald-100'
        }`}>
          {isMac ? <Laptop className="w-4 h-4 text-indigo-600" /> : <Tablet className="w-4 h-4 text-emerald-600" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-gray-900 text-xs truncate">
              {pickup.model_name || pickup.device_type}
            </h3>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${status.bg} ${status.text}`}>
              {status.label}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-[10px] text-gray-500 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {formatTime(pickup.pickup_scheduled_time)}
            </p>
            <p className="font-semibold text-xs text-gray-900">
              ₹{(pickup.final_price || pickup.admin_offer_price || pickup.system_estimated_price || 0).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
