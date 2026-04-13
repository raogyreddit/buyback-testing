import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { 
  LayoutDashboard, 
  Package, 
  History,
  User,
  LogOut,
  Menu,
  X,
  Truck
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { path: '/field-tech', icon: LayoutDashboard, label: 'Dashboard', mobileLabel: 'Home' },
  { path: '/field-tech/pickups', icon: Package, label: 'My Pickups', mobileLabel: 'Pickups' },
  { path: '/field-tech/history', icon: History, label: 'History', mobileLabel: 'History' },
  { path: '/field-tech/profile', icon: User, label: 'Profile', mobileLabel: 'Profile' },
]

export default function Layout() {
  const { agent, logout } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/field-tech/login')
  }

  const displayName = agent?.name || agent?.email?.split('@')[0] || 'Agent'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Collapsible Sidebar - slides in on click */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 shadow-xl
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-agent flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-base font-bold text-primary-600">Agent Panel</h1>
          </div>
          <button className="p-1.5 hover:bg-gray-100 rounded-lg" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <nav className="p-2 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/field-tech'}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm
                ${isActive 
                  ? 'bg-primary-50 text-primary-600 font-semibold' 
                  : 'text-gray-600 hover:bg-gray-100'
                }
              `}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-semibold text-sm">
                {displayName[0]?.toUpperCase() || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{displayName}</p>
              <p className="text-xs text-gray-500 truncate">{agent?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content - full width */}
      <div className="pb-16 lg:pb-0">
        {/* Top bar with menu toggle */}
        <header className="sticky top-0 z-30 h-14 bg-white border-b border-gray-200 flex items-center px-4">
          <button className="p-2 hover:bg-gray-100 rounded-lg mr-3" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-agent flex items-center justify-center">
              <Truck className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm text-primary-600">Agent Panel</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Hi, <strong className="text-gray-800">{displayName}</strong></span>
          </div>
        </header>

        {/* Page content - full width */}
        <main className="p-3 lg:p-4">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 lg:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-14 px-1">
          {navItems.map((item) => {
            const isActive = item.path === '/field-tech' 
              ? location.pathname === '/field-tech' 
              : location.pathname.startsWith(item.path)
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1"
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                <span className={`text-[10px] leading-tight ${isActive ? 'text-primary-600 font-semibold' : 'text-gray-400'}`}>
                  {item.mobileLabel}
                </span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
