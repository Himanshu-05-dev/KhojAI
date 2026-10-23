import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck, Check, Briefcase, Clock, Filter, X, Loader2, Inbox } from 'lucide-react'
import { notificationsAPI } from '@/api'
import { useNotificationStore } from '@/store'
import { formatDistanceToNow } from 'date-fns'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

const FILTERS = ['All', 'Unread', 'Job Match', 'Deadline', 'System']

export default function InboxPage() {
  const [filter, setFilter]   = useState('All')
  const qc                    = useQueryClient()
  const setUnreadCount        = useNotificationStore((s) => s.setUnreadCount)

  const params = {
    type: filter === 'All' || filter === 'Unread' ? undefined : filter.toLowerCase().replace(' ', '_'),
    unreadOnly: filter === 'Unread' ? true : undefined,
    limit: 50,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationsAPI.list(params),
    refetchInterval: 60000,
  })

  const { data: countData } = useQuery({
    queryKey: ['unread-count'],
    queryFn:  () => notificationsAPI.unreadCount(),
    refetchInterval: 30000,
  })

  useEffect(() => {
    if (countData?.data?.data?.count != null) setUnreadCount(countData.data.data.count)
  }, [countData, setUnreadCount])

  const markReadMut = useMutation({
    mutationFn: (id) => notificationsAPI.markRead(id),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['notifications'] }); qc.invalidateQueries({ queryKey: ['unread-count'] }) },
  })

  const markAllMut = useMutation({
    mutationFn: () => notificationsAPI.markAllRead(),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['notifications'] }); qc.invalidateQueries({ queryKey: ['unread-count'] }) },
  })

  const rawNotifications = data?.data?.data !== undefined ? data.data.data : (data?.data?.notifications || data?.data)
  const notifications = Array.isArray(rawNotifications)
    ? rawNotifications
    : (Array.isArray(rawNotifications?.notifications) ? rawNotifications.notifications : [])
  const unread        = countData?.data?.data?.count || 0

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-900 flex items-center gap-2">
            Inbox
            {unread > 0 && (
              <span className="text-sm font-semibold bg-red-500 text-white rounded-full px-2 py-0.5">
                {unread}
              </span>
            )}
          </h1>
          <p className="text-sm text-navy-500 mt-0.5">Job alerts and updates from your AI agent</p>
        </div>
        {unread > 0 && (
          <button
            onClick={() => markAllMut.mutate()}
            disabled={markAllMut.isPending}
            className="btn-secondary btn-sm gap-2"
          >
            {markAllMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
            Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-surface-100 p-1 rounded-xl overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
              filter === f
                ? 'bg-surface-0 text-navy-900 shadow-card'
                : 'text-navy-500 hover:text-navy-700'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="card h-20 skeleton" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card card-body flex flex-col items-center py-16 text-center gap-3">
          <div className="w-14 h-14 bg-surface-100 rounded-2xl flex items-center justify-center">
            <Inbox size={28} className="text-navy-300" />
          </div>
          <p className="font-medium text-navy-600">No notifications</p>
          <p className="text-sm text-navy-400 max-w-xs">
            When the agent finds strong matches or your deadlines approach, alerts will appear here — even if you're offline.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotificationItem key={n._id} notification={n} onMarkRead={() => markReadMut.mutate(n._id)} />
          ))}
        </div>
      )}
    </div>
  )
}

function NotificationItem({ notification: n, onMarkRead }) {
  const typeIcon = {
    job_match: <Briefcase size={16} className="text-primary-500" />,
    deadline:  <Clock size={16} className="text-amber-500" />,
    system:    <Bell size={16} className="text-navy-400" />,
  }[n.type] || <Bell size={16} className="text-navy-400" />

  return (
    <div
      className={clsx(
        'card card-body flex items-start gap-3 transition-all',
        !n.isRead && 'border-primary-200 bg-primary-50/30'
      )}
    >
      <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
        !n.isRead ? 'bg-primary-100' : 'bg-surface-100')}>
        {typeIcon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={clsx('text-sm leading-snug', !n.isRead ? 'font-semibold text-navy-900' : 'text-navy-700')}>
          {n.title}
        </p>
        {n.message && (
          <p className="text-xs text-navy-500 mt-0.5 line-clamp-2">{n.message}</p>
        )}
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-[11px] text-navy-400">
            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
          </span>
          {(n.jobId || n.data?.jobId) && (
            <Link to={`/jobs/${n.jobId || n.data?.jobId}`} className="text-[11px] text-primary-600 hover:underline font-medium">
              View job →
            </Link>
          )}
          {(n.applicationId || n.data?.applicationId) && (
            <Link to="/applications" className="text-[11px] text-primary-600 hover:underline font-medium">
              View application →
            </Link>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {!n.isRead && (
          <>
            <span className="w-2 h-2 bg-primary-500 rounded-full" />
            <button
              onClick={onMarkRead}
              className="btn-ghost btn-sm p-1.5 text-navy-400 hover:text-navy-700"
              aria-label="Mark as read"
              title="Mark as read"
            >
              <Check size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
