import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { useAuth } from '../features/auth/AuthContext'
import { JobDetailPage } from '../pages/employee/JobDetailPage'
import { LoginPage } from '../pages/employee/LoginPage'
import { MyJobsPage } from '../pages/employee/MyJobsPage'
import {
  CustomersPage,
  EquipmentPage,
  PartsApprovalPage,
  PartsPage,
  PartsUsageHistoryPage,
  PurchasingWorkbenchPage,
  ReportsPage,
  ServiceLocationsPage,
  TimeApprovalPage,
  UnauthorizedPage,
  UsersPage
} from '../pages/manager/EntityPages'
import { JobTicketCreatePage } from '../pages/manager/JobTicketCreatePage'
import { JobTicketDetailPage } from '../pages/manager/JobTicketDetailPage'
import { JobTicketListPage } from '../pages/manager/JobTicketListPage'
import { ManagerDashboardPage } from '../pages/manager/ManagerDashboardPage'
import { ManagerShell } from '../pages/manager/ManagerShell'
import { UxPreviewReadinessPage } from '../pages/preview/UxPreviewReadinessPage'

function HomeRoute() {
  const { user } = useAuth()
  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role === 'Employee') {
    return <Navigate to="/jobs" replace />
  }

  return <Navigate to="/manage" replace />
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/preview" element={<UxPreviewReadinessPage />} />

      <Route element={<ProtectedRoute allowedRoles={['Employee']} />}>
        <Route path="/jobs" element={<MyJobsPage />} />
        <Route path="/jobs/:jobTicketId" element={<JobDetailPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['Manager', 'Admin']} />}>
        <Route path="/manage" element={<ManagerShell />}>
          <Route index element={<ManagerDashboardPage />} />
          <Route path="job-tickets" element={<JobTicketListPage />} />
          <Route path="job-tickets/new" element={<JobTicketCreatePage />} />
          <Route path="job-tickets/:jobTicketId" element={<JobTicketDetailPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="service-locations" element={<ServiceLocationsPage />} />
          <Route path="equipment" element={<EquipmentPage />} />
          <Route path="parts" element={<PartsPage />} />
          <Route path="purchasing" element={<PurchasingWorkbenchPage />} />
          <Route path="parts-usage-history" element={<PartsUsageHistoryPage />} />
          <Route path="time-approval" element={<TimeApprovalPage />} />
          <Route path="parts-approval" element={<PartsApprovalPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route path="users" element={<UsersPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<HomeRoute />} />
      <Route path="*" element={<HomeRoute />} />
    </Routes>
  )
}
