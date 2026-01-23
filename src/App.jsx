import { BrowserRouter as Router } from 'react-router-dom'
import { TransportProvider } from '@/contexts/TransportContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { AppRouter } from '@/routes'

function App() {
  return (
    <Router>
      <TransportProvider>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </TransportProvider>
    </Router>
  )
}

export default App
