import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, X, Briefcase, ChevronDown } from 'lucide-react'
import { jobsAPI } from '@/api'
import JobCard from '@/components/jobs/JobCard'
import clsx from 'clsx'

const JOB_TYPES  = ['All', 'Internship', 'Full-time', 'Part-time', 'Contract']
const LOCATIONS  = ['All', 'Remote', 'Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Pune', 'Chennai']
const EXP_LEVELS = ['All', 'Fresher', '0-1 years', '1-3 years', '3-5 years']
const SORT_BY    = ['Relevance', 'Match Score', 'Newest', 'Salary']

export default function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState({
    q:        searchParams.get('q') || '',
    jobType:  'All',
    location: 'All',
    expLevel: 'All',
    sort:     'Relevance',
    page:     1,
  })
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) setFilters((f) => ({ ...f, q }))
  }, [searchParams])

  const queryParams = {
    q:        filters.q || undefined,
    jobType:  filters.jobType !== 'All' ? filters.jobType : undefined,
    location: filters.location !== 'All' ? filters.location : undefined,
    expLevel: filters.expLevel !== 'All' ? filters.expLevel : undefined,
    sort:     filters.sort,
    page:     filters.page,
    limit:    15,
  }

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['jobs', queryParams],
    queryFn: () => jobsAPI.list(queryParams),
    keepPreviousData: true,
  })

  const jobs  = data?.data?.data?.jobs  || []
  const total = data?.data?.data?.total || 0
  const pages = data?.data?.data?.pages || 1

  const setFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val, page: 1 }))

  const hasActiveFilters = filters.q || filters.jobType !== 'All' || filters.location !== 'All' || filters.expLevel !== 'All'

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-900">Job Discovery</h1>
          <p className="text-navy-500 text-sm mt-0.5">
            {isLoading ? 'Searching…' : `${total} opportunit${total !== 1 ? 'ies' : 'y'} found`}
          </p>
        </div>
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={clsx('btn-secondary btn-sm gap-2', filtersOpen && 'border-primary-400 text-primary-600')}
        >
          <SlidersHorizontal size={15} />
          Filters
          {hasActiveFilters && <span className="w-2 h-2 bg-primary-500 rounded-full" />}
        </button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
        <input
          type="search"
          id="jobs-search"
          placeholder="Search by role, company, or skill…"
          value={filters.q}
          onChange={(e) => setFilter('q', e.target.value)}
          className="input pl-10 text-sm"
        />
        {filters.q && (
          <button onClick={() => setFilter('q', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600">
            <X size={15} />
          </button>
        )}
      </div>

      {/* Filters panel */}
      {filtersOpen && (
        <div className="card card-body grid sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-down">
          <div>
            <label className="label text-xs">Job Type</label>
            <FilterSelect options={JOB_TYPES} value={filters.jobType} onChange={(v) => setFilter('jobType', v)} />
          </div>
          <div>
            <label className="label text-xs">Location</label>
            <FilterSelect options={LOCATIONS} value={filters.location} onChange={(v) => setFilter('location', v)} />
          </div>
          <div>
            <label className="label text-xs">Experience</label>
            <FilterSelect options={EXP_LEVELS} value={filters.expLevel} onChange={(v) => setFilter('expLevel', v)} />
          </div>
          <div>
            <label className="label text-xs">Sort by</label>
            <FilterSelect options={SORT_BY} value={filters.sort} onChange={(v) => setFilter('sort', v)} />
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => setFilters({ q: '', jobType: 'All', location: 'All', expLevel: 'All', sort: 'Relevance', page: 1 })}
              className="btn-ghost btn-sm text-red-500 col-span-full justify-start"
            >
              <X size={14} /> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Active filter chips */}
      {hasActiveFilters && !filtersOpen && (
        <div className="flex gap-2 flex-wrap">
          {filters.q && <FilterChip label={`"${filters.q}"`}  onRemove={() => setFilter('q', '')} />}
          {filters.jobType  !== 'All' && <FilterChip label={filters.jobType}  onRemove={() => setFilter('jobType', 'All')} />}
          {filters.location !== 'All' && <FilterChip label={filters.location} onRemove={() => setFilter('location', 'All')} />}
          {filters.expLevel !== 'All' && <FilterChip label={filters.expLevel} onRemove={() => setFilter('expLevel', 'All')} />}
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => <div key={i} className="card h-48 skeleton" />)}
        </div>
      ) : jobs.length === 0 ? (
        <div className="card card-body flex flex-col items-center py-16 text-center gap-3">
          <Briefcase size={36} className="text-navy-200" />
          <p className="font-semibold text-navy-700">No jobs found</p>
          <p className="text-sm text-navy-400 max-w-xs">Try adjusting your filters or search terms. The agent continuously discovers new opportunities.</p>
          <button onClick={() => setFilters({ q: '', jobType: 'All', location: 'All', expLevel: 'All', sort: 'Relevance', page: 1 })} className="btn-primary btn-sm mt-1">
            Reset filters
          </button>
        </div>
      ) : (
        <>
          <div className={clsx('grid md:grid-cols-2 lg:grid-cols-3 gap-4', isFetching && 'opacity-70 pointer-events-none transition-opacity')}>
            {jobs.map((job) => <JobCard key={job._id} job={job} />)}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                disabled={filters.page <= 1}
                className="btn-secondary btn-sm"
              >
                Previous
              </button>
              <span className="text-sm text-navy-600 px-2">
                Page {filters.page} of {pages}
              </span>
              <button
                onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                disabled={filters.page >= pages}
                className="btn-secondary btn-sm"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function FilterSelect({ options, value, onChange }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input appearance-none pr-8 text-sm"
      >
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none" />
    </div>
  )
}

function FilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 badge-blue text-xs px-2.5 py-1">
      {label}
      <button onClick={onRemove} className="hover:text-primary-900" aria-label={`Remove ${label} filter`}>
        <X size={11} />
      </button>
    </span>
  )
}
