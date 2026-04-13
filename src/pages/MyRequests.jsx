import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import {
  Laptop, Tablet, ArrowRight, Clock, CheckCircle2, XCircle,
  AlertCircle, RefreshCw, Search, Filter, Package
} from 'lucide-react'

const STATUS_CONFIG = {
  'Pending': { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Pending Review', icon: Clock },
  'Reviewing': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Under Review', icon: AlertCircle },
  'Seller_Confirmed': { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Seller Confirmed', icon: CheckCircle2 },
  'Agent_Assigned': { bg: 'bg-cyan-100', text: 'text-cyan-700', label: 'Agent Assigned', icon: Package },
  'Counter_Offered': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Offer Received', icon: AlertCircle },
  'Customer_Countered': { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Counter Sent', icon: ArrowRight },
  'Offer_Accepted': { bg: 'bg-green-100', text: 'text-green-700', label: 'Offer Accepted', icon: CheckCircle2 },
  'Pickup_Scheduled': { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Pickup Scheduled', icon: Package },
  'Completed': { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed', icon: CheckCircle2 },
  'Rejected': { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected', icon: XCircle },
  'Cancelled': { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Cancelled', icon: XCircle },
}

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Requests' },
  { value: 'active', label: 'Active' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Counter_Offered', label: 'Offers Received' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
]

export default function MyRequests() {
  const { sellRequests, fetchUserRequests, isLoading } = useStore()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchUserRequests()
  }, [])

  const filteredRequests = sellRequests.filter(req => {
    // Filter
    if (filter === 'active') {
      if (['Completed', 'Rejected', 'Cancelled'].includes(req.status)) return false
    } else if (filter !== 'all') {
      if (req.status !== filter) return false
    }
    // Search
    if (search) {
      const q = search.toLowerCase()
      return (
        (req.model_name || '').toLowerCase().includes(q) ||
        (req.device_type || '').toLowerCase().includes(q) ||
        (req.id || '').toLowerCase().includes(q)
      )
    }
    return true
  })

  const formatPrice = (p) => (p || 0).toLocaleString('en-IN')
  const formatDate = (d) => {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Sell Requests</h1>
          <p className="text-sm text-gray-500">{sellRequests.length} total requests</p>
        </div>
        <button
          onClick={() => fetchUserRequests()}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by model, type, or ID..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                filter === opt.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Request List */}
      {isLoading && sellRequests.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No Requests Found</h3>
          <p className="text-sm text-gray-500 mb-4">
            {filter !== 'all' ? 'Try changing your filter' : "You haven't submitted any sell requests yet"}
          </p>
          <button
            onClick={() => navigate('/sell')}
            className="inline-flex items-center gap-2 px-5 py-2.5 gradient-bg text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Sell a Device <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => {
            const statusConfig = STATUS_CONFIG[req.status] || {
              bg: 'bg-gray-100', text: 'text-gray-700', label: req.status, icon: AlertCircle
            }
            const StatusIcon = statusConfig.icon
            const displayPrice = req.final_price || req.admin_offer_price || req.system_estimated_price || 0

            return (
              <div
                key={req.id}
                onClick={() => navigate(`/dashboard/requests/${req.id}`)}
                className="bg-white rounded-xl border border-gray-200 p-4 lg:p-5 hover:shadow-md hover:border-primary-200 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  {/* Device Icon */}
                  <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center ${
                    req.device_type === 'MacBook' ? 'bg-indigo-100' : 'bg-emerald-100'
                  }`}>
                    {req.device_type === 'MacBook'
                      ? <Laptop className="w-6 h-6 text-indigo-600" />
                      : <Tablet className="w-6 h-6 text-emerald-600" />
                    }
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 truncate">
                          {req.model_name || req.device_type}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          ID: {req.id?.substring(0, 8)}... | {formatDate(req.created_at)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-gray-900">₹{formatPrice(displayPrice)}</p>
                        {req.admin_offer_price && req.admin_offer_price !== req.system_estimated_price && (
                          <p className="text-xs text-gray-400 line-through">₹{formatPrice(req.system_estimated_price)}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>

                      {req.status === 'Counter_Offered' && (
                        <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full animate-pulse">
                          Action Required
                        </span>
                      )}

                      <ArrowRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
