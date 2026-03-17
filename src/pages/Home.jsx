import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { 
  Laptop, Tablet, ArrowRight, Shield, Zap, IndianRupee, 
  TrendingUp, Clock, CheckCircle2, Star
} from 'lucide-react'

export default function Home() {
  const { user, userProfile, sellRequests, fetchUserRequests, fetchPriceEngine, fetchConditionDeductions, setDeviceType, resetSellFlow } = useStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchUserRequests()
    fetchPriceEngine()
    fetchConditionDeductions()
  }, [])

  const displayName = userProfile?.name || user?.user_metadata?.name || 'there'
  const pendingCount = sellRequests.filter(r => ['Pending', 'Reviewing'].includes(r.status)).length
  const activeCount = sellRequests.filter(r => !['Completed', 'Rejected', 'Cancelled'].includes(r.status)).length
  const completedCount = sellRequests.filter(r => r.status === 'Completed').length

  const handleSellDevice = (type) => {
    resetSellFlow()
    setDeviceType(type)
    navigate('/dashboard/sell')
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
      {/* Welcome Banner - Compact */}
      <div className="gradient-bg rounded-xl p-4 sm:p-5 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <h1 className="text-lg sm:text-xl font-bold mb-1">
            Hello, {displayName}!
          </h1>
          <p className="text-white/80 text-xs sm:text-sm mb-3 max-w-md">
            Get the best price for your Apple device with transparent pricing.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleSellDevice('MacBook')}
              className="flex items-center gap-1.5 bg-white text-primary-700 px-3 py-2 rounded-lg font-semibold text-sm hover:bg-white/90 transition-colors"
            >
              <Laptop className="w-3.5 h-3.5" />
              Sell MacBook
            </button>
            <button
              onClick={() => handleSellDevice('iPad')}
              className="flex items-center gap-1.5 bg-white/20 text-white px-3 py-2 rounded-lg font-semibold text-sm hover:bg-white/30 transition-colors"
            >
              <Tablet className="w-3.5 h-3.5" />
              Sell iPad
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards - Compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{sellRequests.length}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{pendingCount}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{activeCount}</p>
              <p className="text-xs text-gray-500">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{completedCount}</p>
              <p className="text-xs text-gray-500">Done</p>
            </div>
          </div>
        </div>
      </div>

      {/* Device Cards - Compact */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">Choose Your Device</h2>
        <div className="grid grid-cols-2 gap-3">
          {/* MacBook Card */}
          <div
            onClick={() => handleSellDevice('MacBook')}
            className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all cursor-pointer"
          >
            <div className="h-24 sm:h-28 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center relative">
              <Laptop className="w-12 h-12 sm:w-14 sm:h-14 text-white/80" />
            </div>
            <div className="p-3">
              <h3 className="text-sm font-bold text-gray-900">Sell MacBook</h3>
              <p className="text-xs text-gray-500 mb-2">Air, Pro & more</p>
              <div className="flex items-center gap-1 text-primary-600 font-semibold text-xs">
                Get Price <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* iPad Card */}
          <div
            onClick={() => handleSellDevice('iPad')}
            className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all cursor-pointer"
          >
            <div className="h-24 sm:h-28 bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center relative">
              <Tablet className="w-12 h-12 sm:w-14 sm:h-14 text-white/80" />
            </div>
            <div className="p-3">
              <h3 className="text-sm font-bold text-gray-900">Sell iPad</h3>
              <p className="text-xs text-gray-500 mb-2">Air, Pro, Mini & more</p>
              <div className="flex items-center gap-1 text-emerald-600 font-semibold text-xs">
                Get Price <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose Us - Compact */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">Why BuyBack Elite?</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="bg-white rounded-lg p-3 border border-gray-200 flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
              <IndianRupee className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-xs">Best Prices</h3>
              <p className="text-[10px] text-gray-500">Top buyback rates</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200 flex items-center gap-2.5">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-xs">Safe & Secure</h3>
              <p className="text-[10px] text-gray-500">Data protected</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200 flex items-center gap-2.5">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-xs">Quick Process</h3>
              <p className="text-[10px] text-gray-500">Fast payment</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200 flex items-center gap-2.5">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center shrink-0">
              <Star className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-xs">Transparent</h3>
              <p className="text-[10px] text-gray-500">Clear pricing</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Requests */}
      {sellRequests.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Recent Requests</h2>
            <button
              onClick={() => navigate('/dashboard/requests')}
              className="text-sm text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2">
            {sellRequests.slice(0, 3).map((req) => (
              <div
                key={req.id}
                onClick={() => navigate(`/dashboard/requests/${req.id}`)}
                className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-sm transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    req.device_type === 'MacBook' ? 'bg-indigo-100' : 'bg-emerald-100'
                  }`}>
                    {req.device_type === 'MacBook'
                      ? <Laptop className="w-4 h-4 text-indigo-600" />
                      : <Tablet className="w-4 h-4 text-emerald-600" />
                    }
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-xs">{req.model_name || req.device_type}</p>
                    <p className="text-[10px] text-gray-500">
                      {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 text-xs">
                    ₹{(req.admin_offer_price || req.system_estimated_price || 0).toLocaleString('en-IN')}
                  </p>
                  <StatusBadge status={req.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ClipboardList(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>
    </svg>
  )
}

function StatusBadge({ status }) {
  const config = {
    'Pending': { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Pending' },
    'Reviewing': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Reviewing' },
    'Counter_Offered': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Offer Received' },
    'Customer_Countered': { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Counter Sent' },
    'Offer_Accepted': { bg: 'bg-green-100', text: 'text-green-700', label: 'Accepted' },
    'Seller_Confirmed': { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Confirmed' },
    'Agent_Assigned': { bg: 'bg-cyan-100', text: 'text-cyan-700', label: 'Agent Assigned' },
    'Pickup_Scheduled': { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Pickup Scheduled' },
    'Completed': { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
    'Rejected': { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
    'Cancelled': { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Cancelled' },
  }
  const c = config[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  )
}
