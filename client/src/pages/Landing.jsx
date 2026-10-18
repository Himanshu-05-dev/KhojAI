import { Link } from 'react-router-dom'
import { Zap, Brain, Bell, Target, Shield, ChevronRight, Star,
         CheckCircle, ArrowRight, Briefcase, TrendingUp, Clock } from 'lucide-react'

const features = [
  { icon: Brain,      title: 'AI Resume Analysis',      desc: 'Upload your resume once. Our AI extracts skills, experience, and projects to build your candidate profile.' },
  { icon: Target,     title: 'Precision Matching',      desc: 'Every job is scored against your actual skills and preferences with transparent, evidence-backed explanations.' },
  { icon: Bell,       title: 'Always-On Discovery',     desc: 'Background agent keeps searching while you sleep, study, or interview. New matches land in your inbox.' },
  { icon: Briefcase,  title: 'Application Copilot',     desc: 'Get tailored resume bullets, cover letters, and interview prep — all grounded in your real experience.' },
  { icon: TrendingUp, title: 'Career Roadmap',          desc: 'Identify skill gaps, get learning recommendations, and track your progress toward target roles.' },
  { icon: Shield,     title: 'Privacy First',           desc: 'Your resume is private and encrypted. It is never sold, shared, or made publicly accessible.' },
]

const howItWorks = [
  { step: '01', title: 'Upload your resume',        desc: 'PDF upload. AI extracts your complete candidate profile automatically.' },
  { step: '02', title: 'Set your preferences',      desc: 'Target roles, locations, job types, salary range. Your agent learns your priorities.' },
  { step: '03', title: 'Discover matched jobs',     desc: 'The background agent searches authorized sources and ranks opportunities by fit.' },
  { step: '04', title: 'Apply with confidence',     desc: 'Review match explanations, get tailored materials, and track every application.' },
]

const sampleJob = {
  role: 'Software Development Engineer Intern',
  company: 'Razorpay',
  location: 'Bangalore, India',
  type: 'Internship',
  stipend: '₹60,000/month',
  match: 87,
  source: 'Demo Provider',
  highlights: ['Matches your React & Node.js skills', 'Aligns with your B.Tech CSE degree', 'Remote-friendly position'],
}

const faqs = [
  { q: 'Is KhojAI free?',                           a: 'Core job discovery, matching, and the inbox are free. Advanced AI copilot features will have a premium tier in future.' },
  { q: 'Where do jobs come from?',                  a: 'KhojAI integrates authorized job source connectors. Demo mode uses clearly labeled synthetic data until live integrations are configured.' },
  { q: 'Does KhojAI apply on my behalf?',           a: 'No. KhojAI never submits applications or messages recruiters without your explicit instruction and review.' },
  { q: 'Who can see my resume?',                    a: 'Only you. Resumes are stored privately and never made publicly accessible or shared with third parties.' },
  { q: 'Will notifications arrive when my tab is closed?', a: 'Yes. The background discovery agent runs on the server and delivers notifications via email and web push to supported devices.' },
]

