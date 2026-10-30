import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Upload, FileText, Trash2, RefreshCw, CheckCircle2,
  Loader2, Edit3, Plus, X, Clock, GraduationCap,
  Briefcase, Award, Code2, Calendar, MapPin, Building2,
  ExternalLink, FolderGit2
} from 'lucide-react'
import { resumeAPI } from '@/api'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const MAX_SIZE_MB = 5

export default function ResumePage() {
  const qc = useQueryClient()
  const fileRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  // Modals / Dialog state
  const [activeModal, setActiveModal] = useState(null) // 'education' | 'experience' | 'project' | 'achievement' | null
  const [modalMode, setModalMode] = useState('add') // 'add' | 'edit'
  const [editingIndex, setEditingIndex] = useState(null)

  // Skill input
  const [newSkill, setNewSkill] = useState('')

  // Form states
  const [eduForm, setEduForm] = useState({
    degree: '',
    institution: '',
    field: '',
    startYear: '',
    endYear: '',
    grade: '',
  })

  const [expForm, setExpForm] = useState({
    role: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
  })

  const [projForm, setProjForm] = useState({
    title: '',
    description: '',
    techStack: '',
    link: '',
  })

  const [achForm, setAchForm] = useState({
    title: '',
    issuer: '',
    date: '',
    description: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => resumeAPI.list(),
  })

  const rawData = (data?.data && typeof data.data === 'object')
    ? (data.data.data ?? data.data.resumes ?? data.data.resume ?? data.data)
    : null
  const resumes = Array.isArray(rawData) ? rawData : (rawData && typeof rawData === 'object' ? [rawData] : [])
  const resume = resumes[0]

  // Extract real parsed profile (safe fallback to empty collections)
  const profile = resume?.parsedProfile || resume?.extractedProfile || {}
  const education = Array.isArray(profile.education) ? profile.education : []
  const workExperience = Array.isArray(profile.workExperience) ? profile.workExperience : []
  const projects = Array.isArray(profile.projects) ? profile.projects : []
  const skills = Array.isArray(profile.skills) ? profile.skills : []
  const achievements = Array.isArray(profile.achievements) ? profile.achievements : []
  const certifications = Array.isArray(profile.certifications) ? profile.certifications : []

  // Mutations
  const uploadMut = useMutation({
    mutationFn: (file) => {
      const form = new FormData()
      form.append('resume', file)
      return resumeAPI.upload(form)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resumes'] })
      toast.success('Resume uploaded! AI extraction in progress…')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Upload failed'),
  })

  const analyzeMut = useMutation({
    mutationFn: (id) => resumeAPI.analyze(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resumes'] })
      toast.success('Resume re-analyzed successfully!')
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
    mutationFn: ({ id, data }) => resumeAPI.updateProfile(id || resume?._id || 'profile', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resumes'] })
      closeModal()
      toast.success('Saved successfully!')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save changes'),
  })

  const handleFile = (file) => {
    if (!file) return
    if (!['application/pdf'].includes(file.type) && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF files are supported')
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large. Maximum size is ${MAX_SIZE_MB}MB`)
      return
    }
    uploadMut.mutate(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const closeModal = () => {
    setActiveModal(null)
    setEditingIndex(null)
  }

  // --- Education Handlers ---
  const openAddEducation = () => {
    setEduForm({ degree: '', institution: '', field: '', startYear: '', endYear: '', grade: '' })
    setModalMode('add')
    setEditingIndex(null)
    setActiveModal('education')
  }

  const openEditEducation = (idx) => {
    const item = education[idx]
    setEduForm({
      degree: item.degree || '',
      institution: item.institution || '',
      field: item.field || '',
      startYear: item.startYear || '',
      endYear: item.endYear || '',
      grade: item.grade || '',
    })
    setModalMode('edit')
    setEditingIndex(idx)
    setActiveModal('education')
  }

  const handleSaveEducation = (e) => {
    e.preventDefault()
    if (!eduForm.degree.trim() || !eduForm.institution.trim()) {
      toast.error('Please enter Degree and Institution name')
      return
    }
    let updated = [...education]
    if (modalMode === 'add') {
      updated.push(eduForm)
    } else {
      updated[editingIndex] = eduForm
    }
    updateProfileMut.mutate({ id: resume?._id, data: { education: updated } })
  }

  const handleDeleteEducation = (idx) => {
    const updated = education.filter((_, i) => i !== idx)
    updateProfileMut.mutate({ id: resume?._id, data: { education: updated } })
  }

  // --- Experience Handlers ---
  const openAddExperience = () => {
    setExpForm({ role: '', company: '', location: '', startDate: '', endDate: '', current: false, description: '' })
    setModalMode('add')
    setEditingIndex(null)
    setActiveModal('experience')
  }

  const openEditExperience = (idx) => {
    const item = workExperience[idx]
    setExpForm({
      role: item.role || '',
      company: item.company || '',
      location: item.location || '',
      startDate: item.startDate || '',
      endDate: item.endDate || '',
      current: Boolean(item.current),
      description: item.description || (item.highlights ? item.highlights.join('\n') : ''),
    })
    setModalMode('edit')
    setEditingIndex(idx)
    setActiveModal('experience')
  }

  const handleSaveExperience = (e) => {
    e.preventDefault()
    if (!expForm.role.trim() || !expForm.company.trim()) {
      toast.error('Please enter Role and Company name')
      return
    }
    const formatted = {
      ...expForm,
      highlights: expForm.description ? expForm.description.split('\n').map(s => s.trim()).filter(Boolean) : [],
    }
    let updated = [...workExperience]
    if (modalMode === 'add') {
      updated.push(formatted)
    } else {
      updated[editingIndex] = formatted
    }
    updateProfileMut.mutate({ id: resume?._id, data: { workExperience: updated } })
  }

  const handleDeleteExperience = (idx) => {
    const updated = workExperience.filter((_, i) => i !== idx)
    updateProfileMut.mutate({ id: resume?._id, data: { workExperience: updated } })
  }

  // --- Project Handlers ---
  const openAddProject = () => {
    setProjForm({ title: '', description: '', techStack: '', link: '' })
    setModalMode('add')
    setEditingIndex(null)
    setActiveModal('project')
  }

  const openEditProject = (idx) => {
    const item = projects[idx]
    setProjForm({
      title: item.title || '',
      description: item.description || '',
      techStack: Array.isArray(item.techStack) ? item.techStack.join(', ') : (item.techStack || ''),
      link: item.link || '',
    })
    setModalMode('edit')
    setEditingIndex(idx)
    setActiveModal('project')
  }

  const handleSaveProject = (e) => {
    e.preventDefault()
    if (!projForm.title.trim()) {
      toast.error('Please enter Project Title')
      return
    }
    const formatted = {
      ...projForm,
      techStack: projForm.techStack ? projForm.techStack.split(/[,/]/).map(s => s.trim()).filter(Boolean) : [],
    }
    let updated = [...projects]
    if (modalMode === 'add') {
      updated.push(formatted)
    } else {
      updated[editingIndex] = formatted
    }
    updateProfileMut.mutate({ id: resume?._id, data: { projects: updated } })
  }

  const handleDeleteProject = (idx) => {
    const updated = projects.filter((_, i) => i !== idx)
    updateProfileMut.mutate({ id: resume?._id, data: { projects: updated } })
  }

  // --- Skills Handlers ---
  const handleAddSkill = (skillToAdd) => {
    const rawInput = (skillToAdd !== undefined ? skillToAdd : newSkill).trim()
    if (!rawInput) return

    const candidateSkills = rawInput
      .split(/[,;\n]/)
      .map(s => s.trim())
      .filter(Boolean)

    if (candidateSkills.length === 0) return

    const existingLower = new Set(skills.map(s => s.toLowerCase()))
    const newItems = []
    let duplicateCount = 0

    for (const item of candidateSkills) {
      if (existingLower.has(item.toLowerCase())) {
        duplicateCount++
      } else {
        existingLower.add(item.toLowerCase())
        newItems.push(item)
      }
    }

    if (newItems.length === 0) {
      toast.error(candidateSkills.length > 1 ? 'All these skills are already in your list' : 'Skill already added')
      setNewSkill('')
      return
    }

    const updated = [...skills, ...newItems]
    setNewSkill('')
    updateProfileMut.mutate({ id: resume?._id, data: { skills: updated } })
    if (duplicateCount > 0) {
      toast.success(`Added ${newItems.length} new skill(s) (${duplicateCount} duplicate skipped)`)
    }
  }

  const handleRemoveSkill = (skillToRemove) => {
    const updated = skills.filter(s => s !== skillToRemove)
    updateProfileMut.mutate({ id: resume?._id, data: { skills: updated } })
  }

  // --- Achievement Handlers ---
  const openAddAchievement = () => {
    setAchForm({ title: '', issuer: '', date: '', description: '' })
    setModalMode('add')
    setEditingIndex(null)
    setActiveModal('achievement')
  }

  const openEditAchievement = (idx) => {
    const item = achievements[idx]
    setAchForm({
      title: item.title || '',
      issuer: item.issuer || '',
      date: item.date || '',
      description: item.description || '',
    })
    setModalMode('edit')
    setEditingIndex(idx)
    setActiveModal('achievement')
  }

  const handleSaveAchievement = (e) => {
    e.preventDefault()
    if (!achForm.title.trim()) {
      toast.error('Please enter Achievement Title')
      return
    }
    let updated = [...achievements]
    if (modalMode === 'add') {
      updated.push(achForm)
    } else {
      updated[editingIndex] = achForm
    }
    updateProfileMut.mutate({ id: resume?._id, data: { achievements: updated } })
  }

  const handleDeleteAchievement = (idx) => {
    const updated = achievements.filter((_, i) => i !== idx)
    updateProfileMut.mutate({ id: resume?._id, data: { achievements: updated } })
  }

  const resumeStatus = resume?.parsingStatus || resume?.status || 'none'

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-900 tracking-tight">
            My Resume & Credentials
          </h1>
          <p className="text-navy-500 text-sm mt-1">
            Manage your verified education, work experience, key projects, technical skills, and achievements.
          </p>
        </div>

        <button
          onClick={() => fileRef.current?.click()}
          className="btn-primary btn-sm gap-2 self-start sm:self-auto"
        >
          <Upload size={15} />
          {resume ? 'Replace Resume (PDF)' : 'Upload Resume (PDF)'}
        </button>
        <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
      </div>

      {/* Resume File Banner */}
      {resume ? (
        <div className="card card-body bg-white border border-surface-200 hover:border-primary-200 transition-all shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 shrink-0">
                <FileText size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-semibold text-navy-900 text-base">{resume.originalFilename || 'My_Resume.pdf'}</h3>
                  <StatusBadge status={resumeStatus} />
                </div>
                <div className="flex items-center gap-3 text-xs text-navy-400 mt-1">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    Uploaded {resume?.createdAt && !isNaN(new Date(resume.createdAt).getTime()) ? formatDistanceToNow(new Date(resume.createdAt), { addSuffix: true }) : 'recently'}
                  </span>
                  {resume.fileSize && <span>· {(resume.fileSize / 1024 / 1024).toFixed(1)} MB</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button
                onClick={() => analyzeMut.mutate(resume._id)}
                disabled={analyzeMut.isPending || resumeStatus === 'processing'}
                className="btn-secondary btn-sm gap-1.5"
                title="Re-run AI extraction"
              >
                {analyzeMut.isPending ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                Re-analyze
              </button>
              <button
                onClick={() => { if (confirm('Are you sure you want to delete this resume?')) deleteMut.mutate(resume._id) }}
                disabled={deleteMut.isPending}
                className="btn-ghost btn-sm text-red-600 hover:bg-red-50 gap-1.5"
                title="Delete resume"
              >
                <Trash2 size={13} />
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty Upload Dropzone */
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={clsx(
            'border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all',
            dragging ? 'border-primary-500 bg-primary-50/50' : 'border-surface-300 hover:border-primary-400 hover:bg-surface-50/50 bg-white'
          )}
        >
          {uploadMut.isPending ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 size={36} className="animate-spin text-primary-600" />
              <p className="font-semibold text-navy-800">Uploading and parsing with AI…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600">
                <Upload size={26} />
              </div>
              <div>
                <p className="font-semibold text-navy-900 text-base">Drop your PDF resume here, or click to browse</p>
                <p className="text-xs text-navy-400 mt-1">Upload your resume to automatically extract your education, work experience, projects, skills, and achievements.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: EDUCATION
          ───────────────────────────────────────────────────────────── */}
      <div className="card bg-white border border-surface-200 overflow-hidden shadow-sm">
        <div className="card-header flex items-center justify-between bg-surface-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center">
              <GraduationCap size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-navy-900 text-base">Education</h2>
              <span className="text-xs text-navy-400 font-normal">Degree, universities, graduation timeline & grades</span>
            </div>
            <span className="badge-blue ml-2">{education.length}</span>
          </div>

          <button onClick={openAddEducation} className="btn-secondary btn-sm gap-1.5 text-xs font-medium">
            <Plus size={14} /> Add Education
          </button>
        </div>

        <div className="p-5">
          {education.length === 0 ? (
            <div className="text-center py-8 text-navy-400">
              <GraduationCap size={32} className="mx-auto mb-2 text-surface-400 opacity-60" />
              <p className="text-sm font-medium text-navy-700">No education entries added yet</p>
              <p className="text-xs text-navy-400 mt-0.5">Add your college, university, or high school qualifications.</p>
              <button onClick={openAddEducation} className="btn-ghost btn-sm text-primary-600 hover:bg-primary-50 mt-3 gap-1">
                <Plus size={13} /> Add Education Record
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {education.map((item, idx) => (
                <div
                  key={idx}
                  className="group flex flex-col sm:flex-row sm:items-start justify-between p-4 rounded-xl border border-surface-150 hover:border-surface-300 hover:bg-surface-50/40 transition-all gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-navy-900 text-sm">{item.degree || 'Degree'}</h4>
                      {item.grade && (
                        <span className="badge-green text-[11px] font-semibold">
                          {item.grade}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-navy-700 flex items-center gap-1.5">
                      <Building2 size={13} className="text-navy-400" />
                      {item.institution || 'University / College'}
                      {item.field && <span className="text-navy-400">· {item.field}</span>}
                    </p>
                    {(item.startYear || item.endYear) && (
                      <p className="text-[11px] text-navy-400 flex items-center gap-1">
                        <Calendar size={11} />
                        {item.startYear ? `${item.startYear} – ` : ''}{item.endYear || 'Present'}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity self-end sm:self-start">
                    <button
                      onClick={() => openEditEducation(idx)}
                      className="btn-ghost btn-sm p-1.5 text-navy-500 hover:text-navy-900"
                      title="Edit education"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteEducation(idx)}
                      className="btn-ghost btn-sm p-1.5 text-red-500 hover:text-red-700"
                      title="Delete education"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: WORK EXPERIENCE & INTERNSHIPS
          ───────────────────────────────────────────────────────────── */}
      <div className="card bg-white border border-surface-200 overflow-hidden shadow-sm">
        <div className="card-header flex items-center justify-between bg-surface-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Briefcase size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-navy-900 text-base">Work Experience & Internships</h2>
              <span className="text-xs text-navy-400 font-normal">Roles, companies, tenures & key contributions</span>
            </div>
            <span className="badge-purple ml-2">{workExperience.length}</span>
          </div>

          <button onClick={openAddExperience} className="btn-secondary btn-sm gap-1.5 text-xs font-medium">
            <Plus size={14} /> Add Experience
          </button>
        </div>

        <div className="p-5">
          {workExperience.length === 0 ? (
            <div className="text-center py-8 text-navy-400">
              <Briefcase size={32} className="mx-auto mb-2 text-surface-400 opacity-60" />
              <p className="text-sm font-medium text-navy-700">No work experience or internships added yet</p>
              <p className="text-xs text-navy-400 mt-0.5">Showcase your full-time positions, internships, or freelance work.</p>
              <button onClick={openAddExperience} className="btn-ghost btn-sm text-primary-600 hover:bg-primary-50 mt-3 gap-1">
                <Plus size={13} /> Add Work Experience
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {workExperience.map((item, idx) => (
                <div
                  key={idx}
                  className="group flex flex-col sm:flex-row sm:items-start justify-between p-4 rounded-xl border border-surface-150 hover:border-surface-300 hover:bg-surface-50/40 transition-all gap-4"
                >
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-navy-900 text-sm">{item.role || 'Role'}</h4>
                        {item.current && (
                          <span className="badge-blue text-[10px] font-semibold">Currently Working</span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-navy-700 flex items-center gap-2 mt-0.5">
                        <span className="font-semibold text-primary-700">{item.company || 'Company'}</span>
                        {item.location && (
                          <span className="text-navy-400 flex items-center gap-0.5 text-[11px]">
                            <MapPin size={11} /> {item.location}
                          </span>
                        )}
                      </p>
                      {(item.startDate || item.endDate) && (
                        <p className="text-[11px] text-navy-400 flex items-center gap-1 mt-0.5">
                          <Calendar size={11} />
                          {item.startDate} – {item.current ? 'Present' : (item.endDate || 'Present')}
                        </p>
                      )}
                    </div>

                    {item.description && (
                      <p className="text-xs text-navy-600 leading-relaxed whitespace-pre-line pl-2 border-l-2 border-surface-200">
                        {item.description}
                      </p>
                    )}

                    {Array.isArray(item.highlights) && item.highlights.length > 0 && (
                      <ul className="text-xs text-navy-600 space-y-1 list-disc list-inside pl-1">
                        {item.highlights.map((h, hIdx) => (
                          <li key={hIdx} className="leading-relaxed">{h}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity self-end sm:self-start">
                    <button
                      onClick={() => openEditExperience(idx)}
                      className="btn-ghost btn-sm p-1.5 text-navy-500 hover:text-navy-900"
                      title="Edit experience"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteExperience(idx)}
                      className="btn-ghost btn-sm p-1.5 text-red-500 hover:text-red-700"
                      title="Delete experience"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: TECHNICAL PROJECTS & APPLICATIONS
          ───────────────────────────────────────────────────────────── */}
      <div className="card bg-white border border-surface-200 overflow-hidden shadow-sm">
        <div className="card-header flex items-center justify-between bg-surface-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FolderGit2 size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-navy-900 text-base">Key Projects & Works</h2>
              <span className="text-xs text-navy-400 font-normal">Full-stack systems, AI/ML models, and applications</span>
            </div>
            <span className="badge-purple ml-2">{projects.length}</span>
          </div>

          <button onClick={openAddProject} className="btn-secondary btn-sm gap-1.5 text-xs font-medium">
            <Plus size={14} /> Add Project
          </button>
        </div>

        <div className="p-5">
          {projects.length === 0 ? (
            <div className="text-center py-8 text-navy-400">
              <FolderGit2 size={32} className="mx-auto mb-2 text-surface-400 opacity-60" />
              <p className="text-sm font-medium text-navy-700">No projects added yet</p>
              <p className="text-xs text-navy-400 mt-0.5">Showcase your portfolio applications, open source work, or hackathon projects.</p>
              <button onClick={openAddProject} className="btn-ghost btn-sm text-primary-600 hover:bg-primary-50 mt-3 gap-1">
                <Plus size={13} /> Add Project
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((item, idx) => (
                <div
                  key={idx}
                  className="group flex flex-col sm:flex-row sm:items-start justify-between p-4 rounded-xl border border-surface-150 hover:border-surface-300 hover:bg-surface-50/40 transition-all gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-navy-900 text-sm">{item.title || 'Project'}</h4>
                      {item.link && (
                        <a
                          href={item.link.startsWith('http') ? item.link : `https://${item.link}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary-600 hover:text-primary-700 text-xs inline-flex items-center gap-0.5"
                        >
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>

                    {item.description && (
                      <p className="text-xs text-navy-600 leading-relaxed whitespace-pre-line pl-2 border-l-2 border-surface-200">
                        {item.description}
                      </p>
                    )}

                    {Array.isArray(item.techStack) && item.techStack.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.techStack.map((tech, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-2 py-0.5 rounded-lg bg-surface-100 text-[11px] font-medium text-navy-700"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity self-end sm:self-start">
                    <button
                      onClick={() => openEditProject(idx)}
                      className="btn-ghost btn-sm p-1.5 text-navy-500 hover:text-navy-900"
                      title="Edit project"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteProject(idx)}
                      className="btn-ghost btn-sm p-1.5 text-red-500 hover:text-red-700"
                      title="Delete project"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: TECHNICAL SKILLS & STACK
          ───────────────────────────────────────────────────────────── */}
      <div className="card bg-white border border-surface-200 overflow-hidden shadow-sm">
        <div className="card-header flex items-center justify-between bg-surface-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Code2 size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-navy-900 text-base">Skills & Tech Stack</h2>
              <span className="text-xs text-navy-400 font-normal">Core technologies evaluated during job matching</span>
            </div>
            <span className="badge-green ml-2">{skills.length}</span>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Add skill input */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill() } }}
              placeholder="Type skills (e.g. React, Docker, Python) and press Enter or click Add"
              className="input text-sm flex-1"
            />
            <button
              onClick={() => handleAddSkill()}
              disabled={!newSkill.trim() || updateProfileMut.isPending}
              className="btn-primary btn-sm px-4 gap-1.5 shrink-0"
            >
              <Plus size={14} /> Add Skill
            </button>
          </div>

          {/* Skill chips */}
          {skills.length === 0 ? (
            <div className="text-center py-6 text-navy-400">
              <p className="text-sm text-navy-600 font-medium">No skills registered yet</p>
              <p className="text-xs text-navy-400 mt-1">Add your programming languages, frameworks, databases, and developer tools above.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 pt-1 max-h-72 overflow-y-auto pr-1">
              {skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-50 border border-surface-200 text-xs font-semibold text-navy-800 hover:border-primary-300 hover:bg-primary-50/40 transition-colors"
                >
                  {skill}
                  <button
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-navy-400 hover:text-red-500 transition-colors p-0.5 rounded-full"
                    title={`Remove ${skill}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Quick Add Suggestions */}
          <div className="pt-2 border-t border-surface-150">
            <span className="text-[11px] text-navy-400 block mb-1.5 font-medium">Quick suggestions (click to add):</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'FastAPI', 'Docker',
                'Kubernetes', 'AWS', 'MongoDB', 'PostgreSQL', 'Redis', 'Git', 'Machine Learning', 'GraphQL'
              ].filter(s => !skills.some(existing => existing.toLowerCase() === s.toLowerCase())).slice(0, 8).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleAddSkill(s)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-surface-100 hover:bg-surface-200 hover:text-primary-700 text-navy-600 font-medium transition-colors flex items-center gap-1"
                >
                  <Plus size={11} /> {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 5: ACHIEVEMENTS, HONORS & CERTIFICATIONS
          ───────────────────────────────────────────────────────────── */}
      <div className="card bg-white border border-surface-200 overflow-hidden shadow-sm">
        <div className="card-header flex items-center justify-between bg-surface-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-navy-900 text-base">Achievements & Honors</h2>
              <span className="text-xs text-navy-400 font-normal">Hackathon wins, competitive ranks, awards & certifications</span>
            </div>
            <span className="badge-amber ml-2">{achievements.length}</span>
          </div>

          <button onClick={openAddAchievement} className="btn-secondary btn-sm gap-1.5 text-xs font-medium">
            <Plus size={14} /> Add Achievement
          </button>
        </div>

        <div className="p-5">
          {achievements.length === 0 ? (
            <div className="text-center py-8 text-navy-400">
              <Award size={32} className="mx-auto mb-2 text-surface-400 opacity-60" />
              <p className="text-sm font-medium text-navy-700">No achievements added yet</p>
              <p className="text-xs text-navy-400 mt-0.5">Highlight hackathons, academic awards, coding rankings, or published work.</p>
              <button onClick={openAddAchievement} className="btn-ghost btn-sm text-primary-600 hover:bg-primary-50 mt-3 gap-1">
                <Plus size={13} /> Add Achievement
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {achievements.map((item, idx) => (
                <div
                  key={idx}
                  className="group flex flex-col sm:flex-row sm:items-start justify-between p-4 rounded-xl border border-surface-150 hover:border-surface-300 hover:bg-surface-50/40 transition-all gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-navy-900 text-sm">{item.title || 'Achievement'}</h4>
                      {item.date && (
                        <span className="badge-amber text-[10px] font-semibold">
                          {item.date}
                        </span>
                      )}
                    </div>
                    {item.issuer && (
                      <p className="text-xs font-medium text-navy-700">
                        Issued by: <span className="text-navy-900 font-semibold">{item.issuer}</span>
                      </p>
                    )}
                    {item.description && (
                      <p className="text-xs text-navy-600 leading-relaxed mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity self-end sm:self-start">
                    <button
                      onClick={() => openEditAchievement(idx)}
                      className="btn-ghost btn-sm p-1.5 text-navy-500 hover:text-navy-900"
                      title="Edit achievement"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteAchievement(idx)}
                      className="btn-ghost btn-sm p-1.5 text-red-500 hover:text-red-700"
                      title="Delete achievement"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Certifications Sub-section */}
          {certifications.length > 0 && (
            <div className="pt-4 mt-4 border-t border-surface-150">
              <span className="text-xs text-navy-500 block mb-2 font-semibold">Verified Licenses & Certifications:</span>
              <div className="flex flex-wrap gap-2">
                {certifications.map((c, cIdx) => (
                  <span
                    key={cIdx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs font-medium text-amber-900"
                  >
                    <Award size={13} className="text-amber-600 shrink-0" />
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: EDUCATION
          ───────────────────────────────────────────────────────────── */}
      {activeModal === 'education' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/40 backdrop-blur-sm animate-fade-in">
          <div className="card bg-white w-full max-w-lg p-6 shadow-xl border border-surface-200 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-150 pb-3">
              <h3 className="font-semibold text-navy-900 text-base">
                {modalMode === 'add' ? 'Add Education' : 'Edit Education'}
              </h3>
              <button onClick={closeModal} className="text-navy-400 hover:text-navy-800">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEducation} className="space-y-3.5">
              <div>
                <label className="label text-xs">Degree / Qualification *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B.Tech in Computer Science, B.S., High School"
                  value={eduForm.degree}
                  onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })}
                  className="input text-sm"
                />
              </div>

              <div>
                <label className="label text-xs">Institution / University *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. National Institute of Technology, Stanford University"
                  value={eduForm.institution}
                  onChange={(e) => setEduForm({ ...eduForm, institution: e.target.value })}
                  className="input text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs">Field of Study</label>
                  <input
                    type="text"
                    placeholder="e.g. Artificial Intelligence, CSE"
                    value={eduForm.field}
                    onChange={(e) => setEduForm({ ...eduForm, field: e.target.value })}
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="label text-xs">Grade / CGPA</label>
                  <input
                    type="text"
                    placeholder="e.g. 9.1 CGPA or 92%"
                    value={eduForm.grade}
                    onChange={(e) => setEduForm({ ...eduForm, grade: e.target.value })}
                    className="input text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs">Start Year</label>
                  <input
                    type="text"
                    placeholder="e.g. 2022"
                    value={eduForm.startYear}
                    onChange={(e) => setEduForm({ ...eduForm, startYear: e.target.value })}
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="label text-xs">End Year (or Expected)</label>
                  <input
                    type="text"
                    placeholder="e.g. 2026"
                    value={eduForm.endYear}
                    onChange={(e) => setEduForm({ ...eduForm, endYear: e.target.value })}
                    className="input text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary btn-sm">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateProfileMut.isPending}
                  className="btn-primary btn-sm px-5"
                >
                  {updateProfileMut.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: EXPERIENCE
          ───────────────────────────────────────────────────────────── */}
      {activeModal === 'experience' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/40 backdrop-blur-sm animate-fade-in">
          <div className="card bg-white w-full max-w-lg p-6 shadow-xl border border-surface-200 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-150 pb-3">
              <h3 className="font-semibold text-navy-900 text-base">
                {modalMode === 'add' ? 'Add Work Experience' : 'Edit Work Experience'}
              </h3>
              <button onClick={closeModal} className="text-navy-400 hover:text-navy-800">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveExperience} className="space-y-3.5">
              <div>
                <label className="label text-xs">Job Title / Role *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Full Stack Developer Intern"
                  value={expForm.role}
                  onChange={(e) => setExpForm({ ...expForm, role: e.target.value })}
                  className="input text-sm"
                />
              </div>

              <div>
                <label className="label text-xs">Company / Organization *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Google, Startup Inc."
                  value={expForm.company}
                  onChange={(e) => setExpForm({ ...expForm, company: e.target.value })}
                  className="input text-sm"
                />
              </div>

              <div>
                <label className="label text-xs">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Bengaluru, India or Remote"
                  value={expForm.location}
                  onChange={(e) => setExpForm({ ...expForm, location: e.target.value })}
                  className="input text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs">Start Date</label>
                  <input
                    type="text"
                    placeholder="e.g. Jun 2024"
                    value={expForm.startDate}
                    onChange={(e) => setExpForm({ ...expForm, startDate: e.target.value })}
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="label text-xs">End Date</label>
                  <input
                    type="text"
                    placeholder="e.g. Aug 2024 (or Present)"
                    value={expForm.endDate}
                    onChange={(e) => setExpForm({ ...expForm, endDate: e.target.value })}
                    disabled={expForm.current}
                    className="input text-sm disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="currentJob"
                  checked={expForm.current}
                  onChange={(e) => setExpForm({ ...expForm, current: e.target.checked })}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="currentJob" className="text-xs text-navy-700 cursor-pointer font-medium">
                  I currently work here
                </label>
              </div>

              <div>
                <label className="label text-xs">Description & Highlights</label>
                <textarea
                  rows={4}
                  placeholder="Write key accomplishments, technologies used, and metrics achieved..."
                  value={expForm.description}
                  onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
                  className="input text-sm leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary btn-sm">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateProfileMut.isPending}
                  className="btn-primary btn-sm px-5"
                >
                  {updateProfileMut.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: PROJECT
          ───────────────────────────────────────────────────────────── */}
      {activeModal === 'project' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/40 backdrop-blur-sm animate-fade-in">
          <div className="card bg-white w-full max-w-lg p-6 shadow-xl border border-surface-200 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-150 pb-3">
              <h3 className="font-semibold text-navy-900 text-base">
                {modalMode === 'add' ? 'Add Technical Project' : 'Edit Technical Project'}
              </h3>
              <button onClick={closeModal} className="text-navy-400 hover:text-navy-800">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-3.5">
              <div>
                <label className="label text-xs">Project Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PharmaChain - Medicine Supply Chain Platform"
                  value={projForm.title}
                  onChange={(e) => setProjForm({ ...projForm, title: e.target.value })}
                  className="input text-sm"
                />
              </div>

              <div>
                <label className="label text-xs">Tech Stack (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. React, Node.js, MongoDB, Docker"
                  value={projForm.techStack}
                  onChange={(e) => setProjForm({ ...projForm, techStack: e.target.value })}
                  className="input text-sm"
                />
              </div>

              <div>
                <label className="label text-xs">Project / GitHub Link (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. github.com/username/project"
                  value={projForm.link}
                  onChange={(e) => setProjForm({ ...projForm, link: e.target.value })}
                  className="input text-sm"
                />
              </div>

              <div>
                <label className="label text-xs">Description & Architecture Highlights</label>
                <textarea
                  rows={4}
                  placeholder="Describe what the project does, key features, and engineering accomplishments..."
                  value={projForm.description}
                  onChange={(e) => setProjForm({ ...projForm, description: e.target.value })}
                  className="input text-sm leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary btn-sm">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateProfileMut.isPending}
                  className="btn-primary btn-sm px-5"
                >
                  {updateProfileMut.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Save Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ACHIEVEMENT
          ───────────────────────────────────────────────────────────── */}
      {activeModal === 'achievement' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/40 backdrop-blur-sm animate-fade-in">
          <div className="card bg-white w-full max-w-lg p-6 shadow-xl border border-surface-200 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-150 pb-3">
              <h3 className="font-semibold text-navy-900 text-base">
                {modalMode === 'add' ? 'Add Achievement / Honor' : 'Edit Achievement / Honor'}
              </h3>
              <button onClick={closeModal} className="text-navy-400 hover:text-navy-800">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAchievement} className="space-y-3.5">
              <div>
                <label className="label text-xs">Achievement Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SIH Hackathon Winner, 350+ Problems Solved on LeetCode"
                  value={achForm.title}
                  onChange={(e) => setAchForm({ ...achForm, title: e.target.value })}
                  className="input text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs">Issuer / Organization</label>
                  <input
                    type="text"
                    placeholder="e.g. Smart India Hackathon, IIT Varanasi"
                    value={achForm.issuer}
                    onChange={(e) => setAchForm({ ...achForm, issuer: e.target.value })}
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="label text-xs">Date / Year</label>
                  <input
                    type="text"
                    placeholder="e.g. 2026 or Jun 2025"
                    value={achForm.date}
                    onChange={(e) => setAchForm({ ...achForm, date: e.target.value })}
                    className="input text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="label text-xs">Description (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe your achievement, project impact, or ranking..."
                  value={achForm.description}
                  onChange={(e) => setAchForm({ ...achForm, description: e.target.value })}
                  className="input text-sm leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary btn-sm">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateProfileMut.isPending}
                  className="btn-primary btn-sm px-5"
                >
                  {updateProfileMut.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    pending:    { label: 'Pending',    cls: 'badge-amber' },
    processing: { label: 'Analyzing…', cls: 'badge-blue' },
    completed:  { label: 'Analyzed',   cls: 'badge-green' },
    done:       { label: 'Analyzed',   cls: 'badge-green' },
    failed:     { label: 'Failed',     cls: 'badge-red' },
  }
  const { label, cls } = map[status] || { label: status, cls: 'badge-gray' }
  return <span className={cls}>{label}</span>
}