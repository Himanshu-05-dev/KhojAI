import { Link, useNavigate } from 'react-router-dom'
import { Search, Bell, Menu } from 'lucide-react'
import { useUIStore, useAuthStore, useNotificationStore } from '@/store'
import { useState } from 'react'
import clsx from 'clsx'

export default function Topbar() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const user = useAuthStore((s) => s.user)
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const [searchVal, setSearchVal] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchVal.trim()) {
      navigate(`/jobs?q=${encodeURIComponent(searchVal.trim())}`)
      setSearchVal('')
    }
  }

  return (
    <header className="h-16 bg-surface-0 border-b border-surface-200 flex items-center gap-4 px-6 flex-shrink-0">
      <button
        onClick={toggleSidebar}
        className="btn-ghost p-2 rounded-lg text-navy-500 md:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
          <input
            type="search"
            placeholder="Search jobs, companies, skills…"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-surface-200 bg-surface-50 focus:bg-surface-0 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
          />
        </div>
      </form>

      <div className="flex items-center gap-2 ml-auto">
        {/* Notification bell */}
        <Link
          to="/inbox"
          className="relative p-2 rounded-xl hover:bg-surface-100 transition-colors text-navy-500"
          aria-label="Inbox"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold px-0.5">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Avatar */}
        <Link
          to="/profile"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-surface-100 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-xs flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <span className="text-sm font-medium text-navy-700 hidden sm:block max-w-[120px] truncate">
            {user?.name || 'User'}
          </span>
        </Link>
      </div>
    </header>
  )
}
