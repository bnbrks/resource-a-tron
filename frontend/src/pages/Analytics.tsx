import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import api from '../lib/api'
import { format, subDays } from 'date-fns'

interface UtilizationData {
  userId: string
  userName: string
  period: string
  allocatedHours: number
  actualHours: number
  utilizationPercent: number
  capacityHours: number
}

interface ActivitySummary {
  totalProjects: number
  activeProjects: number
  totalTasks: number
  totalTimeEntries: number
  totalHours: number
  uniqueUsers: number
}

export default function Analytics() {
  const [utilization, setUtilization] = useState<UtilizationData[]>([])
  const [activity, setActivity] = useState<ActivitySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  useEffect(() => {
    fetchData()
  }, [startDate, endDate])

  const fetchData = async () => {
    try {
      const [utilResponse, activityResponse] = await Promise.all([
        api.get('/analytics/utilization/team', {
          params: { startDate, endDate },
        }),
        api.get('/analytics/activity', {
          params: { startDate, endDate },
        }),
      ])
      setUtilization(utilResponse.data)
      setActivity(activityResponse.data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading analytics...</div>
  }

  const utilizationChartData = utilization
    .sort((a, b) => b.utilizationPercent - a.utilizationPercent)
    .slice(0, 10)
    .map(u => ({
      name: u.userName,
      utilization: Number(u.utilizationPercent.toFixed(1)),
      allocated: Number((u.allocatedHours / u.capacityHours * 100).toFixed(1)),
    }))

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Analytics & Utilization</h1>
        <div className="flex items-center space-x-4">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md"
          />
          <span>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      {activity && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Projects</div>
            <div className="text-2xl font-bold">{activity.totalProjects}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Active Projects</div>
            <div className="text-2xl font-bold text-green-600">{activity.activeProjects}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Tasks</div>
            <div className="text-2xl font-bold">{activity.totalTasks}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Time Entries</div>
            <div className="text-2xl font-bold">{activity.totalTimeEntries}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Hours</div>
            <div className="text-2xl font-bold">{activity.totalHours.toFixed(1)}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Active Users</div>
            <div className="text-2xl font-bold">{activity.uniqueUsers}</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Top 10 Utilization</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={utilizationChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="utilization" fill="#8884d8" name="Actual Utilization %" />
            <Bar dataKey="allocated" fill="#82ca9d" name="Allocated %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Utilization Details</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Allocated</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actual</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilization</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {utilization
                .sort((a, b) => b.utilizationPercent - a.utilizationPercent)
                .map((u) => (
                  <tr key={u.userId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{u.userName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{u.capacityHours.toFixed(1)}h</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{u.allocatedHours.toFixed(1)}h</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{u.actualHours.toFixed(1)}h</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        u.utilizationPercent > 100 ? 'bg-red-100 text-red-800' :
                        u.utilizationPercent > 80 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {u.utilizationPercent.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

