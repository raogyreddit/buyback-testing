import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { 
  Laptop, Tablet, ArrowRight, Shield, Zap, IndianRupee, 
  TrendingUp, Clock, CheckCircle2, Star, ClipboardList
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
    <div className="space-y-5">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700" />
        <div className="absolute inset-0 noise-overlay" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10 p-5 sm:p-6">
          <h1 className="text-lg sm:text-xl font-extrabold text-white mb-1">
            Hello, {displayName}! 👋
          </h1>
          <p className="text-white/60 text-sm mb-4 max-w-md">
            Get the best price for your Apple device. Transparent pricing, instant payment.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <button onClick={() => handleSellDevice('MacBook')}
              className="flex items-center gap-2 bg-white text-indigo-700 px-4 py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg hover:-translate-y-0.5 transition-all">
              <Laptop className="w-4 h-4" /> Sell MacBook
            </button>
            <button onClick={() => handleSellDevice('iPad')}
              className="flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white border border-white/20 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-white/25 transition-all">
              <Tablet className="w-4 h-4" /> Sell iPad
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: ClipboardList, label: 'Total', value: sellRequests.length, color: 'bg-blue-50 text-blue-600' },
          { icon: Clock, label: 'Pending', value: pendingCount, color: 'bg-amber-50 text-amber-600' },
          { icon: TrendingUp, label: 'Active', value: activeCount, color: 'bg-purple-50 text-purple-600' },
          { icon: CheckCircle2, label: 'Done', value: completedCount, color: 'bg-emerald-50 text-emerald-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-3.5 border border-gray-100 card-hover">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xl font-extrabold text-gray-900">{stat.value}</p>
                <p className="text-[11px] text-gray-400 font-medium">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Device Cards */}
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-3">Choose Your Device</h2>
        <div className="grid grid-cols-2 gap-3">
          <div onClick={() => handleSellDevice('MacBook')}
            className="group bg-white rounded-2xl border border-gray-100 overflow-hidden card-hover cursor-pointer">
            <div className="h-24 sm:h-28 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
              <Laptop className="w-12 h-12 sm:w-14 sm:h-14 text-white/80 relative z-10" />
            </div>
            <div className="p-3.5">
              <h3 className="text-sm font-bold text-gray-900">Sell MacBook</h3>
              <p className="text-[11px] text-gray-400 mb-2">Air, Pro & more</p>
              <div className="flex items-center gap-1 text-indigo-600 font-semibold text-xs">
                Get Price <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
          <div onClick={() => handleSellDevice('iPad')}
            className="group bg-white rounded-2xl border border-gray-100 overflow-hidden card-hover cursor-pointer">
            <div className="h-24 sm:h-28 bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
              <Tablet className="w-12 h-12 sm:w-14 sm:h-14 text-white/80 relative z-10" />
            </div>
            <div className="p-3.5">
              <h3 className="text-sm font-bold text-gray-900">Sell iPad</h3>
              <p className="text-[11px] text-gray-400 mb-2">Air, Pro, Mini & more</p>
              <div className="flex items-center gap-1 text-emerald-600 font-semibold text-xs">
                Get Price <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose Us */}
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-3">Why BuyBack Elite?</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {[
            { icon: IndianRupee, title: 'Best Prices', sub: 'Top buyback rates', color: 'bg-indigo-50 text-indigo-600' },
            { icon: Shield, title: 'Safe & Secure', sub: 'Data protected', color: 'bg-emerald-50 text-emerald-600' },
            { icon: Zap, title: 'Quick Process', sub: 'Fast payment', color: 'bg-amber-50 text-amber-600' },
            { icon: Star, title: 'Transparent', sub: 'Clear pricing', color: 'bg-purple-50 text-purple-600' },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-2.5 card-hover">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                <item.icon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-xs">{item.title}</h3>
                <p className="text-[10px] text-gray-400">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Requests */}
      {sellRequests.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">Recent Requests</h2>
            <button onClick={() => navigate('/dashboard/requests')}
              className="text-xs text-indigo-600 font-semibold hover:text-indigo-700 flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {sellRequests.slice(0, 3).map((req) => (
              <div key={req.id} onClick={() => navigate(`/dashboard/requests/${req.id}`)}
                className="bg-white rounded-xl p-3.5 border border-gray-100 card-hover cursor-pointer flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    req.device_type === 'MacBook' ? 'bg-indigo-50' : 'bg-emerald-50'
                  }`}>
                    {req.device_type === 'MacBook'
                      ? <Laptop className="w-4 h-4 text-indigo-600" />
                      : <Tablet className="w-4 h-4 text-emerald-600" />
                    }
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{req.model_name || req.device_type}</p>
                    <p className="text-[11px] text-gray-400">
                      {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 text-sm">
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

function StatusBadge({ status }) {
  const config = {
    'Pending': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    'Reviewing': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
    'Counter_Offered': { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
    'Customer_Countered': { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' },
    'Offer_Accepted': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    'Seller_Confirmed': { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500' },
    'Agent_Assigned': { bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-500' },
    'Pickup_Scheduled': { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500' },
    'Completed': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    'Rejected': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
    'Cancelled': { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' },
  }
  const labels = {
    'Counter_Offered': 'Offer', 'Customer_Countered': 'Counter', 'Offer_Accepted': 'Accepted',
    'Seller_Confirmed': 'Confirmed', 'Agent_Assigned': 'Assigned', 'Pickup_Scheduled': 'Pickup',
  }
  const c = config[status] || { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {labels[status] || status}
    </span>
  )
}