function ScoreRing({ score }) {
  const cls = score >= 75 ? 'score-high' : score >= 50 ? 'score-medium' : 'score-low'
  return <div className={cls}>{score}%</div>
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ── NAV ───────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-surface-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-navy-900 text-xl">KhojAI</span>
          </div>
          <div className="hidden md:flex items-center gap-1 text-sm font-medium text-navy-600">
            <a href="#how"      className="px-3 py-1.5 rounded-lg hover:bg-surface-50 transition-colors">How it works</a>
            <a href="#features" className="px-3 py-1.5 rounded-lg hover:bg-surface-50 transition-colors">Features</a>
            <a href="#faq"      className="px-3 py-1.5 rounded-lg hover:bg-surface-50 transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth/login"    className="btn-secondary btn-sm">Log in</Link>
            <Link to="/auth/register" className="btn-primary btn-sm">Get started free</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-24 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-white pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary-100 rounded-full opacity-40 blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-100 rounded-full px-4 py-1.5 text-sm font-medium text-primary-700 mb-6">
            <Zap size={14} />
            AI-Powered Career Discovery for Indian Students
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-extrabold text-navy-900 leading-tight mb-6 text-balance">
            Your AI career agent.<br />
            <span className="text-primary-600">Discover smarter.</span><br />
            Apply with confidence.
          </h1>
          <p className="text-xl text-navy-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload your resume once. KhojAI's always-on background agent discovers personalized jobs, ranks them by fit, explains every match, and notifies you — even when your laptop is closed.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/auth/register" className="btn-primary btn-xl gap-2">
              Start discovering jobs free
              <ArrowRight size={18} />
            </Link>
            <a href="#how" className="btn-secondary btn-xl">
              See how it works
            </a>
          </div>
          <p className="mt-6 text-sm text-navy-400">
            No credit card required · Resume never shared publicly · Cancel anytime
          </p>
        </div>
      </section>

      {/* ── SAMPLE JOB MATCH ──────────────────────────────── */}
      <section className="py-16 px-6 bg-surface-50">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-sm font-semibold text-navy-400 uppercase tracking-widest mb-8">
            Example match — Demo data only
          </p>
          <div className="card-hover card-body p-6 animate-slide-up">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="badge-amber">Internship</span>
                  <span className="badge-gray">{sampleJob.source}</span>
                  <span className="badge-blue">Demo</span>
                </div>
                <h3 className="text-lg font-semibold text-navy-900 mt-1">{sampleJob.role}</h3>
                <p className="text-navy-600 font-medium">{sampleJob.company}</p>
                <div className="flex items-center gap-3 mt-1 text-sm text-navy-500 flex-wrap">
                  <span>{sampleJob.location}</span>
                  <span>·</span>
                  <span className="text-emerald-600 font-medium">{sampleJob.stipend}</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ScoreRing score={sampleJob.match} />
                <span className="text-xs text-navy-400 font-medium">Match</span>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {sampleJob.highlights.map((h, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-navy-700">
                  <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                  {h}
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button className="btn-primary btn-sm">View Details</button>
              <button className="btn-secondary btn-sm">Save Job</button>
              <span className="text-xs text-navy-400 ml-auto flex items-center gap-1">
                <Clock size={11} /> Posted today · Demo listing
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section id="how" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl font-bold text-navy-900 mb-3">How KhojAI works</h2>
            <p className="text-navy-500 max-w-lg mx-auto">Four steps from upload to opportunity — the agent handles discovery in the background.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {howItWorks.map(({ step, title, desc }) => (
              <div key={step} className="relative">
                <div className="text-4xl font-display font-extrabold text-primary-100 mb-3">{step}</div>
                <h3 className="font-semibold text-navy-900 mb-2">{title}</h3>
                <p className="text-sm text-navy-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────── */}
      <section id="features" className="py-20 px-6 bg-surface-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl font-bold text-navy-900 mb-3">Everything you need to land your next role</h2>
            <p className="text-navy-500 max-w-lg mx-auto">A full career intelligence platform, not just a job board.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card card-body group hover:shadow-card-md hover:border-primary-200 transition-all duration-200">
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 mb-4 group-hover:bg-primary-100 transition-colors">
                  <Icon size={20} />
                </div>
                <h3 className="font-semibold text-navy-900 mb-1.5">{title}</h3>
                <p className="text-sm text-navy-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST + PRIVACY ───────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 mx-auto mb-5">
            <Shield size={24} />
          </div>
          <h2 className="font-display text-2xl font-bold text-navy-900 mb-4">Your data stays yours</h2>
          <p className="text-navy-500 mb-8 leading-relaxed">
            KhojAI does not sell your resume or profile data. Resumes are stored encrypted in private object storage.
            The AI service processes your resume to extract skills — it does not retain raw resume content.
            You can delete all your data at any time.
          </p>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { icon: Shield, label: 'Encrypted storage' },
              { icon: CheckCircle, label: 'Never publicly accessible' },
              { icon: Star, label: 'Delete anytime' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 justify-center text-sm font-medium text-navy-700">
                <Icon size={16} className="text-primary-500" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────── */}
      <section id="faq" className="py-20 px-6 bg-surface-50">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-navy-900 mb-10 text-center">Frequently asked questions</h2>
          <div className="space-y-4">
            {faqs.map(({ q, a }) => (
              <details key={q} className="card group">
                <summary className="card-body cursor-pointer flex items-center justify-between font-medium text-navy-900 list-none select-none">
                  {q}
                  <ChevronRight size={16} className="text-navy-400 group-open:rotate-90 transition-transform flex-shrink-0" />
                </summary>
                <div className="px-5 pb-5 text-sm text-navy-600 leading-relaxed border-t border-surface-100 pt-3">
                  {a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-navy-900">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-4">
            Start your smarter job search today
          </h2>
          <p className="text-navy-300 mb-8 leading-relaxed">
            Upload your resume, set your preferences, and let the AI agent do the work.
            No cost. No spam.
          </p>
          <Link to="/auth/register" className="btn btn-xl bg-white text-navy-900 hover:bg-surface-50 shadow-card-lg font-bold">
            Get started free
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="bg-navy-950 py-10 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-6 h-6 bg-primary-600 rounded-md flex items-center justify-center">
            <Zap size={12} className="text-white" />
          </div>
          <span className="font-display font-bold text-white text-sm">KhojAI</span>
        </div>
        <p className="text-xs text-navy-400">
          © {new Date().getFullYear()} KhojAI. Demo data is synthetic and clearly labeled. Real job integrations require authorized API access.
        </p>
      </footer>
    </div>
  )
}
