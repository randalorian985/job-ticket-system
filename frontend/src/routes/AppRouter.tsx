import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { useAuth } from '../features/auth/AuthContext'
import { JobDetailPage } from '../pages/employee/JobDetailPage'
import { LoginPage } from '../pages/employee/LoginPage'
import { MyJobsPage } from '../pages/employee/MyJobsPage'
import {
  CompanyConfigurationPage,
  AlertsConfigurationPage,
  CustomersPage,
  EquipmentHistoryPage,
  EquipmentPage,
  ErrorLogsPage,
  InvoiceReadyPacketPage,
  LaborReportsPage,
  MailerSettingsPage,
  PartRequestsPage,
  PartsServiceReportsPage,
  PartsApprovalPage,
  PartsPage,
  PartsUsageHistoryPage,
  PurchasingWorkbenchPage,
  ReportsPage,
  SchedulePage,
  ServiceLocationsPage,
  SystemWikiPage,
  TicketStatusFiltersPage,
  TimeApprovalPage,
  TravelTimeReportPage,
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
          <Route path="dispatch" element={<Navigate to="/manage/schedule" replace />} />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="job-tickets" element={<JobTicketListPage />} />
          <Route path="job-tickets/new" element={<JobTicketCreatePage />} />
          <Route path="job-tickets/:jobTicketId" element={<JobTicketDetailPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="service-locations" element={<ServiceLocationsPage />} />
          <Route path="equipment" element={<EquipmentPage />} />
          <Route path="equipment/:id/history" element={<EquipmentHistoryPage />} />
          <Route path="parts" element={<PartsPage />} />
          <Route path="part-requests" element={<PartRequestsPage />} />
          <Route path="inventory" element={<Navigate to="/manage" replace />} />
          <Route path="purchasing" element={<PurchasingWorkbenchPage />} />
          <Route path="parts-usage-history" element={<PartsUsageHistoryPage />} />
          <Route path="travel-time" element={<TravelTimeReportPage />} />
          <Route path="time-approval" element={<TimeApprovalPage />} />
          <Route path="parts-approval" element={<PartsApprovalPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="reports/invoice-ready/:jobTicketId" element={<InvoiceReadyPacketPage />} />
          <Route path="reports/labor" element={<LaborReportsPage />} />
          <Route path="reports/parts-service" element={<PartsServiceReportsPage />} />
          <Route path="reports/labor-parts-service" element={<Navigate to="/manage/reports/labor" replace />} />
          <Route path="wiki" element={<SystemWikiPage />} />
          <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route path="company-configuration" element={<CompanyConfigurationPage />} />
            <Route path="alerts" element={<AlertsConfigurationPage />} />
            <Route path="mailer-settings" element={<MailerSettingsPage />} />
            <Route path="error-logs" element={<ErrorLogsPage />} />
            <Route path="ticket-status-filters" element={<TicketStatusFiltersPage />} />
            <Route path="users" element={<UsersPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<HomeRoute />} />
      <Route path="*" element={<HomeRoute />} />
    </Routes>
  )
}
