import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, ChevronDown, Trash2, ExternalLink, Calendar,
  ClipboardList, Edit2, Save, X, Loader2, Sparkles,
  RefreshCw, CheckCircle2, ArrowRight
} from 'lucide-react'
import { applicationsAPI } from '@/api'
import { formatDistanceToNow, format } from 'date-fns'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const STATUSES = ['Interested','Saved','Ready to Apply','Applied','Assessment','Interview','Offer','Rejected','Withdrawn']

const statusColors = {
  Interested:    'badge-blue',
  Saved:         'badge-gray',
  'Ready to Apply': 'badge-purple',
  Applied:       'badge-blue',
  Assessment:    'badge-amber',
  Interview:     'badge-amber',
  Offer:         'badge-green',
  Rejected:      'badge-red',
  Withdrawn:     'badge-gray',
}

function AddApplicationModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ company: '', role: '', applyUrl: '', deadline: '', notes: '', status: 'Interested' })
  const [loading, setLoading] = useState(false)
  const handle = async (e) => {
    e.preventDefault()
    if (!form.company || !form.role) { toast.error('Company and role are required'); return }
    setLoading(true)
    try {
      await onCreate({ ...form, jobUrl: form.applyUrl })
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add application')
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="card w-full max-w-md animate-slide-up">
        <div className="card-header flex items-center justify-between">
          <h2 className="font-semibold text-navy-900">Track new application</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>
        <form onSubmit={handle} className="card-body space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Company *</label><input className="input" value={form.company} onChange={e=>setForm({...form,company:e.target.value})} placeholder="Razorpay" /></div>
            <div><label className="label">Role *</label><input className="input" value={form.role} onChange={e=>setForm({...form,role:e.target.value})} placeholder="SDE Intern" /></div>
          </div>
          <div><label className="label">Status</label>
            <select className="input" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
              {STATUSES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div><label className="label">Deadline</label><input type="date" className="input" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})} /></div>
          <div><label className="label">Application URL</label><input type="url" className="input" value={form.applyUrl} onChange={e=>setForm({...form,applyUrl:e.target.value})} placeholder="https://…" /></div>
          <div><label className="label">Notes</label><textarea className="input resize-none" rows={2} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Referral contact, next steps…" /></div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary gap-2">
              {loading && <Loader2 size={14} className="animate-spin" />} Add Application
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AutoUpdateModal({ onClose, onParsed }) {
  const [text, setText] = useState('')
  const [subject, setSubject] = useState('')
  const [loading, setLoading] = useState(false)

  const handleParse = async (sampleText, sampleSubject) => {
    const content = sampleText || text
    const subj = sampleSubject !== undefined ? sampleSubject : subject
    if (!content.trim()) {
      toast.error('Please paste or select a message to analyze')
      return
    }
    setLoading(true)
    try {
      const res = await applicationsAPI.parseEmail({ emailText: content, subject: subj })
      toast.success(res?.data?.message || 'Application updated automatically!')
      onParsed()
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to auto-update application')
    } finally {
      setLoading(false)
    }
  }

  const samples = [
    {
      label: 'Interview Invite',
      company: 'Google',
      subject: 'Interview invitation: Software Engineer at Google',
      body: 'Hi Candidate,\nWe reviewed your application for the Software Engineer role at Google and would love to invite you for a 45-minute technical interview on Nov 8 via Google Meet. Please let us know your availability.'
    },
    {
      label: 'Assessment Link',
      company: 'Razorpay',
      subject: 'Razorpay Online Assessment Invitation',
      body: 'Hello,\nThanks for applying to Razorpay! As the next step, please complete the HackerRank coding challenge within 48 hours.'
    },
    {
      label: 'Offer Letter',
      company: 'Microsoft',
      subject: 'Congratulations: Formal Offer from Microsoft',
      body: 'Dear Candidate,\nWe are pleased to offer you the position of Software Engineer at Microsoft. Your formal offer letter and compensation package details are attached.'
    },
    {
      label: 'Rejection Notice',
      company: 'Amazon',
      subject: 'Update on your application with Amazon',
      body: 'Thank you for your interest in Amazon. Unfortunately, we have decided to move forward with other candidates whose qualifications more closely align with our current needs.'
    }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="card w-full max-w-lg animate-slide-up shadow-xl">
        <div className="card-header flex items-center justify-between border-b border-surface-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="font-semibold text-navy-900 text-base">AI Auto-Update from Message</h2>
              <p className="text-xs text-navy-400">Paste any recruiter email, interview invite, or test link to auto-detect and update your application</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>

        <div className="card-body space-y-4">
          <div>
            <label className="text-xs font-medium text-navy-600 mb-1.5 block">Or test with instant recruiter presets:</label>
            <div className="flex flex-wrap gap-1.5">
              {samples.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => {
                    setSubject(s.subject)
                    setText(s.body)
                    handleParse(s.body, s.subject)
                  }}
                  className="btn-secondary btn-sm text-xs py-1 px-2.5 bg-surface-50 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 transition-colors"
                >
                  ⚡ {s.label} ({s.company})
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label text-xs">Email Subject (optional)</label>
            <input
              className="input text-sm"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Invitation to Interview at Razorpay"
            />
          </div>

          <div>
            <label className="label text-xs">Email / Message Body *</label>
            <textarea
              className="input text-sm resize-none"
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the recruiter's email, rejection notice, or interview scheduling details..."
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button
              type="button"
              onClick={() => handleParse()}
              disabled={loading}
              className="btn-primary gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Analyze & Auto-Update
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ApplicationsPage() {
  const qc          = useQueryClient()
  const [modal, setModal]         = useState(false)
  const [autoModal, setAutoModal] = useState(false)
  const [statusFilter, setStatus] = useState('All')

  const { data, isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn:  () => applicationsAPI.list({ limit: 100 }),
  })

  const createMut = useMutation({
    mutationFn: (d) => applicationsAPI.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['applications'] }); qc.invalidateQueries({ queryKey: ['applications-count'] }); toast.success('Application added!') },
    onError: (err) => { toast.error(err?.response?.data?.message || 'Failed to add application') }
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => applicationsAPI.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] })
      qc.invalidateQueries({ queryKey: ['applications-count'] })
      toast.success('Status updated!')
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id) => applicationsAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['applications'] }); toast.success('Application removed') },
  })

  const autoSyncMut = useMutation({
    mutationFn: () => applicationsAPI.autoSync(),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['applications'] })
      qc.invalidateQueries({ queryKey: ['applications-count'] })
      toast.success(res?.data?.message || 'Pipeline auto-synced!')
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to auto-sync pipeline')
    }
  })

  const all    = data?.data?.applications || data?.data?.data?.applications || []
  const apps   = statusFilter === 'All' ? all : all.filter((a) => a.status === statusFilter)

  const counts = STATUSES.reduce((acc, s) => { acc[s] = all.filter(a => a.status === s).length; return acc }, {})

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-900">Application Tracker</h1>
          <p className="text-navy-500 text-sm mt-0.5">{all.length} application{all.length !== 1 ? 's' : ''} tracked</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => autoSyncMut.mutate()}
            disabled={autoSyncMut.isPending}
            className="btn-secondary btn-sm gap-2"
            title="Auto-sync tracker and review timelines"
          >
            <RefreshCw size={14} className={clsx(autoSyncMut.isPending && 'animate-spin')} />
            {autoSyncMut.isPending ? 'Syncing…' : 'Auto-Sync Pipeline'}
          </button>
          <button
            onClick={() => setAutoModal(true)}
            className="btn-primary btn-sm gap-2 bg-gradient-to-r from-teal-600 to-primary-600 hover:from-teal-700 hover:to-primary-700 shadow-sm"
          >
            <Sparkles size={14} /> AI Auto-Update from Message
          </button>
          <button onClick={() => setModal(true)} className="btn-secondary btn-sm gap-2">
            <Plus size={15} /> Add Application
          </button>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <StatusChip label="All" count={all.length} active={statusFilter === 'All'} onClick={() => setStatus('All')} />
        {STATUSES.filter(s => counts[s] > 0).map(s => (
          <StatusChip key={s} label={s} count={counts[s]} active={statusFilter === s} onClick={() => setStatus(s)} />
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_,i)=><div key={i} className="card h-24 skeleton" />)}</div>
      ) : apps.length === 0 ? (
        <div className="card card-body flex flex-col items-center py-14 text-center gap-3">
          <ClipboardList size={32} className="text-navy-200" />
          <p className="font-medium text-navy-600">No applications yet</p>
          <p className="text-sm text-navy-400 max-w-xs">Track every application you submit. Add them manually or from a job's detail page.</p>
          <div className="flex gap-2 flex-wrap justify-center">
            <button onClick={() => setAutoModal(true)} className="btn-primary btn-sm gap-2 mt-1">
              <Sparkles size={14} /> AI Auto-Update from Email
            </button>
            <button onClick={() => setModal(true)} className="btn-secondary btn-sm gap-2 mt-1">
              <Plus size={14} /> Add first application
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <AppCard key={app._id} app={app}
              onStatusChange={(s) => updateMut.mutate({ id: app._id, data: { status: s } })}
              onDelete={() => { if(confirm('Remove this application?')) deleteMut.mutate(app._id) }}
            />
          ))}
        </div>
      )}

      {modal && <AddApplicationModal onClose={() => setModal(false)} onCreate={(d) => createMut.mutateAsync(d)} />}
      {autoModal && (
        <AutoUpdateModal
          onClose={() => setAutoModal(false)}
          onParsed={() => {
            qc.invalidateQueries({ queryKey: ['applications'] })
            qc.invalidateQueries({ queryKey: ['applications-count'] })
          }}
        />
      )}
    </div>
  )
}

