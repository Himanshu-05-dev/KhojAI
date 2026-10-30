import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  CheckCheck,
  Check,
  Briefcase,
  Clock,
  Filter,
  X,
  Loader2,
  Inbox,
  Trash2,
  ExternalLink,
  Sparkles,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react'
import { notificationsAPI } from '@/api'
import { useNotificationStore } from '@/store'
import { formatDistanceToNow } from 'date-fns'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const FILTERS = [
  { id: 'All', label: 'All Updates' },
  { id: 'Unread', label: 'Unread' },
  { id: 'job_match', label: '💼 Job Matches' },
  { id: 'deadline_reminder', label: '⏰ Deadlines' },
  { id: 'system', label: '🔔 System' },
]

export default function InboxPage() {
  const [filter, setFilter] = useState('All')
  const qc = useQueryClient()
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount)
  const navigate = useNavigate()

  const params = {
    type: filter === 'All' || filter === 'Unread' ? undefined : filter,
    unreadOnly: filter === 'Unread' ? true : undefined,
    limit: 50,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationsAPI.list(params),
    refetchInterval: 30000,
  })

  const { data: countData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => notificationsAPI.unreadCount(),
    refetchInterval: 15000,
  })

  useEffect(() => {
    const count = countData?.data?.count ?? countData?.data?.data?.count
    if (typeof count === 'number') {
      setUnreadCount(count)
    }
  }, [countData, setUnreadCount])

  const markReadMut = useMutation({
    mutationFn: (id) => notificationsAPI.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notifications-preview'] })
      qc.invalidateQueries({ queryKey: ['unread-count'] })
    },
  })

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

  const deleteMut = useMutation({
    mutationFn: (id) => notificationsAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notifications-preview'] })
      qc.invalidateQueries({ queryKey: ['unread-count'] })
      toast.success('Notification removed')
    },
  })

  const rawNotifications = data?.data?.notifications || data?.data?.data || data?.data || []
  const notifications = Array.isArray(rawNotifications) ? rawNotifications : []
  const unread = countData?.data?.count ?? countData?.data?.data?.count ?? 0

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold text-navy-900">Notification Center</h1>
            {unread > 0 && (
              <span className="text-xs font-semibold bg-red-500 text-white rounded-full px-2.5 py-0.5 shadow-xs">
                {unread} unread
              </span>
            )}
          </div>
          <p className="text-sm text-navy-500 mt-1">
            Real-time career match alerts, application deadlines, and agent updates
          </p>
        </div>

        {unread > 0 && (
          <button
            onClick={() => markAllMut.mutate()}
            disabled={markAllMut.isPending}
            className="btn-secondary btn-sm gap-2 text-navy-700 hover:text-primary-600 shadow-2xs"
          >
            {markAllMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={15} />}
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 bg-surface-100 p-1.5 rounded-2xl overflow-x-auto scrollbar-none border border-surface-200/50">
        {FILTERS.map((f) => {
          const isActive = filter === f.id
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={clsx(
                'px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer',
                isActive
                  ? 'bg-surface-0 text-navy-900 font-semibold shadow-sm'
                  : 'text-navy-500 hover:text-navy-800 hover:bg-surface-200/50'
              )}
            >
              {f.label}
              {f.id === 'Unread' && unread > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-red-100 text-red-600 font-bold text-[10px]">
                  {unread}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Notifications list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card card-body h-24 skeleton" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card card-body flex flex-col items-center py-16 text-center gap-3 bg-surface-50/50 border border-dashed border-surface-300">
          <div className="w-16 h-16 bg-surface-100 rounded-3xl flex items-center justify-center text-navy-300 shadow-inner">
            <Inbox size={32} />
          </div>
          <p className="font-semibold text-navy-800 text-base">No notifications in this view</p>
          <p className="text-sm text-navy-400 max-w-sm leading-relaxed">
            {filter === 'Unread'
              ? 'Great job! You are completely caught up on all alerts.'
              : 'When the AI agent finds verified jobs, internships, or profile insights matching your criteria, alerts will appear right here.'}
          </p>
          {filter !== 'All' && (
            <button
              onClick={() => setFilter('All')}
              className="btn-secondary btn-sm mt-2 text-xs"
            >
              Show all notifications
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <NotificationCard
              key={n._id}
              notification={n}
              onMarkRead={() => markReadMut.mutate(n._id)}
              onDelete={() => deleteMut.mutate(n._id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function NotificationCard({ notification: n, onMarkRead, onDelete }) {
  const navigate = useNavigate()

  const typeConfig = {
    job_match: {
      icon: <Briefcase size={18} className="text-primary-600" />,
      bg: 'bg-primary-50 text-primary-700 border-primary-200',
      label: 'Job Match',
    },
    deadline_reminder: {
      icon: <Clock size={18} className="text-amber-600" />,
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      label: 'Deadline',
    },
    career_tip: {
      icon: <Sparkles size={18} className="text-purple-600" />,
      bg: 'bg-purple-50 text-purple-700 border-purple-200',
      label: 'Career Insight',
    },
    system: {
      icon: <Bell size={18} className="text-sky-600" />,
      bg: 'bg-sky-50 text-sky-700 border-sky-200',
      label: 'System Update',
    },
  }[n.type] || {
    icon: <Bell size={18} className="text-navy-500" />,
    bg: 'bg-surface-100 text-navy-700 border-surface-200',
    label: 'Alert',
  }

  const handleCardClick = () => {
    if (!n.isRead) onMarkRead()
    if (n.jobId || n.data?.jobId) {
      navigate(`/jobs/${n.jobId || n.data?.jobId}`)
    } else if (n.applicationId || n.data?.applicationId) {
      navigate('/applications')
    }
  }

  return (
    <div
      onClick={handleCardClick}
      className={clsx(
        'card card-body p-4 transition-all duration-200 flex items-start gap-3.5 group cursor-pointer relative rounded-2xl',
        !n.isRead
          ? 'bg-primary-50/30 border-primary-200/80 shadow-xs hover:border-primary-300'
          : 'bg-surface-0 hover:bg-surface-50/70 border-surface-200/80 hover:border-surface-300'
      )}
    >
      {/* Icon */}
      <div
        className={clsx(
          'w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5 border shadow-2xs',
          typeConfig.bg
        )}
      >
        {typeConfig.icon}
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 pr-8">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className={clsx('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border', typeConfig.bg)}>
            {typeConfig.label}
          </span>

          {n.data?.matchScore && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              {n.data.matchScore}% Match
            </span>
          )}

          {!n.isRead && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-600 animate-pulse" />
              New
            </span>
          )}
        </div>

        <h3 className={clsx('text-sm leading-snug', !n.isRead ? 'font-bold text-navy-900' : 'font-medium text-navy-800')}>
          {n.title}
        </h3>

        {n.message && (
          <p className="text-xs text-navy-500 mt-1 leading-relaxed">
            {n.message}
          </p>
        )}

        <div className="flex items-center gap-4 mt-2.5 flex-wrap">
          <span className="text-[11px] text-navy-400">
            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
          </span>

          {(n.jobId || n.data?.jobId) && (
            <Link
              to={`/jobs/${n.jobId || n.data?.jobId}`}
              onClick={(e) => {
                e.stopPropagation()
                if (!n.isRead) onMarkRead()
              }}
              className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 hover:underline"
            >
              View Opportunity <ChevronRight size={13} />
            </Link>
          )}

          {(n.applicationId || n.data?.applicationId) && (
            <Link
              to="/applications"
              onClick={(e) => {
                e.stopPropagation()
                if (!n.isRead) onMarkRead()
              }}
              className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 hover:underline"
            >
              View Application <ChevronRight size={13} />
            </Link>
          )}
        </div>
      </div>

      {/* Floating Action Controls */}
      <div className="absolute right-3.5 top-3.5 flex items-center gap-1">
        {!n.isRead && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onMarkRead()
            }}
            className="p-1.5 rounded-xl text-navy-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
            title="Mark as read"
            aria-label="Mark as read"
          >
            <Check size={15} />
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="p-1.5 rounded-xl text-navy-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          title="Delete notification"
          aria-label="Delete notification"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}
