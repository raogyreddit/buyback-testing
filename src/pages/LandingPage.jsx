import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Smartphone, Laptop, Shield, Zap, IndianRupee, Clock, 
  CheckCircle2, ArrowRight, Star, Users, MapPin, Phone,
  Mail, ChevronDown, Play, Award, TrendingUp, Truck,
  CreditCard, HeadphonesIcon, Download, Apple, Menu, X,
  Sparkles, Globe, BadgeCheck, User, LogOut
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'

// Premium gradient backgrounds
const gradients = {
  primary: 'bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500',
  secondary: 'bg-gradient-to-br from-emerald-500 to-teal-600',
  dark: 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900',
}

export default function LandingPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout, checkAuth } = useStore()
  const [openFaq, setOpenFaq] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [devicePrices, setDevicePrices] = useState([])
  const [isLoadingPrices, setIsLoadingPrices] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)

  // Check auth on mount
  useEffect(() => {
    checkAuth().finally(() => setAuthChecked(true))
  }, [checkAuth])

  // Fetch realtime prices from Supabase
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const { data } = await supabase
          .from('price_engine')
          .select('model_name, base_price, device_type')
          .order('base_price', { ascending: false })
        if (data) {
          // Group by device type and get max price for each model category
          const grouped = {}
          data.forEach(d => {
            const key = d.model_name.includes('Pro') ? `${d.device_type} Pro` :
                        d.model_name.includes('Air') ? `${d.device_type} Air` :
                        d.model_name.includes('Mini') ? 'iPad Mini' :
                        d.device_type === 'MacBook' ? 'MacBook' : 'iPad'
            if (!grouped[key] || d.base_price > grouped[key].price) {
              grouped[key] = { name: key, price: d.base_price, type: d.device_type }
            }
          })
          setDevicePrices(Object.values(grouped).slice(0, 6))
        }
      } catch (e) {
        console.error('Failed to fetch prices:', e)
      } finally {
        setIsLoadingPrices(false)
      }
    }
    fetchPrices()

    // Realtime subscription for price updates
    const channel = supabase
      .channel('price_engine_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'price_engine' }, () => {
        fetchPrices()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const features = [
    { icon: IndianRupee, title: 'Best Prices Guaranteed', desc: 'Get up to 40% more than other buyers. Transparent pricing with no hidden charges.' },
    { icon: Zap, title: 'Instant Quote', desc: 'Get your device value in under 60 seconds. No waiting, no hassle.' },
    { icon: Truck, title: 'Free Doorstep Pickup', desc: 'Our verified agents pick up from your location. Zero travel needed.' },
    { icon: CreditCard, title: 'Same Day Payment', desc: 'Instant bank transfer or UPI payment right after verification.' },
    { icon: Shield, title: 'Safe & Secure', desc: 'Your data is wiped securely. Complete privacy guaranteed.' },
    { icon: HeadphonesIcon, title: '24/7 Support', desc: 'Dedicated support team ready to help you anytime.' },
  ]

  const steps = [
    { num: '01', title: 'Get Quote', desc: 'Select your device model and answer a few questions about its condition.' },
    { num: '02', title: 'Schedule Pickup', desc: 'Choose a convenient time slot. Our agent will come to your doorstep.' },
    { num: '03', title: 'Get Paid', desc: 'Device verified on spot. Instant payment via UPI or bank transfer.' },
  ]

  // Remove fake testimonials - will add real ones later

  const faqs = [
    { q: 'How do you determine the price of my device?', a: 'We evaluate based on device model, storage, condition, and current market rates. Our AI-powered system ensures you get the best competitive price.' },
    { q: 'Is my data safe?', a: 'Absolutely! Our agents perform a secure factory reset in front of you. Your data is completely wiped before we take the device.' },
    { q: 'How long does the pickup take?', a: 'The entire process takes 15-20 minutes. Our agent verifies the device condition and processes payment on the spot.' },
    { q: 'What payment methods do you support?', a: 'We support instant UPI payments (GPay, PhonePe, Paytm) and direct bank transfers. Payment is made within minutes.' },
    { q: 'What if my device has some issues?', a: 'No problem! We buy devices in all conditions. The price is adjusted based on the actual condition, which is shown transparently during the quote.' },
  ]

  const formatPrice = (price) => {
    if (!price) return '₹0'
    return '₹' + Math.round(price).toLocaleString('en-IN')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Apple className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                BuyBack Elite
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-indigo-600 transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-indigo-600 transition-colors">How It Works</a>
              <a href="#pricing" className="text-gray-600 hover:text-indigo-600 transition-colors">Pricing</a>
              <a href="#faq" className="text-gray-600 hover:text-indigo-600 transition-colors">FAQ</a>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 font-medium px-4 py-2"
                  >
                    <User className="w-4 h-4" />
                    Dashboard
                  </button>
                  <button 
                    onClick={() => navigate('/dashboard/sell')}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-full font-semibold hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
                  >
                    Sell Now
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-700 hover:text-indigo-600 font-medium px-4 py-2">
                    Login
                  </Link>
                  <button 
                    onClick={() => navigate('/dashboard/sell')}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-full font-semibold hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
                  >
                    Sell Now
                  </button>
                </>
              )}
            </div>
            {/* Mobile menu button */}
            <button 
              className="sm:hidden p-2 hover:bg-gray-100 rounded-lg"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          
          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden border-t border-gray-100 py-4 space-y-2">
              <a href="#features" className="block px-4 py-2 text-gray-600 hover:bg-indigo-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <a href="#how-it-works" className="block px-4 py-2 text-gray-600 hover:bg-indigo-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
              <a href="#pricing" className="block px-4 py-2 text-gray-600 hover:bg-indigo-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
              <a href="#faq" className="block px-4 py-2 text-gray-600 hover:bg-indigo-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
              <div className="pt-2 border-t border-gray-100 space-y-2">
                {isAuthenticated ? (
                  <>
                    <button 
                      onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false) }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-gray-700 font-medium hover:bg-indigo-50 rounded-lg"
                    >
                      <User className="w-4 h-4" />
                      Dashboard
                    </button>
                    <button 
                      onClick={() => { navigate('/dashboard/sell'); setMobileMenuOpen(false) }}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2.5 rounded-full font-semibold"
                    >
                      Sell Now
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="block px-4 py-2 text-gray-700 font-medium hover:bg-indigo-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                      Login
                    </Link>
                    <button 
                      onClick={() => { navigate('/dashboard/sell'); setMobileMenuOpen(false) }}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2.5 rounded-full font-semibold"
                    >
                      Sell Now
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Star className="w-4 h-4 fill-current" />
                Rated #1 Apple Device Buyback in India
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Sell Your <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">MacBook & iPad</span> at Best Prices
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0">
                Get <span className="font-bold text-indigo-600">best prices</span> for your Apple devices. 
                Instant quotes, free pickup, same-day payment.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button 
                  onClick={() => navigate('/dashboard/sell')}
                  className="group bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-xl hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-2"
                >
                  Get Instant Quote
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <a 
                  href="#how-it-works"
                  className="flex items-center justify-center gap-2 text-gray-700 font-semibold px-6 py-4 rounded-full border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                >
                  <Play className="w-5 h-5 text-indigo-600" />
                  See How It Works
                </a>
              </div>
              
              {/* Trust badges */}
              <div className="mt-10 flex items-center gap-6 justify-center lg:justify-start">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Shield className="w-5 h-5 text-green-500" />
                  <span>Secure & Verified</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span>Instant Payment</span>
                </div>
              </div>
            </div>
            
            {/* Hero Image/Device Cards - 3D Effect */}
            <div className="relative hidden lg:block" style={{ perspective: '1000px' }}>
              {/* Floating background elements */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-indigo-400/30 to-purple-400/30 rounded-full blur-2xl animate-pulse"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-br from-pink-400/30 to-purple-400/30 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
              
              {/* 3D Card */}
              <div 
                className="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-8 transform hover:scale-105 transition-all duration-500"
                style={{ 
                  transformStyle: 'preserve-3d',
                  transform: 'rotateY(-5deg) rotateX(5deg)',
                  boxShadow: '0 25px 50px -12px rgba(79, 70, 229, 0.25), 0 0 0 1px rgba(79, 70, 229, 0.1)'
                }}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-white/0 via-white/30 to-white/0 pointer-events-none"></div>
                
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-medium mb-3">
                    <Sparkles className="w-3 h-3" />
                    Live Quote
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">MacBook Air M1 (2020)</h3>
                  <p className="text-gray-500 text-sm">256GB • 8GB RAM • Good Condition</p>
                </div>
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 rounded-2xl p-5 sm:p-6 text-center text-white mb-6 relative overflow-hidden">
                  {/* Animated gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                  <p className="text-indigo-100 text-sm mb-1">Your Device Value</p>
                  <p className="text-3xl sm:text-4xl font-bold">₹52,000</p>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 text-gray-600 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <span>Free doorstep pickup</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <span>Same day payment via UPI</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <span>Secure data wipe included</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mobile Hero Card */}
            <div className="lg:hidden relative">
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">MacBook Air M1</h3>
                  <p className="text-gray-500 text-sm">256GB • Good Condition</p>
                </div>
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 text-center text-white">
                  <p className="text-indigo-100 text-xs mb-1">Get up to</p>
                  <p className="text-2xl font-bold">₹52,000</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Us Section - replaces fake stats */}
      <section className="py-12 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4">
              <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <BadgeCheck className="w-6 h-6 text-white" />
              </div>
              <p className="font-bold text-gray-900">Verified Agents</p>
              <p className="text-sm text-gray-500">Background checked</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <p className="font-bold text-gray-900">Instant Payment</p>
              <p className="text-sm text-gray-500">UPI / Bank Transfer</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <p className="font-bold text-gray-900">Data Security</p>
              <p className="text-sm text-gray-500">Secure wipe included</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <p className="font-bold text-gray-900">Free Pickup</p>
              <p className="text-sm text-gray-500">At your doorstep</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Choose <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">BuyBack Elite?</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Sell your Apple devices with complete peace of mind and get the best value.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="group bg-white rounded-2xl p-8 border border-gray-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-xl text-indigo-200 max-w-2xl mx-auto">
              Selling your device is as easy as 1-2-3. Complete the process in under 24 hours.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="relative">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all">
                  <span className="text-6xl font-bold text-white/20">{step.num}</span>
                  <h3 className="text-2xl font-bold mt-4 mb-3">{step.title}</h3>
                  <p className="text-indigo-200">{step.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-white/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <button 
              onClick={() => navigate('/sell')}
              className="bg-white text-indigo-900 px-8 py-4 rounded-full font-bold text-lg hover:shadow-xl transition-all"
            >
              Start Selling Now
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              We Buy All Apple Devices
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Check out some of our recent buyback prices. Get your personalized quote in seconds.
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {isLoadingPrices ? (
              // Loading skeleton
              [...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 animate-pulse">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-2xl"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                      <div className="h-5 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : devicePrices.length > 0 ? (
              devicePrices.map((device, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all group cursor-pointer" onClick={() => navigate('/dashboard/sell')}>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:from-indigo-100 group-hover:to-purple-100 transition-all">
                      {device.type === 'MacBook' ? (
                        <Laptop className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600 group-hover:text-indigo-600" />
                      ) : (
                        <Smartphone className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600 group-hover:text-indigo-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm sm:text-base">{device.name}</h3>
                      <p className="text-indigo-600 font-semibold text-sm sm:text-base">Up to {formatPrice(device.price)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Fallback if no prices
              <div className="col-span-full text-center py-8 text-gray-500">
                <Laptop className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Loading device prices...</p>
              </div>
            )}
          </div>
          
          <div className="text-center mt-12">
            <button 
              onClick={() => navigate('/sell')}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-xl hover:shadow-indigo-500/30 transition-all"
            >
              Get Your Exact Quote
            </button>
          </div>
        </div>
      </section>

      {/* Trust Section - replaces fake testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Why Trust Us?
            </h2>
            <p className="text-lg text-gray-600">Your satisfaction is our priority</p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 hover:shadow-lg transition-all">
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Secure Process</h3>
              <p className="text-sm text-gray-500">Your data is wiped securely before we take the device</p>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 hover:shadow-lg transition-all">
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                <BadgeCheck className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Verified Agents</h3>
              <p className="text-sm text-gray-500">All our pickup agents are background verified</p>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 hover:shadow-lg transition-all">
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
                <IndianRupee className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Fair Pricing</h3>
              <p className="text-sm text-gray-500">Transparent pricing based on market rates</p>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 hover:shadow-lg transition-all">
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Instant Payment</h3>
              <p className="text-sm text-gray-500">Get paid immediately via UPI or bank transfer</p>
            </div>
          </div>
        </div>
      </section>

      {/* Android App Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Download className="w-4 h-4" />
                Now Available on Android
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Download Our App for Faster Experience
              </h2>
              <p className="text-xl text-emerald-100 mb-8">
                Get instant quotes, track your pickups, and manage everything from your phone. 
                Available now on Google Play Store.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6" />
                  <span>Instant price quotes</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6" />
                  <span>Real-time pickup tracking</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6" />
                  <span>Push notifications for updates</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6" />
                  <span>Exclusive app-only offers</span>
                </li>
              </ul>
              <a 
                href="https://play.google.com/store" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-900 transition-colors"
              >
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                </svg>
                <div className="text-left">
                  <p className="text-xs text-gray-300">GET IT ON</p>
                  <p className="font-semibold">Google Play</p>
                </div>
              </a>
            </div>
            <div className="relative flex justify-center">
              <div className="w-64 h-[500px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] flex items-center justify-center">
                  <div className="text-center">
                    <Apple className="w-16 h-16 mx-auto mb-4 text-white/80" />
                    <p className="text-white font-bold text-xl">BuyBack Elite</p>
                    <p className="text-white/60 text-sm">App Preview</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">Everything you need to know</p>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-semibold text-gray-900">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 text-gray-600">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Sell Your Device?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Get your instant quote now and experience the best buyback service in India.
          </p>
          <button 
            onClick={() => navigate('/sell')}
            className="bg-white text-indigo-600 px-10 py-4 rounded-full font-bold text-lg hover:shadow-xl transition-all"
          >
            Get Started - It's Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Apple className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">BuyBack Elite</span>
              </div>
              <p className="text-gray-400 mb-6">
                India's most trusted platform for selling MacBooks and iPads. Best prices, instant payment.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-indigo-600 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-indigo-600 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                <li><Link to="/about-us" className="hover:text-white transition-colors">About Us</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Devices We Buy</h4>
              <ul className="space-y-3 text-gray-400">
                <li>MacBook Air</li>
                <li>MacBook Pro</li>
                <li>iPad Pro</li>
                <li>iPad Air</li>
                <li>iPad Mini</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contact Us</h4>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>support@buybackelite.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>+91 98765 43210</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>Mumbai, India</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-gray-500">&copy; 2026 BuyBack Elite. All rights reserved.</p>
              <div className="flex items-center gap-6 text-gray-400">
                <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
                <Link to="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
