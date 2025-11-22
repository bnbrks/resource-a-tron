import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold text-gray-900">
              Resource Management
            </Link>
            <div className="hidden md:flex space-x-4">
              <Link to="/" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link to="/projects" className="text-gray-600 hover:text-gray-900">
                Projects
              </Link>
              <Link to="/tasks" className="text-gray-600 hover:text-gray-900">
                Tasks
              </Link>
              <Link to="/time-tracking" className="text-gray-600 hover:text-gray-900">
                Time Tracking
              </Link>
              <Link to="/resource-allocation" className="text-gray-600 hover:text-gray-900">
                Allocation
              </Link>
              <Link to="/analytics" className="text-gray-600 hover:text-gray-900">
                Analytics
              </Link>
              <Link to="/resource-suggestions" className="text-gray-600 hover:text-gray-900">
                Suggestions
              </Link>
              <Link to="/users" className="text-gray-600 hover:text-gray-900">
                Users
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <span className="text-sm text-gray-600">{user.name}</span>
                <button
                  onClick={logout}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Logout
                </button>
              </>
            )}
            <span className="text-sm text-gray-500">Moody's Insurance Advisory</span>
          </div>
        </div>
      </div>
    </nav>
  )
}