function StatusChip({ label, count, active, onClick }) {
  return (
    <button onClick={onClick} className={clsx(
      'flex-shrink-0 px-3 py-1.5 rounded-xl text-sm font-medium transition-all border',
      active ? 'bg-primary-600 text-white border-primary-600' : 'bg-surface-0 text-navy-600 border-surface-200 hover:border-primary-300'
    )}>
      {label} {count > 0 && <span className={clsx('ml-1 text-xs', active ? 'text-primary-200' : 'text-navy-400')}>({count})</span>}
    </button>
  )
}

function AppCard({ app, onStatusChange, onDelete }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="card card-body space-y-2.5">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={statusColors[app.status] || 'badge-gray'}>{app.status}</span>
            {app.isDemo && <span className="badge-gray text-[10px]">Demo</span>}
          </div>
          <p className="font-semibold text-navy-900 mt-1">{app.role}</p>
          <p className="text-sm text-navy-600">{app.company}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {(app.applyUrl || app.jobUrl) && (
            <a href={app.applyUrl || app.jobUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm p-1.5" title="Open original listing">
              <ExternalLink size={14} />
            </a>
          )}
          <button onClick={() => setOpen(!open)} className="btn-ghost btn-sm p-1.5">
            <ChevronDown size={14} className={clsx('transition-transform', open && 'rotate-180')} />
          </button>
          <button onClick={onDelete} className="btn-ghost btn-sm p-1.5 text-red-400 hover:text-red-600" title="Remove">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-navy-400 flex-wrap">
        {(app.appliedAt || app.appliedDate) && (
          <span className="flex items-center gap-1">
            <Calendar size={11} /> Applied {formatDistanceToNow(new Date(app.appliedAt || app.appliedDate), { addSuffix: true })}
          </span>
        )}
        {app.deadline  && <span className="flex items-center gap-1 text-amber-600"><Calendar size={11} /> Deadline: {format(new Date(app.deadline), 'dd MMM yyyy')}</span>}
      </div>

      {/* 1-Click Fast Progression Bar */}
      <div className="flex items-center gap-1.5 flex-wrap pt-1.5 border-t border-surface-100">
        <span className="text-[11px] text-navy-400 font-medium mr-0.5">Quick update:</span>
        {app.status !== 'Applied' && (
          <button
            onClick={() => onStatusChange('Applied')}
            className="text-[11px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
            title="Mark as Applied"
          >
            → Applied
          </button>
        )}
        {app.status !== 'Screening' && (
          <button
            onClick={() => onStatusChange('Screening')}
            className="text-[11px] px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors"
            title="Move to Screening"
          >
            → Screening
          </button>
        )}
        {app.status !== 'Assessment' && (
          <button
            onClick={() => onStatusChange('Assessment')}
            className="text-[11px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors"
            title="Move to Online Assessment"
          >
            → Assessment
          </button>
        )}
        {app.status !== 'Interview' && (
          <button
            onClick={() => onStatusChange('Interview')}
            className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors font-medium"
            title="Move to Interview"
          >
            → Interview
          </button>
        )}
        {app.status !== 'Offer' && (
          <button
            onClick={() => onStatusChange('Offer')}
            className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors font-semibold"
            title="Move to Offer"
          >
            🎉 Offer
          </button>
        )}
        {app.status !== 'Rejected' && (
          <button
            onClick={() => onStatusChange('Rejected')}
            className="text-[11px] px-2 py-0.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors"
            title="Mark as Rejected"
          >
            ✕ Rejected
          </button>
        )}
      </div>

      {open && (
        <div className="pt-2 border-t border-surface-100 space-y-3 animate-slide-down">
          <div>
            <label className="label text-xs">Update Status</label>
            <select className="input text-sm" value={app.status} onChange={e=>onStatusChange(e.target.value)}>
              {STATUSES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          {app.notes && <div><p className="label text-xs">Notes</p><p className="text-sm text-navy-600 whitespace-pre-line">{app.notes}</p></div>}
          {app.timeline && app.timeline.length > 0 && (
            <div>
              <p className="label text-xs mb-1.5">Timeline History</p>
              <div className="space-y-1.5 pl-2 border-l-2 border-surface-200 text-xs">
                {app.timeline.map((t, idx) => (
                  <div key={idx} className="text-navy-600">
                    <span className="font-semibold text-navy-800">{t.status}</span>
                    <span className="text-navy-400 text-[10px] ml-2">
                      {t.changedAt ? format(new Date(t.changedAt), 'dd MMM yyyy, HH:mm') : ''}
                    </span>
                    {t.note && <p className="text-navy-500 text-[11px]">{t.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
