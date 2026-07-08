import { BrowserRouter } from 'react-router-dom'
import { AppRouter } from './routes/AppRouter'
import { AuthProvider } from './features/auth/AuthContext'
import { CompanyBrandingProvider } from './features/companyBranding/CompanyBrandingContext'
import { GlobalErrorReporter } from './features/diagnostics/GlobalErrorReporter'
import { NotificationProvider } from './features/notifications/NotificationContext'
import { NotificationBanner } from './components/NotificationBanner'
import './styles.css'
import './shell-overflow-fix.css'
import './ui-smoothness.css'
import './system-polish.css'
import './mobile-density-polish.css'
import { routerFuture } from './routes/routerFuture'

const App = () => (
  <CompanyBrandingProvider>
    <NotificationProvider>
      <AuthProvider>
        <GlobalErrorReporter />
        <BrowserRouter future={routerFuture}>
          <NotificationBanner />
          <AppRouter />
        </BrowserRouter>
      </AuthProvider>
    </NotificationProvider>
  </CompanyBrandingProvider>
)

export default App
