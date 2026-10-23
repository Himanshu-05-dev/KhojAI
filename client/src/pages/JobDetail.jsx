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
    const curr = salary.currency === 'USD' ? '$' : (salary.currency || '$')
    if (salary.min && salary.max) {
      return `${curr}${salary.min.toLocaleString()} - ${curr}${salary.max.toLocaleString()}/${salary.period || 'yr'}`
    }
    if (salary.min) {
      return `From ${curr}${salary.min.toLocaleString()}/${salary.period || 'yr'}`
    }
  }
  return null
}

function ScoreBar({ label, score, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-navy-600">{label}</span>
        <span className={`font-semibold ${color}`}>{score}%</span>
      </div>
      <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color.replace('text-', 'bg-')}`} style={{ width: `${score}%` }} />
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

  const applyMut = useMutation({
    mutationFn: () => applicationsAPI.create({ jobId: id, status: 'Interested' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications-count'] })
      toast.success('Added to your application tracker!')
      setApplying(false)
    },
    onError: () => toast.error('Failed to add to tracker'),
  })

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
              <Building2 size={16} />{job.company}
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
        <div className="flex gap-2 mt-4 flex-wrap">
          {job.applyUrl && (
            <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="btn-primary gap-2">
              Apply on {job.source || 'source'} <ExternalLink size={14} />
            </a>
          )}
          <button onClick={() => applyMut.mutate()} disabled={applyMut.isPending} className="btn-secondary gap-2">
            <ClipboardList size={15} />
            {applyMut.isPending ? 'Adding…' : 'Track application'}
          </button>
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
            <div className="text-sm text-navy-600 leading-relaxed whitespace-pre-wrap prose-sm">
              {job.description || 'No description available.'}
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
                  <ScoreBar key={k} label={formatKey(k)} score={Math.round(v)} color={matchColor} />
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
  return k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())
}
