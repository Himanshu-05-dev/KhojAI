import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Bell,
  Menu,
  CheckCheck,
  Check,
  Trash2,
  Briefcase,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Inbox,
  X,
} from 'lucide-react'
import { useUIStore, useAuthStore, useNotificationStore } from '@/store'
import { notificationsAPI } from '@/api'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function Topbar() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount)

  const [searchVal, setSearchVal] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [dropdownTab, setDropdownTab] = useState('all') // 'all' | 'unread'
  const dropdownRef = useRef(null)
  const navigate = useNavigate()
  const qc = useQueryClient()

  // Globally keep unread count in sync across the entire app
  const { data: countData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => notificationsAPI.unreadCount(),
    enabled: !!token,
    refetchInterval: 15000,
    staleTime: 10000,
  })

  useEffect(() => {
    const count = countData?.data?.count ?? countData?.data?.data?.count
    if (typeof count === 'number') {
      setUnreadCount(count)
    }
  }, [countData, setUnreadCount])

  // Fetch recent preview notifications for the dropdown
  const { data: previewData, isLoading: isLoadingPreview } = useQuery({
    queryKey: ['notifications-preview', dropdownTab],
    queryFn: () => notificationsAPI.list({
      limit: 8,
      unreadOnly: dropdownTab === 'unread' ? true : undefined,
    }),
    enabled: dropdownOpen && !!token,
    staleTime: 5000,
  })

  const rawNotifications = previewData?.data?.notifications || previewData?.data?.data || previewData?.data || []
  const previewList = Array.isArray(rawNotifications) ? rawNotifications : []

  // Close dropdown on outside click or Escape
  useEffect(() => {
    const handleDown = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    const handleKey = (e) => {
      if (e.key === 'Escape') setDropdownOpen(false)
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleDown)
      document.addEventListener('keydown', handleKey)
    }
    return () => {
      document.removeEventListener('mousedown', handleDown)
      document.removeEventListener('keydown', handleKey)
    }
  }, [dropdownOpen])

  // Mark single as read
  const markReadMut = useMutation({
    mutationFn: (id) => notificationsAPI.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notifications-preview'] })
      qc.invalidateQueries({ queryKey: ['unread-count'] })
    },
  })

  // Mark all as read
  const markAllMut = useMutation({
    mutationFn: () => notificationsAPI.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notifications-preview'] })
      qc.invalidateQueries({ queryKey: ['unread-count'] })
      setUnreadCount(0)
      toast.success('All notifications marked as read')
    },
  })

  // Delete notification
  const deleteMut = useMutation({
    mutationFn: (id) => notificationsAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notifications-preview'] })
      qc.invalidateQueries({ queryKey: ['unread-count'] })
    },
  })

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchVal.trim()) {
      navigate(`/jobs?q=${encodeURIComponent(searchVal.trim())}`)
      setSearchVal('')
    }
  }

  const handleNotificationClick = (n) => {
    if (!n.isRead) markReadMut.mutate(n._id)
    setDropdownOpen(false)
    if (n.jobId || n.data?.jobId) {
      navigate(`/jobs/${n.jobId || n.data?.jobId}`)
    } else if (n.applicationId || n.data?.applicationId) {
      navigate('/applications')
    } else {
      navigate('/inbox')
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'job_match':
        return <Briefcase size={15} className="text-primary-600" />
      case 'deadline_reminder':
        return <Clock size={15} className="text-amber-500" />
      case 'career_tip':
        return <Sparkles size={15} className="text-indigo-500" />
      default:
        return <Bell size={15} className="text-navy-500" />
    }
  }

  return (
    <header className="h-16 bg-surface-0 border-b border-surface-200 flex items-center gap-4 px-6 flex-shrink-0 relative z-20">
      <button
        onClick={toggleSidebar}
        className="btn-ghost p-2 rounded-lg text-navy-500 md:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Global Search */}
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
        {/* Notification Bell with Professional Popover */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className={clsx(
              'relative p-2 rounded-xl transition-all outline-none',
              dropdownOpen
                ? 'bg-primary-50 text-primary-600 ring-2 ring-primary-100'
                : 'text-navy-500 hover:bg-surface-100 hover:text-navy-700'
            )}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={20} className={clsx(unreadCount > 0 && 'animate-wiggle')} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold px-1 ring-2 ring-surface-0 shadow-xs animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Interactive Popover Panel */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-surface-0 rounded-2xl shadow-xl border border-surface-200 z-50 overflow-hidden animate-scale-in">
              {/* Header */}
              <div className="p-3.5 border-b border-surface-100 flex items-center justify-between bg-surface-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
                    <Bell size={15} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-navy-900 leading-tight">Notifications</h3>
                    <p className="text-[11px] text-navy-500">
                      {unreadCount > 0 ? `${unreadCount} unread update${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllMut.mutate()}
                      disabled={markAllMut.isPending}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium px-2 py-1 rounded-lg hover:bg-primary-50 transition-colors flex items-center gap-1"
                      title="Mark all as read"
                    >
                      <CheckCheck size={13} />
                      <span className="hidden sm:inline">Mark all read</span>
                    </button>
                  )}
                  <button
                    onClick={() => setDropdownOpen(false)}
                    className="p-1 text-navy-400 hover:text-navy-600 rounded-lg hover:bg-surface-100"
                    title="Close"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="px-3 py-2 border-b border-surface-100 flex items-center gap-1 bg-surface-0">
                <button
                  onClick={() => setDropdownTab('all')}
                  className={clsx(
                    'px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
                    dropdownTab === 'all'
                      ? 'bg-primary-100 text-primary-700 font-semibold'
                      : 'text-navy-500 hover:text-navy-700 hover:bg-surface-100'
                  )}
                >
                  All
                </button>
                <button
                  onClick={() => setDropdownTab('unread')}
                  className={clsx(
                    'px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5',
                    dropdownTab === 'unread'
                      ? 'bg-primary-100 text-primary-700 font-semibold'
                      : 'text-navy-500 hover:text-navy-700 hover:bg-surface-100'
                  )}
                >
                  Unread
                  {unreadCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Notifications List */}
              <div className="max-h-[360px] overflow-y-auto divide-y divide-surface-100 scrollbar-thin">
                {isLoadingPreview ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-3 animate-pulse">
                        <div className="w-8 h-8 rounded-xl bg-surface-200 flex-shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 bg-surface-200 rounded-md w-3/4" />
                          <div className="h-2.5 bg-surface-100 rounded-md w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : previewList.length === 0 ? (
                  <div className="py-10 px-4 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-surface-100 text-navy-400 flex items-center justify-center mx-auto mb-2">
                      <Inbox size={22} />
                    </div>
                    <p className="text-sm font-medium text-navy-700">No notifications</p>
                    <p className="text-xs text-navy-400 mt-0.5">
                      {dropdownTab === 'unread' ? 'You have read all your alerts.' : 'New job matches and career alerts will appear here.'}
                    </p>
                  </div>
                ) : (
                  previewList.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => handleNotificationClick(n)}
                      className={clsx(
                        'p-3 flex items-start gap-3 hover:bg-surface-50 cursor-pointer transition-colors group relative',
                        !n.isRead && 'bg-primary-50/40'
                      )}
                    >
                      {/* Icon */}
                      <div
                        className={clsx(
                          'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 transition-transform group-hover:scale-105',
                          !n.isRead ? 'bg-primary-100' : 'bg-surface-100'
                        )}
                      >
                        {getNotificationIcon(n.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-1.5">
                          <p className={clsx('text-xs leading-snug line-clamp-1', !n.isRead ? 'font-semibold text-navy-900' : 'font-medium text-navy-700')}>
                            {n.title}
                          </p>
                          {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-primary-600 flex-shrink-0" />}
                        </div>
                        {n.message && (
                          <p className="text-[11px] text-navy-500 line-clamp-2 mt-0.5 leading-relaxed">
                            {n.message}
                          </p>
                        )}
                        <span className="text-[10px] text-navy-400 mt-1 block">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </span>
                      </div>

                      {/* Hover action buttons */}
                      <div className="absolute right-2.5 top-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-surface-0/90 rounded-lg p-0.5 shadow-xs">
                        {!n.isRead && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              markReadMut.mutate(n._id)
                            }}
                            className="p-1 rounded text-navy-400 hover:text-primary-600 hover:bg-surface-100"
                            title="Mark as read"
                          >
                            <Check size={13} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteMut.mutate(n._id)
                          }}
                          className="p-1 rounded text-navy-400 hover:text-red-500 hover:bg-surface-100"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-2.5 border-t border-surface-100 bg-surface-50 text-center">
                <Link
                  to="/inbox"
                  onClick={() => setDropdownOpen(false)}
                  className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center justify-center gap-1.5 py-1"
                >
                  <span>Open Full Inbox</span>
                  <ChevronRight size={13} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar */}
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
