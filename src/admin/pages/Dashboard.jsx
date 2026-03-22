import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  IndianRupee,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'

export default function Dashboard() {
  const { stats, fetchStats, requests, fetchRequests, fraudAlerts, fetchFraudAlerts, selectRequest } = useStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchStats()
    fetchRequests()
    fetchFraudAlerts()
  }, [])

  const recentRequests = requests.slice(0, 5)

  const statCards = [
    {
      title: 'Total Requests',
      value: stats.totalRequests,
      icon: ShoppingBag,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Pending Review',
      value: stats.pendingRequests,
      icon: Clock,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Completed',
      value: stats.completedRequests,
      icon: CheckCircle,
      color: 'bg-green-500',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Value',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: IndianRupee,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50'
    }
  ]

  const getStatusBadge = (status) => {
    const styles = {
      Pending: 'bg-yellow-100 text-yellow-700',
      Reviewing: 'bg-blue-100 text-blue-700',
      Counter_Offered: 'bg-purple-100 text-purple-700',
      Customer_Countered: 'bg-indigo-100 text-indigo-700',
      Offer_Accepted: 'bg-green-100 text-green-700',
      Seller_Confirmed: 'bg-teal-100 text-teal-700',
      Pickup_Scheduled: 'bg-indigo-100 text-indigo-700',
      Agent_Assigned: 'bg-cyan-100 text-cyan-700',
      Agent_En_Route: 'bg-cyan-100 text-cyan-700',
      Agent_Arrived: 'bg-teal-100 text-teal-700',
      Picked_Up: 'bg-sky-100 text-sky-700',
      Completed: 'bg-emerald-100 text-emerald-700',
      Rejected: 'bg-red-100 text-red-700',
      Cancelled: 'bg-gray-100 text-gray-700'
    }
    return styles[status] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((stat) => (
          <div key={stat.title} className="bg-white rounded-xl border border-gray-200 p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">{stat.title}</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">{stat.value}</p>
              </div>
              <div className={`w-9 h-9 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Requests */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-sm text-gray-900">Recent Requests</h2>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </div>
          <div className="divide-y divide-gray-100">
            {recentRequests.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No requests yet
              </div>
            ) : (
              recentRequests.map((request) => (
                <div 
                  key={request.id} 
                  className="px-4 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => { selectRequest(request); navigate('/infra-control/requests') }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <ShoppingBag className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          {request.model_name || request.device_type}
                        </p>
                        <p className="text-xs text-gray-500">
                          {request.users?.phone || 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadge(request.status)}`}>
                        {request.status?.replace(/_/g, ' ')}
                      </span>
                      <p className="text-xs font-bold text-gray-900 mt-0.5">
                        ₹{(request.system_estimated_price || request.user_expected_price || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Fraud Alerts */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-sm text-gray-900">Fraud Alerts</h2>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="divide-y divide-gray-100">
            {fraudAlerts.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-1" />
                <p className="text-xs">No active alerts</p>
              </div>
            ) : (
              fraudAlerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="px-3 py-2.5">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-900">{alert.alert_type?.replace(/_/g, ' ')}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{alert.alert_message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
