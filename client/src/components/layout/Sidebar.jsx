import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Briefcase, Bell, ClipboardList,
  Map, User, Settings, ChevronLeft, ChevronRight, Zap, LogOut
} from 'lucide-react'
import clsx from 'clsx'
import { useUIStore, useAuthStore, useNotificationStore } from '@/store'
import { authAPI } from '@/api'
import toast from 'react-hot-toast'

const navItems = [
  { label: 'Dashboard',      to: '/dashboard',      icon: LayoutDashboard },
  { label: 'My Resume',      to: '/resume',          icon: FileText },
  { label: 'Jobs',           to: '/jobs',            icon: Briefcase },
  { label: 'Inbox',          to: '/inbox',           icon: Bell, badge: true },
  { label: 'Applications',   to: '/applications',    icon: ClipboardList },
  { label: 'Career Roadmap', to: '/career-roadmap',  icon: Map },
  { label: 'Profile',        to: '/profile',         icon: User },
  { label: 'Settings',       to: '/settings',        icon: Settings },
]

export default function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const user = useAuthStore((s) => s.user)
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await authAPI.logout()
    } catch {/* ignore */} finally {
      clearAuth()
      navigate('/auth/login')
      toast.success('Logged out successfully')
    }
  }

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 h-screen bg-surface-0 border-r border-surface-200 flex flex-col',
        'transition-all duration-200 z-30',
        sidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      {/* Logo */}
      <div className={clsx('flex items-center h-16 px-4 border-b border-surface-100', sidebarOpen ? 'gap-3' : 'justify-center')}>
        <div className="flex-shrink-0 w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
          <Zap size={16} className="text-white" />
        </div>
        {sidebarOpen && (
          <span className="font-display font-bold text-navy-900 text-lg">KhojAI</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navItems.map(({ label, to, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(isActive ? 'nav-item-active' : 'nav-item', !sidebarOpen && 'justify-center px-2')
            }
            title={!sidebarOpen ? label : undefined}
          >
            <div className="relative flex-shrink-0">
              <Icon size={18} />
              {badge && unreadCount > 0 && !sidebarOpen && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            {sidebarOpen && (
              <>
                <span className="flex-1 truncate">{label}</span>
                {badge && unreadCount > 0 && (
                  <span className="ml-auto min-w-[20px] h-5 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + Collapse */}
      <div className="border-t border-surface-100 p-2 space-y-1">
        {sidebarOpen && user && (
          <div className="px-3 py-2 rounded-xl bg-surface-50 mb-1">
            <p className="text-xs font-semibold text-navy-800 truncate">{user.name}</p>
            <p className="text-xs text-navy-400 truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={clsx('nav-item w-full text-red-500 hover:bg-red-50 hover:text-red-600', !sidebarOpen && 'justify-center px-2')}
          title={!sidebarOpen ? 'Logout' : undefined}
        >
          <LogOut size={18} />
          {sidebarOpen && <span>Logout</span>}
        </button>
        <button
          onClick={toggleSidebar}
          className={clsx('nav-item w-full text-navy-500', !sidebarOpen && 'justify-center px-2')}
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          {sidebarOpen && <span className="text-xs">Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
