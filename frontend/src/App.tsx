import { BrowserRouter } from 'react-router-dom'
import { AppRouter } from './routes/AppRouter'
import { AuthProvider } from './features/auth/AuthContext'
import { CompanyBrandingProvider } from './features/companyBranding/CompanyBrandingContext'
import './styles.css'
import './mobile-density-polish.css'
import './shell-overflow-fix.css'
import './ui-smoothness.css'
import './system-polish.css'
import { routerFuture } from './routes/routerFuture'

const App = () => (
  <CompanyBrandingProvider>
    <AuthProvider>
      <BrowserRouter future={routerFuture}>
        <AppRouter />
      </BrowserRouter>
    </AuthProvider>
  </CompanyBrandingProvider>
)

export default App
