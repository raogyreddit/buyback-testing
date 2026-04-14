import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useStore = create((set, get) => ({
  // Auth State
  user: null,
  userProfile: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Sell Flow State
  sellStep: 0, // 0=deviceType, 1=modelSelect, 2=questionnaire, 3=photos, 4=pricing, 5=personalInfo, 6=review
  selectedDeviceType: null,
  selectedModel: null,
  selectedModelBasePrice: 0,
  specs: { ram: '', storage: '', batteryHealth: '', cycleCount: '' },
  conditionAnswers: {
    deviceTurnsOn: true,
    screenOriginal: true,
    hasDents: false,
    screenIssue: false,
    batteryIssue: false,
    keyboardIssue: false,
    chargerAvailable: true,
    boxAvailable: false,
    screenCondition: null,
    bodyCondition: null,
    keyboardCondition: null,
    trackpadCondition: null,
    portsCondition: null,
    speakersCondition: null,
    cameraCondition: null,
    wifiBluetoothCondition: null,
    screenDiscolouration: null,
    screenSpots: null,
    screenLines: null,
    dentTopPanel: null,
    dentBasePanel: null,
    looseHinges: null,
    crackedLoosePanel: null,
    chargingPort: null,
    hardDrive: null,
    motherboard: null,
    warrantyStatus: null,
    selectedAccessories: [],
  },
  photos: [],
  conditionPhotos: { screen: null, body: null },
  estimatedPrice: 0,
  priceBreakdown: {},
  personalInfo: { fullName: '', email: '', phone: '', address: '', city: '', state: '', pincode: '' },
  deliveryMethod: 'pickup', // 'pickup' or 'store_visit'
  userLocation: null, // { latitude, longitude, address }
  idProofType: '',
  idProofUrl: null,

  // Data State
  priceEngineModels: [],
  conditionDeductions: [],
  deductionsByCategory: {},
  sellRequests: [],
  selectedRequest: null,

  // ============ AUTH ACTIONS ============
  register: async (email, password, name) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, full_name: name } }
      })
      if (error) throw error

      // Create user in users table
      if (data.user) {
        await supabase.from('users').upsert({
          id: data.user.id,
          email: email,
          name: name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })
      }

      set({ isLoading: false })
      return { success: true, message: 'Account created! Please check your email to verify.' }
    } catch (error) {
      set({ error: error.message, isLoading: false })
      return { success: false, message: error.message }
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      const userProfile = await get().fetchUserProfile(data.user.id)
      set({
        user: data.user,
        userProfile,
        isAuthenticated: true,
        isLoading: false,
        personalInfo: {
          fullName: userProfile?.name || data.user.user_metadata?.name || '',
          email: data.user.email || '',
          phone: userProfile?.phone || '',
          address: '', city: '', state: '', pincode: ''
        }
      })
      return true
    } catch (error) {
      set({ error: error.message, isLoading: false })
      return false
    }
  },

  loginWithGoogle: async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      })
      if (error) throw error
    } catch (error) {
      set({ error: error.message })
    }
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({
      user: null, userProfile: null, isAuthenticated: false,
      sellStep: 0, selectedDeviceType: null, selectedModel: null,
      photos: [], estimatedPrice: 0, sellRequests: [], selectedRequest: null,
    })
  },

  resetPassword: async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      return true
    } catch (error) {
      set({ error: error.message })
      return false
    }
  },

  checkAuth: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const userProfile = await get().fetchUserProfile(session.user.id)
        set({
          user: session.user,
          userProfile,
          isAuthenticated: true,
          personalInfo: {
            fullName: userProfile?.name || session.user.user_metadata?.name || '',
            email: session.user.email || '',
            phone: userProfile?.phone || '',
            address: '', city: '', state: '', pincode: ''
          }
        })
        return true
      }
      set({ user: null, isAuthenticated: false })
      return false
    } catch {
      set({ user: null, isAuthenticated: false })
      return false
    }
  },

  fetchUserProfile: async (userId) => {
    try {
      const { data } = await supabase.from('users').select('*').eq('id', userId).single()
      return data
    } catch {
      return null
    }
  },

  updateProfile: async (updates) => {
    const { user } = get()
    if (!user) return false
    try {
      const { error } = await supabase.from('users').update({
        ...updates,
        updated_at: new Date().toISOString()
      }).eq('id', user.id)
      if (error) throw error
      const userProfile = await get().fetchUserProfile(user.id)
      set({ userProfile })
      return true
    } catch (error) {
      set({ error: error.message })
      return false
    }
  },

  // ============ PRICE ENGINE ============
  fetchPriceEngine: async () => {
    try {
      const { data, error } = await supabase
        .from('price_engine')
        .select('*')
        .eq('is_active', true)
        .order('device_type')
        .order('model_name')
      if (error) throw error
      set({ priceEngineModels: data || [] })
    } catch (error) {
      console.error('Error fetching price engine:', error)
    }
  },

  getModelsByType: (deviceType) => {
    return get().priceEngineModels.filter(m => m.device_type === deviceType)
  },

  // ============ CONDITION DEDUCTIONS ============
  fetchConditionDeductions: async () => {
    try {
      let data = []
      // Try with is_active and display_order first
      const response = await supabase
        .from('condition_deductions')
        .select('*')
        .order('category')
      
      if (response.error) {
        console.error('Error fetching condition_deductions:', response.error)
        return
      }
      
      data = response.data || []

      const byCategory = {}
      data.forEach(rule => {
        if (!byCategory[rule.category]) byCategory[rule.category] = []
        byCategory[rule.category].push(rule)
      })

      set({ conditionDeductions: data, deductionsByCategory: byCategory })
    } catch (error) {
      console.error('Error fetching deductions:', error)
    }
  },

  getRule: (category, conditionName) => {
    if (!conditionName) return null
    const rules = get().deductionsByCategory[category] || []
    const normalized = conditionName.trim().toLowerCase()
    return rules.find(r => r.condition_name.trim().toLowerCase() === normalized) || null
  },

  // ============ HYBRID PRICE CALCULATION ============
  calculatePrice: () => {
    const { selectedModelBasePrice, conditionAnswers, selectedDeviceType } = get()
    const getRule = get().getRule
    const basePrice = selectedModelBasePrice
    const scrapValue = 5000 // Fixed scrap value matching Android app
    const isMacBook = selectedDeviceType === 'MacBook'
    const breakdown = {}
    let currentPrice = basePrice

    // SCRAP CHECK
    if (!conditionAnswers.deviceTurnsOn) {
      set({
        estimatedPrice: scrapValue,
        priceBreakdown: { 'Device Not Turning On': `SCRAP - ₹${scrapValue}` }
      })
      return scrapValue
    }

    let totalFlatDeduction = 0

    // Helper: get deduction value as integer (matching Flutter's null-coalescing logic)
    const getVal = (rule) => Math.round(rule.value ?? rule.deduction_amount ?? 0)

    // Screen
    const screenRule = getRule('Screen', conditionAnswers.screenCondition)
    if (screenRule && getVal(screenRule) > 0) {
      const val = getVal(screenRule)
      totalFlatDeduction += val
      breakdown[`Screen: ${conditionAnswers.screenCondition}`] = `-₹${val}`
    }

    // Body
    const bodyRule = getRule('Body', conditionAnswers.bodyCondition)
    if (bodyRule && getVal(bodyRule) > 0) {
      const val = getVal(bodyRule)
      totalFlatDeduction += val
      breakdown[`Body: ${conditionAnswers.bodyCondition}`] = `-₹${val}`
    }

    // Battery
    const batteryRule = getRule('Battery', conditionAnswers.batteryHealth || get().specs.batteryHealth)
    if (batteryRule && getVal(batteryRule) > 0) {
      const val = getVal(batteryRule)
      totalFlatDeduction += val
      breakdown[`Battery: ${conditionAnswers.batteryHealth || get().specs.batteryHealth}`] = `-₹${val}`
    }

    // MacBook specific
    if (isMacBook) {
      const macParts = [
        ['Keyboard', conditionAnswers.keyboardCondition],
        ['Trackpad', conditionAnswers.trackpadCondition],
        ['Ports', conditionAnswers.portsCondition],
      ]
      macParts.forEach(([cat, cond]) => {
        const rule = getRule(cat, cond)
        if (rule && getVal(rule) > 0) {
          const val = getVal(rule)
          totalFlatDeduction += val
          breakdown[`${cat}: ${cond}`] = `-₹${val}`
        }
      })

      // Cycle Count
      const cycleCount = parseInt(get().specs.cycleCount) || 0
      let cycleRange = '0-299 cycles'
      if (cycleCount >= 800) cycleRange = '800+ cycles'
      else if (cycleCount >= 500) cycleRange = '500-799 cycles'
      else if (cycleCount >= 300) cycleRange = '300-499 cycles'
      const cycleRule = getRule('CycleCount', cycleRange)
      if (cycleRule && getVal(cycleRule) > 0) {
        const val = getVal(cycleRule)
        totalFlatDeduction += val
        breakdown[`Cycle Count (${cycleCount})`] = `-₹${val}`
      }
    }

    // Speakers, Camera
    const otherParts = [
      ['Speakers', conditionAnswers.speakersCondition],
      ['Camera', conditionAnswers.cameraCondition],
    ]
    otherParts.forEach(([cat, cond]) => {
      const rule = getRule(cat, cond)
      if (rule && getVal(rule) > 0) {
        const val = getVal(rule)
        totalFlatDeduction += val
        breakdown[`${cat}: ${cond}`] = `-₹${val}`
      }
    })

    // WiFi/Bluetooth
    if (conditionAnswers.wifiBluetoothCondition) {
      const wifiRule = getRule('WiFi/Bluetooth', conditionAnswers.wifiBluetoothCondition) || getRule('WiFi', conditionAnswers.wifiBluetoothCondition) || getRule('Bluetooth', conditionAnswers.wifiBluetoothCondition)
      if (wifiRule && getVal(wifiRule) > 0) {
        const val = getVal(wifiRule)
        totalFlatDeduction += val
        breakdown[`WiFi/Bluetooth: ${conditionAnswers.wifiBluetoothCondition}`] = `-₹${val}`
      }
    }

    // New Cashify-style conditions
    const newConditions = [
      ['ScreenDiscolouration', conditionAnswers.screenDiscolouration, 'Screen Discolouration'],
      ['ScreenSpots', conditionAnswers.screenSpots, 'Screen Spots'],
      ['ScreenLines', conditionAnswers.screenLines, 'Screen Lines'],
      ['DentTopPanel', conditionAnswers.dentTopPanel, 'Dent Top Panel'],
      ['DentBasePanel', conditionAnswers.dentBasePanel, 'Dent Base Panel'],
      ['LooseHinges', conditionAnswers.looseHinges, 'Loose Hinges'],
      ['CrackedLoosePanel', conditionAnswers.crackedLoosePanel, 'Cracked/Loose Panel'],
      ['ChargingPort', conditionAnswers.chargingPort, 'Charging Port'],
      ['HardDrive', conditionAnswers.hardDrive, 'Hard Drive'],
    ]
    newConditions.forEach(([cat, cond, label]) => {
      if (!cond) return
      const rule = getRule(cat, cond)
      if (rule && getVal(rule) > 0) {
        const val = getVal(rule)
        totalFlatDeduction += val
        breakdown[`${label}: ${cond}`] = `-₹${val}`
      }
    })

    // Motherboard (can be SCRAP_TRIGGER)
    if (conditionAnswers.motherboard) {
      const mbRule = getRule('Motherboard', conditionAnswers.motherboard)
      if (mbRule && getVal(mbRule) > 0) {
        if ((mbRule.deduction_type || '').toUpperCase() === 'SCRAP_TRIGGER') {
          set({ estimatedPrice: scrapValue, priceBreakdown: { 'Motherboard Issue': `SCRAP - ₹${scrapValue}` } })
          return scrapValue
        }
        const val = getVal(mbRule)
        totalFlatDeduction += val
        breakdown[`Motherboard: ${conditionAnswers.motherboard}`] = `-₹${val}`
      }
    }

    // Storage & RAM deductions
    const storageRule = getRule('Storage', get().specs.storage)
    if (storageRule && getVal(storageRule) > 0) {
      const val = getVal(storageRule)
      totalFlatDeduction += val
      breakdown[`Storage: ${get().specs.storage}`] = `-₹${val}`
    }
    const ramRule = getRule('RAM', get().specs.ram)
    if (ramRule && getVal(ramRule) > 0) {
      const val = getVal(ramRule)
      totalFlatDeduction += val
      breakdown[`RAM: ${get().specs.ram}`] = `-₹${val}`
    }

    // No Charger
    if (!conditionAnswers.chargerAvailable) {
      const chargerRule = getRule('Accessories', 'No charger')
      if (chargerRule && getVal(chargerRule) > 0) {
        const val = getVal(chargerRule)
        totalFlatDeduction += val
        breakdown['No Charger'] = `-₹${val}`
      }
    }

    currentPrice -= totalFlatDeduction

    // Warranty
    let totalBonus = 0
    if (conditionAnswers.warrantyStatus) {
      const warrantyRule = getRule('Warranty', conditionAnswers.warrantyStatus)
      if (warrantyRule) {
        const val = getVal(warrantyRule)
        if (val < 0) {
          const bonus = Math.abs(val)
          totalBonus += bonus
          breakdown[`Warranty: ${conditionAnswers.warrantyStatus}`] = `+₹${bonus} (Bonus)`
        } else if (val > 0) {
          totalFlatDeduction += val
          currentPrice -= val
          breakdown[`Warranty: ${conditionAnswers.warrantyStatus}`] = `-₹${val}`
        }
      }
    }

    // Box bonus
    if (conditionAnswers.boxAvailable) {
      const boxRule = getRule('Accessories', 'Box included')
      if (boxRule) {
        const val = getVal(boxRule)
        if (val < 0) {
          const bonus = Math.abs(val)
          totalBonus += bonus
          breakdown['Box Included'] = `+₹${bonus} (Bonus)`
        }
      }
    }

    // Accessories bonuses
    if (conditionAnswers.selectedAccessories?.length > 0) {
      conditionAnswers.selectedAccessories.forEach(acc => {
        const rule = getRule('Accessories', acc)
        if (rule) {
          const val = getVal(rule)
          if (val < 0) {
            const bonus = Math.abs(val)
            totalBonus += bonus
            breakdown[acc.replace(' included', '')] = `+₹${bonus} (Bonus)`
          }
        }
      })
    }

    currentPrice += totalBonus

    // Floor check
    if (currentPrice < scrapValue) currentPrice = scrapValue

    // Round to nearest 100
    currentPrice = Math.round(currentPrice / 100) * 100

    set({ estimatedPrice: currentPrice, priceBreakdown: breakdown })
    return currentPrice
  },

  // ============ SELL FLOW ACTIONS ============
  setSellStep: (step) => set({ sellStep: step }),
  setDeviceType: (type) => set({ selectedDeviceType: type, sellStep: 1 }),
  setModel: (model) => {
    set({
      selectedModel: model.model_name,
      selectedModelBasePrice: model.base_price,
      sellStep: 2
    })
  },
  setSpecs: (specs) => set({ specs }),
  setConditionAnswers: (answers) => set({ conditionAnswers: { ...get().conditionAnswers, ...answers } }),
  setPhotos: (photos) => set({ photos }),
  setConditionPhotos: (photos) => set({ conditionPhotos: { ...get().conditionPhotos, ...photos } }),
  setPersonalInfo: (info) => set({ personalInfo: { ...get().personalInfo, ...info } }),
  setDeliveryMethod: (method) => set({ deliveryMethod: method }),
  setUserLocation: (location) => set({ userLocation: location }),
  setIdProof: (type, url) => set({ idProofType: type, idProofUrl: url }),

  resetSellFlow: () => set({
    sellStep: 0,
    selectedDeviceType: null,
    selectedModel: null,
    selectedModelBasePrice: 0,
    specs: { ram: '', storage: '', batteryHealth: '', cycleCount: '' },
    conditionAnswers: {
      deviceTurnsOn: true, screenOriginal: true, hasDents: false,
      screenIssue: false, batteryIssue: false, keyboardIssue: false,
      chargerAvailable: true, boxAvailable: false,
      screenCondition: null, bodyCondition: null,
      keyboardCondition: null, trackpadCondition: null,
      portsCondition: null, speakersCondition: null,
      cameraCondition: null, wifiBluetoothCondition: null,
      warrantyStatus: null, selectedAccessories: [],
    },
    photos: [],
    conditionPhotos: { screen: null, body: null },
    estimatedPrice: 0,
    priceBreakdown: {},
    deliveryMethod: 'pickup',
    userLocation: null,
    idProofType: '',
    idProofUrl: null,
  }),

  // ============ PHOTO UPLOAD ============
  uploadPhoto: async (file, folder) => {
    try {
      const fileName = `${Date.now()}_${file.name}`
      const path = `${folder}/${fileName}`
      const { error } = await supabase.storage.from('device-photos').upload(path, file)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('device-photos').getPublicUrl(path)
      return publicUrl
    } catch (error) {
      console.error('Photo upload failed:', error)
      return null
    }
  },

  uploadConditionPhoto: async (file, type) => {
    try {
      const fileName = `${Date.now()}_${type}_${file.name}`
      const path = `condition_photos/${fileName}`
      // Use device-photos bucket (condition_photos subfolder) since bucket already exists
      const { error } = await supabase.storage.from('device-photos').upload(path, file)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('device-photos').getPublicUrl(path)
      return publicUrl
    } catch (error) {
      console.error('Condition photo upload failed:', error)
      return null
    }
  },

  uploadIdProof: async (file) => {
    try {
      const fileName = `${Date.now()}_id_${file.name}`
      const path = `id_proofs/${fileName}`
      const { error } = await supabase.storage.from('device-photos').upload(path, file)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('device-photos').getPublicUrl(path)
      return publicUrl
    } catch (error) {
      console.error('ID proof upload failed:', error)
      return null
    }
  },

  // ============ SUBMIT REQUEST ============
  submitSellRequest: async () => {
    const state = get()
    if (!state.user) return { success: false, message: 'Please login first' }

    set({ isLoading: true, error: null })
    try {
      // Ensure user exists in users table
      await supabase.from('users').upsert({
        id: state.user.id,
        email: state.user.email,
        name: state.personalInfo.fullName || state.user.user_metadata?.name,
        phone: state.personalInfo.phone,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })

      const requestData = {
        user_id: state.user.id,
        device_type: state.selectedDeviceType,
        model_name: state.selectedModel,
        specs: {
          ram: state.specs.ram,
          storage: state.specs.storage,
          battery_health: state.specs.batteryHealth,
          cycle_count: state.specs.cycleCount,
        },
        condition_answers: {
          device_turns_on: state.conditionAnswers.deviceTurnsOn,
          screen_original: state.conditionAnswers.screenOriginal,
          has_dents: state.conditionAnswers.hasDents,
          screen_issue: state.conditionAnswers.screenIssue,
          battery_issue: state.conditionAnswers.batteryIssue,
          keyboard_issue: state.conditionAnswers.keyboardIssue,
          charger_available: state.conditionAnswers.chargerAvailable,
          box_available: state.conditionAnswers.boxAvailable,
          screen_condition: state.conditionAnswers.screenCondition,
          body_condition: state.conditionAnswers.bodyCondition,
          screen_condition_photo_url: state.conditionPhotos.screen,
          body_condition_photo_url: state.conditionPhotos.body,
          keyboard_condition: state.conditionAnswers.keyboardCondition,
          trackpad_condition: state.conditionAnswers.trackpadCondition,
          ports_condition: state.conditionAnswers.portsCondition,
          speakers_condition: state.conditionAnswers.speakersCondition,
          camera_condition: state.conditionAnswers.cameraCondition,
          wifi_bluetooth_condition: state.conditionAnswers.wifiBluetoothCondition,
          screen_discolouration: state.conditionAnswers.screenDiscolouration,
          screen_spots: state.conditionAnswers.screenSpots,
          screen_lines: state.conditionAnswers.screenLines,
          dent_top_panel: state.conditionAnswers.dentTopPanel,
          dent_base_panel: state.conditionAnswers.dentBasePanel,
          loose_hinges: state.conditionAnswers.looseHinges,
          cracked_loose_panel: state.conditionAnswers.crackedLoosePanel,
          charging_port: state.conditionAnswers.chargingPort,
          hard_drive: state.conditionAnswers.hardDrive,
          motherboard: state.conditionAnswers.motherboard,
          warranty_status: state.conditionAnswers.warrantyStatus,
          selected_accessories: state.conditionAnswers.selectedAccessories,
        },
        photos_url: state.photos,
        system_estimated_price: state.estimatedPrice,
        user_expected_price: state.estimatedPrice,
        status: 'Pending',
        id_proof_url: state.idProofUrl || null,
        id_proof_type: state.idProofType || null,
        pickup_pincode: state.personalInfo.pincode || null,
        delivery_method: state.deliveryMethod === 'store_visit' ? 'self_drop' : 'pickup',
        ...(state.userLocation ? { user_location: state.userLocation } : {}),
        price_breakdown: {
          base_price: state.selectedModelBasePrice,
          deductions: state.priceBreakdown,
          final_price: state.estimatedPrice,
          delivery_method: state.deliveryMethod,
        },
      }

      const { error } = await supabase.from('sell_requests').insert(requestData)
      if (error) throw error

      get().resetSellFlow()
      await get().fetchUserRequests()
      set({ isLoading: false })
      return { success: true, message: 'Request submitted successfully!' }
    } catch (error) {
      set({ isLoading: false, error: error.message })
      return { success: false, message: error.message }
    }
  },

  // ============ REQUESTS ============
  fetchUserRequests: async () => {
    const { user } = get()
    if (!user) return
    set({ isLoading: true })
    try {
      const { data, error } = await supabase
        .from('sell_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      set({ sellRequests: data || [], isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },

  selectRequest: (request) => set({ selectedRequest: request }),

  cancelRequest: async (requestId) => {
    set({ isLoading: true })
    try {
      const { error } = await supabase
        .from('sell_requests')
        .update({ status: 'Cancelled' })
        .eq('id', requestId)
      if (error) throw error
      await get().fetchUserRequests()
      set({ isLoading: false })
      return true
    } catch (error) {
      set({ error: error.message, isLoading: false })
      return false
    }
  },

  // ============ AGENT TRACKING (Customer View) ============
  fetchAgentTracking: async (requestId) => {
    try {
      const { data, error } = await supabase
        .from('agent_tracking')
        .select('*, agents(name, phone)')
        .eq('sell_request_id', requestId)
        .maybeSingle()
      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to fetch agent tracking:', error)
      return null
    }
  },
}))
