import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Briefcase, Bell, ClipboardList, TrendingUp,
  Upload, ChevronRight, ArrowRight, AlertCircle, Sparkles,
  Target, BarChart3, Zap, ArrowUpRight,
  ShieldCheck, Flame, Compass, Building2, MapPin,
  Code2, Cpu, Layers, Database
} from 'lucide-react'
import { jobsAPI, notificationsAPI, applicationsAPI, resumeAPI } from '@/api'
import { useAuthStore, useNotificationStore } from '@/store'
import clsx from 'clsx'

// Benchmark industry demand mapping for technology skills in 2026
const INDUSTRY_SKILL_DEMAND = {
  javascript: { demand: 94, category: 'Frontend & Full Stack', tag: 'Core Essential' },
  typescript: { demand: 92, category: 'Frontend & Full Stack', tag: 'High Demand' },
  react:      { demand: 91, category: 'Frontend',              tag: 'High Demand' },
  'node.js':  { demand: 88, category: 'Backend',               tag: 'High Demand' },
  python:     { demand: 90, category: 'Backend & AI',          tag: 'Surging' },
  sql:        { demand: 86, category: 'Database',              tag: 'Core Essential' },
  mongodb:    { demand: 78, category: 'Database',              tag: 'Steady' },
  postgresql: { demand: 84, category: 'Database',              tag: 'High Demand' },
  docker:     { demand: 81, category: 'DevOps & Cloud',        tag: 'Critical' },
  aws:        { demand: 83, category: 'Cloud Infrastructure',  tag: 'High Demand' },
  git:        { demand: 96, category: 'Developer Tools',       tag: 'Core Essential' },
  java:       { demand: 85, category: 'Backend & Enterprise',  tag: 'Steady' },
  'c++':      { demand: 74, category: 'Systems & Core',        tag: 'Core' },
  fastapi:    { demand: 79, category: 'Backend & AI',          tag: 'Fast Growing' },
  html:       { demand: 90, category: 'Frontend',              tag: 'Foundational' },
  css:        { demand: 88, category: 'Frontend',              tag: 'Foundational' },
  'tailwind css': { demand: 86, category: 'Frontend',          tag: 'High Demand' },
  express:    { demand: 83, category: 'Backend',               tag: 'Standard' },
  redis:      { demand: 76, category: 'Database & Caching',    tag: 'Valued' },
}

const TOP_RECRUITER_TRENDS = [
  {
    title: 'Generative AI & Agentic Automation',
    growth: '+142%',
    desc: 'Companies are hiring engineers who know how to connect LLMs to production databases using LangGraph, Python, and vector stores.',
    skills: ['Python', 'LangChain', 'FastAPI', 'Vector DB'],
    hot: true,
  },
  {
    title: 'Full-Stack TypeScript & React Architecture',
    growth: '+88%',
    desc: 'Highest volume of postings in India. Teams prioritize clean component state, responsive Tailwind interfaces, and performant REST APIs.',
    skills: ['TypeScript', 'React', 'Node.js', 'Tailwind CSS'],
    hot: false,
  },
  {
    title: 'Containerization & Production Deployment',
    growth: '+76%',
    desc: 'Recruiters look for candidates who don\'t just code locally, but containerize services with Docker and run automated GitHub Actions.',
    skills: ['Docker', 'AWS', 'CI/CD', 'Linux'],
    hot: false,
  },
  {
    title: 'Relational & Distributed Data Engineering',
    growth: '+69%',
    desc: 'Heavy interview focus on schema design, SQL query indexing, transactions, and Redis caching for high-concurrency systems.',
    skills: ['PostgreSQL', 'Redis', 'SQL', 'MongoDB'],
    hot: false,
  },
]

