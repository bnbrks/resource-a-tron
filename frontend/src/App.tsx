import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './components/theme/ThemeProvider'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App


