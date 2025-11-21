import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Users from './pages/Users'
import Projects from './pages/Projects'
import Tasks from './pages/Tasks'
import TimeTracking from './pages/TimeTracking'
import ResourceAllocation from './pages/ResourceAllocation'
import Analytics from './pages/Analytics'
import ResourceSuggestions from './pages/ResourceSuggestions'

function PrivateRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="users" element={<PrivateRoute><Users /></PrivateRoute>} />
        <Route path="projects" element={<PrivateRoute><Projects /></PrivateRoute>} />
        <Route path="tasks" element={<PrivateRoute><Tasks /></PrivateRoute>} />
        <Route path="time-tracking" element={<PrivateRoute><TimeTracking /></PrivateRoute>} />
        <Route path="resource-allocation" element={<PrivateRoute><ResourceAllocation /></PrivateRoute>} />
        <Route path="analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
        <Route path="resource-suggestions" element={<PrivateRoute><ResourceSuggestions /></PrivateRoute>} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}

export default App

