import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Briefcase, Bell, ClipboardList, Bookmark, TrendingUp,
         Upload, ChevronRight, ArrowRight, AlertCircle, Loader2 } from 'lucide-react'
import { jobsAPI, notificationsAPI, applicationsAPI, resumeAPI } from '@/api'
import { useAuthStore, useNotificationStore } from '@/store'
import JobCard from '@/components/jobs/JobCard'
import clsx from 'clsx'

function StatCard({ icon: Icon, label, value, color, to }) {
  const inner = (
    <div className={clsx('card card-body flex items-center gap-4 hover:shadow-card-md transition-shadow', to && 'cursor-pointer')}>
      <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-display font-bold text-navy-900">{value ?? '—'}</p>
        <p className="text-sm text-navy-500">{label}</p>
      </div>
    </div>
  )
  return to ? <Link to={to}>{inner}</Link> : inner
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount)

  const { data: resumeData } = useQuery({ queryKey: ['resumes'], queryFn: () => resumeAPI.list() })
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['recommended-jobs'],
    queryFn: () => jobsAPI.recommended({ limit: 6 }),
  })
  const { data: appsData } = useQuery({ queryKey: ['applications-count'], queryFn: () => applicationsAPI.list({ limit: 1 }) })
  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => notificationsAPI.unreadCount(),
    refetchInterval: 30000,
  })

  useEffect(() => {
    if (unreadData?.data?.data?.count != null) {
      setUnreadCount(unreadData.data.data.count)
    }
  }, [unreadData, setUnreadCount])

  const resumes   = resumeData?.data?.data || []
  const jobs      = jobsData?.data?.data?.jobs || []
  const totalJobs = jobsData?.data?.data?.total || 0
  const appCount  = appsData?.data?.data?.total || 0
  const unread    = unreadData?.data?.data?.count || 0
  const hasResume = resumes.length > 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-900">
            Good {getTimeOfDay()}, {user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-navy-500 mt-1 text-sm">Here's what your career agent found for you.</p>
        </div>
        {!hasResume && (
          <Link to="/resume" className="btn-primary btn-sm gap-2">
            <Upload size={15} /> Upload Resume
          </Link>
        )}
      </div>

      {/* Resume missing banner */}
      {!hasResume && (
        <div className="alert-info flex items-center gap-3">
          <AlertCircle size={18} className="flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Upload your resume to unlock personalized matching</p>
            <p className="text-sm opacity-80 mt-0.5">Without a resume, the agent can't calculate match scores or generate tailored materials.</p>
          </div>
          <Link to="/resume" className="btn-primary btn-sm flex-shrink-0">Upload now</Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Briefcase}    label="Matched jobs"       value={totalJobs}  color="bg-primary-50 text-primary-600"  to="/jobs" />
        <StatCard icon={Bell}         label="Unread alerts"      value={unread}     color="bg-amber-50 text-amber-600"      to="/inbox" />
        <StatCard icon={ClipboardList}label="Applications"       value={appCount}   color="bg-violet-50 text-violet-600"    to="/applications" />
        <StatCard icon={Bookmark}     label="Resumes uploaded"   value={resumes.length} color="bg-emerald-50 text-emerald-600" to="/resume" />
      </div>

      {/* Recommended jobs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-navy-900">Recommended for you</h2>
          <Link to="/jobs" className="text-sm font-medium text-primary-600 hover:underline flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {jobsLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="card h-40 skeleton" />)}
          </div>
        ) : jobs.length === 0 ? (
          <div className="card card-body flex flex-col items-center justify-center py-12 text-center gap-3">
            <Briefcase size={32} className="text-navy-300" />
            <p className="font-medium text-navy-600">No recommendations yet</p>
            <p className="text-sm text-navy-400 max-w-xs">
              {hasResume
                ? 'The discovery agent is searching for matches. Check back soon.'
                : 'Upload your resume to receive personalized job recommendations.'}
            </p>
            <Link to={hasResume ? '/jobs' : '/resume'} className="btn-primary btn-sm mt-1">
              {hasResume ? 'Browse all jobs' : 'Upload Resume'}
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => <JobCard key={job._id} job={job} />)}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { to: '/career-roadmap', icon: TrendingUp, label: 'View Career Roadmap', desc: 'Skill gaps & learning plan', color: 'text-violet-600' },
          { to: '/inbox',          icon: Bell,       label: 'Open Inbox',          desc: `${unread} unread notification${unread !== 1 ? 's' : ''}`, color: 'text-amber-600' },
          { to: '/applications',   icon: ClipboardList, label: 'Track Applications', desc: `${appCount} active application${appCount !== 1 ? 's' : ''}`, color: 'text-primary-600' },
        ].map(({ to, icon: Icon, label, desc, color }) => (
          <Link key={to} to={to} className="card card-body hover:shadow-card-md hover:border-primary-200 transition-all group flex items-center gap-3">
            <Icon size={20} className={clsx(color, 'flex-shrink-0')} />
            <div className="min-w-0">
              <p className="font-medium text-navy-800 text-sm">{label}</p>
              <p className="text-xs text-navy-400 truncate">{desc}</p>
            </div>
            <ChevronRight size={16} className="ml-auto text-navy-300 group-hover:text-navy-500 flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  )
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
