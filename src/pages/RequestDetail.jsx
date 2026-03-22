import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'
import {
  ArrowLeft, Laptop, Tablet, CheckCircle2, XCircle, Clock,
  AlertCircle, IndianRupee, Package, MapPin, Phone, Mail,
  User, Monitor, Battery, Keyboard, Speaker, Wifi, Video,
  MousePointer, Usb, ShieldCheck, Box, ChevronDown, ChevronUp,
  Navigation, Truck, CreditCard, Banknote, Upload, Save,
  ZoomIn, ChevronLeft, ChevronRight, X
} from 'lucide-react'

const STATUS_CONFIG = {
  'Pending': { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Pending Review', desc: 'Your request is being reviewed by our team.' },
  'Reviewing': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Under Review', desc: 'Our team is evaluating your device details.' },
  'Offer_Accepted': { bg: 'bg-green-100', text: 'text-green-700', label: 'Offer Accepted', desc: 'Great! The offer has been accepted. Pickup will be scheduled.' },
  'Seller_Confirmed': { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Seller Confirmed', desc: 'You have confirmed the sale. Agent will be assigned soon.' },
  'Agent_Assigned': { bg: 'bg-cyan-100', text: 'text-cyan-700', label: 'Agent Assigned', desc: 'An agent has been assigned for pickup.' },
  'Agent_En_Route': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Agent En Route', desc: 'Agent is on the way to your location.' },
  'Agent_Arrived': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Agent Arrived', desc: 'Agent has arrived at your location.' },
  'Pickup_Scheduled': { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Pickup Scheduled', desc: 'Your device pickup has been scheduled.' },
  'Picked_Up': { bg: 'bg-sky-100', text: 'text-sky-700', label: 'Picked Up', desc: 'Your device has been picked up. Verification in progress.' },
  'Completed': { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed', desc: 'Deal completed successfully! Thank you.' },
  'Cancelled': { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Cancelled', desc: 'This request has been cancelled.' },
}

export default function RequestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { sellRequests, fetchUserRequests, cancelRequest, fetchAgentTracking, isLoading } = useStore()
  const [expandConditions, setExpandConditions] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const [agentTracking, setAgentTracking] = useState(null)
  
  // Payment details state (matching Android customer app)
  const [upiId, setUpiId] = useState('')
  const [bankDetails, setBankDetails] = useState({ account_holder: '', bank_name: '', account_number: '', ifsc: '' })
  const [paymentSaving, setPaymentSaving] = useState(false)
  const [paymentSaved, setPaymentSaved] = useState(false)

  // Photo zoom state
  const [zoomPhoto, setZoomPhoto] = useState(null)
  const [zoomIndex, setZoomIndex] = useState(0)
  const [photoGallery, setPhotoGallery] = useState([])

  // Always fetch requests on mount to ensure data is available
  useEffect(() => {
    fetchUserRequests()
  }, [id])

  const request = sellRequests.find(r => r.id === id)

  // Fetch agent tracking for active pickup statuses
  useEffect(() => {
    if (request && ['Agent_En_Route', 'Agent_Arrived', 'Picked_Up', 'Agent_Assigned', 'Pickup_Scheduled'].includes(request.status)) {
      const loadTracking = async () => {
        const data = await fetchAgentTracking(request.id)
        setAgentTracking(data)
      }
      loadTracking()
      // Poll every 15 seconds for live updates
      const interval = setInterval(loadTracking, 15000)
      return () => clearInterval(interval)
    }
  }, [request?.id, request?.status])

  // Show loading while fetching
  if (isLoading && !request) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500">Loading request details...</p>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Request Not Found</h3>
        <button onClick={() => navigate('/dashboard/requests')} className="text-primary-600 font-medium hover:underline">
          Back to Requests
        </button>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[request.status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: request.status, desc: '' }
  const specs = request.specs || {}
  const conditions = request.condition_answers || {}
  const isMac = request.device_type === 'MacBook'
  const formatPrice = (p) => (p || 0).toLocaleString('en-IN')
  const displayPrice = request.final_price || request.admin_offer_price || request.system_estimated_price || 0

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this request?')) return
    setActionLoading('cancel')
    await cancelRequest(request.id)
    setActionLoading(null)
  }

  // Save payment details (matching Android customer app)
  const handleSavePaymentDetails = async () => {
    if (!upiId && !bankDetails.account_number) return
    setPaymentSaving(true)
    try {
      const updateData = {
        upi_id: upiId || null,
        bank_details: {
          ...(request.bank_details || {}),
          upi_id: upiId || null,
          account_holder_name: bankDetails.account_holder || null,
          bank_name: bankDetails.bank_name || null,
          account_number: bankDetails.account_number || null,
          ifsc_code: bankDetails.ifsc || null,
        }
      }
      const { error } = await supabase
        .from('sell_requests')
        .update(updateData)
        .eq('id', request.id)
      if (!error) {
        setPaymentSaved(true)
        fetchUserRequests()
        setTimeout(() => setPaymentSaved(false), 3000)
      }
    } catch (e) {
      console.error('Failed to save payment details:', e)
    }
    setPaymentSaving(false)
  }

  // Load existing payment details
  useEffect(() => {
    if (request) {
      setUpiId(request.upi_id || request.bank_details?.upi_id || '')
      setBankDetails({
        account_holder: request.bank_details?.account_holder_name || '',
        bank_name: request.bank_details?.bank_name || '',
        account_number: request.bank_details?.account_number || '',
        ifsc: request.bank_details?.ifsc_code || '',
      })
    }
  }, [request?.id])

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <button
        onClick={() => navigate('/dashboard/requests')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Requests
      </button>

      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 shrink-0 rounded-xl flex items-center justify-center ${
            isMac ? 'bg-indigo-100' : 'bg-emerald-100'
          }`}>
            {isMac ? <Laptop className="w-7 h-7 text-indigo-600" /> : <Tablet className="w-7 h-7 text-emerald-600" />}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 break-words">{request.model_name || request.device_type}</h1>
            <p className="text-sm text-gray-500">ID: {request.id?.substring(0, 12)}...</p>
          </div>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${statusConfig.bg} ${statusConfig.text}`}>
          {statusConfig.label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Status Card */}
          <div className={`rounded-xl p-4 ${statusConfig.bg} border`}>
            <p className={`font-semibold ${statusConfig.text}`}>{statusConfig.label}</p>
            <p className="text-sm text-gray-600 mt-1">{statusConfig.desc}</p>
          </div>

          {/* Agent Tracking Card */}
          {agentTracking && ['Agent_En_Route', 'Agent_Arrived', 'Picked_Up', 'Agent_Assigned', 'Pickup_Scheduled'].includes(request.status) && (
            <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-3 h-3 rounded-full animate-pulse ${
                  request.status === 'Agent_En_Route' ? 'bg-blue-500' :
                  request.status === 'Agent_Arrived' ? 'bg-purple-500' : 'bg-teal-500'
                }`} />
                <h3 className="font-semibold text-gray-900">
                  {request.status === 'Agent_En_Route' ? 'Agent is on the way!' :
                   request.status === 'Agent_Arrived' ? 'Agent has arrived!' :
                   'Agent Assigned'}
                </h3>
              </div>

              {/* Agent Info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{agentTracking.agents?.name || request.assigned_agent_name || 'Agent'}</p>
                  {agentTracking.agents?.phone && (
                    <a href={`tel:${agentTracking.agents.phone}`} className="text-sm text-blue-600 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {agentTracking.agents.phone}
                    </a>
                  )}
                </div>
                {request.status === 'Agent_En_Route' && (
                  <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
                    <Navigation className="w-4 h-4" />
                    <span className="text-xs font-medium">En Route</span>
                  </div>
                )}
                {request.status === 'Agent_Arrived' && (
                  <div className="flex items-center gap-1 text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full">
                    <MapPin className="w-4 h-4" />
                    <span className="text-xs font-medium">Arrived</span>
                  </div>
                )}
              </div>

              {/* Tracking Timeline */}
              <div className="space-y-2 text-sm">
                {agentTracking.started_at && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Truck className="w-4 h-4 text-blue-500" />
                    <span>Started journey at {new Date(agentTracking.started_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
                {agentTracking.actual_arrival_time && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 text-purple-500" />
                    <span>Arrived at {new Date(agentTracking.actual_arrival_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
                {agentTracking.location_updated_at && request.status === 'Agent_En_Route' && (
                  <div className="flex items-center gap-2 text-gray-500 text-xs mt-1">
                    <Clock className="w-3 h-3" />
                    <span>Location updated {new Date(agentTracking.location_updated_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Device Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Device Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label="Type" value={request.device_type} />
              <InfoRow label="Model" value={request.model_name} />
              <InfoRow label="Storage" value={specs.storage} />
              <InfoRow label="RAM" value={specs.ram} />
              <InfoRow label="Battery Health" value={specs.battery_health || specs.batteryHealth} />
              {isMac && <InfoRow label="Cycle Count" value={specs.cycle_count || specs.cycleCount} />}
            </div>
          </div>

          {/* Condition Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <button
              onClick={() => setExpandConditions(!expandConditions)}
              className="w-full flex items-center justify-between"
            >
              <h3 className="font-semibold text-gray-900">Condition Details</h3>
              {expandConditions ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            {expandConditions && (
              <div className="mt-4 space-y-3">
                <ConditionRow label="Device Turns On" value={conditions.device_turns_on !== false ? 'Yes' : 'No'} isGood={conditions.device_turns_on !== false} />
                <ConditionRow label="Screen" value={conditions.screen_condition || '-'} isGood={conditions.screen_condition === 'Perfect (No scratches)'} />
                <ConditionRow label="Body" value={conditions.body_condition || '-'} isGood={conditions.body_condition === 'Like new'} />
                <ConditionRow label="Charger" value={conditions.charger_available !== false ? 'Available' : 'Not Available'} isGood={conditions.charger_available !== false} />
                <ConditionRow label="Box" value={conditions.box_available ? 'Available' : 'Not Available'} isGood={conditions.box_available} />
                {isMac && (
                  <>
                    <ConditionRow label="Keyboard" value={conditions.keyboard_condition || '-'} isGood={conditions.keyboard_condition === 'Working perfectly'} />
                    <ConditionRow label="Trackpad" value={conditions.trackpad_condition || '-'} isGood={conditions.trackpad_condition === 'Working perfectly'} />
                    <ConditionRow label="Ports" value={conditions.ports_condition || '-'} isGood={conditions.ports_condition === 'All working'} />
                  </>
                )}
                <ConditionRow label="Speakers" value={conditions.speakers_condition || '-'} isGood={conditions.speakers_condition === 'Working'} />
                <ConditionRow label="Camera" value={conditions.camera_condition || '-'} isGood={conditions.camera_condition === 'Working'} />
                <ConditionRow label="WiFi/Bluetooth" value={conditions.wifi_bluetooth_condition || '-'} isGood={conditions.wifi_bluetooth_condition === 'Working'} />
                {conditions.warranty_status && (
                  <ConditionRow label="Warranty" value={conditions.warranty_status} isGood={conditions.warranty_status?.includes('Active')} />
                )}
                {/* Condition Photos */}
                {(conditions.screen_condition_photo_url || conditions.body_condition_photo_url) && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Condition Photos</p>
                    <div className="grid grid-cols-2 gap-3">
                      {conditions.screen_condition_photo_url && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Screen</p>
                          <a href={conditions.screen_condition_photo_url} target="_blank" rel="noopener noreferrer">
                            <img src={conditions.screen_condition_photo_url} alt="Screen condition" className="w-full aspect-square object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity" />
                          </a>
                        </div>
                      )}
                      {conditions.body_condition_photo_url && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Body</p>
                          <a href={conditions.body_condition_photo_url} target="_blank" rel="noopener noreferrer">
                            <img src={conditions.body_condition_photo_url} alt="Body condition" className="w-full aspect-square object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Photos */}
          {request.photos_url && request.photos_url.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">Device Photos <span className="text-xs text-gray-400 font-normal">Tap to zoom</span></h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {request.photos_url.map((url, i) => (
                  <div key={i} className="relative cursor-pointer group" onClick={() => { setPhotoGallery(request.photos_url); setZoomIndex(i); setZoomPhoto(url); }}>
                    <img src={url} alt={`Photo ${i+1}`} className="w-full aspect-square object-cover rounded-lg border border-gray-200 group-hover:opacity-80 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
                      <ZoomIn className="w-5 h-5 text-white" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Pricing</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">System Estimate</span>
                <span className="font-medium">₹{formatPrice(request.system_estimated_price)}</span>
              </div>
              {request.admin_offer_price && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Admin Offer</span>
                  <span className="font-bold text-purple-600">₹{formatPrice(request.admin_offer_price)}</span>
                </div>
              )}
              {request.customer_counter_price && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Your Counter</span>
                  <span className="font-medium text-primary-600">₹{formatPrice(request.customer_counter_price)}</span>
                </div>
              )}
              {request.final_price && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Final Price</span>
                  <span className="font-bold text-green-600">₹{formatPrice(request.final_price)}</span>
                </div>
              )}
              <hr />
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">Current Value</span>
                <span className="font-bold text-lg text-primary-600">₹{formatPrice(displayPrice)}</span>
              </div>
            </div>
          </div>

          {/* Price Breakdown - Deductions & Bonuses */}
          {request.price_breakdown && Object.keys(request.price_breakdown).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Deductions & Bonuses</h3>
              {/* Base Price */}
              {request.price_breakdown.base_price > 0 && (
                <div className="flex justify-between text-sm py-1.5 border-b border-gray-200 mb-2">
                  <span className="text-gray-700 font-medium">Base Price</span>
                  <span className="font-bold text-gray-900">₹{formatPrice(request.price_breakdown.base_price)}</span>
                </div>
              )}
              {/* Deductions */}
              {request.price_breakdown.deductions && typeof request.price_breakdown.deductions === 'object' && Object.keys(request.price_breakdown.deductions).length > 0 && (
                <div className="space-y-1">
                  {Object.entries(request.price_breakdown.deductions).map(([key, val]) => {
                    const numVal = typeof val === 'number' ? val : parseInt(String(val).replace(/[^\d-]/g, '')) || 0
                    return (
                      <div key={key} className="flex justify-between text-xs py-0.5">
                        <span className="text-gray-600 truncate max-w-[65%]">{key}</span>
                        <span className="font-semibold text-red-600">-₹{formatPrice(Math.abs(numVal))}</span>
                      </div>
                    )
                  })}
                </div>
              )}
              {/* Bonuses */}
              {request.price_breakdown.bonuses && typeof request.price_breakdown.bonuses === 'object' && Object.keys(request.price_breakdown.bonuses).length > 0 && (
                <div className="space-y-1 mt-2">
                  {Object.entries(request.price_breakdown.bonuses).map(([key, val]) => {
                    const numVal = typeof val === 'number' ? val : parseInt(String(val).replace(/[^\d-]/g, '')) || 0
                    return (
                      <div key={key} className="flex justify-between text-xs py-0.5">
                        <span className="text-gray-600 truncate max-w-[65%]">{key}</span>
                        <span className="font-semibold text-green-600">+₹{formatPrice(Math.abs(numVal))}</span>
                      </div>
                    )
                  })}
                </div>
              )}
              {/* Final Price */}
              {request.price_breakdown.final_price > 0 && (
                <div className="flex justify-between text-sm py-1.5 border-t border-gray-300 mt-2">
                  <span className="text-gray-700 font-bold">Final Price</span>
                  <span className="font-bold text-green-600">₹{formatPrice(request.price_breakdown.final_price)}</span>
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Timeline</h3>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Submitted</p>
                  <p className="text-gray-500 text-xs">
                    {request.created_at ? new Date(request.created_at).toLocaleString('en-IN') : '-'}
                  </p>
                </div>
              </div>
              {request.updated_at && request.updated_at !== request.created_at && (
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Last Updated</p>
                    <p className="text-gray-500 text-xs">
                      {new Date(request.updated_at).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              )}
              {request.assigned_agent_name && (
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Agent: {request.assigned_agent_name}</p>
                  </div>
                </div>
              )}
              {request.pickup_scheduled_time && (
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Pickup Scheduled</p>
                    <p className="text-gray-500 text-xs">
                      {new Date(request.pickup_scheduled_time).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Details (matching Android customer app) */}
          {['Offer_Accepted', 'Seller_Confirmed', 'Pickup_Scheduled', 'Agent_Assigned', 'Agent_En_Route', 'Agent_Arrived', 'Picked_Up'].includes(request.status) && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary-600" /> Payment Details
              </h3>
              <p className="text-sm text-gray-500 mb-4">Add your payment details so we can transfer the amount after pickup verification.</p>
              
              <div className="space-y-4">
                {/* UPI ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
                  <div className="flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-green-600" />
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="yourname@upi"
                      className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                  <div className="relative flex justify-center text-xs"><span className="px-2 bg-white text-gray-400">OR add bank details</span></div>
                </div>

                {/* Bank Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      value={bankDetails.account_holder}
                      onChange={(e) => setBankDetails({ ...bankDetails, account_holder: e.target.value })}
                      placeholder="Full name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={bankDetails.bank_name}
                      onChange={(e) => setBankDetails({ ...bankDetails, bank_name: e.target.value })}
                      placeholder="Bank name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={bankDetails.account_number}
                      onChange={(e) => setBankDetails({ ...bankDetails, account_number: e.target.value })}
                      placeholder="Account number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={bankDetails.ifsc}
                      onChange={(e) => setBankDetails({ ...bankDetails, ifsc: e.target.value.toUpperCase() })}
                      placeholder="IFSC code"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSavePaymentDetails}
                  disabled={paymentSaving || (!upiId && !bankDetails.account_number)}
                  className={`w-full py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
                    paymentSaved ? 'bg-green-600 text-white' : 'bg-primary-600 text-white hover:bg-primary-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {paymentSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : paymentSaved ? (
                    <><CheckCircle2 className="w-4 h-4" /> Saved!</>
                  ) : (
                    <><Save className="w-4 h-4" /> Save Payment Details</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Payment Status (if payment done) */}
          {request.bank_details?.payment_done && (
            <div className="bg-green-50 rounded-xl border border-green-200 p-5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-700">Payment Completed!</h3>
                  <p className="text-sm text-green-600">
                    {request.bank_details.payment_done_at 
                      ? `Paid on ${new Date(request.bank_details.payment_done_at).toLocaleString('en-IN')}`
                      : 'Your payment has been processed.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Cancel Button */}
          {['Pending', 'Reviewing'].includes(request.status) && (
            <button
              onClick={handleCancel}
              disabled={actionLoading === 'cancel'}
              className="w-full py-2.5 border border-red-300 text-red-600 font-medium rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {actionLoading === 'cancel' ? 'Cancelling...' : 'Cancel Request'}
            </button>
          )}
        </div>
      </div>

      {/* Photo Zoom Modal */}
      {zoomPhoto && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center" onClick={() => setZoomPhoto(null)}>
          {/* Close button */}
          <button onClick={() => setZoomPhoto(null)} className="absolute top-4 right-4 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white">
            <X className="w-6 h-6" />
          </button>
          {/* Photo counter */}
          <div className="absolute top-4 left-4 text-white/70 text-sm font-medium bg-black/40 px-3 py-1 rounded-full">
            {zoomIndex + 1} / {photoGallery.length}
          </div>
          {/* Main image */}
          <div className="flex-1 flex items-center justify-center w-full px-12 sm:px-20" onClick={e => e.stopPropagation()}>
            <img src={zoomPhoto} alt="Zoomed" className="max-w-full max-h-[75vh] object-contain rounded-lg" />
          </div>
          {/* Navigation arrows */}
          {photoGallery.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); const prev = (zoomIndex - 1 + photoGallery.length) % photoGallery.length; setZoomIndex(prev); setZoomPhoto(photoGallery[prev]); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/25 rounded-full text-white">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); const next = (zoomIndex + 1) % photoGallery.length; setZoomIndex(next); setZoomPhoto(photoGallery[next]); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/25 rounded-full text-white">
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          {/* Thumbnail strip */}
          {photoGallery.length > 1 && (
            <div className="flex gap-2 py-3 px-4 overflow-x-auto max-w-full" onClick={e => e.stopPropagation()}>
              {photoGallery.map((url, i) => (
                <img key={i} src={url} alt={`Thumb ${i+1}`}
                  onClick={() => { setZoomIndex(i); setZoomPhoto(url); }}
                  className={`w-14 h-14 object-cover rounded-lg cursor-pointer border-2 shrink-0 transition-all ${i === zoomIndex ? 'border-white opacity-100 scale-110' : 'border-transparent opacity-50 hover:opacity-80'}`} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium text-gray-900 text-sm">{value || '-'}</p>
    </div>
  )
}

function ConditionRow({ label, value, isGood }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-medium flex items-center gap-1.5 ${isGood ? 'text-green-600' : 'text-red-500'}`}>
        {isGood ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
        {value}
      </span>
    </div>
  )
}
