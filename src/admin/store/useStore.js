import { create } from 'zustand'
import { supabase } from '../../lib/supabase'

export const useStore = create((set, get) => ({
  // Auth State
  admin: null,
  isAuthenticated: false,
  
  // Requests State
  requests: [],
  selectedRequest: null,
  isLoading: false,
  error: null,
  
  // Price Engine State
  priceEngineModels: [],
  
  // Condition Deductions State
  conditionDeductions: [],
  
  // Agents State
  agents: [],

  // Fraud Alerts State
  fraudAlerts: [],
  
  // Real-time subscription
  realtimeSubscription: null,
  
  // Stats
  stats: {
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    totalRevenue: 0
  },

  // Verify admin status matching Flutter auth_provider.dart
  _verifyAdmin: async (email) => {
    try {
      // Primary: admin_users table
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .maybeSingle()
      if (adminUser) {
        return adminUser.is_active !== false ? adminUser : null
      }

      // Legacy fallback: admins table
      try {
        const { data: legacyAdmin } = await supabase
          .from('admins')
          .select('*')
          .eq('email', email)
          .maybeSingle()
        if (legacyAdmin) return legacyAdmin
      } catch {}

      // Optional fallback: users.role
      try {
        const { data: userResp } = await supabase
          .from('users')
          .select('id, role, name, email')
          .eq('email', email)
          .maybeSingle()
        if (userResp?.role === 'admin') return userResp
      } catch {}

      return null
    } catch {
      // If tables don't exist, allow login
      return { email, name: email.split('@')[0] }
    }
  },

  // Auth Actions (matches Flutter admin auth_provider.dart)
  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error

      const adminData = await get()._verifyAdmin(email)
      if (!adminData) {
        await supabase.auth.signOut()
        throw new Error('Access denied. Admin privileges required.')
      }
      
      set({ admin: adminData, isAuthenticated: true, isLoading: false })
      return true
    } catch (error) {
      set({ error: error.message, isLoading: false })
      return false
    }
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ admin: null, isAuthenticated: false })
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
        const adminData = await get()._verifyAdmin(session.user.email)
        if (adminData) {
          set({ admin: adminData, isAuthenticated: true })
          return true
        }
      }
      set({ admin: null, isAuthenticated: false })
      return false
    } catch {
      set({ admin: null, isAuthenticated: false })
      return false
    }
  },

  // Requests Actions
  fetchRequests: async (status = null) => {
    set({ isLoading: true })
    try {
      let query = supabase
        .from('sell_requests')
        .select(`
          *,
          users (id, phone, name, email)
        `)
        .order('created_at', { ascending: false })
      
      if (status && status !== 'all') {
        query = query.eq('status', status)
      }
      
      const { data, error } = await query
      if (error) throw error
      
      set({ requests: data || [], isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },

  selectRequest: (request) => {
    set({ selectedRequest: request })
  },

  // Real-time sync - subscribe to sell_requests changes
  subscribeToRealtime: () => {
    const existingSub = get().realtimeSubscription
    if (existingSub) return // Already subscribed

    const channel = supabase
      .channel('admin-sell-requests')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'sell_requests' },
        async (payload) => {
          console.log('Realtime update:', payload.eventType, payload.new?.id)
          // Refresh requests on any change
          await get().fetchRequests()
          // Update selected request if it was modified
          const selected = get().selectedRequest
          if (selected && payload.new?.id === selected.id) {
            const updated = get().requests.find(r => r.id === selected.id)
            if (updated) set({ selectedRequest: updated })
          }
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'condition_deductions' },
        async () => {
          console.log('Condition deductions updated')
          await get().fetchConditionDeductions()
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'price_engine' },
        async () => {
          console.log('Price engine updated')
          await get().fetchPriceEngine()
        }
      )
      .subscribe()

    set({ realtimeSubscription: channel })
    console.log('Realtime subscription active')
  },

  unsubscribeFromRealtime: () => {
    const sub = get().realtimeSubscription
    if (sub) {
      supabase.removeChannel(sub)
      set({ realtimeSubscription: null })
      console.log('Realtime subscription removed')
    }
  },

  updateRequestStatus: async (requestId, status, additionalData = {}) => {
    set({ isLoading: true })
    try {
      const { error } = await supabase
        .from('sell_requests')
        .update({ status, ...additionalData })
        .eq('id', requestId)
      
      if (error) throw error
      
      // Refresh requests
      await get().fetchRequests()
      set({ isLoading: false })
      return true
    } catch (error) {
      set({ error: error.message, isLoading: false })
      return false
    }
  },

  acceptRequest: async (requestId) => {
    return get().updateRequestStatus(requestId, 'Offer_Accepted')
  },

  rejectRequest: async (requestId, reason) => {
    return get().updateRequestStatus(requestId, 'Rejected', { 
      rejection_reason: reason,
      updated_at: new Date().toISOString()
    })
  },

  counterOffer: async (requestId, price) => {
    return get().updateRequestStatus(requestId, 'Counter_Offered', { 
      admin_offer_price: price,
      updated_at: new Date().toISOString()
    })
  },

  confirmSeller: async (requestId) => {
    return get().updateRequestStatus(requestId, 'Seller_Confirmed', { 
      seller_confirmed: true,
      seller_confirmed_at: new Date().toISOString()
    })
  },

  // Mark Payment Done (matches Android admin app _markPaymentDone)
  markPaymentDone: async (requestId) => {
    try {
      // Get current request to preserve existing bank_details
      const { data: current } = await supabase
        .from('sell_requests')
        .select('bank_details')
        .eq('id', requestId)
        .single()
      
      const existingBankDetails = current?.bank_details || {}
      const updatedBankDetails = {
        ...existingBankDetails,
        payment_done: true,
        payment_done_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('sell_requests')
        .update({ bank_details: updatedBankDetails })
        .eq('id', requestId)
      
      if (error) throw error
      await get().fetchRequests()
      return true
    } catch (error) {
      console.error('Error marking payment done:', error)
      return false
    }
  },

  // Fetch agents from database (matches Flutter _fetchAgents)
  fetchAgents: async () => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('is_active', true)
        .order('name')
      if (error) throw error
      set({ agents: data || [] })
      return data || []
    } catch (error) {
      console.error('Error fetching agents:', error)
      return []
    }
  },

  // Schedule pickup with agent assignment (matches Flutter _schedulePickup)
  schedulePickupWithAgent: async (requestId, agentId, agentName, pickupDate, pickupTime, pickupSlot, pickupPincode) => {
    try {
      const pickupDateTime = new Date(pickupDate)
      if (pickupTime) {
        const [h, m] = pickupTime.split(':')
        pickupDateTime.setHours(parseInt(h), parseInt(m))
      }
      const updateData = {
        status: 'Pickup_Scheduled',
        assigned_agent_id: agentId,
        assigned_agent_name: agentName,
        pickup_scheduled_time: pickupDateTime.toISOString(),
        pickup_date: pickupDate,
        updated_at: new Date().toISOString(),
      }
      if (pickupSlot) updateData.pickup_slot = pickupSlot
      if (pickupPincode) updateData.pickup_pincode = pickupPincode

      const { error } = await supabase
        .from('sell_requests')
        .update(updateData)
        .eq('id', requestId)
      if (error) throw error
      await get().fetchRequests()
      set({ selectedRequest: null })
      return true
    } catch (error) {
      set({ error: error.message })
      return false
    }
  },

  markCompleted: async (requestId, finalPrice) => {
    const updateData = { status: 'Completed', updated_at: new Date().toISOString() }
    if (finalPrice) updateData.final_price = finalPrice
    return get().updateRequestStatus(requestId, 'Completed', updateData)
  },

  // Price Engine Actions (matches Flutter price_management_screen.dart)
  fetchPriceEngine: async () => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase
        .from('price_engine')
        .select('*')
        .eq('is_active', true)
        .order('device_type', { ascending: true })
        .order('model_name', { ascending: true })
      
      if (error) throw error
      set({ priceEngineModels: data || [], isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },

  addPriceModel: async (deviceType, modelName, basePrice) => {
    try {
      const { error } = await supabase
        .from('price_engine')
        .insert({
          device_type: deviceType,
          model_name: modelName,
          base_price: basePrice,
          is_active: true,
        })
      if (error) throw error
      await get().fetchPriceEngine()
      return true
    } catch (error) {
      set({ error: error.message })
      return false
    }
  },

  updatePriceEngine: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('price_engine')
        .update(updates)
        .eq('id', id)
      
      if (error) throw error
      await get().fetchPriceEngine()
      return true
    } catch (error) {
      set({ error: error.message })
      return false
    }
  },

  deletePriceModel: async (id) => {
    try {
      // Soft delete
      const { error } = await supabase
        .from('price_engine')
        .update({ is_active: false })
        .eq('id', id)
      if (error) throw error
      await get().fetchPriceEngine()
      return true
    } catch (error) {
      set({ error: error.message })
      return false
    }
  },

  // Condition Deductions Actions (matches Flutter condition_pricing_screen.dart)
  fetchConditionDeductions: async () => {
    set({ isLoading: true })
    try {
      let data = []
      try {
        const res = await supabase
          .from('condition_deductions')
          .select('*')
          .order('category')
          .order('display_order')
        data = res.data || []
      } catch {
        const res = await supabase
          .from('condition_deductions')
          .select('*')
          .order('category')
          .order('condition_name')
        data = res.data || []
      }

      // Normalize: ensure 'value' field exists
      const normalized = data.map(item => {
        const obj = { ...item }
        if (obj.value === undefined && obj.deduction_amount !== undefined) {
          obj.value = obj.deduction_amount
        }
        return obj
      })

      set({ conditionDeductions: normalized, isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },

  saveConditionDeductions: async (deductions) => {
    set({ isLoading: true })
    try {
      // Delete all existing deductions first, then insert fresh (matches Flutter app approach)
      const { error: deleteError } = await supabase
        .from('condition_deductions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (deleteError) {
        console.error('Delete error:', deleteError)
        throw deleteError
      }

      // Build insert data - resolve 'value' from either field name
      const getVal = (d) => typeof d.value === 'number' ? d.value
        : typeof d.deduction_amount === 'number' ? d.deduction_amount
        : parseInt(d.value ?? d.deduction_amount) || 0

      // Try 1: Full Android schema (HYBRID_PRICING_SQL.sql columns)
      const fullInsert = deductions.map((d, idx) => ({
        category: d.category,
        condition_name: d.condition_name,
        value: getVal(d),
        deduction_type: d.deduction_type || 'FLAT',
        impact_level: d.impact_level || (getVal(d) < 0 ? 'BONUS' : 'MINOR'),
        display_order: d.display_order ?? idx,
        is_active: d.is_active !== undefined ? d.is_active : true,
      }))

      let { error: insertError } = await supabase
        .from('condition_deductions')
        .insert(fullInsert)

      // Try 2: Fallback with deduction_amount column (fix_condition_deductions_rls.sql schema)
      if (insertError) {
        console.warn('Full insert failed, trying deduction_amount fallback:', insertError.message)
        const fallbackInsert = deductions.map((d) => ({
          category: d.category,
          condition_name: d.condition_name,
          deduction_amount: getVal(d),
        }))
        const res2 = await supabase.from('condition_deductions').insert(fallbackInsert)
        insertError = res2.error
      }

      if (insertError) {
        console.error('Insert error (both attempts):', insertError)
        throw insertError
      }
      
      await get().fetchConditionDeductions()
      set({ isLoading: false })
      return true
    } catch (error) {
      console.error('Save condition deductions error:', error)
      set({ error: error.message, isLoading: false })
      return { success: false, message: error.message || 'Unknown error' }
    }
  },

  // Fraud Alerts Actions
  fetchFraudAlerts: async () => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase
        .from('fraud_alerts')
        .select(`
          *,
          users (id, phone, name)
        `)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      set({ fraudAlerts: data || [], isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },

  resolveFraudAlert: async (alertId) => {
    try {
      const { error } = await supabase
        .from('fraud_alerts')
        .update({ is_resolved: true })
        .eq('id', alertId)
      
      if (error) throw error
      await get().fetchFraudAlerts()
      return true
    } catch (error) {
      set({ error: error.message })
      return false
    }
  },

  // Stats Actions
  fetchStats: async () => {
    try {
      const { data: requests } = await supabase
        .from('sell_requests')
        .select('status, final_price, admin_offer_price, user_expected_price')
      
      if (requests) {
        const totalRequests = requests.length
        const pendingRequests = requests.filter(r => 
          ['Pending', 'Reviewing'].includes(r.status)
        ).length
        const completedRequests = requests.filter(r => 
          r.status === 'Completed'
        ).length
        const totalRevenue = requests
          .filter(r => r.status === 'Completed')
          .reduce((sum, r) => sum + (r.final_price || r.admin_offer_price || r.user_expected_price || 0), 0)
        
        set({ 
          stats: { 
            totalRequests, 
            pendingRequests, 
            completedRequests, 
            totalRevenue 
          } 
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }
}))
