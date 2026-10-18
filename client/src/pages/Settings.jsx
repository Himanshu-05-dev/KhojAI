import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsAPI } from '@/api'
import { Bell, Mail, Smartphone, Save, Loader2, Shield, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

function Toggle({ id, checked, onChange, label, desc }) {
  return (
    <label htmlFor={id} className="flex items-center justify-between gap-4 cursor-pointer group py-3 border-b border-surface-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-navy-800 group-hover:text-navy-900 transition-colors">{label}</p>
        {desc && <p className="text-xs text-navy-400 mt-0.5">{desc}</p>}
      </div>
      <button
        role="switch"
        id={id}
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${checked ? 'bg-primary-600' : 'bg-surface-200'}`}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </label>
  )
}

export default function SettingsPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['notification-prefs'],
    queryFn:  () => notificationsAPI.getPrefs(),
  })

  const prefs = data?.data?.data || {}
  const [form, setForm] = useState(null)
  const f = form ?? prefs

  const updateMut = useMutation({
    mutationFn: (d) => notificationsAPI.updatePrefs(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notification-prefs'] }); toast.success('Settings saved!') },
    onError: () => toast.error('Save failed'),
  })

  const set = (key, val) => setForm((prev) => ({ ...(prev ?? prefs), [key]: val }))

  if (isLoading) return <div className="space-y-4">{[...Array(3)].map((_,i) => <div key={i} className="card h-20 skeleton" />)}</div>

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-900">Settings</h1>
        <p className="text-navy-500 text-sm mt-0.5">Notification preferences and account settings</p>
      </div>

      {/* In-app notifications */}
      <div className="card card-body">
        <div className="flex items-center gap-2 mb-3">
          <Bell size={16} className="text-primary-500" />
          <h2 className="font-semibold text-navy-900">In-App Notifications</h2>
        </div>
        <Toggle id="notif-job-match"  checked={f.jobMatchAlerts ?? true}    onChange={v => set('jobMatchAlerts', v)}    label="New job matches"         desc="Alert when a strong match is discovered" />
        <Toggle id="notif-deadline"   checked={f.deadlineReminders ?? true}  onChange={v => set('deadlineReminders', v)} label="Deadline reminders"      desc="Reminders 48 hours before application deadlines" />
        <Toggle id="notif-system"     checked={f.systemUpdates ?? true}      onChange={v => set('systemUpdates', v)}     label="System updates"          desc="Agent status, resume analysis completion" />
        <Toggle id="notif-digest"     checked={f.weeklyDigest ?? false}      onChange={v => set('weeklyDigest', v)}      label="Weekly digest"           desc="Summary of top matches every Monday morning" />
      </div>

      {/* Email */}
      <div className="card card-body">
        <div className="flex items-center gap-2 mb-3">
          <Mail size={16} className="text-primary-500" />
          <h2 className="font-semibold text-navy-900">Email Notifications</h2>
        </div>
        <Toggle id="email-enabled"    checked={f.emailEnabled ?? false}      onChange={v => set('emailEnabled', v)}      label="Enable email alerts"     desc="Requires a configured email provider" />
        <Toggle id="email-digest"     checked={f.emailDigest ?? false}       onChange={v => set('emailDigest', v)}       label="Daily digest email"      desc="Summary of new matches each morning" />
      </div>

      {/* Web Push */}
      <div className="card card-body">
        <div className="flex items-center gap-2 mb-3">
          <Smartphone size={16} className="text-primary-500" />
          <h2 className="font-semibold text-navy-900">Web Push Notifications</h2>
        </div>
        <div className="alert-info text-xs mb-3">
          <div className="flex items-start gap-2">
            <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
            <p>Web push requires a secure origin (HTTPS) and browser permission. Works on Chrome, Edge, and Firefox on supported platforms. iOS Safari has limited support.</p>
          </div>
        </div>
        <Toggle id="push-enabled" checked={f.pushEnabled ?? false} onChange={v => set('pushEnabled', v)} label="Enable push notifications" desc="Receive alerts when browser is closed" />
      </div>

      {/* Quiet hours */}
      <div className="card card-body">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={16} className="text-primary-500" />
          <h2 className="font-semibold text-navy-900">Quiet Hours</h2>
        </div>
        <Toggle id="quiet-enabled" checked={f.quietHoursEnabled ?? false} onChange={v => set('quietHoursEnabled', v)} label="Enable quiet hours" desc="Suppress notifications during these times" />
        {f.quietHoursEnabled && (
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div><label className="label text-xs">Start time</label>
              <input type="time" className="input text-sm" value={f.quietStart || '22:00'} onChange={e=>set('quietStart', e.target.value)} /></div>
            <div><label className="label text-xs">End time</label>
              <input type="time" className="input text-sm" value={f.quietEnd || '08:00'} onChange={e=>set('quietEnd', e.target.value)} /></div>
          </div>
        )}
      </div>

      {/* Min match threshold */}
      <div className="card card-body">
        <h2 className="font-semibold text-navy-900 mb-3">Match Threshold</h2>
        <label className="label text-xs">Only notify when match score ≥ {f.minMatchScore ?? 60}%</label>
        <input type="range" min={40} max={95} step={5} value={f.minMatchScore ?? 60}
          onChange={e=>set('minMatchScore', Number(e.target.value))}
          className="w-full accent-primary-600" />
        <div className="flex justify-between text-xs text-navy-400 mt-1">
          <span>40% (more alerts)</span><span>95% (fewer, higher quality)</span>
        </div>
      </div>

      <button
        onClick={() => updateMut.mutate(f)}
        disabled={updateMut.isPending}
        className="btn-primary w-full gap-2"
      >
        {updateMut.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        Save All Settings
      </button>
    </div>
  )
}