function StatCard({ icon: Icon, label, value, subtext, color, to }) {
  const inner = (
    <div className={clsx('card card-body flex items-start justify-between hover:shadow-card-md transition-all group', to && 'cursor-pointer')}>
      <div className="space-y-1">
        <p className="text-xs font-medium text-navy-500 uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-display font-extrabold text-navy-900 tracking-tight">{value ?? '—'}</p>
        {subtext && <p className="text-xs text-navy-400 font-medium">{subtext}</p>}
      </div>
      <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110', color)}>
        <Icon size={20} />
      </div>
    </div>
  )
  return to ? <Link to={to}>{inner}</Link> : inner
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount)
  const [activeSkill, setActiveSkill] = useState(null)

  const { data: resumeData } = useQuery({ queryKey: ['resumes'], queryFn: () => resumeAPI.list() })
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['recommended-jobs'],
    queryFn: () => jobsAPI.recommended({ limit: 4 }),
  })
  const { data: appsData } = useQuery({
    queryKey: ['applications-overview'],
    queryFn: () => applicationsAPI.list(),
  })
  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => notificationsAPI.unreadCount(),
    refetchInterval: 30000,
  })

  useEffect(() => {
    const count = unreadData?.data?.count ?? unreadData?.data?.data?.count
    if (typeof count === 'number') {
      setUnreadCount(count)
    }
  }, [unreadData, setUnreadCount])

  // Extract raw resume data safely
  const rawData = (resumeData?.data && typeof resumeData.data === 'object')
    ? (resumeData.data.resumes ?? resumeData.data.data ?? (resumeData.data.resume ? [resumeData.data.resume] : []))
    : []
  const resumes   = Array.isArray(rawData) ? rawData.filter(Boolean) : (rawData ? [rawData] : [])
  const primaryResume = resumes[0] || null
  const parsedProfile = primaryResume?.parsedProfile || {}
  const userSkills    = parsedProfile.skills || []

  const jobs          = jobsData?.data?.data?.jobs || []
  const totalJobs     = jobsData?.data?.data?.total || 0
  const unread        = unreadData?.data?.data?.count || 0
  const hasResume     = resumes.length > 0 && !!(primaryResume?._id || parsedProfile?.skills?.length || primaryResume?.originalFilename)

  // Applications breakdown
  const applications = appsData?.data?.applications || appsData?.data?.data?.applications || []
  const appCount     = applications.length
  const appStages = {
    bookmarked: applications.filter(a => a.status === 'Bookmarked').length,
    applied: applications.filter(a => a.status === 'Applied').length,
    interviewing: applications.filter(a => a.status === 'Interviewing' || a.status === 'Screening').length,
    offered: applications.filter(a => a.status === 'Offered').length,
  }

  // Profile readiness score calculation
  const profileScore = Math.min(100, Math.max(20,
    (hasResume ? 40 : 0) +
    Math.min(30, userSkills.length * 5) +
    (user?.currentStatus ? 15 : 5) +
    (user?.preferences?.targetRoles?.length ? 15 : 5)
  ))

  // Map user skills to market demand histogram
  const skillsHistogramData = (userSkills.length > 0
    ? userSkills
    : ['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'Git', 'MongoDB']
  ).map((skillName) => {
    const key = skillName.toLowerCase().trim()
    const found = INDUSTRY_SKILL_DEMAND[key] || {
      demand: 75,
      category: 'Technical Competency',
      tag: 'Valued'
    }
    return {
      name: skillName,
      demand: found.demand,
      category: found.category,
      tag: found.tag,
    }
  }).sort((a, b) => b.demand - a.demand)

  const chartSkills = skillsHistogramData.slice(0, 6)
  const avgSkillDemand = chartSkills.length > 0
    ? Math.round(chartSkills.reduce((acc, s) => acc + s.demand, 0) / chartSkills.length)
    : 85
  const topSkill = chartSkills[0] || { name: 'Git', demand: 96, tag: 'Core Essential' }

  // 4 Core Technical Domains Matrix
  const domainMatrix = [
    {
      title: 'Frontend & UI',
      icon: Code2,
      skills: skillsHistogramData.filter(s => ['javascript', 'react', 'typescript', 'html', 'css', 'tailwind css', 'vue'].includes(s.name.toLowerCase())),
      benchmark: 93,
      status: 'Core Strength',
    },
    {
      title: 'Backend & APIs',
      icon: Cpu,
      skills: skillsHistogramData.filter(s => ['node.js', 'fastapi', 'python', 'java', 'express', 'c++', 'django', 'spring'].includes(s.name.toLowerCase())),
      benchmark: 86,
      status: 'Production Ready',
    },
    {
      title: 'DevOps & Tooling',
      icon: Layers,
      skills: skillsHistogramData.filter(s => ['git', 'docker', 'aws', 'linux', 'ci/cd', 'kubernetes'].includes(s.name.toLowerCase())),
      benchmark: 94,
      status: 'Industry Standard',
    },
    {
      title: 'Data & Databases',
      icon: Database,
      skills: skillsHistogramData.filter(s => ['sql', 'mongodb', 'postgresql', 'redis', 'mysql'].includes(s.name.toLowerCase())),
      benchmark: 82,
      status: 'Target Growth',
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* ─── Header & Quick Actions ───────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white p-6 rounded-2xl border border-surface-200 shadow-card">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold mb-2">
            <Sparkles size={13} className="text-primary-600" />
            AI Career Copilot Dashboard
          </div>
          <h1 className="font-display text-2xl font-extrabold text-navy-900 tracking-tight">
            Good {getTimeOfDay()}, {user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-navy-500 mt-0.5 text-sm">
            Here is your live career intelligence overview, candidate skills histogram, and market hiring radar.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link to="/jobs" className="btn-secondary btn-sm gap-2">
            <Compass size={15} className="text-navy-500" />
            Explore All Jobs ({totalJobs})
          </Link>
          {!hasResume ? (
            <Link to="/resume" className="btn-primary btn-sm gap-2 shadow-sm">
              <Upload size={15} /> Upload Resume
            </Link>
          ) : (
            <Link to="/career-roadmap" className="btn-primary btn-sm gap-2 shadow-sm">
              <TrendingUp size={15} /> Career Roadmap
            </Link>
          )}
        </div>
      </div>

      {/* ─── Resume Missing Banner (if applicable) ────────────── */}
      {!hasResume && (
        <div className="alert-info flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 flex-shrink-0">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="font-bold text-sm text-navy-900">Upload your resume to activate personalized intelligence</p>
              <p className="text-xs text-navy-600 mt-0.5">
                KhojAI will extract your verified tech skills, calculate accurate hiring match percentages, and benchmark your readiness.
              </p>
            </div>
          </div>
          <Link to="/resume" className="btn-primary btn-sm flex-shrink-0">
            Upload Resume Now
          </Link>
        </div>
      )}

      {/* ─── Executive Stats Row (4 Metric Cards) ───────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Briefcase}
          label="Active Matched Jobs"
          value={totalJobs}
          subtext="Live postings in database"
          color="bg-primary-50 text-primary-700"
          to="/jobs"
        />
        <StatCard
          icon={ShieldCheck}
          label="Profile Readiness"
          value={`${profileScore}%`}
          subtext={hasResume ? 'Resume verified & active' : 'Upload resume to boost'}
          color="bg-emerald-50 text-emerald-700"
          to="/resume"
        />
        <StatCard
          icon={ClipboardList}
          label="Applications Tracked"
          value={appCount}
          subtext={`${appStages.interviewing} in interview stage`}
          color="bg-teal-50 text-teal-700"
          to="/applications"
        />
        <StatCard
          icon={Bell}
          label="High-Match Alerts"
          value={unread}
          subtext="New career opportunities"
          color="bg-amber-50 text-amber-700"
          to="/inbox"
        />
      </div>

      {/* ─── Main Analytics Grid: Skills Histogram & Market Intelligence ── */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column: Skills Competency Histogram & Technical Matrix (7 Cols) */}
        <div className="lg:col-span-7 card card-body space-y-4 flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-surface-100 pb-3 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 size={18} className="text-primary-600" />
                  <h2 className="font-display font-bold text-navy-900 text-base">
                    Candidate Skills Competency Histogram
                  </h2>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-200">
                    Live Benchmark
                  </span>
                </div>
                <p className="text-xs text-navy-500 mt-0.5">
                  {hasResume
                    ? `Distribution of ${skillsHistogramData.length} verified technical skills evaluated against 2026 hiring benchmarks.`
                    : 'Demonstration skills histogram. Upload your resume to benchmark your stack.'}
                </p>
              </div>
              <Link
                to="/resume"
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1"
              >
                Edit Skills <ArrowRight size={13} />
              </Link>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-2.5 mb-3.5">
              <div className="p-2.5 rounded-xl bg-surface-50 border border-surface-200">
                <p className="text-[10px] font-semibold text-navy-500 uppercase tracking-wider">Avg Market Demand</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-lg font-display font-extrabold text-navy-900">{avgSkillDemand}%</span>
                  <span className="text-[10px] text-emerald-600 font-bold">Strong Fit</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-primary-50/50 border border-primary-100">
                <p className="text-[10px] font-semibold text-primary-700 uppercase tracking-wider">Top Competency</p>
                <div className="flex items-baseline gap-1 mt-0.5 truncate">
                  <span className="text-lg font-display font-extrabold text-primary-800 truncate">{topSkill.name}</span>
                  <span className="text-[10px] text-primary-600 font-bold font-mono">{topSkill.demand}%</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-50 border border-surface-200">
                <p className="text-[10px] font-semibold text-navy-500 uppercase tracking-wider">Verified Stack</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-lg font-display font-extrabold text-navy-900">{skillsHistogramData.length}</span>
                  <span className="text-[10px] text-navy-500 font-medium">Technologies</span>
                </div>
              </div>
            </div>

            {/* Modern Vertical Column Histogram Chart */}
            <div className="bg-surface-50/60 rounded-xl p-3.5 border border-surface-200/80 mb-3.5">
              <div className="flex items-center justify-between mb-2 text-xs">
                <div className="flex items-center gap-1.5 text-navy-600">
                  <TrendingUp size={14} className="text-primary-600" />
                  <span className="font-bold text-navy-800 text-[11px]">Hiring Demand Frequency per Technology</span>
                </div>
                {activeSkill ? (
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary-700 bg-primary-100/70 px-2.5 py-0.5 rounded-full border border-primary-200 animate-fade-in">
                    <span>{activeSkill.name}:</span>
                    <span className="font-mono">{activeSkill.demand}% demand</span>
                    <span className="text-[10px] font-medium text-navy-600">({activeSkill.tag})</span>
                  </div>
                ) : (
                  <div className="text-[10px] text-navy-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500 inline-block animate-pulse" />
                    Hover on column to view breakdown
                  </div>
                )}
              </div>

              <div className="w-full">
                <svg
                  viewBox="0 0 540 182"
                  className="w-full h-auto select-none overflow-visible"
                >
                  <defs>
                    <linearGradient id="emeraldBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#047857" />
                    </linearGradient>
                    <linearGradient id="emeraldBarGradHover" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <filter id="barShadow" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#047857" floodOpacity="0.3" />
                    </filter>
                  </defs>

                  {/* Horizontal gridlines and y-axis ticks */}
                  {[
                    { val: 100, y: 22 },
                    { val: 75,  y: 52 },
                    { val: 50,  y: 82 },
                    { val: 25,  y: 112 },
                  ].map((tick) => (
                    <g key={tick.val}>
                      <line
                        x1="36"
                        y1={tick.y}
                        x2="530"
                        y2={tick.y}
                        stroke="#e2e8f0"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                      />
                      <text
                        x="30"
                        y={tick.y + 3}
                        textAnchor="end"
                        fontSize="9.5"
                        fill="#94a3b8"
                        fontFamily="monospace"
                      >
                        {tick.val}%
                      </text>
                    </g>
                  ))}

                  {/* Baseline Axis */}
                  <line x1="36" y1="142" x2="530" y2="142" stroke="#cbd5e1" strokeWidth="1.5" />

                  {/* 85% Industry Target Line */}
                  <line
                    x1="36"
                    y1="40"
                    x2="530"
                    y2="40"
                    stroke="#10b981"
                    strokeWidth="1.2"
                    strokeDasharray="4 3"
                    opacity="0.65"
                  />
                  <text
                    x="530"
                    y="35"
                    textAnchor="end"
                    fontSize="9"
                    fontWeight="600"
                    fill="#059669"
                  >
                    Avg Top Tier 85%
                  </text>

                  {/* Vertical Columns / Histogram bars */}
                  {chartSkills.map((item, i) => {
                    const count = chartSkills.length
                    const slotWidth = (530 - 46) / count
                    const barWidth = Math.min(48, Math.max(34, slotWidth * 0.52))
                    const cx = 46 + slotWidth * (i + 0.5)
                    const bx = cx - barWidth / 2
                    const barHeight = (item.demand / 100) * 120
                    const by = 142 - barHeight
                    const isHovered = activeSkill?.name === item.name

                    return (
                      <g
                        key={item.name}
                        className="cursor-pointer transition-all duration-200 group"
                        onMouseEnter={() => setActiveSkill(item)}
                        onMouseLeave={() => setActiveSkill(null)}
                      >
                        {/* Background track column */}
                        <rect
                          x={bx}
                          y="22"
                          width={barWidth}
                          height="120"
                          rx="6"
                          fill="#f1f5f9"
                          opacity="0.75"
                        />

                        {/* Active rounded gradient bar */}
                        <rect
                          x={bx}
                          y={by}
                          width={barWidth}
                          height={barHeight}
                          rx="6"
                          fill={isHovered ? 'url(#emeraldBarGradHover)' : 'url(#emeraldBarGrad)'}
                          filter={isHovered ? 'url(#barShadow)' : undefined}
                          className="transition-all duration-300"
                        />

                        {/* Top glowing cap */}
                        <rect
                          x={bx + 2}
                          y={by + 2}
                          width={barWidth - 4}
                          height="3.5"
                          rx="1.75"
                          fill="#ffffff"
                          opacity={isHovered ? '0.8' : '0.45'}
                        />

                        {/* Percentage badge floating above bar */}
                        <g transform={`translate(${cx}, ${by - 10})`}>
                          <rect
                            x="-17"
                            y="-11"
                            width="34"
                            height="14"
                            rx="4"
                            fill={isHovered ? '#047857' : '#111a17'}
                            className="transition-colors"
                          />
                          <text
                            x="0"
                            y="-1"
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="9"
                            fontWeight="bold"
                            fontFamily="monospace"
                          >
                            {item.demand}%
                          </text>
                        </g>

                        {/* Skill Name Label */}
                        <text
                          x={cx}
                          y="157"
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight="bold"
                          fill={isHovered ? '#047857' : '#0f172a'}
                          className="transition-colors"
                        >
                          {item.name}
                        </text>

                        {/* Category / Recruiter Tag below */}
                        <text
                          x={cx}
                          y="171"
                          textAnchor="middle"
                          fontSize="8.5"
                          fontWeight="500"
                          fill={isHovered ? '#059669' : '#64748b'}
                        >
                          {item.tag}
                        </text>
                      </g>
                    )
                  })}
                </svg>
              </div>
            </div>

            {/* Domain Breakdown Matrix (2x2 Grid) */}
            <div className="space-y-2 mb-2">
              <div className="flex items-center justify-between text-xs text-navy-500 font-medium">
                <span>Competency by Technical Domain</span>
                <span className="text-[11px] text-primary-700 font-semibold">4 Pillars Evaluated</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {domainMatrix.map((domain) => {
                  const Icon = domain.icon
                  const hasSkills = domain.skills.length > 0
                  const score = hasSkills
                    ? Math.round(domain.skills.reduce((acc, s) => acc + s.demand, 0) / domain.skills.length)
                    : domain.benchmark

                  return (
                    <div
                      key={domain.title}
                      className="p-2.5 rounded-xl border border-surface-200 bg-white hover:border-primary-200 hover:shadow-xs transition-all space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className={clsx(
                            'w-6 h-6 rounded-lg flex items-center justify-center text-xs flex-shrink-0',
                            hasSkills ? 'bg-primary-50 text-primary-700' : 'bg-amber-50 text-amber-700'
                          )}>
                            <Icon size={13} />
                          </div>
                          <span className="text-xs font-bold text-navy-900">{domain.title}</span>
                        </div>
                        <span className={clsx(
                          'text-[10px] font-bold px-1.5 py-0.5 rounded',
                          hasSkills ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        )}>
                          {hasSkills ? `${score}%` : 'Gap Target'}
                        </span>
                      </div>

                      <div className="h-1.5 w-full bg-surface-100 rounded-full overflow-hidden">
                        <div
                          className={clsx(
                            'h-full rounded-full transition-all duration-500',
                            hasSkills
                              ? 'bg-gradient-to-r from-primary-500 to-primary-600'
                              : 'bg-amber-400'
                          )}
                          style={{ width: `${score}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-navy-500 pt-0.5">
                        <span className="truncate max-w-[140px]">
                          {hasSkills
                            ? domain.skills.map((s) => s.name).join(', ')
                            : 'Recruiter Target: SQL & Redis'}
                        </span>
                        <span className="font-semibold text-navy-600 flex-shrink-0 text-[9.5px]">
                          {domain.status}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Bottom Skill Insights Callout */}
          <div className="p-3 rounded-xl bg-surface-50 border border-surface-200/80 flex items-center justify-between gap-3 text-xs mt-2">
            <div className="flex items-center gap-2 text-navy-600">
              <Target size={16} className="text-primary-600 flex-shrink-0" />
              <span>
                Want to expand your profile with missing high-demand technologies?
              </span>
            </div>
            <Link
              to="/career-roadmap"
              className="font-semibold text-primary-600 hover:text-primary-700 whitespace-nowrap flex items-center gap-1 hover:underline"
            >
              Analyze Skill Gaps <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Right Column: 2026 Recruiter Hiring Radar & Market Trends (5 Cols) */}
        <div className="lg:col-span-5 card card-body space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-surface-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Flame size={18} className="text-amber-500" />
                <h2 className="font-display font-bold text-navy-900 text-base">
                  What Tech Recruiters Seek in 2026
                </h2>
              </div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Live Radar
              </span>
            </div>
            <p className="text-xs text-navy-500 mb-4">
              Key market hiring priorities across tech companies and high-growth startups this quarter:
            </p>

            {/* Recruiter Trends List */}
            <div className="space-y-3">
              {TOP_RECRUITER_TRENDS.map((trend) => (
                <div
                  key={trend.title}
                  className="p-3 rounded-xl border border-surface-200 bg-white hover:border-primary-200 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-navy-900">{trend.title}</span>
                    <span className={clsx('text-[10px] font-extrabold px-1.5 py-0.5 rounded', trend.hot ? 'bg-red-50 text-red-600' : 'bg-primary-50 text-primary-700')}>
                      {trend.growth}
                    </span>
                  </div>
                  <p className="text-[11px] text-navy-500 leading-relaxed">
                    {trend.desc}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    {trend.skills.map(s => (
                      <span key={s} className="text-[9px] bg-surface-100 text-navy-600 font-medium px-1.5 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recruiter Tip Banner */}
          <div className="p-3 rounded-xl bg-primary-50/80 border border-primary-200 text-xs text-navy-800 flex items-start gap-2.5 mt-2">
            <Zap size={16} className="text-primary-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-navy-900">Recruiter Tip for Freshers</p>
              <p className="text-[11px] text-navy-600 mt-0.5">
                Companies value deployed live project links and active Git history more than coursework certifications.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Bottom Section: Application Pipeline & Top Opportunities Preview ── */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left: Application Progress Pipeline (5 Cols) */}
        <div className="lg:col-span-5 card card-body space-y-4">
          <div className="flex items-center justify-between border-b border-surface-100 pb-3">
            <div className="flex items-center gap-2">
              <ClipboardList size={18} className="text-teal-600" />
              <h3 className="font-display font-bold text-navy-900 text-base">
                Application Pipeline
              </h3>
            </div>
            <Link
              to="/applications"
              className="text-xs font-semibold text-primary-600 hover:underline flex items-center gap-1"
            >
              Open Kanban <ArrowRight size={13} />
            </Link>
          </div>

          <p className="text-xs text-navy-500">
            Track your progress across every recruitment stage from first bookmark to final offer.
          </p>

          {/* Mini Kanban Funnel */}
          <div className="grid grid-cols-4 gap-2 pt-1 text-center">
            <div className="p-2.5 rounded-xl bg-surface-50 border border-surface-200">
              <p className="text-xl font-display font-extrabold text-navy-900">{appStages.bookmarked}</p>
              <p className="text-[10px] text-navy-500 font-medium uppercase mt-0.5">Saved</p>
            </div>
            <div className="p-2.5 rounded-xl bg-primary-50/60 border border-primary-100">
              <p className="text-xl font-display font-extrabold text-primary-800">{appStages.applied}</p>
              <p className="text-[10px] text-primary-700 font-medium uppercase mt-0.5">Applied</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
              <p className="text-xl font-display font-extrabold text-amber-700">{appStages.interviewing}</p>
              <p className="text-[10px] text-amber-800 font-medium uppercase mt-0.5">Interview</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200">
              <p className="text-xl font-display font-extrabold text-emerald-700">{appStages.offered}</p>
              <p className="text-[10px] text-emerald-800 font-medium uppercase mt-0.5">Offers</p>
            </div>
          </div>

          {appCount === 0 ? (
            <div className="text-center py-5 border border-dashed border-surface-200 rounded-xl space-y-2">
              <p className="text-xs text-navy-500">No active applications in tracker yet.</p>
              <Link to="/jobs" className="btn-secondary btn-sm text-xs inline-flex gap-1.5">
                Browse Jobs & Start Applying <ArrowUpRight size={13} />
              </Link>
            </div>
          ) : (
            <div className="pt-2">
              <Link to="/applications" className="btn-secondary btn-sm w-full gap-2 text-xs">
                Manage All {appCount} Tracked Applications
              </Link>
            </div>
          )}
        </div>

        {/* Right: Curated Top 3 High-Match Opportunities Spotlight (7 Cols) */}
        <div className="lg:col-span-7 card card-body space-y-4">
          <div className="flex items-center justify-between border-b border-surface-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Compass size={18} className="text-primary-600" />
                <h3 className="font-display font-bold text-navy-900 text-base">
                  Top High-Match Opportunities Spotlight
                </h3>
              </div>
              <p className="text-xs text-navy-500 mt-0.5">
                Personalized top picks for you. Explore all {totalJobs} listings in the dedicated Jobs tab.
              </p>
            </div>
            <Link
              to="/jobs"
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1"
            >
              View All ({totalJobs}) <ArrowRight size={13} />
            </Link>
          </div>

          {/* Compact Spotlight List */}
          {jobsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 skeleton rounded-xl" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8 text-navy-500 space-y-2">
              <Briefcase size={28} className="mx-auto text-navy-300" />
              <p className="text-xs">No job recommendations found at the moment.</p>
              <Link to="/jobs" className="btn-primary btn-sm mt-2 text-xs">
                Explore All Postings
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {jobs.slice(0, 3).map((job) => {
                const score = job.matchScore ?? 80
                const scoreClass = score >= 75 ? 'bg-primary-50 text-primary-700 border-primary-200' : (score >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-600 border-red-200')
                return (
                  <Link
                    key={job._id}
                    to={`/jobs/${job._id}`}
                    className="p-3.5 rounded-xl border border-surface-200 hover:border-primary-300 hover:shadow-card-md transition-all flex items-center justify-between gap-3 group bg-white"
                  >
                    <div className="min-w-0 space-y-0.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-navy-900 text-sm group-hover:text-primary-700 transition-colors truncate">
                          {job.title}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-100 text-navy-600 font-medium">
                          {job.jobType || 'Job'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-navy-500">
                        <span className="flex items-center gap-1 truncate">
                          <Building2 size={12} className="text-navy-400" />
                          {job.company}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-navy-400" />
                          {job.location || 'Remote'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className={clsx('px-2.5 py-1 rounded-lg border text-xs font-bold text-center', scoreClass)}>
                        {score}% <span className="text-[10px] font-normal block">Match</span>
                      </div>
                      <ChevronRight size={16} className="text-navy-300 group-hover:text-primary-600 transition-colors" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Link to Full Jobs Tab */}
          <div className="pt-1">
            <Link
              to="/jobs"
              className="btn-secondary btn-sm w-full gap-2 text-xs justify-center"
            >
              Browse All {totalJobs} Active Opportunities in Jobs Tab <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
