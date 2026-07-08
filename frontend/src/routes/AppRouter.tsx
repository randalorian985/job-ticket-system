import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { useAuth } from '../features/auth/AuthContext'

const LoginPage = lazy(() => import('../pages/employee/LoginPage').then((module) => ({ default: module.LoginPage })))
const MyJobsPage = lazy(() => import('../pages/employee/MyJobsPage').then((module) => ({ default: module.MyJobsPage })))
const JobDetailPage = lazy(() => import('../pages/employee/JobDetailPage').then((module) => ({ default: module.JobDetailPage })))
const UnauthorizedPage = lazy(() => import('../pages/manager/users/UnauthorizedPage').then((module) => ({ default: module.UnauthorizedPage })))
const UxPreviewReadinessPage = lazy(() => import('../pages/preview/UxPreviewReadinessPage').then((module) => ({ default: module.UxPreviewReadinessPage })))

const ManagerShell = lazy(() => import('../pages/manager/ManagerShell').then((module) => ({ default: module.ManagerShell })))
const ManagerDashboardPage = lazy(() => import('../pages/manager/ManagerDashboardPage').then((module) => ({ default: module.ManagerDashboardPage })))
const SchedulePage = lazy(() => import('../pages/manager/SchedulePage').then((module) => ({ default: module.SchedulePage })))
const JobTicketListPage = lazy(() => import('../pages/manager/JobTicketListPage').then((module) => ({ default: module.JobTicketListPage })))
const JobTicketCreatePage = lazy(() => import('../pages/manager/JobTicketCreatePage').then((module) => ({ default: module.JobTicketCreatePage })))
const JobTicketDetailPage = lazy(() => import('../pages/manager/JobTicketDetailPage').then((module) => ({ default: module.JobTicketDetailPage })))
const CustomersPage = lazy(() => import('../pages/manager/masterData/CustomersPage').then((module) => ({ default: module.CustomersPage })))
const ServiceLocationsPage = lazy(() => import('../pages/manager/masterData/ServiceLocationsPage').then((module) => ({ default: module.ServiceLocationsPage })))
const EquipmentPage = lazy(() => import('../pages/manager/masterData/EquipmentPage').then((module) => ({ default: module.EquipmentPage })))
const EquipmentHistoryPage = lazy(() => import('../pages/manager/EquipmentHistoryPage').then((module) => ({ default: module.EquipmentHistoryPage })))
const PartsPage = lazy(() => import('../pages/manager/masterData/PartsPage').then((module) => ({ default: module.PartsPage })))
const PartRequestsPage = lazy(() => import('../pages/manager/PartRequestsPage').then((module) => ({ default: module.PartRequestsPage })))
const PurchasingWorkbenchPage = lazy(() => import('../pages/manager/PurchasingWorkbenchPage').then((module) => ({ default: module.PurchasingWorkbenchPage })))
const PartsUsageHistoryPage = lazy(() => import('../pages/manager/PartsUsageHistoryPage').then((module) => ({ default: module.PartsUsageHistoryPage })))
const TravelTimeReportPage = lazy(() => import('../pages/manager/TravelTimeReportPage').then((module) => ({ default: module.TravelTimeReportPage })))
const TimeApprovalPage = lazy(() => import('../pages/manager/approvals/TimeApprovalPage').then((module) => ({ default: module.TimeApprovalPage })))
const PartsApprovalPage = lazy(() => import('../pages/manager/approvals/ApprovalPages').then((module) => ({ default: module.PartsApprovalPage })))
const ReportsPage = lazy(() => import('../pages/manager/reports/ReportsPage').then((module) => ({ default: module.ReportsPage })))
const InvoiceReadyPacketPage = lazy(() => import('../pages/manager/reports/InvoiceReadyPacketPage').then((module) => ({ default: module.InvoiceReadyPacketPage })))
const LaborReportsPage = lazy(() => import('../pages/manager/reports/ReportsPage').then((module) => ({ default: module.LaborReportsPage })))
const PartsServiceReportsPage = lazy(() => import('../pages/manager/reports/ReportsPage').then((module) => ({ default: module.PartsServiceReportsPage })))
const SystemWikiPage = lazy(() => import('../pages/manager/wiki/SystemWikiPage').then((module) => ({ default: module.SystemWikiPage })))
const CompanyConfigurationPage = lazy(() => import('../pages/manager/companyConfiguration/CompanyConfigurationPage').then((module) => ({ default: module.CompanyConfigurationPage })))
const AlertsConfigurationPage = lazy(() => import('../pages/manager/companyConfiguration/AlertsConfigurationPage').then((module) => ({ default: module.AlertsConfigurationPage })))
const MailerSettingsPage = lazy(() => import('../pages/manager/companyConfiguration/MailerSettingsPage').then((module) => ({ default: module.MailerSettingsPage })))
const ErrorLogsPage = lazy(() => import('../pages/manager/diagnostics/ErrorLogsPage').then((module) => ({ default: module.ErrorLogsPage })))
const TicketStatusFiltersPage = lazy(() => import('../pages/manager/ticketStatusFilters/TicketStatusFiltersPage').then((module) => ({ default: module.TicketStatusFiltersPage })))
const UsersPage = lazy(() => import('../pages/manager/users/UsersPage').then((module) => ({ default: module.UsersPage })))

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
    <Suspense fallback={<p className="muted" role="status">Loading screen...</p>}>
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
    </Suspense>
  )
}
