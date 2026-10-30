import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Upload, Target, Bell, CheckCircle, ArrowRight, Loader2 } from 'lucide-react'
import { profileAPI, resumeAPI } from '@/api'
import toast from 'react-hot-toast'
import { useRef } from 'react'

const STEPS = ['Career Preferences', 'Upload Resume', 'Notifications']
const JOB_TYPES  = ['Internship', 'Full-time']
const WORK_MODES = ['Remote', 'Hybrid', 'On-site']
const LOCATIONS  = ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Remote']

export default function OnboardingPage() {
  const [step, setStep]   = useState(0)
  const [prefs, setPrefs] = useState({ targetRoles: '', locations: [], jobTypes: [], workModes: [], minSalary: '' })
  const [notifEnabled, setNotifEnabled] = useState(true)
  const [loading, setLoading] = useState(false)
  const [uploadDone, setUploadDone] = useState(false)
  const fileRef = useRef(null)
  const navigate = useNavigate()

  const toggle = (key, val) => {
    setPrefs((p) => ({
      ...p,
      [key]: p[key].includes(val) ? p[key].filter(x => x !== val) : [...p[key], val],
    }))
  }

  const handlePrefs = async () => {
    setLoading(true)
    try {
      await profileAPI.updatePreferences({
        targetRoles: prefs.targetRoles.split(',').map(s=>s.trim()).filter(Boolean),
        locations: prefs.locations,
        jobTypes: prefs.jobTypes,
        workModes: prefs.workModes,
        minSalary: prefs.minSalary ? Number(prefs.minSalary) : undefined,
      })
      setStep(1)
    } catch {
      toast.error('Failed to save preferences')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (file) => {
    if (!file) return
    if (file.type !== 'application/pdf') { toast.error('PDF only'); return }
    setLoading(true)
    try {
      const form = new FormData(); form.append('resume', file)
      await resumeAPI.upload(form)
      toast.success('Resume uploaded! Analysis queued.')
      setUploadDone(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = async () => {
    setLoading(true)
    try {
      if (notifEnabled) await profileAPI.updatePreferences({ jobMatchAlerts: true, deadlineReminders: true })
      toast.success("You're all set! Discover jobs now.")
      navigate('/dashboard')
    } catch {
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const progress = Math.round(((step) / STEPS.length) * 100)

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <img src="/khojai-icon.png" alt="KhojAI" className="w-9 h-9 rounded-xl object-contain shadow-sm" />
            <span className="font-display font-bold text-navy-900 text-xl tracking-tight">
              Khoj<span className="text-orange-500">AI</span>
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold text-navy-900">Set up your profile</h1>
          <p className="text-navy-500 text-sm mt-1">Takes about 2 minutes</p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-navy-400 mb-2">
            {STEPS.map((s, i) => (
              <span key={s} className={i <= step ? 'text-primary-600 font-semibold' : ''}>{s}</span>
            ))}
          </div>
          <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden">
            <div className="h-full bg-primary-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="card card-body p-8">
          {/* Step 0: Preferences */}
          {step === 0 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <Target size={20} className="text-primary-500" />
                <h2 className="font-semibold text-navy-900 text-lg">Career Preferences</h2>
              </div>
              <div>
                <label className="label">Target Roles (comma-separated)</label>
                <input className="input" placeholder="Software Engineer, Data Analyst, Product Manager"
                  value={prefs.targetRoles} onChange={e=>setPrefs({...prefs, targetRoles: e.target.value})} />
              </div>
              <div>
                <label className="label">Preferred Locations</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {LOCATIONS.map(loc => (
                    <button type="button" key={loc} onClick={() => toggle('locations', loc)}
                      className={`px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${prefs.locations.includes(loc) ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-surface-200 text-navy-600 hover:border-primary-300'}`}>
                      {prefs.locations.includes(loc) && <CheckCircle size={11} className="inline mr-1" />}{loc}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Job Types</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {JOB_TYPES.map(t => (
                    <button type="button" key={t} onClick={() => toggle('jobTypes', t)}
                      className={`px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${prefs.jobTypes.includes(t) ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-surface-200 text-navy-600'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Work Mode</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {WORK_MODES.map(m => (
                    <button type="button" key={m} onClick={() => toggle('workModes', m)}
                      className={`px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${prefs.workModes.includes(m) ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-surface-200 text-navy-600'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handlePrefs} disabled={loading} className="btn-primary w-full gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                Continue <ArrowRight size={16} />
              </button>
              <button onClick={() => setStep(1)} className="btn-ghost w-full text-navy-400 text-sm">
                Skip for now
              </button>
            </div>
          )}

          {/* Step 1: Upload Resume */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <Upload size={20} className="text-primary-500" />
                <h2 className="font-semibold text-navy-900 text-lg">Upload Your Resume</h2>
              </div>
              <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e=>handleUpload(e.target.files[0])} />
              {uploadDone ? (
                <div className="alert-success flex items-center gap-3">
                  <CheckCircle size={18} className="text-emerald-600" />
                  <div>
                    <p className="font-semibold">Resume uploaded!</p>
                    <p className="text-sm opacity-80">AI analysis has been queued.</p>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-surface-300 rounded-2xl p-10 text-center cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition-all"
                >
                  {loading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 size={32} className="animate-spin text-primary-500" />
                      <p className="text-sm text-navy-600">Uploading…</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-500">
                        <Upload size={24} />
                      </div>
                      <p className="font-medium text-navy-700">Click to upload PDF resume</p>
                      <p className="text-xs text-navy-400">Maximum 5MB</p>
                    </div>
                  )}
                </div>
              )}
              <button onClick={() => setStep(2)} className="btn-primary w-full gap-2" disabled={loading}>
                {uploadDone ? 'Continue' : 'Skip for now'} <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Step 2: Notifications */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <Bell size={20} className="text-primary-500" />
                <h2 className="font-semibold text-navy-900 text-lg">Stay Notified</h2>
              </div>
              <p className="text-sm text-navy-500 leading-relaxed">
                KhojAI's background agent continues searching for matches even when you're offline. Enable alerts to be notified of new opportunities.
              </p>
              <div className="space-y-3">
                {[
                  { key: 'jobMatch', label: 'New job match alerts', desc: 'When the agent finds a strong match' },
                  { key: 'deadline', label: 'Application deadline reminders', desc: '48 hours before deadlines' },
                ].map(({ key, label, desc }) => (
                  <label key={key} className="flex items-center gap-3 p-3 rounded-xl border border-surface-200 cursor-pointer hover:border-primary-300 transition-all">
                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-primary-600" />
                    <div>
                      <p className="text-sm font-medium text-navy-800">{label}</p>
                      <p className="text-xs text-navy-400">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              <button onClick={handleFinish} disabled={loading} className="btn-primary w-full gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
