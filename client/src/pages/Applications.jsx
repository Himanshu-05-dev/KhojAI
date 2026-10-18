import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, ChevronDown, Trash2, ExternalLink, Calendar, ClipboardList, Edit2, Save, X, Loader2 } from 'lucide-react'
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
    try { await onCreate(form); onClose() } finally { setLoading(false) }
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

export default function ApplicationsPage() {
  const qc          = useQueryClient()
  const [modal, setModal]         = useState(false)
  const [statusFilter, setStatus] = useState('All')

  const { data, isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn:  () => applicationsAPI.list({ limit: 100 }),
  })

  const createMut = useMutation({
    mutationFn: (d) => applicationsAPI.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['applications'] }); qc.invalidateQueries({ queryKey: ['applications-count'] }); toast.success('Application added!') },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => applicationsAPI.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => applicationsAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['applications'] }); toast.success('Application removed') },
  })

  const all    = data?.data?.data?.applications || []
  const apps   = statusFilter === 'All' ? all : all.filter((a) => a.status === statusFilter)

  const counts = STATUSES.reduce((acc, s) => { acc[s] = all.filter(a => a.status === s).length; return acc }, {})

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-900">Application Tracker</h1>
          <p className="text-navy-500 text-sm mt-0.5">{all.length} application{all.length !== 1 ? 's' : ''} tracked</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary btn-sm gap-2">
          <Plus size={15} /> Add Application
        </button>
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
          <button onClick={() => setModal(true)} className="btn-primary btn-sm gap-2 mt-1"><Plus size={14} /> Add first application</button>
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
    <div className="card card-body space-y-2">
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
          {app.applyUrl && (
            <a href={app.applyUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm p-1.5" title="Open original listing">
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
        {app.appliedAt && <span className="flex items-center gap-1"><Calendar size={11} /> Applied {formatDistanceToNow(new Date(app.appliedAt), { addSuffix: true })}</span>}
        {app.deadline  && <span className="flex items-center gap-1 text-amber-600"><Calendar size={11} /> Deadline: {format(new Date(app.deadline), 'dd MMM yyyy')}</span>}
      </div>

      {open && (
        <div className="pt-2 border-t border-surface-100 space-y-3 animate-slide-down">
          <div>
            <label className="label text-xs">Update Status</label>
            <select className="input text-sm" value={app.status} onChange={e=>onStatusChange(e.target.value)}>
              {STATUSES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          {app.notes && <div><p className="label text-xs">Notes</p><p className="text-sm text-navy-600">{app.notes}</p></div>}
        </div>
      )}
    </div>
  )
}
