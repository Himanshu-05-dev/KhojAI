import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'
import { authAPI } from '@/api'
import { useAuthStore } from '@/store'
import toast from 'react-hot-toast'

const roles = ['Student', 'Fresher', 'Working Professional', 'Career Switcher']

export default function RegisterPage() {
  const [form, setForm]       = useState({ name: '', email: '', password: '', role: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors]   = useState({})
  const setAuth  = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  const validate = () => {
    const e = {}
    if (!form.name.trim())         e.name = 'Name is required'
    if (!form.email.includes('@')) e.email = 'Enter a valid email'
    if (form.password.length < 8)  e.password = 'Password must be at least 8 characters'
    if (!form.role)                e.role = 'Please select your current status'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true); setErrors({})
    try {
      const res = await authAPI.register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        currentStatus: form.role,
      })
      const user = res.data?.data?.user || res.data?.user
      const token = res.data?.data?.token || res.data?.token
      if (!user || !token) {
        throw new Error('Registration succeeded, but failed to load user profile.')
      }
      setAuth(user, token)
      toast.success('Account created! Let\'s set up your profile.')
      navigate('/onboarding')
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed.'
      toast.error(msg)
      if (err.response?.status === 409) setErrors({ email: 'This email is already registered' })
    } finally {
      setLoading(false)
    }
  }

  const passwordStrength = form.password.length >= 8
    ? form.password.match(/[A-Z]/) && form.password.match(/[0-9]/)
      ? 'strong' : 'medium'
    : form.password.length > 0 ? 'weak' : null

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <span className="font-display font-bold text-navy-900 text-2xl">KhojAI</span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-navy-900">Create your account</h1>
          <p className="text-navy-500 text-sm mt-1">Start your smarter job search — free</p>
        </div>

        <div className="card card-body p-8">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="reg-name" className="label">Full name</label>
              <input
                id="reg-name" type="text" autoComplete="name"
                placeholder="Priya Sharma"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={`input ${errors.name ? 'input-error' : ''}`}
              />
              {errors.name && <p className="field-error">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="reg-email" className="label">Email address</label>
              <input
                id="reg-email" type="email" autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={`input ${errors.email ? 'input-error' : ''}`}
              />
              {errors.email && <p className="field-error">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="reg-password" className="label">Password</label>
              <div className="relative">
                <input
                  id="reg-password" type={showPw ? 'text' : 'password'} autoComplete="new-password"
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600"
                  aria-label={showPw ? 'Hide password' : 'Show password'}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordStrength && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex gap-1">
                    {['weak','medium','strong'].map((s, i) => (
                      <div key={s} className={`h-1 w-8 rounded-full transition-colors ${
                        passwordStrength === 'weak'   && i === 0 ? 'bg-red-400' :
                        passwordStrength === 'medium' && i <= 1  ? 'bg-amber-400' :
                        passwordStrength === 'strong'            ? 'bg-emerald-400' : 'bg-surface-200'
                      }`} />
                    ))}
                  </div>
                  <span className={`text-xs font-medium ${
                    passwordStrength === 'weak' ? 'text-red-500' : passwordStrength === 'medium' ? 'text-amber-500' : 'text-emerald-500'
                  }`}>{passwordStrength}</span>
                </div>
              )}
              {errors.password && <p className="field-error">{errors.password}</p>}
            </div>

            <div>
              <label className="label">Current status</label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((r) => (
                  <button
                    key={r} type="button"
                    onClick={() => setForm({ ...form, role: r })}
                    className={`px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                      form.role === r
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-surface-200 bg-surface-0 text-navy-600 hover:border-primary-300'
                    }`}
                  >
                    {form.role === r && <CheckCircle size={12} className="inline mr-1" />}
                    {r}
                  </button>
                ))}
              </div>
              {errors.role && <p className="field-error">{errors.role}</p>}
            </div>

            <button type="submit" disabled={loading} id="register-submit" className="btn-primary w-full py-3 mt-2">
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? 'Creating account…' : 'Create free account'}
            </button>
          </form>

          <p className="text-xs text-center text-navy-400 mt-4 leading-relaxed">
            By registering you agree to responsible use. KhojAI never submits applications without your explicit approval.
          </p>

          <p className="text-center text-sm text-navy-500 mt-4">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
