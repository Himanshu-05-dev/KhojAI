import api from './client'

// ─── Auth ─────────────────────────────────────────────────────
export const authAPI = {
  register:      (data) => api.post('/auth/register', data),
  login:         (data) => api.post('/auth/login', data),
  logout:        ()     => api.post('/auth/logout'),
  me:            ()     => api.get('/auth/me'),
  resetPassword: (data) => api.post('/auth/reset-password', data),
}

// ─── Profile ───────────────────────────────────────────────────
export const profileAPI = {
  get:              ()     => api.get('/profile'),
  update:           (data) => api.patch('/profile', data),
  updatePreferences:(data) => api.patch('/preferences', data),
  syncResume:       ()     => api.post('/profile/sync-resume'),
}

// ─── Resume ───────────────────────────────────────────────────
export const resumeAPI = {
  list:     ()     => api.get('/resumes'),
  get:      (id)   => api.get(`/resumes/${id}`),
  upload:   (form) => api.post('/resumes', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  analyze:  (id)   => api.post(`/resumes/${id}/analyze`),
  updateProfile: (id, data) => api.patch(`/resumes/${id}/profile`, data),
  delete:   (id)   => api.delete(`/resumes/${id}`),
}

// ─── Jobs ──────────────────────────────────────────────────────
export const jobsAPI = {
  list:        (params) => api.get('/jobs', { params }),
  get:         (id)     => api.get(`/jobs/${id}`),
  recommended: (params) => api.get('/jobs/recommended', { params }),
  search:      (data)   => api.post('/jobs/search', data),
  feedback:    (id, data) => api.post(`/jobs/${id}/feedback`, data),
  save:        (id)     => api.post(`/jobs/${id}/save`),
  unsave:      (id)     => api.delete(`/jobs/${id}/save`),
  syncRealJobs:()       => api.post('/jobs/sync'),
}

// ─── Matches ───────────────────────────────────────────────────
export const matchesAPI = {
  list: (params) => api.get('/matches', { params }),
  get:  (id)     => api.get(`/matches/${id}`),
}

// ─── Notifications ─────────────────────────────────────────────
export const notificationsAPI = {
  list:           (params) => api.get('/notifications', { params }),
  unreadCount:    ()       => api.get('/notifications/unread-count'),
  markRead:       (id)     => api.patch(`/notifications/${id}/read`),
  markAllRead:    ()       => api.post('/notifications/read-all'),
  delete:         (id)     => api.delete(`/notifications/${id}`),
  getPrefs:       ()       => api.get('/notifications/preferences'),
  updatePrefs:    (data)   => api.patch('/notifications/preferences', data),
  subscribePush:  (sub)    => api.post('/notifications/push-subscriptions', sub),
  unsubscribePush:()       => api.delete('/notifications/push-subscriptions'),
}

// ─── Applications ──────────────────────────────────────────────
export const applicationsAPI = {
  list:       (params) => api.get('/applications', { params }),
  create:     (data)   => api.post('/applications', data),
  get:        (id)     => api.get(`/applications/${id}`),
  update:     (id, data) => api.patch(`/applications/${id}`, data),
  delete:     (id)     => api.delete(`/applications/${id}`),
  autoSync:   ()       => api.post('/applications/auto-sync'),
  parseEmail: (data)   => api.post('/applications/parse-email', data),
}

// ─── Career ───────────────────────────────────────────────────
export const careerAPI = {
  getRoadmap:      ()       => api.get('/career/roadmap'),
  generateRoadmap: (data)   => api.post('/career/roadmap/generate', data),
  updateTask:      (id, data) => api.patch(`/career/roadmap/tasks/${id}`, data),
}

// ─── Health ───────────────────────────────────────────────────
export const healthAPI = {
  check: () => api.get('/health'),
}
