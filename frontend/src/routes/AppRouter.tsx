import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { JobDetailPage } from '../pages/employee/JobDetailPage'
import { LoginPage } from '../pages/employee/LoginPage'
import { MyJobsPage } from '../pages/employee/MyJobsPage'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute allowedRoles={['Employee']} />}>
        <Route path="/jobs" element={<MyJobsPage />} />
        <Route path="/jobs/:jobTicketId" element={<JobDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/jobs" replace />} />
    </Routes>
  )
}
