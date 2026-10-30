import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { profileAPI, resumeAPI } from '@/api'
import { useAuthStore } from '@/store'
import {
  Save, Loader2, User, MapPin, Briefcase, FileText,
  RefreshCw, Sparkles, ExternalLink, CheckCircle2,
  Code2, GraduationCap, Globe, Phone, Mail, Plus, X,
  ArrowRight, Award
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const PRESET_LOCATIONS = ['Bangalore', 'Mumbai', 'Delhi', 'Noida', 'Gurgaon', 'Hyderabad', 'Pune', 'Chennai', 'Remote']
const JOB_TYPES = ['Internship', 'Full-time', 'Part-time', 'Contract']
const WORK_MODES = ['Remote', 'Hybrid', 'On-site']
const STATUS_OPTIONS = ['Student', 'Fresher', 'Working Professional', 'Career Switcher', 'Other']

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const [tab, setTab] = useState('personal')
  const [customRoleInput, setCustomRoleInput] = useState('')
  const [customLocInput, setCustomLocInput] = useState('')
  const qc = useQueryClient()

  // Fetch current user profile
  const { data: profileRes, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileAPI.get(),
  })

  // Fetch active resume for auto-fill context & skills display
  const { data: resumeRes } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => resumeAPI.list(),
  })

  const rawResumes = (resumeRes?.data && typeof resumeRes.data === 'object')
    ? (resumeRes.data.resumes ?? resumeRes.data.data ?? (resumeRes.data.resume ? [resumeRes.data.resume] : []))
    : []
  const resumes = Array.isArray(rawResumes) ? rawResumes.filter(Boolean) : (rawResumes ? [rawResumes] : [])
  const primaryResume = resumes[0] || null
  const parsedProfile = primaryResume?.parsedProfile || {}
  const hasResume = !!(primaryResume?._id || parsedProfile?.skills?.length || primaryResume?.originalFilename)

  const profile = profileRes?.data?.data?.user || profileRes?.data?.data || profileRes?.data?.user || {}

  // Local form state
  const [personalForm, setPersonal] = useState(null)
  const [prefsForm, setPrefs] = useState(null)

  const p = personalForm ?? profile ?? {}
  const f = prefsForm ?? profile?.preferences ?? {}

  // Mutation to save personal info
  const updateMut = useMutation({
    mutationFn: (d) => {
      const payload = { ...d }
      if (payload.linkedinUrl && !/^https?:\/\//i.test(payload.linkedinUrl.trim())) {
        payload.linkedinUrl = `https://${payload.linkedinUrl.trim()}`
      }
      if (payload.githubUrl && !/^https?:\/\//i.test(payload.githubUrl.trim())) {
        payload.githubUrl = `https://${payload.githubUrl.trim()}`
      }
      if (payload.portfolioUrl && !/^https?:\/\//i.test(payload.portfolioUrl.trim())) {
        payload.portfolioUrl = `https://${payload.portfolioUrl.trim()}`
      }
      return profileAPI.update(payload)
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['profile'] })
      const updatedUser = res.data?.data?.user || res.data?.user || res.data?.data
      if (updatedUser) setUser(updatedUser)
      setPersonal(null)
      toast.success('Profile details saved successfully!')
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0] || 'Update failed'
      toast.error(msg)
    },
  })

  // Mutation to save preferences
  const prefsMut = useMutation({
    mutationFn: (d) => profileAPI.updatePreferences(d),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['profile'] })
      const updatedPrefs = res.data?.data?.preferences || res.data?.preferences || res.data?.data
      if (updatedPrefs && user) {
        setUser({ ...user, preferences: updatedPrefs })
      }
      setPrefs(null)
      toast.success('Job search preferences saved!')
    },
    onError: () => toast.error('Save failed'),
  })

  // Mutation to re-sync profile from active resume
  const syncMut = useMutation({
    mutationFn: () => profileAPI.syncResume(),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['profile'] })
      qc.invalidateQueries({ queryKey: ['resumes'] })
      const updatedUser = res.data?.data?.user || res.data?.user || res.data?.data
      if (updatedUser) setUser(updatedUser)
      setPersonal(null)
      setPrefs(null)
      toast.success('Profile auto-filled from resume details!')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to sync from resume')
    },
  })

  if (profileLoading && !profile?.email) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card h-28 skeleton" />
        ))}
      </div>
    )
  }

  const tabs = [
    { id: 'personal', label: 'Personal Information', icon: User },
    { id: 'preferences', label: 'Job Preferences', icon: Briefcase },
    { id: 'resume', label: 'Resume & Skills Overview', icon: FileText },
  ]

  // Add custom target role tag
  const handleAddRole = (e) => {
    e.preventDefault()
    if (!customRoleInput.trim()) return
    const currentRoles = f.targetRoles || []
    if (!currentRoles.includes(customRoleInput.trim())) {
      setPrefs({ ...f, targetRoles: [...currentRoles, customRoleInput.trim()] })
    }
    setCustomRoleInput('')
  }

  // Add custom location tag
  const handleAddLocation = (e) => {
    e.preventDefault()
    if (!customLocInput.trim()) return
    const currentLocs = f.locations || []
    if (!currentLocs.includes(customLocInput.trim())) {
      setPrefs({ ...f, locations: [...currentLocs, customLocInput.trim()] })
    }
    setCustomLocInput('')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-900">Candidate Profile</h1>
          <p className="text-navy-500 text-sm mt-0.5">
            Manage your personal contact details, verified resume information, and job search filters.
          </p>
        </div>

        {hasResume && (
          <button
            type="button"
            onClick={() => syncMut.mutate()}
            disabled={syncMut.isPending}
            className="btn-secondary btn-sm gap-2 text-xs"
            title="Re-populate empty profile fields from your active resume"
          >
            <RefreshCw size={14} className={clsx(syncMut.isPending && 'animate-spin')} />
            {syncMut.isPending ? 'Syncing...' : 'Sync from Resume'}
          </button>
        )}
      </div>

      {/* Resume Auto-Fill Status Banner */}
      {hasResume ? (
        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0 mt-0.5">
              <Sparkles size={16} />
            </div>
            <div>
              <p className="font-bold text-navy-900 text-sm">
                Auto-filled from resume: <span className="text-emerald-700 font-mono">{primaryResume.originalFilename}</span>
              </p>
              <p className="text-navy-600 mt-0.5 leading-relaxed">
                Contact details, links, education, and target preferences are synchronized with your uploaded resume.
                Any information not found in the resume is left blank for you to customize.
              </p>
            </div>
          </div>
          <Link
            to="/resume"
            className="font-semibold text-emerald-700 hover:text-emerald-800 whitespace-nowrap flex items-center gap-1 hover:underline text-xs flex-shrink-0"
          >
            Resume Studio <ArrowRight size={13} />
          </Link>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0">
              <FileText size={16} />
            </div>
            <div>
              <p className="font-bold text-navy-900 text-sm">No Resume Connected Yet</p>
              <p className="text-navy-600 mt-0.5">
                Upload your resume to automatically extract your verified skills, contact links, and job match score.
              </p>
            </div>
          </div>
          <Link to="/resume" className="btn-primary btn-sm flex-shrink-0">
            Upload Resume
          </Link>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="card card-body flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center text-white font-display font-extrabold text-2xl flex-shrink-0 shadow-sm">
            {(p.name || user?.name || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-navy-900 text-lg">
                {p.name || user?.name || 'Unnamed Candidate'}
              </h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200">
                {p.currentStatus || 'Student'}
              </span>
            </div>
            <p className="text-xs text-navy-500 flex items-center gap-1.5">
              <Mail size={12} /> {user?.email}
              {p.phone && (
                <>
                  <span className="text-navy-300">•</span>
                  <Phone size={12} /> {p.phone}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Quick Social Badges */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {p.linkedinUrl ? (
            <a
              href={p.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-100 hover:bg-surface-200 text-navy-700 font-medium transition-colors"
            >
              LinkedIn <ExternalLink size={11} className="text-navy-400" />
            </a>
          ) : (
            <span className="text-[11px] text-navy-400 italic">No LinkedIn</span>
          )}
          {p.githubUrl ? (
            <a
              href={p.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-100 hover:bg-surface-200 text-navy-700 font-medium transition-colors"
            >
              GitHub <ExternalLink size={11} className="text-navy-400" />
            </a>
          ) : (
            <span className="text-[11px] text-navy-400 italic">No GitHub</span>
          )}
          {p.portfolioUrl ? (
            <a
              href={p.portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-700 font-medium transition-colors"
            >
              Portfolio <ExternalLink size={11} className="text-primary-500" />
            </a>
          ) : (
            <span className="text-[11px] text-navy-400 italic">No Portfolio</span>
          )}
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex gap-1 bg-surface-100 p-1 rounded-xl">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={clsx(
              'flex items-center gap-2 flex-1 justify-center py-2.5 rounded-lg text-xs font-semibold transition-all',
              tab === id
                ? 'bg-white text-navy-900 shadow-sm border border-surface-200/80 font-bold'
                : 'text-navy-500 hover:text-navy-800'
            )}
          >
            <Icon size={14} className={tab === id ? 'text-primary-600' : 'text-navy-400'} />
            {label}
          </button>
        ))}
      </div>

      {/* ─── TAB 1: Personal Details ─── */}
      {tab === 'personal' && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            updateMut.mutate(p)
          }}
          className="card card-body space-y-4"
        >
          <div className="border-b border-surface-100 pb-2">
            <h3 className="font-bold text-navy-900 text-sm">Personal & Contact Information</h3>
            <p className="text-xs text-navy-500">
              Details extracted from your resume. If a field was omitted in your resume, it remains blank here until you fill it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input
                className="input"
                value={p.name || ''}
                onChange={(e) => setPersonal({ ...p, name: e.target.value })}
                placeholder="e.g. Himanshu Gola"
              />
              <p className="text-[10px] text-navy-400 mt-1">Populated from resume header</p>
            </div>

            <div>
              <label className="label">Current Professional Status</label>
              <select
                className="input"
                value={p.currentStatus || 'Student'}
                onChange={(e) => setPersonal({ ...p, currentStatus: e.target.value })}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-navy-400 mt-1">Inferred from graduation year / work experience</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <input
                  className="input bg-surface-50 cursor-not-allowed"
                  type="email"
                  value={user?.email || p.email || ''}
                  disabled
                />
                <span className="absolute right-3 top-2.5 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 size={10} /> Verified
                </span>
              </div>
              <p className="text-[10px] text-navy-400 mt-1">Primary authentication account email</p>
            </div>

            <div>
              <label className="label">Phone Number</label>
              <input
                className="input"
                type="tel"
                value={p.phone || ''}
                onChange={(e) => setPersonal({ ...p, phone: e.target.value })}
                placeholder="e.g. +91 9319072402 (leave blank if none)"
              />
              <p className="text-[10px] text-navy-400 mt-1">
                {p.phone ? 'Extracted from resume' : 'Not given in resume — left blank'}
              </p>
            </div>
          </div>

          <div className="border-t border-surface-100 pt-3 space-y-4">
            <h4 className="font-bold text-navy-900 text-xs uppercase tracking-wider text-navy-600">
              Online Profiles & Portfolio Links
            </h4>

            <div>
              <label className="label flex items-center gap-1.5">
                <Globe size={13} className="text-primary-600" /> LinkedIn URL
              </label>
              <input
                className="input"
                type="text"
                value={p.linkedinUrl || ''}
                onChange={(e) => setPersonal({ ...p, linkedinUrl: e.target.value })}
                placeholder="https://linkedin.com/in/username (leave blank if none)"
              />
              <p className="text-[10px] text-navy-400 mt-1">
                {p.linkedinUrl ? 'Extracted from resume' : 'Not found in resume — left blank'}
              </p>
            </div>

            <div>
              <label className="label flex items-center gap-1.5">
                <Code2 size={13} className="text-primary-600" /> GitHub URL
              </label>
              <input
                className="input"
                type="text"
                value={p.githubUrl || ''}
                onChange={(e) => setPersonal({ ...p, githubUrl: e.target.value })}
                placeholder="https://github.com/username (leave blank if none)"
              />
              <p className="text-[10px] text-navy-400 mt-1">
                {p.githubUrl ? 'Extracted from resume' : 'Not found in resume — left blank'}
              </p>
            </div>

            <div>
              <label className="label flex items-center gap-1.5">
                <Award size={13} className="text-primary-600" /> Portfolio / LeetCode / Coding Profile URL
              </label>
              <input
                className="input"
                type="text"
                value={p.portfolioUrl || ''}
                onChange={(e) => setPersonal({ ...p, portfolioUrl: e.target.value })}
                placeholder="https://leetcode.com/u/username or https://myportfolio.dev (leave blank if none)"
              />
              <p className="text-[10px] text-navy-400 mt-1">
                {p.portfolioUrl ? 'Extracted from resume' : 'Not found in resume — left blank'}
              </p>
            </div>
          </div>

          <div className="border-t border-surface-100 pt-3">
            <label className="label">Professional Bio / Executive Summary</label>
            <textarea
              className="input resize-none leading-relaxed"
              rows={4}
              value={p.bio || ''}
              onChange={(e) => setPersonal({ ...p, bio: e.target.value })}
              placeholder="Brief professional summary extracted from resume or entered manually..."
            />
            <p className="text-[10px] text-navy-400 mt-1">
              {p.bio ? 'Summary extracted from resume' : 'Not found in resume — left blank'}
            </p>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={updateMut.isPending}
              className="btn-primary gap-2 shadow-sm text-xs"
            >
              {updateMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Profile Changes
            </button>
            {hasResume && (
              <button
                type="button"
                onClick={() => syncMut.mutate()}
                disabled={syncMut.isPending}
                className="btn-secondary gap-1.5 text-xs"
              >
                <RefreshCw size={13} className={clsx(syncMut.isPending && 'animate-spin')} />
                Re-sync with Resume
              </button>
            )}
          </div>
        </form>
      )}

      {/* ─── TAB 2: Job Preferences ─── */}
      {tab === 'preferences' && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            prefsMut.mutate(f)
          }}
          className="card card-body space-y-5"
        >
          <div className="border-b border-surface-100 pb-2">
            <h3 className="font-bold text-navy-900 text-sm">Job Search & Match Preferences</h3>
            <p className="text-xs text-navy-500">
              Configure preferred locations, desired job types, and target roles for KhojAI matching.
            </p>
          </div>

          {/* Locations */}
          <div className="space-y-2">
            <label className="label flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-primary-600" /> Preferred Locations
              </span>
              <span className="text-[10px] text-navy-400 font-normal">Click preset or add custom city</span>
            </label>

            <div className="flex flex-wrap gap-2">
              {PRESET_LOCATIONS.map((loc) => {
                const selected = (f.locations || []).some(
                  (l) => l.toLowerCase() === loc.toLowerCase()
                )
                return (
                  <button
                    type="button"
                    key={loc}
                    onClick={() => {
                      const locs = f.locations || []
                      setPrefs({
                        ...f,
                        locations: selected
                          ? locs.filter((l) => l.toLowerCase() !== loc.toLowerCase())
                          : [...locs, loc],
                      })
                    }}
                    className={clsx(
                      'px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all',
                      selected
                        ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-xs'
                        : 'border-surface-200 text-navy-600 hover:border-primary-300 bg-white'
                    )}
                  >
                    {loc}
                  </button>
                )
              })}
            </div>

            {/* Custom Location input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                className="input py-1.5 text-xs"
                placeholder="Add another city (e.g. Chandigarh, Ahmedabad)"
                value={customLocInput}
                onChange={(e) => setCustomLocInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddLocation(e)
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddLocation}
                className="btn-secondary btn-sm text-xs gap-1 flex-shrink-0"
              >
                <Plus size={13} /> Add
              </button>
            </div>
            {(f.locations || []).length > 0 && (
              <p className="text-[11px] text-navy-500 pt-0.5">
                Selected: <strong className="text-navy-800">{f.locations.join(', ')}</strong>
              </p>
            )}
          </div>

          {/* Job Types */}
          <div className="space-y-2 border-t border-surface-100 pt-3">
            <label className="label">Employment Type</label>
            <div className="flex flex-wrap gap-2">
              {JOB_TYPES.map((t) => {
                const selected = (f.jobTypes || []).includes(t)
                return (
                  <button
                    type="button"
                    key={t}
                    onClick={() => {
                      const types = f.jobTypes || []
                      setPrefs({
                        ...f,
                        jobTypes: selected ? types.filter((x) => x !== t) : [...types, t],
                      })
                    }}
                    className={clsx(
                      'px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all',
                      selected
                        ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-xs'
                        : 'border-surface-200 text-navy-600 hover:border-primary-300 bg-white'
                    )}
                  >
                    {t}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Work Mode */}
          <div className="space-y-2 border-t border-surface-100 pt-3">
            <label className="label">Work Mode</label>
            <div className="flex flex-wrap gap-2">
              {WORK_MODES.map((m) => {
                const selected = (f.workModes || []).includes(m)
                return (
                  <button
                    type="button"
                    key={m}
                    onClick={() => {
                      const modes = f.workModes || []
                      setPrefs({
                        ...f,
                        workModes: selected ? modes.filter((x) => x !== m) : [...modes, m],
                      })
                    }}
                    className={clsx(
                      'px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all',
                      selected
                        ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-xs'
                        : 'border-surface-200 text-navy-600 hover:border-primary-300 bg-white'
                    )}
                  >
                    {m}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Minimum Salary */}
          <div className="border-t border-surface-100 pt-3">
            <label className="label">Minimum Expected Stipend / Salary (₹/month)</label>
            <input
              type="number"
              className="input max-w-xs"
              value={f.minSalary || ''}
              onChange={(e) => setPrefs({ ...f, minSalary: e.target.value ? Number(e.target.value) : '' })}
              placeholder="e.g. 25000 (leave blank for any)"
            />
            <p className="text-[10px] text-navy-400 mt-1">Jobs below this threshold will be filtered out</p>
          </div>

          {/* Target Roles */}
          <div className="border-t border-surface-100 pt-3 space-y-2">
            <label className="label">Target Job Roles</label>
            <div className="flex flex-wrap gap-1.5">
              {(f.targetRoles || []).map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-100 text-navy-800 text-xs font-semibold border border-surface-200"
                >
                  {role}
                  <button
                    type="button"
                    onClick={() =>
                      setPrefs({
                        ...f,
                        targetRoles: (f.targetRoles || []).filter((r) => r !== role),
                      })
                    }
                    className="text-navy-400 hover:text-red-500"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                className="input py-1.5 text-xs"
                placeholder="Add role (e.g. AI Engineer, Full Stack Developer, SDE-1)"
                value={customRoleInput}
                onChange={(e) => setCustomRoleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddRole(e)
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddRole}
                className="btn-secondary btn-sm text-xs gap-1 flex-shrink-0"
              >
                <Plus size={13} /> Add Role
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={prefsMut.isPending}
              className="btn-primary gap-2 shadow-sm text-xs"
            >
              {prefsMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Preferences
            </button>
          </div>
        </form>
      )}

      {/* ─── TAB 3: Resume & Skills Overview ─── */}
      {tab === 'resume' && (
        <div className="space-y-5">
          {hasResume ? (
            <>
              {/* Resume File Meta Card */}
              <div className="card card-body flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 flex-shrink-0">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy-900 text-sm">
                      {primaryResume.originalFilename}
                    </h3>
                    <p className="text-xs text-navy-500 mt-0.5">
                      {parsedProfile.experienceYears || 0} years experience • {parsedProfile.skills?.length || 0} skills verified
                    </p>
                  </div>
                </div>
                <Link to="/resume" className="btn-secondary btn-sm gap-1.5 text-xs">
                  Open Interactive Resume Editor <ArrowRight size={13} />
                </Link>
              </div>

              {/* Skills Grid */}
              <div className="card card-body space-y-3">
                <div className="flex items-center justify-between border-b border-surface-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Code2 size={16} className="text-primary-600" />
                    <h3 className="font-bold text-navy-900 text-sm">
                      Verified Technical Skills ({parsedProfile.skills?.length || 0})
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-200">
                    Extracted from Resume
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {(parsedProfile.skills || []).map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded-lg bg-surface-50 text-navy-800 text-xs font-semibold border border-surface-200 hover:border-primary-300 transition-colors"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Education from Resume */}
              {(parsedProfile.education || []).length > 0 && (
                <div className="card card-body space-y-3">
                  <div className="flex items-center gap-2 border-b border-surface-100 pb-2">
                    <GraduationCap size={16} className="text-primary-600" />
                    <h3 className="font-bold text-navy-900 text-sm">Education History</h3>
                  </div>
                  <div className="space-y-3">
                    {parsedProfile.education.map((edu, idx) => (
                      <div key={idx} className="p-3 rounded-xl border border-surface-200 bg-surface-50/50 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-navy-900">{edu.institution || 'University / Institution'}</p>
                          <span className="text-navy-500 font-medium">
                            {edu.startYear && edu.endYear ? `${edu.startYear} – ${edu.endYear}` : edu.endYear || ''}
                          </span>
                        </div>
                        <p className="text-primary-700 font-medium">{edu.degree} {edu.field && `• ${edu.field}`}</p>
                        {edu.grade && <p className="text-navy-500 text-[11px]">Score: {edu.grade}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Experience from Resume */}
              {(parsedProfile.workExperience || []).length > 0 && (
                <div className="card card-body space-y-3">
                  <div className="flex items-center gap-2 border-b border-surface-100 pb-2">
                    <Briefcase size={16} className="text-primary-600" />
                    <h3 className="font-bold text-navy-900 text-sm">Work Experience & Internships</h3>
                  </div>
                  <div className="space-y-3">
                    {parsedProfile.workExperience.map((exp, idx) => (
                      <div key={idx} className="p-3 rounded-xl border border-surface-200 bg-surface-50/50 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-navy-900">{exp.role || 'Position'}</p>
                          <span className="text-navy-500 font-medium">
                            {exp.startDate} {exp.endDate && `– ${exp.endDate}`}
                          </span>
                        </div>
                        <p className="text-primary-700 font-medium">{exp.company}</p>
                        {exp.description && <p className="text-navy-600 text-[11px] mt-1">{exp.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card card-body text-center py-10 space-y-3">
              <FileText size={32} className="mx-auto text-navy-400" />
              <h3 className="font-bold text-navy-900">No Resume Connected</h3>
              <p className="text-xs text-navy-500 max-w-sm mx-auto">
                Upload your resume in PDF or DOCX format to populate verified technical skills and experience on your profile.
              </p>
              <Link to="/resume" className="btn-primary btn-sm inline-flex gap-2">
                Upload Resume Now
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
