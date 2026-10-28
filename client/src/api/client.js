import axios from 'axios'
import { useAuthStore } from '@/store'

let rawBase = import.meta.env.VITE_API_URL || '/api/v1'
if (rawBase && rawBase.startsWith('http')) {
  rawBase = rawBase.replace(/\/+$/, '')
  if (!rawBase.endsWith('/api/v1')) {
    rawBase = `${rawBase}/api/v1`
  }
}

const api = axios.create({
  baseURL: rawBase,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Normalize response data and handle 401 globally
api.interceptors.response.use(
  (res) => {
    if (res.data && typeof res.data === 'object' && res.data.data === undefined) {
      const entityKey = ['job', 'resume', 'roadmap', 'profile', 'applications', 'notifications'].find(
        (k) => res.data[k] !== undefined
      )
      res.data.data = entityKey ? res.data[entityKey] : res.data
    }
    return res
  },
  (err) => {
    if (err.response?.status === 401 && !window.location.pathname.startsWith('/auth/')) {
      useAuthStore.getState().clearAuth()
      window.location.href = '/auth/login'
    }
    return Promise.reject(err)
  }
)

export default api
