import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Smartphone, Laptop, Shield, Zap, IndianRupee,
  CheckCircle2, ArrowRight, MapPin, Phone,
  Mail, ChevronDown, Truck, CreditCard, HeadphonesIcon, 
  Download, Apple, Menu, X, Sparkles, BadgeCheck, User
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'

// Scroll reveal hook
function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); observer.unobserve(el) } },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return ref
}

// Reusable reveal wrapper
function Reveal({ children, className = '', type = 'reveal', delay = '' }) {
  const ref = useReveal()
  return <div ref={ref} className={`${type} ${delay} ${className}`}>{children}</div>
}

export default function LandingPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout, checkAuth } = useStore()
  const [openFaq, setOpenFaq] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [devicePrices, setDevicePrices] = useState([])
  const [isLoadingPrices, setIsLoadingPrices] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    checkAuth().finally(() => setAuthChecked(true))
  }, [checkAuth])

  // Navbar scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fetch realtime prices from Supabase
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const { data } = await supabase
          .from('price_engine')
          .select('model_name, base_price, device_type')
          .order('base_price', { ascending: false })
        if (data) {
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
    const channel = supabase
      .channel('price_engine_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'price_engine' }, () => fetchPrices())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const features = [
    { icon: IndianRupee, title: 'Best Prices', desc: 'Up to 40% more than competitors. Transparent pricing, no hidden fees.' },
    { icon: Zap, title: 'Instant Quote', desc: 'Know your device value in under 60 seconds.' },
    { icon: Truck, title: 'Free Pickup', desc: 'Verified agents pick up from your doorstep.' },
    { icon: CreditCard, title: 'Same Day Payment', desc: 'Instant UPI or bank transfer on the spot.' },
    { icon: Shield, title: 'Data Security', desc: 'Secure factory reset done in front of you.' },
    { icon: HeadphonesIcon, title: '24/7 Support', desc: 'Dedicated team ready to help anytime.' },
  ]

  const steps = [
    { num: '01', title: 'Get Quote', desc: 'Select device model & answer condition questions.', icon: Sparkles },
    { num: '02', title: 'Schedule Pickup', desc: 'Pick a time slot. Agent comes to you.', icon: Truck },
    { num: '03', title: 'Get Paid', desc: 'Device verified on spot. Instant payment.', icon: IndianRupee },
  ]

  const faqs = [
    { q: 'How do you determine the price?', a: 'We evaluate based on device model, storage, condition, and current market rates. Our system ensures you get the best competitive price.' },
    { q: 'Is my data safe?', a: 'Absolutely! Our agents perform a secure factory reset in front of you. Your data is completely wiped before we take the device.' },
    { q: 'How long does pickup take?', a: 'The entire process takes 15-20 minutes. Our agent verifies condition and processes payment on the spot.' },
    { q: 'What payment methods?', a: 'We support instant UPI payments (GPay, PhonePe, Paytm) and direct bank transfers. Payment within minutes.' },
    { q: 'What if my device has issues?', a: 'No problem! We buy devices in all conditions. Price is adjusted transparently based on actual condition.' },
  ]

  const formatPrice = (price) => {
    if (!price) return '₹0'
    return '₹' + Math.round(price).toLocaleString('en-IN')
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* ==================== NAVIGATION ==================== */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass shadow-lg shadow-black/5' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
                <Apple className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-extrabold text-gradient">BuyBack Elite</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {['Features', 'How It Works', 'Pricing', 'FAQ'].map(item => (
                <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 rounded-full hover:bg-indigo-50/50 transition-all">
                  {item}
                </a>
              ))}
            </div>
            <div className="hidden sm:flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <button onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 font-medium px-4 py-2 rounded-full hover:bg-indigo-50/50 transition-all text-sm">
                    <User className="w-4 h-4" /> Dashboard
                  </button>
                  <button onClick={() => navigate('/dashboard/sell')}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-full font-semibold text-sm hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all">
                    Sell Now
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-600 hover:text-indigo-600 font-medium px-4 py-2 rounded-full hover:bg-indigo-50/50 transition-all text-sm">Login</Link>
                  <button onClick={() => navigate('/dashboard/sell')}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-full font-semibold text-sm hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all">
                    Sell Now
                  </button>
                </>
              )}
            </div>
            <button className="sm:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
          {mobileMenuOpen && (
            <div className="sm:hidden py-4 space-y-1 border-t border-gray-100/50 animate-fade-in-up">
              {['Features', 'How It Works', 'Pricing', 'FAQ'].map(item => (
                <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                  className="block px-4 py-2.5 text-gray-600 hover:bg-indigo-50 rounded-xl text-sm font-medium"
                  onClick={() => setMobileMenuOpen(false)}>{item}</a>
              ))}
              <div className="pt-3 border-t border-gray-100 space-y-2">
                {isAuthenticated ? (
                  <button onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false) }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-gray-700 font-medium hover:bg-indigo-50 rounded-xl text-sm">
                    <User className="w-4 h-4" /> Dashboard
                  </button>
                ) : (
                  <Link to="/login" className="block px-4 py-2.5 text-gray-700 font-medium hover:bg-indigo-50 rounded-xl text-sm" onClick={() => setMobileMenuOpen(false)}>Login</Link>
                )}
                <button onClick={() => { navigate('/dashboard/sell'); setMobileMenuOpen(false) }}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm">
                  Sell Now
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ==================== HERO SECTION ==================== */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-32 overflow-hidden">
        {/* Background mesh gradient */}
        <div className="absolute inset-0 gradient-mesh" />
        {/* Animated blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-300/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl animate-blob" style={{ animationDelay: '2s' }} />
        <div className="absolute top-40 right-1/3 w-64 h-64 bg-pink-200/15 rounded-full blur-3xl animate-blob" style={{ animationDelay: '4s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left - Text */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 animate-fade-in-up">
                <Sparkles className="w-3.5 h-3.5" />
                #1 Apple Device Buyback in India
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-extrabold text-gray-900 leading-[1.1] mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                Sell Your{' '}
                <span className="text-gradient animate-gradient">MacBook & iPad</span>
                <br className="hidden sm:block" />
                {' '}at Best Prices
              </h1>
              <p className="text-lg text-gray-500 mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                Instant quotes, free doorstep pickup, and same-day payment. The smartest way to sell your Apple devices.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <button onClick={() => navigate('/dashboard/sell')}
                  className="group bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-7 py-3.5 rounded-full font-bold text-base hover:shadow-xl hover:shadow-indigo-500/25 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                  Get Instant Quote
                  <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
                </button>
                <a href="#how-it-works"
                  className="flex items-center justify-center gap-2 text-gray-600 font-semibold px-6 py-3.5 rounded-full border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all text-base">
                  How It Works
                </a>
              </div>
              <div className="mt-10 flex items-center gap-5 justify-center lg:justify-start animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>Verified & Secure</span>
                </div>
                <div className="w-1 h-1 bg-gray-300 rounded-full" />
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Instant Payment</span>
                </div>
                <div className="w-1 h-1 bg-gray-300 rounded-full hidden sm:block" />
                <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
                  <Truck className="w-4 h-4 text-blue-500" />
                  <span>Free Pickup</span>
                </div>
              </div>
            </div>

            {/* Right - Floating 3D Card */}
            <div className="relative hidden lg:flex justify-center animate-fade-in-right" style={{ animationDelay: '0.4s', perspective: '1000px' }}>
              {/* Glow behind card */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-[80px] scale-75" />
              
              <div className="relative animate-float">
                <div className="bg-white rounded-3xl shadow-2xl p-7 w-[340px] border border-gray-100/80"
                  style={{ transform: 'rotateY(-5deg) rotateX(3deg)', transformStyle: 'preserve-3d' }}>
                  <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0 animate-shimmer" />
                  </div>
                  <div className="text-center mb-5">
                    <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-[11px] font-semibold mb-3">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      Live Quote
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">MacBook Air M1</h3>
                    <p className="text-gray-400 text-sm mt-0.5">256GB • 8GB • Good Condition</p>
                  </div>
                  <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-gradient rounded-2xl p-5 text-center text-white mb-5 relative overflow-hidden">
                    <p className="text-indigo-200 text-xs mb-1 font-medium">Your Device Value</p>
                    <p className="text-4xl font-extrabold tracking-tight">₹52,000</p>
                  </div>
                  <div className="space-y-3">
                    {['Free doorstep pickup', 'Same day UPI payment', 'Secure data wipe'].map((t, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-gray-500 text-sm">
                        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => navigate('/dashboard/sell')}
                    className="w-full mt-5 bg-gray-900 text-white py-3 rounded-xl font-semibold text-sm hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                    Sell Your Device <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Small floating badge */}
              <div className="absolute -left-4 top-1/4 animate-float-delay">
                <div className="glass rounded-2xl px-4 py-3 shadow-lg flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Verified</p>
                    <p className="text-[10px] text-gray-400">Trusted Platform</p>
                  </div>
                </div>
              </div>
              <div className="absolute -right-2 bottom-1/4 animate-float-slow">
                <div className="glass rounded-2xl px-4 py-3 shadow-lg flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Instant</p>
                    <p className="text-[10px] text-gray-400">Same Day Pay</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Hero Card */}
            <div className="lg:hidden animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="bg-white rounded-2xl shadow-xl p-5 border border-gray-100 max-w-sm mx-auto">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">MacBook Air M1</h3>
                  <p className="text-gray-400 text-sm">256GB • Good Condition</p>
                </div>
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 text-center text-white">
                  <p className="text-indigo-200 text-xs mb-0.5">Get up to</p>
                  <p className="text-3xl font-extrabold">₹52,000</p>
                </div>
                <button onClick={() => navigate('/dashboard/sell')}
                  className="w-full mt-4 bg-gray-900 text-white py-3 rounded-xl font-semibold text-sm">
                  Get Your Quote <ArrowRight className="w-4 h-4 inline ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== TRUST BAR ==================== */}
      <Reveal className="py-10 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: BadgeCheck, title: 'Verified Agents', sub: 'Background checked', color: 'from-indigo-500 to-purple-600' },
              { icon: Zap, title: 'Instant Payment', sub: 'UPI / Bank Transfer', color: 'from-amber-500 to-orange-600' },
              { icon: Shield, title: 'Data Security', sub: 'Secure wipe included', color: 'from-emerald-500 to-teal-600' },
              { icon: Truck, title: 'Free Pickup', sub: 'At your doorstep', color: 'from-blue-500 to-cyan-600' },
            ].map((item, i) => (
              <div key={i} className="text-center group">
                <div className={`w-11 h-11 mx-auto mb-2.5 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <p className="font-bold text-gray-900 text-sm">{item.title}</p>
                <p className="text-xs text-gray-400">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ==================== FEATURES ==================== */}
      <section id="features" className="py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-14">
            <p className="text-indigo-600 font-semibold text-sm uppercase tracking-wider mb-3">Why Choose Us</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Everything You Need to <span className="text-gradient">Sell Smart</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              The simplest, safest, and best-value way to sell your Apple devices.
            </p>
          </Reveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <Reveal key={i} delay={`stagger-${i + 1}`}>
                <div className="group bg-white rounded-2xl p-6 border border-gray-100 card-hover h-full">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-indigo-500/20 transition-all">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section id="how-it-works" className="relative py-20 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 gradient-dark noise-overlay" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-14">
            <p className="text-indigo-400 font-semibold text-sm uppercase tracking-wider mb-3">Simple Process</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Three Steps to Get Paid
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Sell your device in under 24 hours. It's that simple.
            </p>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <Reveal key={i} delay={`stagger-${i + 1}`}>
                <div className="relative group">
                  <div className="glass-dark rounded-2xl p-7 hover:bg-white/[0.08] transition-all h-full">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <step.icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-4xl font-extrabold text-white/10">{step.num}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                  {i < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 z-10">
                      <ArrowRight className="w-6 h-6 text-white/20" />
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="text-center mt-12">
            <button onClick={() => navigate('/dashboard/sell')}
              className="bg-white text-gray-900 px-8 py-3.5 rounded-full font-bold text-base hover:shadow-xl hover:-translate-y-0.5 transition-all">
              Start Selling Now
            </button>
          </Reveal>
        </div>
      </section>

      {/* ==================== PRICING ==================== */}
      <section id="pricing" className="py-20 sm:py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-14">
            <p className="text-indigo-600 font-semibold text-sm uppercase tracking-wider mb-3">Live Prices</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              We Buy All Apple Devices
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Real-time pricing from our engine. Get your personalized quote in seconds.
            </p>
          </Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoadingPrices ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-100 rounded w-20 mb-2" />
                      <div className="h-5 bg-gray-100 rounded w-16" />
                    </div>
                  </div>
                </div>
              ))
            ) : devicePrices.length > 0 ? (
              devicePrices.map((device, i) => (
                <Reveal key={i} delay={`stagger-${i + 1}`}>
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 card-hover group cursor-pointer"
                    onClick={() => navigate('/dashboard/sell')}>
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center group-hover:from-indigo-50 group-hover:to-purple-50 transition-all">
                        {device.type === 'MacBook' ? (
                          <Laptop className="w-6 h-6 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                        ) : (
                          <Smartphone className="w-6 h-6 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">{device.name}</h3>
                        <p className="text-indigo-600 font-semibold text-sm">Up to {formatPrice(device.price)}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-400">
                <Laptop className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Loading prices...</p>
              </div>
            )}
          </div>
          <Reveal className="text-center mt-10">
            <button onClick={() => navigate('/dashboard/sell')}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3.5 rounded-full font-bold text-base hover:shadow-xl hover:shadow-indigo-500/25 hover:-translate-y-0.5 transition-all">
              Get Your Exact Quote
            </button>
          </Reveal>
        </div>
      </section>

      {/* ==================== APP DOWNLOAD ==================== */}
      <Reveal>
        <section className="py-20 sm:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-700" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 px-4 py-1.5 rounded-full text-xs font-semibold text-white mb-6">
                  <Download className="w-3.5 h-3.5" /> Available on Android
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5 leading-tight">
                  Download the App for a Faster Experience
                </h2>
                <p className="text-lg text-emerald-100 mb-8 leading-relaxed">
                  Instant quotes, real-time tracking, and push notifications — all from your phone.
                </p>
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {['Instant quotes', 'Live tracking', 'Push alerts', 'App-only deals'].map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-white/90 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
                <a href="https://play.google.com/store/apps/details?id=com.buybackelite.app" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-black/80 text-white px-5 py-3 rounded-xl hover:bg-black transition-colors">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                  </svg>
                  <div className="text-left">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Get it on</p>
                    <p className="font-semibold text-sm">Google Play</p>
                  </div>
                </a>
              </div>
              <div className="relative flex justify-center">
                <div className="w-56 h-[420px] bg-gray-900 rounded-[2.5rem] p-2.5 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-700 animate-float-slow">
                  <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2rem] flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <div className="text-center relative z-10">
                      <Apple className="w-12 h-12 mx-auto mb-3 text-white/80" />
                      <p className="text-white font-bold text-lg">BuyBack Elite</p>
                      <p className="text-white/50 text-xs mt-1">Sell Smart. Get More.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ==================== FAQ ==================== */}
      <section id="faq" className="py-20 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-14">
            <p className="text-indigo-600 font-semibold text-sm uppercase tracking-wider mb-3">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Got Questions?
            </h2>
            <p className="text-lg text-gray-500">Everything you need to know about selling with us.</p>
          </Reveal>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <Reveal key={i} delay={`stagger-${Math.min(i + 1, 5)}`}>
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden card-hover">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left">
                    <span className="font-semibold text-gray-900 text-sm pr-4">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180 text-indigo-600' : ''}`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-40' : 'max-h-0'}`}>
                    <div className="px-5 pb-5 text-gray-500 text-sm leading-relaxed">
                      {faq.a}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== CTA ==================== */}
      <Reveal>
        <section className="relative py-20 sm:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-gradient" />
          <div className="absolute inset-0 noise-overlay" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5">
              Ready to Get the Best Price?
            </h2>
            <p className="text-lg text-indigo-100 mb-8 max-w-xl mx-auto">
              Join thousands of happy sellers. Get your instant quote now.
            </p>
            <button onClick={() => navigate('/dashboard/sell')}
              className="bg-white text-indigo-600 px-9 py-3.5 rounded-full font-bold text-base hover:shadow-xl hover:-translate-y-0.5 transition-all">
              Get Started — It's Free
            </button>
          </div>
        </section>
      </Reveal>

      {/* ==================== FOOTER ==================== */}
      <footer className="bg-gray-950 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Apple className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-extrabold">BuyBack Elite</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed mb-5">
                India's most trusted platform for selling MacBooks and iPads.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4 text-gray-300">Quick Links</h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link to="/about-us" className="hover:text-white transition-colors">About Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4 text-gray-300">Devices We Buy</h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li>MacBook Air</li>
                <li>MacBook Pro</li>
                <li>iPad Pro</li>
                <li>iPad Air / Mini</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4 text-gray-300">Contact</h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> support@buybackelite.com</li>
                <li className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> +91 98765 43210</li>
                <li className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Mumbai, India</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-gray-600 text-xs">&copy; 2026 BuyBack Elite. All rights reserved.</p>
            <div className="flex items-center gap-5 text-xs text-gray-600">
              <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/terms-of-service" className="hover:text-white transition-colors">Terms</Link>
              <Link to="/delete-account" className="hover:text-white transition-colors">Delete Account</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
