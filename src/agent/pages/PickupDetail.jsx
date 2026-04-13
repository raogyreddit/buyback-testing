import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { supabase } from '../../lib/supabase'
import {
  ArrowLeft, Laptop, Tablet, Phone, Mail, MapPin, Clock,
  Navigation, CheckCircle2, Package, IndianRupee, User,
  ExternalLink, AlertCircle, Camera, FileText, CreditCard,
  ChevronDown, ChevronUp, Edit3, Check, X
} from 'lucide-react'

const STATUS_FLOW = [
  { key: 'pending', label: 'Pending', statuses: ['Pickup_Scheduled', 'Offer_Accepted', 'Agent_Assigned'] },
  { key: 'en_route', label: 'En Route', statuses: ['Agent_En_Route'] },
  { key: 'arrived', label: 'Arrived', statuses: ['Agent_Arrived'] },
  { key: 'picked_up', label: 'Picked Up', statuses: ['Picked_Up'] },
  { key: 'completed', label: 'Completed', statuses: ['Completed'] },
]

export default function PickupDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { assignedPickups, completedPickups, fetchAssignedPickups, updatePickupStatus, uploadVerificationPhoto, submitVerification, startLocationTracking, stopLocationTracking, isLoading } = useStore()
  const [actionLoading, setActionLoading] = useState(null)
  const [showVerification, setShowVerification] = useState(false)

  // Verification state
  const [verifiedConditions, setVerifiedConditions] = useState({})
  const [verificationPhotos, setVerificationPhotos] = useState([])
  const [upiId, setUpiId] = useState('')
  const [paymentBarcodeUrl, setPaymentBarcodeUrl] = useState(null)
  const [agentNotes, setAgentNotes] = useState('')
  const [customerConsent, setCustomerConsent] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const verPhotoRef = useRef(null)
  const barcodeRef = useRef(null)

  // Price recalculation state (matching Flutter Android app)
  const [conditionDeductions, setConditionDeductions] = useState([])
  const [revisedPrice, setRevisedPrice] = useState(0)
  const [priceBreakdownDetails, setPriceBreakdownDetails] = useState({ customerDeductions: {}, agentDeductions: {}, basePrice: 0 })

  useEffect(() => {
    if (assignedPickups.length === 0) fetchAssignedPickups()
    // Fetch condition deductions for price recalculation
    const fetchDeductions = async () => {
      try {
        const { data } = await supabase
          .from('condition_deductions')
          .select()
          .order('category')
        if (data) {
          // Log Body category specifically with actual values
          const bodyDeductions = data.filter(d => (d.category || '').toLowerCase() === 'body')
          console.log('[DB] Body deductions from Supabase:', bodyDeductions.map(d => ({
            name: d.condition_name,
            value: d.value,
            deduction_amount: d.deduction_amount,
            actual: d.value ?? d.deduction_amount ?? 0
          })))
          // Alert for debugging - remove after fix
          const visibleDents = bodyDeductions.find(d => (d.condition_name || '').toLowerCase() === 'visible dents')
          if (visibleDents) {
            const actualValue = visibleDents.value ?? visibleDents.deduction_amount ?? 0
            console.warn(`[DEBUG] Visible dents deduction from DB = ₹${actualValue}`)
          }
          setConditionDeductions(data)
        }
      } catch (e) {
        console.error('Failed to fetch condition deductions:', e)
      }
    }
    fetchDeductions()
    return () => stopLocationTracking()
  }, [])

  const pickup = assignedPickups.find(p => p.id === id) || completedPickups.find(p => p.id === id)

  if (!pickup) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Pickup Not Found</h3>
        <button onClick={() => navigate('/field-tech/pickups')} className="text-primary-600 font-medium hover:underline">
          Back to Pickups
        </button>
      </div>
    )
  }

  const user = pickup.users || {}
  const specs = pickup.specs || {}
  const conditions = pickup.condition_answers || {}
  const isMac = pickup.device_type === 'MacBook'
  const formatPrice = (p) => (p || 0).toLocaleString('en-IN')
  const originalPrice = pickup.system_estimated_price || 0

  // Initialize verification conditions from customer's conditions
  useEffect(() => {
    if (pickup && Object.keys(verifiedConditions).length === 0) {
      setVerifiedConditions({ ...conditions })
    }
  }, [pickup])

  // ============ PRICE RECALCULATION (matching Flutter Android app) ============
  const CATEGORY_MAP = {
    screen_condition: 'Screen',
    body_condition: 'Body',
    keyboard_condition: 'Keyboard',
    trackpad_condition: 'Trackpad',
    ports_condition: 'Ports',
    speakers_condition: 'Speakers',
    camera_condition: 'Camera',
    wifi_bluetooth_condition: 'WiFi/Bluetooth',
  }

  const readDeductionValue = (row) => {
    // Check both possible column names from different SQL schemas
    const raw = row?.value ?? row?.deduction_amount ?? row?.amount ?? 0
    if (raw == null) return 0
    const result = typeof raw === 'number' ? Math.round(raw) : (parseInt(String(raw)) || 0)
    return result
  }

  const getDeductionForCondition = useCallback((key, value) => {
    const category = CATEGORY_MAP[key]
    if (!category || !value) return 0
    // Case-insensitive matching for both category and condition_name
    const categoryLower = category.toLowerCase()
    const valueLower = value.toLowerCase()
    const match = conditionDeductions.find(
      d => (d.category || '').toLowerCase() === categoryLower && 
           (d.condition_name || '').toLowerCase() === valueLower
    )
    const result = match ? readDeductionValue(match) : 0
    console.log(`[DEDUCTION] ${category} -> "${value}" = ₹${result}`, match)
    return result
  }, [conditionDeductions])

  const getAccessoryDeduction = useCallback((conditionName) => {
    const nameLower = conditionName.toLowerCase()
    const match = conditionDeductions.find(
      d => (d.category || '').toLowerCase() === 'accessories' && 
           (d.condition_name || '').toLowerCase() === nameLower
    )
    return match ? readDeductionValue(match) : 0
  }, [conditionDeductions])

  const recalculatePrice = useCallback(() => {
    if (!conditionDeductions.length || !originalPrice) {
      setRevisedPrice(originalPrice)
      return
    }

    const customerAnswers = conditions || {}
    const customerDeductionsMap = {}
    const agentDeductionsMap = {}

    // Calculate customer's deductions (what was already applied to get originalPrice)
    let customerTotal = 0
    Object.entries(customerAnswers).forEach(([key, value]) => {
      if (typeof value === 'string' && value) {
        const ded = getDeductionForCondition(key, value)
        if (ded > 0) {
          customerDeductionsMap[CONDITION_LABELS[key] || key] = { value, deduction: ded }
          customerTotal += ded
        }
      } else if (typeof value === 'boolean') {
        if (key === 'charger_available' && value === false) {
          const ded = getAccessoryDeduction('No charger')
          if (ded > 0) { customerDeductionsMap['No Charger'] = { value: 'Missing', deduction: ded }; customerTotal += ded }
        }
        if (key === 'box_available' && value === true) {
          const ded = getAccessoryDeduction('Box included')
          if (ded < 0) { customerDeductionsMap['Box Included'] = { value: 'Yes', deduction: ded }; customerTotal += ded }
        }
      }
    })

    // Reconstruct base price (before any deductions)
    const basePrice = originalPrice + customerTotal

    // Calculate agent's verified deductions
    let agentTotal = 0
    Object.entries(verifiedConditions).forEach(([key, value]) => {
      if (typeof value === 'string' && value) {
        const ded = getDeductionForCondition(key, value)
        if (ded > 0) {
          agentDeductionsMap[CONDITION_LABELS[key] || key] = { value, deduction: ded }
          agentTotal += ded
        }
      } else if (typeof value === 'boolean') {
        if (key === 'charger_available' && value === false) {
          const ded = getAccessoryDeduction('No charger')
          if (ded > 0) { agentDeductionsMap['No Charger'] = { value: 'Missing', deduction: ded }; agentTotal += ded }
        }
        if (key === 'box_available' && value === true) {
          const ded = getAccessoryDeduction('Box included')
          if (ded < 0) { agentDeductionsMap['Box Included'] = { value: 'Yes', deduction: ded }; agentTotal += ded }
        }
      }
    })

    const newPrice = Math.max(0, basePrice - agentTotal)
    setRevisedPrice(newPrice)
    setPriceBreakdownDetails({ customerDeductions: customerDeductionsMap, agentDeductions: agentDeductionsMap, basePrice, customerTotal, agentTotal })
  }, [conditionDeductions, conditions, verifiedConditions, originalPrice, getDeductionForCondition, getAccessoryDeduction])

  // Recalculate whenever conditions change or deductions load
  useEffect(() => {
    recalculatePrice()
  }, [recalculatePrice])

  // Get current step index
  const currentStepIndex = STATUS_FLOW.findIndex(step => step.statuses.includes(pickup.status))

  // Get next action
  const getNextAction = () => {
    if (['Pickup_Scheduled', 'Offer_Accepted', 'Agent_Assigned'].includes(pickup.status)) {
      return { action: 'en_route', label: 'Start Journey', color: 'bg-blue-600 hover:bg-blue-700' }
    }
    if (pickup.status === 'Agent_En_Route') {
      return { action: 'arrived', label: 'Mark Arrived', color: 'bg-purple-600 hover:bg-purple-700' }
    }
    if (pickup.status === 'Agent_Arrived') {
      return { action: 'picked_up', label: 'Confirm Pickup', color: 'bg-teal-600 hover:bg-teal-700' }
    }
    if (pickup.status === 'Picked_Up') {
      return { action: 'completed', label: 'Complete Delivery', color: 'gradient-success' }
    }
    return null
  }

  const nextAction = getNextAction()

  const handleStatusUpdate = async (action) => {
    if (action === 'picked_up') {
      setShowVerification(true)
      return
    }
    setActionLoading(action)
    await updatePickupStatus(pickup.id, action)
    // Start GPS tracking when agent goes en route
    if (action === 'en_route') {
      startLocationTracking(pickup.id)
    }
    setActionLoading(null)
  }

  // Condition option maps
  const CONDITION_OPTIONS = {
    screen_condition: ['Perfect (No scratches)', 'Minor scratches', 'Visible scratches', 'Cracked/Broken'],
    body_condition: ['Like new', 'Minor dents/scratches', 'Visible dents', 'Major damage'],
    keyboard_condition: ['Working perfectly', 'Some keys not working', 'Not working'],
    trackpad_condition: ['Working perfectly', 'Click issues', 'Not working'],
    ports_condition: ['All working', 'Some not working', 'Most not working'],
    speakers_condition: ['Working', 'Distorted sound', 'Not working'],
    camera_condition: ['Working', 'Not working'],
    wifi_bluetooth_condition: ['Working', 'Not working'],
  }

  const CONDITION_LABELS = {
    screen_condition: 'Screen Condition',
    body_condition: 'Body Condition',
    keyboard_condition: 'Keyboard',
    trackpad_condition: 'Trackpad',
    ports_condition: 'Ports',
    speakers_condition: 'Speakers',
    camera_condition: 'Camera',
    wifi_bluetooth_condition: 'WiFi / Bluetooth',
  }

  const handleConditionChange = (key, value) => {
    setVerifiedConditions(prev => ({ ...prev, [key]: value }))
  }

  const handleVerificationPhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoUploading(true)
    try {
      const url = await uploadVerificationPhoto(file, pickup.id)
      if (url) setVerificationPhotos(prev => [...prev, url])
    } catch (err) { console.error(err) }
    setPhotoUploading(false)
    if (verPhotoRef.current) verPhotoRef.current.value = ''
  }

  const handleBarcodeUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoUploading(true)
    try {
      const url = await uploadVerificationPhoto(file, pickup.id)
      if (url) setPaymentBarcodeUrl(url)
    } catch (err) { console.error(err) }
    setPhotoUploading(false)
    if (barcodeRef.current) barcodeRef.current.value = ''
  }

  const isConditionChanged = (key) => {
    return conditions[key] !== undefined && verifiedConditions[key] !== undefined && conditions[key] !== verifiedConditions[key]
  }

  const handleVerificationSubmit = async () => {
    if (!customerConsent) return alert('Customer consent is required before submitting.')
    setActionLoading('verification')
    try {
      await submitVerification(pickup.id, {
        verifiedConditions: {
          ...verifiedConditions,
          agent_verification_photos: verificationPhotos,
        },
        revisedPrice,
        originalPrice,
        upiId,
        paymentBarcodeUrl,
        agentNotes,
      })
      stopLocationTracking()
      setShowVerification(false)
      navigate('/field-tech/pickups')
    } catch (err) {
      console.error(err)
      alert('Failed to submit verification. Please try again.')
    }
    setActionLoading(null)
  }

  const openMaps = () => {
    const location = pickup.user_location || {}
    const lat = location.latitude || pickup.pickup_lat
    const lng = location.longitude || pickup.pickup_lng
    const address = location.address || pickup.pickup_address

    if (lat && lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
    } else if (address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank')
    }
  }

  const getCustomerPhone = () => pickup?.customer_phone || user?.phone

  const openWhatsApp = () => {
    const ph = getCustomerPhone()
    if (!ph) return
    const clean = ph.replace(/\D/g, '')
    const num = clean.startsWith('91') ? clean : '91' + clean
    window.open(`https://wa.me/${num}`, '_blank')
  }

  const callCustomer = () => {
    const ph = getCustomerPhone()
    if (ph) {
      const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      if (isMobileDevice) {
        window.open(`tel:${ph}`, '_self')
      } else {
        navigator.clipboard.writeText(ph).then(() => {
          alert(`Phone number copied: ${ph}`)
        }).catch(() => {
          prompt('Copy phone number:', ph)
        })
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <button
        onClick={() => navigate('/field-tech/pickups')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Pickups
      </button>

      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4 min-w-0">
          <div className={`w-14 h-14 shrink-0 rounded-xl flex items-center justify-center ${
            isMac ? 'bg-indigo-100' : 'bg-emerald-100'
          }`}>
            {isMac ? <Laptop className="w-7 h-7 text-indigo-600" /> : <Tablet className="w-7 h-7 text-emerald-600" />}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 break-words">{pickup.model_name || pickup.device_type}</h1>
            <p className="text-sm text-gray-500">ID: {pickup.id?.substring(0, 12)}...</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl sm:text-2xl font-bold text-gray-900">
            ₹{formatPrice(pickup.final_price || pickup.admin_offer_price || pickup.system_estimated_price)}
          </p>
        </div>
      </div>

      {/* Status Progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Pickup Progress</h3>
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {STATUS_FLOW.map((step, idx) => {
            const isCompleted = idx < currentStepIndex
            const isCurrent = idx === currentStepIndex
            const isLast = idx === STATUS_FLOW.length - 1

            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isCompleted ? 'bg-green-500 text-white' :
                    isCurrent ? 'bg-primary-500 text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className={`text-xs mt-1 ${isCurrent ? 'font-semibold text-primary-600' : 'text-gray-500'}`}>
                    {step.label}
                  </span>
                </div>
                {!isLast && (
                  <div className={`flex-1 h-1 mx-2 rounded ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Customer Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="font-medium text-gray-900">{user.name || 'Customer'}</p>
                </div>
              </div>

              <div
                onClick={callCustomer}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-green-50 transition-colors"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">{getCustomerPhone() || '-'}</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-xs text-green-600 font-medium">Tap to call</span>
                  {getCustomerPhone() && (
                    <button onClick={(e) => { e.stopPropagation(); openWhatsApp() }} className="px-2 py-1 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors flex items-center gap-1">
                      <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.243-1.207l-.304-.18-2.871.853.853-2.871-.18-.304A8 8 0 1112 20z"/></svg>
                      WhatsApp
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium text-gray-900 text-sm">{user.email || '-'}</p>
                </div>
              </div>

              <div
                onClick={openMaps}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
              >
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="font-medium text-gray-900 text-sm">
                    {pickup.user_location?.address || pickup.pickup_address || 'Address not available'}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-indigo-600" />
              </div>
            </div>
          </div>

          {/* Device Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Device Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label="Type" value={pickup.device_type} />
              <InfoRow label="Model" value={pickup.model_name} />
              <InfoRow label="Storage" value={specs.storage} />
              <InfoRow label="RAM" value={specs.ram} />
              <InfoRow label="Battery Health" value={specs.battery_health || specs.batteryHealth} />
              {isMac && <InfoRow label="Cycle Count" value={specs.cycle_count || specs.cycleCount} />}
            </div>
          </div>

          {/* Photos */}
          {pickup.photos_url && pickup.photos_url.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Device Photos</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {pickup.photos_url.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt={`Photo ${i+1}`} className="w-full aspect-square object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Action Button */}
          {nextAction && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Next Action</h3>
              <button
                onClick={() => handleStatusUpdate(nextAction.action)}
                disabled={actionLoading === nextAction.action || isLoading}
                className={`w-full py-3.5 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${nextAction.color}`}
              >
                {actionLoading === nextAction.action ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {nextAction.action === 'en_route' && <Navigation className="w-5 h-5" />}
                    {nextAction.action === 'arrived' && <MapPin className="w-5 h-5" />}
                    {nextAction.action === 'picked_up' && <Package className="w-5 h-5" />}
                    {nextAction.action === 'completed' && <CheckCircle2 className="w-5 h-5" />}
                    {nextAction.label}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={openMaps}
                className="w-full flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors"
              >
                <Navigation className="w-5 h-5" />
                <span className="font-medium">Navigate to Location</span>
              </button>
              <button
                onClick={callCustomer}
                className="w-full flex items-center gap-3 p-3 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors"
              >
                <Phone className="w-5 h-5" />
                <span className="font-medium">Call Customer {getCustomerPhone() ? `(${getCustomerPhone()})` : ''}</span>
              </button>
              {getCustomerPhone() && (
                <button
                  onClick={openWhatsApp}
                  className="w-full flex items-center gap-3 p-3 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.243-1.207l-.304-.18-2.871.853.853-2.871-.18-.304A8 8 0 1112 20z"/></svg>
                  <span className="font-medium">WhatsApp Customer</span>
                </button>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Pricing</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">System Estimate</span>
                <span className="font-medium">₹{formatPrice(pickup.system_estimated_price)}</span>
              </div>
              {pickup.admin_offer_price && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Admin Offer</span>
                  <span className="font-medium">₹{formatPrice(pickup.admin_offer_price)}</span>
                </div>
              )}
              {pickup.final_price && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Final Price</span>
                  <span className="font-bold text-green-600">₹{formatPrice(pickup.final_price)}</span>
                </div>
              )}
              <hr className="my-2" />
              <div className="flex justify-between">
                <span className="font-semibold">Amount to Pay</span>
                <span className="font-bold text-lg text-primary-600">
                  ₹{formatPrice(pickup.final_price || pickup.admin_offer_price || pickup.system_estimated_price)}
                </span>
              </div>
            </div>
          </div>

          {/* Price Breakdown - Deductions & Bonuses */}
          {pickup.price_breakdown && Object.keys(pickup.price_breakdown).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Deductions & Bonuses</h3>
              {pickup.price_breakdown.base_price > 0 && (
                <div className="flex justify-between text-sm py-1 border-b border-gray-200 mb-2">
                  <span className="text-gray-700 font-medium">Base Price</span>
                  <span className="font-bold text-gray-900">₹{formatPrice(pickup.price_breakdown.base_price)}</span>
                </div>
              )}
              {pickup.price_breakdown.deductions && Object.keys(pickup.price_breakdown.deductions).length > 0 && (
                <div className="space-y-1">
                  {Object.entries(pickup.price_breakdown.deductions).map(([key, val]) => (
                    <div key={key} className="flex justify-between text-xs py-0.5">
                      <span className="text-gray-600 truncate max-w-[60%]">{key}</span>
                      <span className="font-semibold text-red-600">-₹{formatPrice(Math.abs(typeof val === 'number' ? val : parseInt(String(val).replace(/[^\d-]/g, '')) || 0))}</span>
                    </div>
                  ))}
                </div>
              )}
              {pickup.price_breakdown.bonuses && Object.keys(pickup.price_breakdown.bonuses).length > 0 && (
                <div className="space-y-1 mt-2">
                  {Object.entries(pickup.price_breakdown.bonuses).map(([key, val]) => (
                    <div key={key} className="flex justify-between text-xs py-0.5">
                      <span className="text-gray-600 truncate max-w-[60%]">{key}</span>
                      <span className="font-semibold text-green-600">+₹{formatPrice(Math.abs(typeof val === 'number' ? val : parseInt(String(val).replace(/[^\d-]/g, '')) || 0))}</span>
                    </div>
                  ))}
                </div>
              )}
              {pickup.price_breakdown.final_price > 0 && (
                <div className="flex justify-between text-sm py-1 border-t border-gray-300 mt-2">
                  <span className="text-gray-700 font-bold">Final</span>
                  <span className="font-bold text-green-600">₹{formatPrice(pickup.price_breakdown.final_price)}</span>
                </div>
              )}
            </div>
          )}

          {/* Schedule */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Schedule</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Scheduled Time</p>
                <p className="font-medium text-gray-900">
                  {pickup.pickup_scheduled_time
                    ? new Date(pickup.pickup_scheduled_time).toLocaleString('en-IN', {
                        weekday: 'short', day: 'numeric', month: 'short',
                        hour: '2-digit', minute: '2-digit'
                      })
                    : 'Not scheduled'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Modal/Overlay */}
      {showVerification && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto py-4 sm:py-8">
          <div className="bg-gray-50 rounded-2xl w-full max-w-3xl mx-2 sm:mx-4 shadow-2xl">
            {/* Verification Header with Price Comparison */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Pickup Verification</h2>
                <button onClick={() => setShowVerification(false)} className="text-white/80 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <p className="text-white/70 text-sm">Original Quote</p>
                  <p className="text-2xl font-bold">₹{formatPrice(originalPrice)}</p>
                </div>
                <div className="bg-white/20 rounded-full p-2">
                  <ArrowLeft className="w-5 h-5 rotate-180" />
                </div>
                <div className="text-center">
                  <p className="text-white/70 text-sm">Revised Price</p>
                  <p className={`text-2xl font-bold ${revisedPrice !== originalPrice ? 'text-yellow-300' : 'text-white'}`}>₹{formatPrice(revisedPrice)}</p>
                </div>
              </div>
              <p className="text-center text-white/60 text-xs mt-2">
                {revisedPrice !== originalPrice && <span className="text-yellow-300 text-xs font-medium block mb-1">Price changed by ₹{formatPrice(Math.abs(revisedPrice - originalPrice))} {revisedPrice > originalPrice ? '↑' : '↓'}</span>}
                {pickup.device_type} - {pickup.model_name} | {specs.storage} | {specs.ram}
              </p>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Price Breakdown Details - Always show when conditions changed */}
              {Object.keys(verifiedConditions).length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <h4 className="font-bold text-amber-800 text-sm mb-3 flex items-center gap-2">
                    <IndianRupee className="w-4 h-4" /> Price Calculation Breakdown
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="font-semibold text-gray-700 mb-1">Customer Reported:</p>
                      {Object.entries(priceBreakdownDetails.customerDeductions || {}).map(([k, v]) => (
                        <div key={k} className="flex justify-between py-0.5">
                          <span className="text-gray-600">{k}: {v.value}</span>
                          <span className="text-red-600 font-medium">-₹{formatPrice(v.deduction)}</span>
                        </div>
                      ))}
                      {Object.keys(priceBreakdownDetails.customerDeductions || {}).length === 0 && (
                        <p className="text-gray-400 italic">No deductions</p>
                      )}
                      <div className="border-t mt-1 pt-1 font-semibold flex justify-between">
                        <span>Total</span>
                        <span className="text-red-600">-₹{formatPrice(priceBreakdownDetails.customerTotal || 0)}</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700 mb-1">Agent Verified:</p>
                      {Object.entries(priceBreakdownDetails.agentDeductions || {}).map(([k, v]) => (
                        <div key={k} className="flex justify-between py-0.5">
                          <span className="text-gray-600">{k}: {v.value}</span>
                          <span className="text-red-600 font-medium">-₹{formatPrice(v.deduction)}</span>
                        </div>
                      ))}
                      {Object.keys(priceBreakdownDetails.agentDeductions || {}).length === 0 && (
                        <p className="text-gray-400 italic">No deductions</p>
                      )}
                      <div className="border-t mt-1 pt-1 font-semibold flex justify-between">
                        <span>Total</span>
                        <span className="text-red-600">-₹{formatPrice(priceBreakdownDetails.agentTotal || 0)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-amber-300 text-sm space-y-1">
                    <div className="flex justify-between"><span className="text-gray-700">Base Price (Model):</span><span className="font-bold">₹{formatPrice(priceBreakdownDetails.basePrice || 0)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-700">Agent Deductions:</span><span className="font-bold text-red-600">-₹{formatPrice(priceBreakdownDetails.agentTotal || 0)}</span></div>
                    <div className="flex justify-between pt-1 border-t border-amber-300"><span className="font-bold text-gray-900">Final Price:</span><span className="font-bold text-green-600">₹{formatPrice(revisedPrice)}</span></div>
                  </div>
                </div>
              )}

              {/* Info Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Verify each condition carefully</p>
                  <p>Compare the actual device condition with customer's reported answers. Mark any differences — this helps ensure fair pricing.</p>
                </div>
              </div>

              {/* Condition Verification Sections */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-indigo-600" /> Condition Verification
                </h3>

                {Object.entries(CONDITION_OPTIONS).map(([key, options]) => {
                  // Skip keyboard/trackpad for iPad
                  if (!isMac && (key === 'keyboard_condition' || key === 'trackpad_condition')) return null

                  const customerValue = conditions[key]
                  const agentValue = verifiedConditions[key]
                  const changed = isConditionChanged(key)

                  return (
                    <div key={key} className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="font-semibold text-gray-800 text-sm">{CONDITION_LABELS[key]}</label>
                        {changed && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Changed</span>
                        )}
                      </div>
                      {customerValue && (
                        <p className="text-xs text-gray-500 mb-2">Customer reported: <span className="font-medium text-gray-700">{customerValue}</span>
                          <span className="text-red-500 ml-1">(-₹{formatPrice(getDeductionForCondition(key, customerValue))})</span>
                        </p>
                      )}
                      {agentValue && (
                        <p className="text-xs text-green-600 mb-2">Agent verified: <span className="font-medium">{agentValue}</span>
                          <span className="ml-1">(-₹{formatPrice(getDeductionForCondition(key, agentValue))})</span>
                        </p>
                      )}
                      <select
                        value={agentValue || ''}
                        onChange={(e) => handleConditionChange(key, e.target.value)}
                        className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                          changed ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select condition</option>
                        {options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  )
                })}

                {/* Accessories toggles */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <label className="font-semibold text-gray-800 text-sm block mb-3">Accessories</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={verifiedConditions.charger_available ?? conditions.charger_available ?? false}
                        onChange={(e) => handleConditionChange('charger_available', e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-sm text-gray-700">Charger Included</span>
                      {conditions.charger_available !== undefined && (verifiedConditions.charger_available ?? false) !== (conditions.charger_available ?? false) && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Changed</span>
                      )}
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={verifiedConditions.box_available ?? conditions.box_available ?? false}
                        onChange={(e) => handleConditionChange('box_available', e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-sm text-gray-700">Box Included</span>
                      {conditions.box_available !== undefined && (verifiedConditions.box_available ?? false) !== (conditions.box_available ?? false) && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Changed</span>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              {/* Verification Photos */}
              <div className="space-y-3">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-indigo-600" /> Verification Photos
                </h3>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-sm text-gray-600 mb-3">Take photos of the device as evidence of its current condition.</p>
                  <input ref={verPhotoRef} type="file" accept="image/*" capture="environment" onChange={handleVerificationPhotoUpload} className="hidden" />
                  <button
                    onClick={() => verPhotoRef.current?.click()}
                    disabled={photoUploading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors font-medium text-sm disabled:opacity-50"
                  >
                    {photoUploading ? (
                      <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                    {photoUploading ? 'Uploading...' : 'Add Photo'}
                  </button>
                  {verificationPhotos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                      {verificationPhotos.map((url, i) => (
                        <div key={i} className="relative">
                          <img src={url} alt={`Verification ${i + 1}`} className="w-full aspect-square object-cover rounded-lg border" />
                          <button
                            onClick={() => setVerificationPhotos(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Information */}
              <div className="space-y-3">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-600" /> Payment Information
                </h3>
                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Customer UPI ID</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. customer@upi"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Payment Barcode/QR Photo (Optional)</label>
                    <input ref={barcodeRef} type="file" accept="image/*" capture="environment" onChange={handleBarcodeUpload} className="hidden" />
                    <button
                      onClick={() => barcodeRef.current?.click()}
                      disabled={photoUploading}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm border border-gray-300 disabled:opacity-50"
                    >
                      <FileText className="w-4 h-4" />
                      {paymentBarcodeUrl ? 'Change Barcode Photo' : 'Upload Barcode Photo'}
                    </button>
                    {paymentBarcodeUrl && (
                      <img src={paymentBarcodeUrl} alt="Barcode" className="mt-2 w-32 h-32 object-contain rounded-lg border" />
                    )}
                  </div>
                </div>
              </div>

              {/* Agent Notes */}
              <div className="space-y-3">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" /> Agent Notes
                </h3>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <textarea
                    value={agentNotes}
                    onChange={(e) => setAgentNotes(e.target.value)}
                    placeholder="Any additional observations about the device or pickup..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  />
                </div>
              </div>

              {/* Customer Consent */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customerConsent}
                    onChange={(e) => setCustomerConsent(e.target.checked)}
                    className="w-5 h-5 text-indigo-600 rounded mt-0.5"
                  />
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">Customer Consent</p>
                    <p className="text-xs text-gray-500 mt-0.5">I confirm that the customer has agreed to the verified conditions and the revised price, and has handed over the device voluntarily.</p>
                  </div>
                </label>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleVerificationSubmit}
                disabled={!customerConsent || actionLoading === 'verification'}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg shadow-lg"
              >
                {actionLoading === 'verification' ? (
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-6 h-6" />
                    Submit Verification & Complete Pickup
                  </>
                )}
              </button>
            </div>
          </div>
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
