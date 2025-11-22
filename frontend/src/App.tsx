import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './components/theme/ThemeProvider'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Projects from './pages/Projects'
import Tasks from './pages/Tasks'
import Users from './pages/Users'
import TimeTracking from './pages/TimeTracking'
import ResourceAllocation from './pages/ResourceAllocation'
import ResourceSuggestions from './pages/ResourceSuggestions'
import Analytics from './pages/Analytics'
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/users" element={<Users />} />
            <Route path="/time-tracking" element={<TimeTracking />} />
            <Route path="/resource-allocation" element={<ResourceAllocation />} />
            <Route path="/resource-suggestions" element={<ResourceSuggestions />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App


