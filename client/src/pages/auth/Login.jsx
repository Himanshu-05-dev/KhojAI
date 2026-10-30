import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff, Loader2, KeyRound, X, CheckCircle2 } from 'lucide-react'
import { authAPI } from '@/api'
import { useAuthStore } from '@/store'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [form, setForm]             = useState({ email: '', password: '' })
  const [showPw, setShowPw]         = useState(false)
  const [loading, setLoading]       = useState(false)
  const [errors, setErrors]         = useState({})
  const [resetModal, setResetModal] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [resetLoading, setResetLoading] = useState(false)

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
      const res = await authAPI.login({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      })
      const user = res.data?.data?.user || res.data?.user
      const token = res.data?.data?.token || res.data?.token
      if (!user || !token) {
        throw new Error('Login succeeded, but failed to load user profile.')
      }
      setAuth(user, token)
      toast.success(`Welcome back, ${user.name}!`)
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.'
      toast.error(msg)
      if (err.response?.status === 401) setErrors({ password: 'Invalid email or password' })
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!resetEmail.trim() || !newPassword.trim()) {
      toast.error('Please enter email and new password')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setResetLoading(true)
    try {
      const res = await authAPI.resetPassword({
        email: resetEmail.trim().toLowerCase(),
        newPassword: newPassword.trim(),
      })
      toast.success(res?.data?.message || 'Password reset successfully!')
      setForm({ email: resetEmail.trim(), password: newPassword.trim() })
      setResetModal(false)
      setNewPassword('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4">
            <img src="/khojai-icon.png" alt="KhojAI" className="w-9 h-9 rounded-xl object-contain shadow-sm" />
            <span className="font-display font-bold text-navy-900 text-2xl tracking-tight">
              Khoj<span className="text-orange-500">AI</span>
            </span>
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
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="login-password" className="label mb-0">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(form.email || 'himanshu@gmail.com')
                    setResetModal(true)
                  }}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Forgot / Reset?
                </button>
              </div>
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

      {/* Instant Password Reset Modal */}
      {resetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md animate-slide-up shadow-xl">
            <div className="card-header flex items-center justify-between border-b border-surface-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                  <KeyRound size={16} />
                </div>
                <div>
                  <h3 className="font-semibold text-navy-900 text-base">Reset Your Password</h3>
                  <p className="text-xs text-navy-400">Set a new password for your KhojAI account</p>
                </div>
              </div>
              <button onClick={() => setResetModal(false)} className="btn-ghost p-1.5"><X size={16} /></button>
            </div>

            <form onSubmit={handleResetPassword} className="card-body space-y-4">
              <div>
                <label className="label text-xs">Account Email</label>
                <input
                  type="email"
                  className="input text-sm"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="himanshu@gmail.com"
                  required
                />
              </div>

              <div>
                <label className="label text-xs">New Password (min 6 characters)</label>
                <input
                  type="password"
                  className="input text-sm"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setResetModal(false)} className="btn-secondary btn-sm">
                  Cancel
                </button>
                <button type="submit" disabled={resetLoading} className="btn-primary btn-sm gap-2">
                  {resetLoading && <Loader2 size={14} className="animate-spin" />} Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
