import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, X, Briefcase, ChevronDown, RefreshCw, MapPin, ExternalLink } from 'lucide-react'
import { jobsAPI } from '@/api'
import { useAuthStore } from '@/store'
import JobCard from '@/components/jobs/JobCard'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const JOB_TYPES  = ['All', 'Internship', 'Full-time', 'Part-time', 'Contract']
const LOCATIONS  = ['All', 'Remote', 'Delhi', 'Bengaluru', 'Mumbai', 'Hyderabad', 'Pune', 'Chennai', 'Gurugram', 'Outside India']
const EXP_LEVELS = ['All', 'Fresher', '0-1 years', '1-3 years', '3-5 years']
const SORT_BY    = ['Relevance', 'Match Score', 'Newest', 'Salary']

export default function JobsPage() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const userPreferredLocations = user?.preferences?.locations || []

  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState({
    q:        searchParams.get('q') || '',
    jobType:  'All',
    location: userPreferredLocations[0] || 'All',
    expLevel: 'All',
    sort:     'Relevance',
    page:     1,
    limit:    15,
  })
  const [filtersOpen, setFiltersOpen] = useState(false)

  const syncMut = useMutation({
    mutationFn: () => jobsAPI.syncRealJobs({
      location: filters.location !== 'All' ? filters.location : undefined,
      q: filters.q || undefined,
      jobType: filters.jobType !== 'All' ? filters.jobType : undefined,
    }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['jobs'] })
      qc.invalidateQueries({ queryKey: ['recommended-jobs'] })
      toast.success(`Synced live opportunities! (${res.data?.totalActive || 0} active, ${res.data?.totalInternships || 0} internships)`)
    },
    onError: () => toast.error('Failed to sync live jobs from external sources'),
  })

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) setFilters((f) => ({ ...f, q, page: 1 }))
  }, [searchParams])

  const effectiveLimit = filters.limit === 'All' ? 100 : Number(filters.limit || 15)

  const queryParams = {
    q:        filters.q || undefined,
    jobType:  filters.jobType !== 'All' ? filters.jobType : undefined,
    location: filters.location !== 'All' ? filters.location : undefined,
    expLevel: filters.expLevel !== 'All' ? filters.expLevel : undefined,
    sort:     filters.sort,
    page:     filters.page,
    limit:    effectiveLimit,
  }

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['jobs', queryParams],
    queryFn: () => jobsAPI.list(queryParams),
    keepPreviousData: true,
  })

  const jobs  = data?.data?.data?.jobs  || []
  const total = data?.data?.data?.total || 0
  const pages = data?.data?.data?.pages || data?.data?.data?.totalPages || Math.ceil(total / effectiveLimit) || 1

  const setFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val, page: 1 }))

  const hasActiveFilters = filters.q || filters.jobType !== 'All' || filters.location !== 'All' || filters.expLevel !== 'All'

  const searchQuery = filters.q.trim() || 'Software Engineer'
  const isOutsideIndia = filters.location === 'Outside India'
  const searchLoc = filters.location !== 'All' ? filters.location : (userPreferredLocations[0] || 'India')

  const externalPortals = isOutsideIndia
    ? [
        {
          name: 'Internshala Global',
          badge: '🌍 Global Internships',
          color: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100',
          url: 'https://internshala.com/internships/international-internship/',
        },
        {
          name: 'Amazon Global (US)',
          badge: '📦 Amazon US',
          color: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
          url: `https://www.amazon.jobs/en/search?base_query=${encodeURIComponent(searchQuery)}&country[]=USA&category[]=software-development`,
        },
        {
          name: 'Microsoft Worldwide',
          badge: '🏢 Microsoft US/Global',
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
          url: `https://careers.microsoft.com/professionals/us/en/search-results?keywords=${encodeURIComponent(searchQuery)}&country=United%20States`,
        },
        {
          name: 'Indeed Global',
          badge: '🌐 Worldwide Jobs',
          color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
          url: `https://www.indeed.com/jobs?q=${encodeURIComponent(searchQuery)}&l=Worldwide`,
        },
      ]
    : [
        {
          name: 'Internshala',
          badge: '🎓 Internships',
          color: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100',
          url: `https://internshala.com/internships/${encodeURIComponent(searchQuery.toLowerCase().replace(/\s+/g, '-'))}-internship-in-${encodeURIComponent(searchLoc.toLowerCase().replace(/\s+/g, '-'))}/`,
        },
        {
          name: 'Naukri',
          badge: '💼 Jobs',
          color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
          url: `https://www.naukri.com/${encodeURIComponent(searchQuery.toLowerCase().replace(/\s+/g, '-'))}-jobs-in-${encodeURIComponent(searchLoc.toLowerCase().replace(/\s+/g, '-'))}`,
        },
        {
          name: 'Indeed India',
          badge: '🌐 Live',
          color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
          url: `https://in.indeed.com/jobs?q=${encodeURIComponent(searchQuery)}&l=${encodeURIComponent(searchLoc)}`,
        },
        {
          name: 'Microsoft Careers',
          badge: '🏢 Microsoft',
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
          url: `https://careers.microsoft.com/professionals/us/en/search-results?keywords=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(searchLoc)}`,
        },
        {
          name: 'Amazon Careers',
          badge: '📦 Amazon',
          color: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
          url: `https://www.amazon.jobs/en/search?base_query=${encodeURIComponent(searchQuery + ' ' + searchLoc)}&category[]=software-development`,
        },
      ]

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-900">Job Discovery</h1>
          <p className="text-navy-500 text-sm mt-0.5">
            {isLoading ? 'Searching…' : `${total} opportunit${total !== 1 ? 'ies' : 'y'} found`}
            {filters.location !== 'All' && <span className="font-medium text-primary-600"> in {filters.location}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => syncMut.mutate()}
            disabled={syncMut.isPending}
            className="btn-secondary btn-sm gap-2 text-navy-700 hover:text-primary-600"
            title="Fetch latest live tech jobs and internships from Amazon, Microsoft, Internshala, and Global Portals"
          >
            <RefreshCw size={14} className={clsx(syncMut.isPending && 'animate-spin text-primary-500')} />
            {syncMut.isPending ? 'Syncing Live Jobs…' : 'Sync Live Jobs'}
          </button>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={clsx('btn-secondary btn-sm gap-2', filtersOpen && 'border-primary-400 text-primary-600')}
          >
            <SlidersHorizontal size={15} />
            Filters
            {hasActiveFilters && <span className="w-2 h-2 bg-primary-500 rounded-full" />}
          </button>
        </div>
      </div>

      {/* Location Pills */}
      <div className="flex items-center gap-1.5 flex-wrap text-xs">
        <span className="text-navy-400 flex items-center gap-1 mr-1"><MapPin size={12} /> Locations:</span>
        {['All', ...(userPreferredLocations.length ? userPreferredLocations : ['Bengaluru', 'Delhi', 'Hyderabad', 'Mumbai', 'Remote'])].map((loc) => (
          <button
            key={loc}
            onClick={() => setFilter('location', loc)}
            className={clsx(
              'px-2.5 py-1 rounded-full border transition-all text-xs font-medium',
              filters.location === loc
                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                : 'bg-surface-50 text-navy-600 border-surface-200 hover:bg-surface-100'
            )}
          >
            {loc}
          </button>
        ))}

        {/* Dedicated Outside India Button */}
        <button
          onClick={() => setFilter('location', filters.location === 'Outside India' ? 'All' : 'Outside India')}
          className={clsx(
            'px-3 py-1 rounded-full border transition-all text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer',
            filters.location === 'Outside India'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-200'
              : 'bg-indigo-50/80 text-indigo-700 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300'
          )}
          title="Filter internships and jobs outside India (US, Europe, Singapore, Dubai, Global Remote)"
        >
          <span>🌍</span> Outside India
        </button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
        <input
          type="search"
          id="jobs-search"
          placeholder="Search by role, company, or skill (e.g. SDE Intern, React, Python)…"
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

      {/* Live Portals Quick Search Bar */}
      <div className="p-3 bg-gradient-to-r from-surface-50 to-primary-50/30 rounded-xl border border-surface-200/60 flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs text-navy-600 flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Live Search in <strong className="text-navy-800">{searchLoc}</strong>:
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {externalPortals.map((portal) => (
            <a
              key={portal.name}
              href={portal.url}
              target="_blank"
              rel="noopener noreferrer"
              className={clsx('text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1 transition-all shadow-2xs', portal.color)}
              title={`Search ${searchQuery} in ${searchLoc} on ${portal.name}`}
            >
              <span>{portal.badge}</span>
              <span className="font-semibold">{portal.name}</span>
              <ExternalLink size={11} className="opacity-70" />
            </a>
          ))}
        </div>
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
          {/* Results toolbar */}
          <div className="flex items-center justify-between gap-3 flex-wrap text-sm bg-surface-50 p-2.5 rounded-xl border border-surface-200/60">
            <div className="text-xs font-medium text-navy-600">
              Showing <span className="font-bold text-navy-900">{total > 0 ? (filters.page - 1) * effectiveLimit + 1 : 0}–{Math.min(filters.page * effectiveLimit, total)}</span> of <span className="font-bold text-primary-600">{total}</span> total opportunities
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs">
                <span className="text-navy-400 mr-0.5">Show:</span>
                {[15, 30, 50, 'All'].map((lim) => (
                  <button
                    key={lim}
                    onClick={() => setFilter('limit', lim)}
                    className={clsx(
                      'px-2 py-0.5 rounded text-xs font-medium transition-all',
                      filters.limit === lim
                        ? 'bg-primary-600 text-white shadow-xs'
                        : 'bg-surface-100 text-navy-600 hover:bg-surface-200'
                    )}
                  >
                    {lim}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-navy-400">Sort:</span>
                <select
                  value={filters.sort}
                  onChange={(e) => setFilter('sort', e.target.value)}
                  className="input py-0.5 px-2 text-xs h-7 rounded-md"
                >
                  {SORT_BY.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className={clsx('grid md:grid-cols-2 lg:grid-cols-3 gap-4', isFetching && 'opacity-70 pointer-events-none transition-opacity')}>
            {jobs.map((job) => <JobCard key={job._id} job={job} />)}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-4 flex-wrap">
              <button
                onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                disabled={filters.page <= 1}
                className="btn-secondary btn-sm"
              >
                Previous
              </button>
              <div className="flex items-center gap-1 mx-1">
                {[...Array(pages)].map((_, idx) => {
                  const pNum = idx + 1
                  if (pages > 8 && Math.abs(pNum - filters.page) > 2 && pNum !== 1 && pNum !== pages) {
                    if (pNum === 2 || pNum === pages - 1) return <span key={pNum} className="text-navy-300 px-1">…</span>
                    return null
                  }
                  return (
                    <button
                      key={pNum}
                      onClick={() => setFilters((f) => ({ ...f, page: pNum }))}
                      className={clsx(
                        'w-8 h-8 rounded-lg text-xs font-semibold transition-all',
                        filters.page === pNum
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'text-navy-600 hover:bg-surface-100'
                      )}
                    >
                      {pNum}
                    </button>
                  )
                })}
              </div>
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
