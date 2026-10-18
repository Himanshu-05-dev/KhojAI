import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
import AppShell from '@/components/layout/AppShell'

// Pages
import LandingPage        from '@/pages/Landing'
import LoginPage          from '@/pages/auth/Login'
import RegisterPage       from '@/pages/auth/Register'
import OnboardingPage     from '@/pages/Onboarding'
import DashboardPage      from '@/pages/Dashboard'
import ResumePage         from '@/pages/Resume'
import JobsPage           from '@/pages/Jobs'
import JobDetailPage      from '@/pages/JobDetail'
import InboxPage          from '@/pages/Inbox'
import ApplicationsPage   from '@/pages/Applications'
import CareerRoadmapPage  from '@/pages/CareerRoadmap'
import ProfilePage        from '@/pages/Profile'
import SettingsPage       from '@/pages/Settings'

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/auth/login" replace />
}

function PublicOnlyRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth/login"    element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/auth/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />

      {/* Protected with shell */}
      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route path="/onboarding"    element={<OnboardingPage />} />
        <Route path="/dashboard"     element={<DashboardPage />} />
        <Route path="/resume"        element={<ResumePage />} />
        <Route path="/jobs"          element={<JobsPage />} />
        <Route path="/jobs/:id"      element={<JobDetailPage />} />
        <Route path="/inbox"         element={<InboxPage />} />
        <Route path="/applications"  element={<ApplicationsPage />} />
        <Route path="/career-roadmap"element={<CareerRoadmapPage />} />
        <Route path="/profile"       element={<ProfilePage />} />
        <Route path="/settings"      element={<SettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
