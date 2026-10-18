import { Link } from 'react-router-dom'
import { MapPin, Clock, Bookmark, BookmarkCheck, ExternalLink, Building2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { jobsAPI } from '@/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { formatDistanceToNow } from 'date-fns'

function ScoreRing({ score }) {
  const cls = score >= 75 ? 'score-high' : score >= 50 ? 'score-medium' : 'score-low'
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className={cls}>{score}%</div>
      <span className="text-[10px] text-navy-400 font-medium">Match</span>
    </div>
  )
}

export default function JobCard({ job, showSaveToggle = true }) {
  const qc = useQueryClient()
  const saveMut = useMutation({
    mutationFn: () => job.isSaved ? jobsAPI.unsave(job._id) : jobsAPI.save(job._id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recommended-jobs'] })
      qc.invalidateQueries({ queryKey: ['jobs'] })
      toast.success(job.isSaved ? 'Job removed from saved' : 'Job saved!')
    },
    onError: () => toast.error('Something went wrong'),
  })

  const typeColor = {
    Internship: 'badge-amber',
    'Full-time': 'badge-blue',
    'Part-time': 'badge-purple',
    Contract: 'badge-gray',
  }[job.jobType] || 'badge-gray'

  return (
    <div className="card-hover card-body flex flex-col gap-3 group animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className={typeColor}>{job.jobType}</span>
            {job.isDemo && <span className="badge bg-surface-100 text-navy-400 border border-surface-200 text-[10px]">Demo</span>}
            {job.source && <span className="badge-gray text-[10px]">{job.source}</span>}
          </div>
          <h3 className="font-semibold text-navy-900 leading-snug line-clamp-2 group-hover:text-primary-700 transition-colors">
            {job.title}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 text-sm text-navy-600">
            <Building2 size={13} className="flex-shrink-0" />
            <span className="font-medium truncate">{job.company}</span>
          </div>
        </div>
        {job.matchScore != null && <ScoreRing score={job.matchScore} />}
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-navy-500 flex-wrap">
        <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>
        {job.salary && <span className="text-emerald-600 font-semibold">{job.salary}</span>}
        {job.postedAt && (
          <span className="flex items-center gap-1 ml-auto">
            <Clock size={11} />{formatDistanceToNow(new Date(job.postedAt), { addSuffix: true })}
          </span>
        )}
      </div>

      {/* Match highlights */}
      {job.matchHighlights?.length > 0 && (
        <ul className="space-y-1">
          {job.matchHighlights.slice(0, 2).map((h, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-navy-600">
              <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
              {h}
            </li>
          ))}
        </ul>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-surface-100 mt-auto">
        <Link to={`/jobs/${job._id}`} className="btn-primary btn-sm flex-1 justify-center">
          View Details
        </Link>
        {showSaveToggle && (
          <button
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending}
            className="btn-secondary btn-sm px-2.5"
            aria-label={job.isSaved ? 'Unsave job' : 'Save job'}
            title={job.isSaved ? 'Remove from saved' : 'Save job'}
          >
            {job.isSaved
              ? <BookmarkCheck size={15} className="text-primary-600" />
              : <Bookmark size={15} />}
          </button>
        )}
        {job.applyUrl && (
          <a
            href={job.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary btn-sm px-2.5"
            aria-label="Open original listing"
            title="Open original listing"
          >
            <ExternalLink size={15} />
          </a>
        )}
      </div>
    </div>
  )
}
