import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, FileText, Trash2, RefreshCw, CheckCircle, AlertCircle,
         Loader2, Edit2, Save, X, Clock } from 'lucide-react'
import { resumeAPI } from '@/api'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const MAX_SIZE_MB = 5

export default function ResumePage() {
  const qc = useQueryClient()
  const fileRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [editingField, setEditingField] = useState(null)
  const [editValue, setEditValue] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => resumeAPI.list(),
  })

  const rawData = data?.data?.data !== undefined ? data.data.data : (data?.data?.resumes || data?.data?.resume || data?.data)
  const resumes = Array.isArray(rawData) ? rawData : (rawData ? [rawData] : [])
  const resume  = resumes[0]

  const uploadMut = useMutation({
    mutationFn: (file) => {
      const form = new FormData()
      form.append('resume', file)
      return resumeAPI.upload(form)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resumes'] })
      toast.success('Resume uploaded! Analysis starting…')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Upload failed'),
  })

  const analyzeMut = useMutation({
    mutationFn: (id) => resumeAPI.analyze(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resumes'] })
      toast.success('Analysis started. Results will appear shortly.')
    },
    onError: () => toast.error('Analysis failed. Please try again.'),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => resumeAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resumes'] })
      toast.success('Resume deleted')
    },
  })

  const updateProfileMut = useMutation({
    mutationFn: ({ id, data }) => resumeAPI.updateProfile(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resumes'] })
      setEditingField(null)
      toast.success('Profile updated')
    },
  })

  const handleFile = (file) => {
    if (!file) return
    if (!['application/pdf'].includes(file.type)) {
      toast.error('Only PDF files are supported'); return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large. Maximum size is ${MAX_SIZE_MB}MB`); return
    }
    uploadMut.mutate(file)
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const startEdit = (field, current) => {
    setEditingField(field)
    setEditValue(Array.isArray(current) ? current.join(', ') : (current || ''))
  }

  const saveEdit = (field) => {
    const val = field.endsWith('Skills') || field === 'skills'
      ? editValue.split(',').map((s) => s.trim()).filter(Boolean)
      : editValue
    updateProfileMut.mutate({ id: resume._id, data: { [field]: val } })
  }

  const profile = resume?.extractedProfile

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-900">My Resume</h1>
        <p className="text-navy-500 text-sm mt-0.5">Upload and manage your resume. Extracted information powers your job matching.</p>
      </div>

      {/* Upload zone */}
      {!resume && !isLoading && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={clsx(
            'border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all',
            dragging ? 'border-primary-400 bg-primary-50' : 'border-surface-300 hover:border-primary-300 hover:bg-surface-50'
          )}
        >
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
          {uploadMut.isPending ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={36} className="animate-spin text-primary-500" />
              <p className="font-medium text-navy-700">Uploading…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-500">
                <Upload size={28} />
              </div>
              <div>
                <p className="font-semibold text-navy-800">Drop your resume here or click to browse</p>
                <p className="text-sm text-navy-400 mt-1">PDF only · Maximum {MAX_SIZE_MB}MB</p>
              </div>
            </div>
          )}
        </div>
      )}

      {isLoading && <div className="card h-32 skeleton" />}

      {/* Resume card */}
      {resume && (
        <div className="card card-body space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
                <FileText size={20} />
              </div>
              <div>
                <p className="font-semibold text-navy-900">{resume.originalFilename}</p>
                <p className="text-xs text-navy-400 flex items-center gap-1 mt-0.5">
                  <Clock size={11} /> Uploaded {formatDistanceToNow(new Date(resume.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <StatusBadge status={resume.status} />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => analyzeMut.mutate(resume._id)}
              disabled={analyzeMut.isPending || resume.status === 'processing'}
              className="btn-secondary btn-sm gap-2"
            >
              {analyzeMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Re-analyze
            </button>
            <button
              onClick={() => { if (confirm('Delete this resume?')) deleteMut.mutate(resume._id) }}
              disabled={deleteMut.isPending}
              className="btn-danger btn-sm gap-2"
            >
              <Trash2 size={14} /> Delete
            </button>
            <button onClick={() => fileRef.current?.click()} className="btn-ghost btn-sm gap-2">
              <Upload size={14} /> Replace
            </button>
            <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
          </div>
        </div>
      )}

      {/* Extracted profile */}
      {profile && (
        <div className="card card-body space-y-5">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-emerald-500" />
            <h2 className="font-semibold text-navy-900">Extracted Profile</h2>
            <span className="text-xs text-navy-400 ml-auto">Click any field to edit</span>
          </div>

          <div className="divider" />

          <ProfileField label="Skills" value={profile.skills} field="skills" resume={resume}
            editingField={editingField} editValue={editValue} setEditValue={setEditValue}
            startEdit={startEdit} saveEdit={saveEdit} setEditingField={setEditingField}
            isPending={updateProfileMut.isPending} />

          <ProfileField label="Education" value={profile.education} field="education" resume={resume}
            editingField={editingField} editValue={editValue} setEditValue={setEditValue}
            startEdit={startEdit} saveEdit={saveEdit} setEditingField={setEditingField}
            isPending={updateProfileMut.isPending} />

          <ProfileField label="Experience Level" value={profile.experienceLevel} field="experienceLevel" resume={resume}
            editingField={editingField} editValue={editValue} setEditValue={setEditValue}
            startEdit={startEdit} saveEdit={saveEdit} setEditingField={setEditingField}
            isPending={updateProfileMut.isPending} />

          <ProfileField label="Graduation Year" value={profile.graduationYear} field="graduationYear" resume={resume}
            editingField={editingField} editValue={editValue} setEditValue={setEditValue}
            startEdit={startEdit} saveEdit={saveEdit} setEditingField={setEditingField}
            isPending={updateProfileMut.isPending} />

          <ProfileField label="Target Roles" value={profile.targetRoles} field="targetRoles" resume={resume}
            editingField={editingField} editValue={editValue} setEditValue={setEditValue}
            startEdit={startEdit} saveEdit={saveEdit} setEditingField={setEditingField}
            isPending={updateProfileMut.isPending} />

          {profile.certifications?.length > 0 && (
            <div>
              <p className="label">Certifications</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.certifications.map((c, i) => <span key={i} className="badge-purple">{c}</span>)}
              </div>
            </div>
          )}

          <div className="alert-info text-xs">
            <p>AI-extracted fields may contain errors. Edit any field to correct mistakes before relying on this profile for job matching.</p>
          </div>
        </div>
      )}

      {resume?.status === 'pending' && (
        <div className="alert-warning flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" />
          Resume analysis is queued. Results will appear here automatically.
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    pending:    { label: 'Pending',    cls: 'badge-amber' },
    processing: { label: 'Analyzing…', cls: 'badge-blue' },
    done:       { label: 'Analyzed',   cls: 'badge-green' },
    failed:     { label: 'Failed',     cls: 'badge-red' },
  }
  const { label, cls } = map[status] || { label: status, cls: 'badge-gray' }
  return <span className={cls}>{label}</span>
}

function ProfileField({ label, value, field, editingField, editValue, setEditValue, startEdit, saveEdit, setEditingField, isPending }) {
  const isEditing = editingField === field
  const display   = Array.isArray(value) ? value.join(', ') : (value || '—')
  const isEmpty   = !value || (Array.isArray(value) && value.length === 0)

  return (
    <div className="group">
      <div className="flex items-center gap-2 mb-1">
        <p className="label mb-0">{label}</p>
        {!isEditing && (
          <button onClick={() => startEdit(field, value)} className="opacity-0 group-hover:opacity-100 transition-opacity btn-ghost btn-sm p-1" aria-label={`Edit ${label}`}>
            <Edit2 size={12} />
          </button>
        )}
      </div>
      {isEditing ? (
        <div className="flex gap-2">
          <input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="input text-sm flex-1" />
          <button onClick={() => saveEdit(field)} disabled={isPending} className="btn-primary btn-sm px-3">
            {isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          </button>
          <button onClick={() => setEditingField(null)} className="btn-secondary btn-sm px-3">
            <X size={13} />
          </button>
        </div>
      ) : (
        <p className={clsx('text-sm', isEmpty ? 'text-navy-400 italic' : 'text-navy-700')}>
          {isEmpty ? 'Not extracted — click edit to add' : display}
        </p>
      )}
    </div>
  )
}
