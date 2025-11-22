import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

interface HealthResponse {
  status: string
  service?: string
  timestamp?: string
}

interface StatsResponse {
  projects: number
  tasks: number
  users: number
  activity?: {
    activeProjects?: number
  }
}

export default function Home() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [stats, setStats] = useState<StatsResponse | null>(null)

  useEffect(() => {
    api.get<HealthResponse>('/api/health')
      .then((response: HealthResponse) => setHealth(response))
      .catch((error: unknown) => console.error('Health check failed:', error))
    
    Promise.all([
      api.get<unknown[]>('/projects').catch(() => []),
      api.get<unknown[]>('/tasks').catch(() => []),
      api.get<unknown[]>('/users').catch(() => []),
      api.get<unknown>('/analytics/activity').catch(() => null),
    ]).then(([projects, tasks, users, activity]) => {
      setStats({
        projects: Array.isArray(projects) ? projects.length : 0,
        tasks: Array.isArray(tasks) ? tasks.length : 0,
        users: Array.isArray(users) ? users.length : 0,
        activity: activity as StatsResponse['activity'],
      })
    })
  }, [])

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Resource Management Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Link to="/projects" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="text-sm text-gray-600 mb-2">Projects</div>
          <div className="text-3xl font-bold text-indigo-600">{stats?.projects || 0}</div>
        </Link>
        <Link to="/tasks" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="text-sm text-gray-600 mb-2">Tasks</div>
          <div className="text-3xl font-bold text-green-600">{stats?.tasks || 0}</div>
        </Link>
        <Link to="/users" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="text-sm text-gray-600 mb-2">Users</div>
          <div className="text-3xl font-bold text-blue-600">{stats?.users || 0}</div>
        </Link>
        <Link to="/analytics" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="text-sm text-gray-600 mb-2">Active Projects</div>
          <div className="text-3xl font-bold text-purple-600">{stats?.activity?.activeProjects || 0}</div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/projects" className="block px-4 py-2 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100">
              Create New Project
            </Link>
            <Link to="/time-tracking" className="block px-4 py-2 bg-green-50 text-green-700 rounded-md hover:bg-green-100">
              Log Time Entry
            </Link>
            <Link to="/resource-allocation" className="block px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100">
              Allocate Resources
            </Link>
            <Link to="/resource-suggestions" className="block px-4 py-2 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100">
              Get Resource Suggestions
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          {health ? (
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                <span>API: {health.status}</span>
              </div>
              <div className="text-sm text-gray-600 mt-4">
                <p>Service: {health.service}</p>
                {health.timestamp && (
                  <p>Last checked: {new Date(health.timestamp).toLocaleString()}</p>
                )}
              </div>
            </div>
          ) : (
            <p>Checking system status...</p>
          )}
        </div>
      </div>
    </div>
  )
}

