import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { profileAPI } from '@/api'
import { useAuthStore } from '@/store'
import { Save, Loader2, User, MapPin, Briefcase, Bell } from 'lucide-react'
import toast from 'react-hot-toast'

const LOCATIONS  = ['Bangalore','Mumbai','Delhi','Hyderabad','Pune','Chennai','Remote']
const JOB_TYPES  = ['Internship','Full-time','Part-time','Contract']
const WORK_MODES = ['Remote','Hybrid','On-site']

export default function ProfilePage() {
  const user   = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const [tab, setTab] = useState('personal')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn:  () => profileAPI.get(),
  })

  const profile = data?.data?.data

  const updateMut = useMutation({
    mutationFn: (d) => profileAPI.update(d),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['profile'] })
      setUser(res.data.data.user || user)
      toast.success('Profile updated!')
    },
    onError: () => toast.error('Update failed'),
  })

  const prefsMut = useMutation({
    mutationFn: (d) => profileAPI.updatePreferences(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['profile'] }); toast.success('Preferences saved!') },
    onError:   () => toast.error('Save failed'),
  })

  const [personalForm, setPersonal] = useState(null)
  const [prefsForm, setPrefs]       = useState(null)

  if (isLoading) return <div className="space-y-4">{[...Array(3)].map((_,i) => <div key={i} className="card h-24 skeleton" />)}</div>

  const p = personalForm ?? profile ?? {}
  const f = prefsForm    ?? profile?.preferences ?? {}

  const tabs = [
    { id: 'personal',    label: 'Personal',    icon: User },
    { id: 'preferences', label: 'Job Preferences', icon: Briefcase },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-900">Profile</h1>
        <p className="text-navy-500 text-sm mt-0.5">Manage your personal info and job search preferences</p>
      </div>

      {/* Avatar */}
      <div className="card card-body flex items-center gap-4">
        <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-display font-bold text-xl flex-shrink-0">
          {user?.name?.charAt(0)?.toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-navy-900 text-lg">{user?.name}</p>
          <p className="text-sm text-navy-500">{user?.email}</p>
          <p className="text-xs text-primary-600 mt-0.5 font-medium">{profile?.currentStatus}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 p-1 rounded-xl">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-2 flex-1 justify-center py-2 rounded-lg text-sm font-medium transition-all ${
            tab === id ? 'bg-surface-0 text-navy-900 shadow-card' : 'text-navy-500 hover:text-navy-700'
          }`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === 'personal' && (
        <form onSubmit={(e) => { e.preventDefault(); updateMut.mutate(p) }} className="card card-body space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Full Name</label>
              <input className="input" value={p.name || ''} onChange={e => setPersonal({...p, name: e.target.value})} /></div>
            <div><label className="label">Phone (optional)</label>
              <input className="input" type="tel" value={p.phone || ''} onChange={e => setPersonal({...p, phone: e.target.value})} /></div>
          </div>
          <div><label className="label">LinkedIn URL</label>
            <input className="input" type="url" value={p.linkedinUrl || ''} onChange={e => setPersonal({...p, linkedinUrl: e.target.value})} placeholder="https://linkedin.com/in/…" /></div>
          <div><label className="label">GitHub URL</label>
            <input className="input" type="url" value={p.githubUrl || ''} onChange={e => setPersonal({...p, githubUrl: e.target.value})} placeholder="https://github.com/…" /></div>
          <div><label className="label">Portfolio URL</label>
            <input className="input" type="url" value={p.portfolioUrl || ''} onChange={e => setPersonal({...p, portfolioUrl: e.target.value})} placeholder="https://…" /></div>
          <div><label className="label">Bio (optional)</label>
            <textarea className="input resize-none" rows={3} value={p.bio || ''} onChange={e => setPersonal({...p, bio: e.target.value})} placeholder="Brief professional summary…" /></div>
          <button type="submit" disabled={updateMut.isPending} className="btn-primary gap-2">
            {updateMut.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save Changes
          </button>
        </form>
      )}

      {tab === 'preferences' && (
        <form onSubmit={(e) => { e.preventDefault(); prefsMut.mutate(f) }} className="card card-body space-y-5">
          <div>
            <label className="label flex items-center gap-2"><MapPin size={14} /> Preferred Locations</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {LOCATIONS.map(loc => (
                <button type="button" key={loc}
                  onClick={() => {
                    const locs = f.locations || []
                    setPrefs({...f, locations: locs.includes(loc) ? locs.filter(l=>l!==loc) : [...locs, loc]})
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${
                    (f.locations||[]).includes(loc) ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-surface-200 text-navy-600 hover:border-primary-300'
                  }`}
                >{loc}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Job Types</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {JOB_TYPES.map(t => (
                <button type="button" key={t}
                  onClick={() => {
                    const types = f.jobTypes || []
                    setPrefs({...f, jobTypes: types.includes(t) ? types.filter(x=>x!==t) : [...types, t]})
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${
                    (f.jobTypes||[]).includes(t) ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-surface-200 text-navy-600 hover:border-primary-300'
                  }`}
                >{t}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Work Mode</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {WORK_MODES.map(m => (
                <button type="button" key={m}
                  onClick={() => {
                    const modes = f.workModes || []
                    setPrefs({...f, workModes: modes.includes(m) ? modes.filter(x=>x!==m) : [...modes, m]})
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${
                    (f.workModes||[]).includes(m) ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-surface-200 text-navy-600 hover:border-primary-300'
                  }`}
                >{m}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Minimum Stipend / Salary (₹/month)</label>
            <input type="number" className="input" value={f.minSalary || ''} onChange={e => setPrefs({...f, minSalary: e.target.value})} placeholder="e.g. 20000" />
          </div>

          <div>
            <label className="label">Target Roles (comma-separated)</label>
            <input className="input" value={(f.targetRoles||[]).join(', ')} onChange={e => setPrefs({...f, targetRoles: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} placeholder="Software Engineer, Backend Developer, Data Analyst" />
          </div>

          <button type="submit" disabled={prefsMut.isPending} className="btn-primary gap-2">
            {prefsMut.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save Preferences
          </button>
        </form>
      )}
    </div>
  )
}
