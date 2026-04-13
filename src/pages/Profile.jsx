import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import {
  User, Mail, Phone, MapPin, Edit3, Save, X, Camera,
  ShoppingBag, CheckCircle2, IndianRupee, Clock, Shield, Wallet
} from 'lucide-react'

export default function Profile() {
  const { user, userProfile, sellRequests, fetchUserRequests, updateProfile, isLoading } = useStore()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    upi_id: '',
  })
  const [saveMsg, setSaveMsg] = useState(null)

  useEffect(() => {
    fetchUserRequests()
  }, [])

  useEffect(() => {
    if (userProfile) {
      setForm({
        name: userProfile.name || user?.user_metadata?.name || '',
        phone: userProfile.phone || '',
        address: userProfile.address || userProfile.saved_address || '',
        upi_id: userProfile.upi_id || '',
      })
    }
  }, [userProfile, user])

  const totalRequests = sellRequests.length
  const completedRequests = sellRequests.filter(r => r.status === 'Completed').length
  const activeRequests = sellRequests.filter(r => !['Completed', 'Rejected', 'Cancelled'].includes(r.status)).length
  const totalEarnings = sellRequests
    .filter(r => r.status === 'Completed')
    .reduce((sum, r) => sum + (r.final_price || r.admin_offer_price || r.system_estimated_price || 0), 0)

  const handleSave = async () => {
    const success = await updateProfile({
      name: form.name,
      phone: form.phone,
      saved_address: form.address,
      upi_id: form.upi_id || null,
    })
    if (success) {
      setSaveMsg({ type: 'success', text: 'Profile updated successfully!' })
      setEditing(false)
    } else {
      setSaveMsg({ type: 'error', text: 'Failed to update profile' })
    }
    setTimeout(() => setSaveMsg(null), 3000)
  }

  const displayName = form.name || user?.email?.split('@')[0] || 'Customer'
  const joinDate = userProfile?.created_at
    ? new Date(userProfile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : 'Recently'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="h-32 gradient-bg relative">
          <div className="absolute -bottom-12 left-6">
            <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center border-4 border-white">
              <span className="text-3xl font-bold text-primary-600">
                {displayName[0]?.toUpperCase() || 'C'}
              </span>
            </div>
          </div>
        </div>
        <div className="pt-14 pb-6 px-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
              <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                <Mail className="w-3.5 h-3.5" /> {user?.email}
              </p>
              {form.phone && (
                <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5" /> {form.phone}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <Shield className="w-3 h-3" /> Member since {joinDate}
              </p>
            </div>
            <button
              onClick={() => editing ? handleSave() : setEditing(true)}
              disabled={isLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                editing
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {editing ? (
                <>{isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />} Save</>
              ) : (
                <><Edit3 className="w-4 h-4" /> Edit Profile</>
              )}
            </button>
          </div>
        </div>
      </div>

      {saveMsg && (
        <div className={`p-3 rounded-xl text-sm ${
          saveMsg.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
        }`}>
          {saveMsg.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ShoppingBag} label="Total Requests" value={totalRequests} color="blue" />
        <StatCard icon={Clock} label="Active" value={activeRequests} color="orange" />
        <StatCard icon={CheckCircle2} label="Completed" value={completedRequests} color="green" />
        <StatCard icon={IndianRupee} label="Total Earnings" value={`₹${totalEarnings.toLocaleString('en-IN')}`} color="purple" />
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Edit Profile</h2>
            <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Your name"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                  rows={2}
                  placeholder="Your address"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID (for payments)</label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={form.upi_id}
                  onChange={(e) => setForm({ ...form, upi_id: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="yourname@upi"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Used for receiving payments when your device is sold</p>
            </div>
          </div>
        </div>
      )}

      {/* Account Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Account Information</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Email Address</p>
              <p className="font-medium text-gray-900 text-sm">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Full Name</p>
              <p className="font-medium text-gray-900 text-sm">{form.name || 'Not set'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Phone Number</p>
              <p className="font-medium text-gray-900 text-sm">{form.phone || 'Not set'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">UPI ID</p>
              <p className="font-medium text-gray-900 text-sm">{form.upi_id || 'Not set'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    orange: 'bg-orange-100 text-orange-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
  }
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}
