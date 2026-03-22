import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { 
  Laptop, Tablet, ArrowRight, Shield, Zap, IndianRupee, 
  TrendingUp, Clock, CheckCircle2, Star, ClipboardList, Sparkles
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
    <div className="space-y-6 animate-fade-in-up">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700" />
        <div className="absolute inset-0 noise-overlay" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/4 w-56 h-56 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10 p-5 sm:p-7 lg:py-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-[11px] text-white/80 font-medium border border-white/10 mb-3">
                <Sparkles className="w-3 h-3" /> Sell Your Device Today
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white mb-1.5">
                Hello, {displayName}!
              </h1>
              <p className="text-white/50 text-sm mb-5 max-w-md">
                Get the best price for your Apple device with transparent pricing and instant payment.
              </p>
              <div className="flex flex-wrap gap-2.5">
                <button onClick={() => handleSellDevice('MacBook')}
                  className="flex items-center gap-2 bg-white text-indigo-700 px-5 py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg hover:-translate-y-0.5 transition-all">
                  <Laptop className="w-4 h-4" /> Sell MacBook
                </button>
                <button onClick={() => handleSellDevice('iPad')}
                  className="flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white border border-white/20 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-white/25 transition-all">
                  <Tablet className="w-4 h-4" /> Sell iPad
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {[
          { icon: ClipboardList, label: 'Total Requests', value: sellRequests.length, color: 'blue', border: 'border-blue-100' },
          { icon: Clock, label: 'Pending', value: pendingCount, color: 'amber', border: 'border-amber-100' },
          { icon: TrendingUp, label: 'Active', value: activeCount, color: 'purple', border: 'border-purple-100' },
          { icon: CheckCircle2, label: 'Completed', value: completedCount, color: 'emerald', border: 'border-emerald-100' },
        ].map((stat, i) => (
          <div key={i} className={`bg-white rounded-xl p-4 border ${stat.border} card-hover shadow-sm`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${stat.color}-50`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
              </div>
              <div>
                <p className="text-lg lg:text-xl font-extrabold text-gray-900">{stat.value}</p>
                <p className="text-[11px] text-gray-400">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Side-by-side layout for Device Cards + Recent Requests */}
      <div className="grid lg:grid-cols-5 gap-5">
        {/* Device Cards - Left */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Sell a Device</h2>
          <div className="space-y-3">
            <div onClick={() => handleSellDevice('MacBook')}
              className="group bg-white rounded-2xl border border-gray-100 overflow-hidden card-hover cursor-pointer shadow-sm">
              <div className="h-28 lg:h-32 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                <Laptop className="w-14 h-14 text-white/80 relative z-10 group-hover:scale-110 transition-transform" />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Sell MacBook</h3>
                    <p className="text-[11px] text-gray-400">Air, Pro & more</p>
                  </div>
                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                    <ArrowRight className="w-4 h-4 text-indigo-600 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
            <div onClick={() => handleSellDevice('iPad')}
              className="group bg-white rounded-2xl border border-gray-100 overflow-hidden card-hover cursor-pointer shadow-sm">
              <div className="h-28 lg:h-32 bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                <Tablet className="w-14 h-14 text-white/80 relative z-10 group-hover:scale-110 transition-transform" />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Sell iPad</h3>
                    <p className="text-[11px] text-gray-400">Air, Pro, Mini & more</p>
                  </div>
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                    <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Requests - Right */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900">Recent Requests</h2>
            {sellRequests.length > 0 && (
              <button onClick={() => navigate('/dashboard/requests')}
                className="text-xs text-indigo-600 font-semibold hover:text-indigo-700 flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
          {sellRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
              <ClipboardList className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 text-sm mb-1">No Requests Yet</h3>
              <p className="text-xs text-gray-400 mb-4">Start by selling your first device</p>
              <button onClick={() => navigate('/dashboard/sell')}
                className="text-xs text-indigo-600 font-semibold hover:text-indigo-700">
                Start Selling →
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-50">
                {sellRequests.slice(0, 5).map((req) => (
                  <div key={req.id} onClick={() => navigate(`/dashboard/requests/${req.id}`)}
                    className="px-4 py-3.5 hover:bg-gray-50/50 transition-colors cursor-pointer flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        req.device_type === 'MacBook' ? 'bg-indigo-50' : 'bg-emerald-50'
                      }`}>
                        {req.device_type === 'MacBook'
                          ? <Laptop className="w-4 h-4 text-indigo-600" />
                          : <Tablet className="w-4 h-4 text-emerald-600" />
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{req.model_name || req.device_type}</p>
                        <p className="text-[11px] text-gray-400">
                          {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
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
      </div>

      {/* Why Choose Us */}
      <div>
        <h2 className="text-sm font-bold text-gray-900 mb-3">Why BuyBack Elite?</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: IndianRupee, title: 'Best Prices', sub: 'Top buyback rates', color: 'indigo' },
            { icon: Shield, title: 'Safe & Secure', sub: 'Data protected', color: 'emerald' },
            { icon: Zap, title: 'Quick Process', sub: 'Fast payment', color: 'amber' },
            { icon: Star, title: 'Transparent', sub: 'Clear pricing', color: 'purple' },
          ].map((item, i) => (
            <div key={i} className={`bg-white rounded-xl p-4 border border-${item.color}-100 card-hover shadow-sm`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-${item.color}-50 mb-3`}>
                <item.icon className={`w-4 h-4 text-${item.color}-600`} />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">{item.title}</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>
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
