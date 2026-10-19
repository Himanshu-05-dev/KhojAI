import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff, Loader2 } from 'lucide-react'
import { authAPI } from '@/api'
import { useAuthStore } from '@/store'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [form, setForm]       = useState({ email: '', password: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors]   = useState({})
  const setAuth    = useAuthStore((s) => s.setAuth)
  const navigate   = useNavigate()

  const validate = () => {
    const e = {}
    if (!form.email)    e.email = 'Email is required'
    if (!form.password) e.password = 'Password is required'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true); setErrors({})
    try {
      const res = await authAPI.login(form)
      const user = res.data?.data?.user || res.data?.user
      const token = res.data?.data?.token || res.data?.token
      if (!user || !token) {
        throw new Error('Login succeeded, but failed to load user profile.')
      }
      setAuth(user, token)
      toast.success(`Welcome back, ${user.name}!`)
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Please try again.'
      toast.error(msg)
      if (err.response?.status === 401) setErrors({ password: 'Invalid email or password' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <span className="font-display font-bold text-navy-900 text-2xl">KhojAI</span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-navy-900">Welcome back</h1>
          <p className="text-navy-500 text-sm mt-1">Sign in to your account to continue</p>
        </div>

        <div className="card card-body p-8">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="login-email" className="label">Email address</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={`input ${errors.email ? 'input-error' : ''}`}
              />
              {errors.email && <p className="field-error">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="login-password" className="label">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="field-error">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              id="login-submit"
              className="btn-primary w-full py-3"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-navy-500 mt-6">
            Don't have an account?{' '}
            <Link to="/auth/register" className="text-primary-600 font-medium hover:underline">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
