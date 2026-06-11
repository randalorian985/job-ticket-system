import { BrowserRouter } from 'react-router-dom'
import { AppRouter } from './routes/AppRouter'
import { AuthProvider } from './features/auth/AuthContext'
import './styles.css'
import './shell-overflow-fix.css'
import './ui-smoothness.css'
import './system-polish.css'
import { routerFuture } from './routes/routerFuture'

const App = () => (
  <AuthProvider>
    <BrowserRouter future={routerFuture}>
      <AppRouter />
    </BrowserRouter>
  </AuthProvider>
)

export default App
