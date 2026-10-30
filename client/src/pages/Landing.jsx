import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { authAPI } from '@/api'
import {
  Sparkles, Brain, Target, Shield, ChevronRight,
  CheckCircle2, TrendingUp,
  Eye, EyeOff, Loader2, Compass, Layers, Flame,
  LogIn, User
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const RECRUITER_RADAR = [
  {
    title: 'Generative AI & Agentic Orchestration',
    growth: '+142%',
    desc: 'Companies are hiring engineers who connect LLMs to production databases using Python, FastAPI, and vector stores.',
    skills: ['Python', 'LangChain', 'FastAPI', 'Vector DB'],
  },
  {
    title: 'Full-Stack TypeScript & React Architecture',
    growth: '+88%',
    desc: 'Highest posting volume in India. High demand for clean component state, responsive Tailwind UI, and REST APIs.',
    skills: ['TypeScript', 'React', 'Node.js', 'Tailwind CSS'],
  },
  {
    title: 'Containerization & CI/CD Pipelines',
    growth: '+76%',
    desc: 'Recruiters favor candidates who containerize microservices with Docker and deploy via GitHub Actions.',
    skills: ['Docker', 'AWS', 'CI/CD', 'Linux'],
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Upload your resume',
    desc: 'Upload a single PDF or DOCX. KhojAI extracts your verified skills, experience, and contact details automatically.',
  },
  {
    step: '02',
    title: 'Calibrate your preferences',
    desc: 'Set preferred locations (Noida, Bangalore, Remote), target roles, work modes, and minimum stipend expectations.',
  },
  {
    step: '03',
    title: 'Autonomous job discovery',
    desc: 'Our backend agent continuously searches live tech jobs & internships from Amazon India, Internshala, and global portals.',
  },
  {
    step: '04',
    title: 'Precision-match and apply',
    desc: 'Review transparent match explanations, skill overlap breakdowns, and track application stages in your Kanban pipeline.',
  },
]

const FEATURES = [
  {
    icon: Brain,
    title: 'Deep Resume Parsing',
    desc: 'Extracts programming languages, frameworks, developer tools, education history, and social profile links with zero manual typing.',
  },
  {
    icon: Target,
    title: 'Evidence-Backed Match Scoring',
    desc: 'Every opportunity receives an authentic 0-100% match score with explicit bullet points explaining why you qualify.',
  },
  {
    icon: TrendingUp,
    title: 'Candidate Competency Histogram',
    desc: 'Visualizes your tech stack competency against benchmarked 2026 industry hiring demand frequencies.',
  },
  {
    icon: Compass,
    title: 'Always-On Discovery Agent',
    desc: 'Runs in the background 24/7 so new internships and high-match openings land in your inbox while you sleep or study.',
  },
  {
    icon: Layers,
    title: 'Kanban Application Pipeline',
    desc: 'Track every lead across Bookmarked, Applied, Interviewing, and Offered stages with personalized notes.',
  },
  {
    icon: Shield,
    title: 'Encrypted Privacy Vault',
    desc: 'Your resume is private. It is never sold, publicly indexed, or shared with third parties without your explicit permission.',
  },
]

const FAQS = [
  {
    q: 'How does KhojAI find live tech jobs and internships?',
    a: 'KhojAI aggregates live postings directly from authorized feeds including Amazon India, Internshala tech internships & fresher jobs, and international remote portals like Remotive and Arbeitnow.',
  },
  {
    q: 'How does the AI calculate match scores?',
    a: 'KhojAI computes a multi-factor score evaluating required skills overlap, candidate experience level, work mode compatibility, and target job titles. You receive transparent evidence bullets explaining the match.',
  },
  {
    q: 'Will my profile details auto-fill from my resume?',
    a: 'Yes! When you upload your resume, your full name, phone number, bio summary, LinkedIn, GitHub, and portfolio links are automatically extracted into your Profile section.',
  },
  {
    q: 'Is KhojAI free for students and freshers?',
    a: 'Yes! Core job discovery, AI resume parsing, match explanations, and the application pipeline are completely free for students and job seekers.',
  },
  {
    q: 'Will I get alerts when new matching jobs arrive?',
    a: 'Yes. The background engine checks for new matching jobs and sends high-match notifications directly to your KhojAI inbox and alert center.',
  },
]

export default function LandingPage() {
  const user = useAuthStore((s) => s.user)
  const setAuth = useAuthStore((s) => s.setAuth)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const navigate = useNavigate()

  // Hero Quick Login/Register State
  const [authMode, setAuthMode] = useState('login') // 'login' | 'register'
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [regName, setRegName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // Handle direct sign in from landing page
  const handleQuickLogin = async (e) => {
    e.preventDefault()
    if (!loginEmail.trim() || !loginPassword) {
      toast.error('Please enter your email and password.')
      return
    }

    setLoading(true)
    try {
      const res = await authAPI.login({
        email: loginEmail.trim(),
        password: loginPassword,
      })
      const userData = res.data?.data?.user || res.data?.user
      const token = res.data?.data?.token || res.data?.token
      if (!userData || !token) {
        throw new Error('Login succeeded, but failed to load user profile.')
      }

      setAuth(userData, token)
      toast.success(`Welcome back, ${userData.name}!`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  // Handle direct registration from landing page
  const handleQuickRegister = async (e) => {
    e.preventDefault()
    if (!regName.trim() || !loginEmail.trim() || !loginPassword) {
      toast.error('Please fill in your name, email, and password.')
      return
    }

    setLoading(true)
    try {
      const res = await authAPI.register({
        name: regName.trim(),
        email: loginEmail.trim(),
        password: loginPassword,
      })
      const userData = res.data?.data?.user || res.data?.user
      const token = res.data?.data?.token || res.data?.token
      setAuth(userData, token)
      toast.success(`Account created! Welcome, ${userData.name}!`)
      navigate('/onboarding')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white font-sans text-navy-900 selection:bg-primary-100 selection:text-primary-800">
      {/* ─── STICKY HEADER ────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-surface-200/80 transition-all">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src="/khojai-icon.png"
              alt="KhojAI"
              className="w-8 h-8 rounded-lg object-contain shadow-xs group-hover:scale-105 transition-transform"
            />
            <span className="font-display font-extrabold text-navy-900 text-xl tracking-tight">
              Khoj<span className="text-orange-500">AI</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-navy-600">
            <a href="#how" className="hover:text-primary-600 transition-colors">How It Works</a>
            <a href="#radar" className="hover:text-primary-600 transition-colors">Hiring Radar</a>
            <a href="#features" className="hover:text-primary-600 transition-colors">Features</a>
            <a href="#faq" className="hover:text-primary-600 transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/dashboard"
                  className="btn-primary btn-sm gap-2 shadow-sm text-xs"
                >
                  <Compass size={14} /> Open Dashboard
                </Link>
                <Link
                  to="/profile"
                  className="w-8 h-8 rounded-full bg-primary-100 text-primary-800 font-bold flex items-center justify-center text-xs border border-primary-200"
                  title={user?.name}
                >
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </Link>
              </div>
            ) : (
              <>
                <a
                  href="#signin"
                  className="btn-secondary btn-sm text-xs font-semibold"
                >
                  Log In
                </a>
                <Link
                  to="/auth/register"
                  className="btn-primary btn-sm text-xs font-semibold shadow-sm"
                >
                  Sign Up Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── HERO SECTION WITH INSTANT SIGN-IN CARD ─────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-20 px-6 bg-gradient-to-b from-primary-50/40 via-white to-white">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary-100/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headline & Value Proposition */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold border border-primary-200/80 shadow-xs">
              <Sparkles size={14} className="text-primary-600" />
              <span>Next-Gen Career Copilot for Software Engineers</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-navy-900 tracking-tight leading-[1.12]">
              Stop applying blindly.<br />
              <span className="text-primary-600">Discover & match jobs</span> with precision.
            </h1>

            <p className="text-navy-600 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Upload your resume once. KhojAI automatically extracts your verified technical stack,
              evaluates openings from <strong>Amazon India</strong>, <strong>Internshala</strong>, and top global startups,
              and generates transparent match explanations 24/7.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-navy-700 bg-white px-3.5 py-2 rounded-xl border border-surface-200 shadow-xs">
                <CheckCircle2 size={16} className="text-primary-600" />
                <span>300+ Verified Live Postings</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-navy-700 bg-white px-3.5 py-2 rounded-xl border border-surface-200 shadow-xs">
                <CheckCircle2 size={16} className="text-primary-600" />
                <span>Auto-Fills Profile from Resume</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-navy-700 bg-white px-3.5 py-2 rounded-xl border border-surface-200 shadow-xs">
                <CheckCircle2 size={16} className="text-primary-600" />
                <span>Always-On Background Search</span>
              </div>
            </div>
          </div>

          {/* Right Column: Instant Login / Sign-In Card */}
          <div id="signin" className="lg:col-span-5">
            <div className="card shadow-card-lg border-primary-100 bg-white/95 backdrop-blur-sm p-6 sm:p-7 space-y-5">
              {isAuthenticated ? (
                <div className="text-center space-y-4 py-4 animate-fade-in">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center text-white font-display font-extrabold text-2xl mx-auto shadow-sm">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Active Session
                    </span>
                    <h3 className="font-display font-bold text-navy-900 text-xl mt-1.5">
                      Welcome back, {user?.name}!
                    </h3>
                    <p className="text-xs text-navy-500 mt-0.5">{user?.email}</p>
                  </div>
                  <div className="pt-2 flex flex-col gap-2.5">
                    <Link to="/dashboard" className="btn-primary w-full gap-2 shadow-sm">
                      <Compass size={16} /> Open Career Dashboard
                    </Link>
                    <Link to="/profile" className="btn-secondary w-full gap-2 text-xs">
                      <User size={14} /> View My Profile & Resume
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  {/* Auth Mode Toggle */}
                  <div className="flex bg-surface-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className={clsx(
                        'flex-1 py-2 text-xs font-bold rounded-lg transition-all',
                        authMode === 'login'
                          ? 'bg-white text-navy-900 shadow-xs'
                          : 'text-navy-500 hover:text-navy-900'
                      )}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode('register')}
                      className={clsx(
                        'flex-1 py-2 text-xs font-bold rounded-lg transition-all',
                        authMode === 'register'
                          ? 'bg-white text-navy-900 shadow-xs'
                          : 'text-navy-500 hover:text-navy-900'
                      )}
                    >
                      Create Account
                    </button>
                  </div>

                  <div className="space-y-1">
                    <h2 className="font-display font-bold text-navy-900 text-lg">
                      {authMode === 'login' ? 'Sign in to your account' : 'Join KhojAI for free'}
                    </h2>
                    <p className="text-xs text-navy-500">
                      {authMode === 'login'
                        ? 'Access your saved matches, resume intelligence, and alerts'
                        : 'Unlock automated job matching and candidate profiling'}
                    </p>
                  </div>

                  {/* Form */}
                  <form
                    onSubmit={authMode === 'login' ? handleQuickLogin : handleQuickRegister}
                    className="space-y-3.5"
                  >
                    {authMode === 'register' && (
                      <div>
                        <label className="label text-xs">Full Name</label>
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="e.g. Himanshu Gola"
                          className="input text-xs py-2"
                        />
                      </div>
                    )}

                    <div>
                      <label className="label text-xs">Email address</label>
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="input text-xs py-2"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="label text-xs mb-0">Password</label>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••"
                          className="input text-xs py-2 pr-9"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-2.5 text-navy-400 hover:text-navy-600"
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary w-full gap-2 shadow-sm text-xs py-2.5 mt-2"
                    >
                      {loading ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <LogIn size={15} />
                      )}
                      {authMode === 'login' ? 'Sign In & Launch Copilot' : 'Create Account & Start'}
                    </button>
                  </form>

                  <div className="pt-1 text-center text-xs text-navy-500 border-t border-surface-100">
                    {authMode === 'login' ? (
                      <p>
                        Don&apos;t have an account?{' '}
                        <button
                          type="button"
                          onClick={() => setAuthMode('register')}
                          className="text-primary-600 font-bold hover:underline"
                        >
                          Sign up free
                        </button>
                      </p>
                    ) : (
                      <p>
                        Already have an account?{' '}
                        <button
                          type="button"
                          onClick={() => setAuthMode('login')}
                          className="text-primary-600 font-bold hover:underline"
                        >
                          Sign in
                        </button>
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── LIVE RECRUITER RADAR PREVIEW ───────────────────────────── */}
      <section id="radar" className="py-16 px-6 bg-surface-50 border-y border-surface-200/80">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              <Flame size={14} className="text-amber-500" />
              <span>Live Hiring Intelligence</span>
            </div>
            <h2 className="font-display text-3xl font-bold text-navy-900">
              What Tech Recruiters Seek in 2026
            </h2>
            <p className="text-xs sm:text-sm text-navy-500 max-w-lg mx-auto">
              KhojAI calibrates your candidate stack against active hiring priorities across high-growth startups and tech teams.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {RECRUITER_RADAR.map((trend) => (
              <div
                key={trend.title}
                className="card card-body p-5 bg-white border border-surface-200 hover:border-primary-300 hover:shadow-card transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200">
                    {trend.growth}
                  </span>
                  <span className="text-[10px] text-navy-400 font-medium">Q4 Priority</span>
                </div>
                <h3 className="font-bold text-navy-900 text-sm leading-snug">{trend.title}</h3>
                <p className="text-xs text-navy-500 leading-relaxed">{trend.desc}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {trend.skills.map((s) => (
                    <span
                      key={s}
                      className="text-[10px] bg-surface-100 text-navy-700 font-semibold px-2 py-0.5 rounded-md"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ───────────────────────────────────────────── */}
      <section id="how" className="py-20 px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="font-display text-3xl font-bold text-navy-900">How KhojAI Works</h2>
            <p className="text-navy-500 text-sm max-w-md mx-auto">
              Four seamless steps from uploading your resume to receiving high-match career alerts.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((item) => (
              <div
                key={item.step}
                className="p-5 rounded-2xl bg-white border border-surface-200 shadow-xs space-y-3 relative group hover:border-primary-300 transition-all"
              >
                <span className="text-4xl font-display font-extrabold text-primary-200 group-hover:text-primary-400 transition-colors">
                  {item.step}
                </span>
                <h3 className="font-bold text-navy-900 text-base">{item.title}</h3>
                <p className="text-xs text-navy-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES MATRIX ────────────────────────────────────────── */}
      <section id="features" className="py-20 px-6 bg-surface-50 border-t border-surface-200/80">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="font-display text-3xl font-bold text-navy-900">
              Built for Engineering Careers
            </h2>
            <p className="text-navy-500 text-sm max-w-lg mx-auto">
              Everything you need to benchmark your skills, discover live roles, and apply with confidence.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="card card-body p-6 bg-white hover:border-primary-300 hover:shadow-card transition-all space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center">
                  <Icon size={20} />
                </div>
                <h3 className="font-bold text-navy-900 text-base">{title}</h3>
                <p className="text-xs text-navy-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FREQUENTLY ASKED QUESTIONS ─────────────────────────────── */}
      <section id="faq" className="py-20 px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="font-display text-3xl font-bold text-navy-900">
              Frequently Asked Questions
            </h2>
            <p className="text-navy-500 text-sm">
              Clear answers on job sources, resume privacy, and matching intelligence.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq) => (
              <details
                key={faq.q}
                className="group card bg-white border border-surface-200 rounded-xl overflow-hidden"
              >
                <summary className="p-4 cursor-pointer flex items-center justify-between font-bold text-sm text-navy-900 list-none select-none hover:text-primary-700 transition-colors">
                  {faq.q}
                  <ChevronRight
                    size={16}
                    className="text-navy-400 group-open:rotate-90 transition-transform flex-shrink-0"
                  />
                </summary>
                <div className="px-4 pb-4 text-xs text-navy-600 leading-relaxed border-t border-surface-100 pt-3">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BOTTOM CTA BANNER ──────────────────────────────────────── */}
      <section className="py-16 px-6 bg-navy-900 text-white">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to find your high-match tech opportunity?
          </h2>
          <p className="text-navy-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Join hundreds of engineering students and developers discovering smart career opportunities with KhojAI.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="#signin"
              className="btn-primary btn-lg shadow-sm font-bold text-sm"
            >
              Sign In to Your Account
            </a>
            <Link
              to="/auth/register"
              className="btn-secondary btn-lg bg-navy-800 text-white border-navy-700 hover:bg-navy-700 font-bold text-sm"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────────────── */}
      <footer className="bg-navy-950 py-8 px-6 text-center text-xs text-navy-400 border-t border-navy-900">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/khojai-icon.png" alt="KhojAI" className="w-5 h-5 rounded object-contain" />
            <span className="font-display font-bold text-white text-sm">
              Khoj<span className="text-orange-500">AI</span>
            </span>
            <span className="text-navy-600">|</span>
            <span>AI Career Agent & Job Discovery Platform</span>
          </div>
          <p>© 2026 KhojAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
