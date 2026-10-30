import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MapPin, Clock, ExternalLink, Bookmark, BookmarkCheck,
         CheckCircle, XCircle, AlertTriangle, Info, ThumbsUp, ThumbsDown,
         Building2, Loader2, ClipboardList } from 'lucide-react'
import { jobsAPI, applicationsAPI } from '@/api'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { useState } from 'react'
import clsx from 'clsx'

function formatSalary(salary) {
  if (!salary) return null
  if (typeof salary === 'string') return salary
  if (typeof salary === 'object') {
    if (salary.display) return salary.display
    const curr = salary.currency === 'INR' ? '₹' : (salary.currency === 'USD' ? '$' : (salary.currency || '₹'))
    if (salary.min && salary.max) {
      return `${curr}${salary.min.toLocaleString()} - ${curr}${salary.max.toLocaleString()}/${salary.period || 'yr'}`
    }
    if (salary.min) {
      return `From ${curr}${salary.min.toLocaleString()}/${salary.period || 'yr'}`
    }
  }
  return null
}

function cleanCompanyName(company) {
  if (!company) return 'Company'
  return company
    .replace(/class\s*=\s*["'][^"']*["']\s*>?/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[>\s\n\r]+/g, ' ')
    .trim() || 'Company'
}

function cleanJobDescription(desc, job = {}) {
  if (!desc) return 'No description available.'

  // Strip raw HTML tags and stray attributes like class="...", id="...", href="..."
  let text = String(desc)
    .replace(/<br\s*[/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/class\s*=\s*["'][^"']*["']\s*>?/gi, '')
    .replace(/id\s*=\s*["'][^"']*["']\s*>?/gi, '')
    .replace(/href\s*=\s*["'][^"']*["']\s*>?/gi, '')
    .replace(/style\s*=\s*["'][^"']*["']\s*>?/gi, '')
    .replace(/[a-zA-Z0-9_-]+\s*=\s*["'][^"']*["']\s*>?/gi, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')

  // Clean up awkward indentation and excessive spaces per line
  text = text
    .split('\n')
    .map(line => line.replace(/[ \t]+/g, ' ').trim())
    .filter((line, i, arr) => !(line === '' && arr[i - 1] === ''))
    .join('\n')
    .trim()

  // Format short targeted synthetic descriptions into a structured presentation
  if (text.startsWith('Targeted opportunity for') || text.startsWith('Live internship opportunity for')) {
    const comp = cleanCompanyName(job.company) || 'Organization'
    const role = job.title || 'Software Developer'
    const loc = job.location || 'India'
    const mode = job.workMode || 'Remote'
    const type = job.jobType || 'Internship'
    const sal = formatSalary(job.salary) || 'Competitive / As per industry standards'
    const skills = job.skills && job.skills.length > 0 ? job.skills.join(', ') : 'Software Engineering, Problem Solving'

    return `${comp} is offering a ${type.toLowerCase()} opportunity for the role of ${role}.\n\n` +
      `Overview:\n` +
      `• Position: ${role}\n` +
      `• Organization: ${comp}\n` +
      `• Location: ${loc} (${mode})\n` +
      `• Compensation / Stipend: ${sal}\n` +
      `• Tech Stack / Skills: ${skills}\n\n` +
      `About the Opportunity:\n` +
      `You will work with the engineering team at ${comp} on real-world projects, gaining practical experience in ${skills}. You'll collaborate on feature implementations, code reviews, and modern development practices.`
  }

  return text
}

function ScoreBar({ label, score }) {
  const safeScore = Math.min(100, Math.max(0, Number(score) || 0))
  const barColor = safeScore >= 75 ? 'bg-emerald-500' : safeScore >= 50 ? 'bg-amber-500' : 'bg-red-500'
  const textColor = safeScore >= 75 ? 'text-emerald-600' : safeScore >= 50 ? 'text-amber-600' : 'text-red-500'

  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-navy-600 font-medium">{label}</span>
        <span className={`font-semibold ${textColor}`}>{safeScore}%</span>
      </div>
      <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${safeScore}%` }}
        />
      </div>
    </div>
  )
}

export default function JobDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [applying, setApplying] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsAPI.get(id),
  })

  const saveMut = useMutation({
    mutationFn: () => job.isSaved ? jobsAPI.unsave(id) : jobsAPI.save(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job', id] })
      toast.success(job.isSaved ? 'Job removed from saved' : 'Job saved!')
    },
  })

  const feedbackMut = useMutation({
    mutationFn: (type) => jobsAPI.feedback(id, { type }),
    onSuccess: (_, type) => toast.success(`Feedback recorded: ${type}`),
  })

  const { data: appsData } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationsAPI.list(),
  })

  const allApps = appsData?.data?.applications || appsData?.data?.data?.applications || []
  const trackedApp = allApps.find(a => String(a.jobId?._id || a.jobId) === String(id))

  const applyMut = useMutation({
    mutationFn: (customData) => applicationsAPI.create({
      jobId: id,
      company: job?.company,
      role: job?.title,
      location: job?.location || 'Remote',
      jobUrl: job?.applyUrl || window.location.href,
      status: customData?.status || (trackedApp ? trackedApp.status : 'Applied'),
      notes: customData?.notes || (trackedApp ? trackedApp.notes : ''),
    }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['applications'] })
      qc.invalidateQueries({ queryKey: ['applications-count'] })
      qc.invalidateQueries({ queryKey: ['applications-overview'] })
      toast.success(res?.data?.message || 'Application tracked automatically!')
      setApplying(false)
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Failed to update tracker'
      toast.error(msg)
    },
  })

  const handleApplyAndAutoTrack = () => {
    if (job?.applyUrl) {
      window.open(job.applyUrl, '_blank', 'noopener,noreferrer')
    }
    applyMut.mutate({
      status: 'Applied',
      notes: `Applied directly on ${job?.source || 'external site'} (${new Date().toLocaleDateString()})`
    })
  }

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 size={28} className="animate-spin text-primary-500" />
    </div>
  )

  if (error || !data?.data?.data) return (
    <div className="card card-body text-center py-16">
      <p className="text-navy-500">Job not found or unavailable.</p>
      <Link to="/jobs" className="btn-primary btn-sm mt-4 inline-flex">Back to Jobs</Link>
    </div>
  )

  const job = data.data.data

  const matchScore = job.matchScore ?? null
  const matchClass = matchScore >= 75 ? 'score-high' : matchScore >= 50 ? 'score-medium' : 'score-low'
  const matchColor = matchScore >= 75 ? 'text-emerald-600' : matchScore >= 50 ? 'text-amber-600' : 'text-red-500'

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="btn-ghost btn-sm gap-2 -ml-2">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Header card */}
      <div className="card card-body">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={clsx('badge', job.jobType === 'Internship' ? 'badge-amber' : 'badge-blue')}>{job.jobType}</span>
              {job.isDemo && <span className="badge-gray text-[10px]">Demo listing — Not a real opportunity</span>}
              {job.source && <span className="badge-gray">{job.source}</span>}
            </div>
            <h1 className="font-display text-2xl font-bold text-navy-900">{job.title}</h1>
            <div className="flex items-center gap-2 mt-1 text-navy-600 font-medium">
              <Building2 size={16} />{cleanCompanyName(job.company)}
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-navy-500 flex-wrap">
              <span className="flex items-center gap-1"><MapPin size={13} />{job.location}</span>
              {formatSalary(job.salary) && <span className="text-emerald-600 font-semibold">{formatSalary(job.salary)}</span>}
              {job.postedAt && (
                <span className="flex items-center gap-1">
                  <Clock size={13} /> {formatDistanceToNow(new Date(job.postedAt), { addSuffix: true })}
                </span>
              )}
            </div>
          </div>
          {matchScore != null && (
            <div className="flex flex-col items-center gap-1">
              <div className={matchClass} style={{ width: 56, height: 56, fontSize: 15 }}>{matchScore}%</div>
              <span className="text-xs text-navy-400">Match score</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 mt-4 flex-wrap items-center">
          {job.applyUrl ? (
            <button
              onClick={handleApplyAndAutoTrack}
              disabled={applyMut.isPending}
              className="btn-primary gap-2"
              title="Open application link and automatically record in tracker as Applied"
            >
              {applyMut.isPending ? <Loader2 size={15} className="animate-spin" /> : <ExternalLink size={15} />}
              Apply on {job.source || 'source'} (Auto-Track)
            </button>
          ) : (
            <button
              onClick={() => applyMut.mutate({ status: 'Applied' })}
              disabled={applyMut.isPending}
              className="btn-primary gap-2"
            >
              <CheckCircle size={15} /> Mark as Applied
            </button>
          )}

          {trackedApp ? (
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-sm font-medium">
              <CheckCircle size={15} className="text-emerald-600" />
              <span>Status:</span>
              <select
                value={trackedApp.status}
                onChange={(e) => applyMut.mutate({ status: e.target.value })}
                className="bg-transparent font-semibold border-none text-emerald-900 focus:ring-0 cursor-pointer text-sm py-0 pl-1 pr-6"
              >
                {['Interested','Saved','Ready to Apply','Applied','Screening','Assessment','Interview','Offer','Rejected','Withdrawn'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          ) : (
            <button
              onClick={() => applyMut.mutate({ status: 'Interested' })}
              disabled={applyMut.isPending}
              className="btn-secondary btn-sm gap-2"
            >
              <ClipboardList size={15} /> Track application
            </button>
          )}

          <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="btn-secondary gap-2">
            {job.isSaved ? <BookmarkCheck size={15} className="text-primary-600" /> : <Bookmark size={15} />}
            {job.isSaved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Description */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card card-body">
            <h2 className="font-semibold text-navy-900 mb-3">Job Description</h2>
            <div className="text-sm text-navy-600 leading-relaxed whitespace-pre-line prose-sm">
              {cleanJobDescription(job.description, job)}
            </div>
          </div>

          {job.requirements?.length > 0 && (
            <div className="card card-body">
              <h2 className="font-semibold text-navy-900 mb-3">Requirements</h2>
              <ul className="space-y-1.5">
                {job.requirements.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-navy-600">
                    <CheckCircle size={14} className="text-primary-400 flex-shrink-0 mt-0.5" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Feedback */}
          <div className="card card-body">
            <h2 className="font-semibold text-navy-900 mb-2 text-sm">Was this recommendation useful?</h2>
            <div className="flex gap-2">
              <button onClick={() => feedbackMut.mutate('positive')} className="btn-secondary btn-sm gap-1.5" disabled={feedbackMut.isPending}>
                <ThumbsUp size={14} /> Yes, relevant
              </button>
              <button onClick={() => feedbackMut.mutate('negative')} className="btn-ghost btn-sm gap-1.5 text-navy-400" disabled={feedbackMut.isPending}>
                <ThumbsDown size={14} /> Not for me
              </button>
            </div>
          </div>
        </div>

        {/* Match sidebar */}
        <div className="space-y-4">
          {/* Match breakdown */}
          {job.matchBreakdown && (
            <div className="card card-body">
              <h2 className="font-semibold text-navy-900 mb-4">Match Breakdown</h2>
              <div className="space-y-3">
                {Object.entries(job.matchBreakdown).map(([k, v]) => (
                  <ScoreBar key={k} label={formatKey(k)} score={Math.round(v)} />
                ))}
              </div>
            </div>
          )}

          {/* Skills match */}
          {job.matchDetails && (
            <div className="card card-body space-y-3">
              <h2 className="font-semibold text-navy-900 text-sm">Skills Analysis</h2>
              {job.matchDetails.matchingSkills?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-emerald-700 mb-1.5 flex items-center gap-1">
                    <CheckCircle size={12} /> Matching skills
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {job.matchDetails.matchingSkills.map((s) => (
                      <span key={s} className="badge-green text-[10px]">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {job.matchDetails.missingSkills?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-red-600 mb-1.5 flex items-center gap-1">
                    <XCircle size={12} /> Skills gap
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {job.matchDetails.missingSkills.map((s) => (
                      <span key={s} className="badge-red text-[10px]">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {job.matchDetails.explanation && (
                <div className="alert-info text-xs">
                  <p className="flex items-start gap-1.5">
                    <Info size={13} className="flex-shrink-0 mt-0.5" />
                    {job.matchDetails.explanation}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Source info */}
          <div className="card card-body text-xs text-navy-500 space-y-1.5">
            <p className="flex items-center gap-1.5"><Info size={12} /> Source: {job.source || 'Unknown'}</p>
            {job.lastVerifiedAt && (
              <p className="flex items-center gap-1.5">
                <Clock size={12} /> Last seen: {formatDistanceToNow(new Date(job.lastVerifiedAt), { addSuffix: true })}
              </p>
            )}
            {job.isDemo && (
              <p className="flex items-center gap-1.5 text-amber-600">
                <AlertTriangle size={12} /> Demo data — not a real job listing
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function formatKey(k) {
  const map = {
    skillsMatch: 'Skills Match',
    experienceMatch: 'Experience Match',
    educationMatch: 'Education Match',
    locationRoleMatch: 'Location / Work Mode',
  }
  return map[k] || k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())
}
