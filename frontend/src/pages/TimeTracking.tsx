import { useEffect, useState } from 'react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'

interface TimeEntry {
  id: string
  userId: string
  taskId: string
  date: string
  hours: number
  description?: string
  user?: {
    id: string
    name: string
  }
  task?: {
    id: string
    name: string
    project?: {
      id: string
      name: string
    }
  }
}

export default function TimeTracking() {
  const { user } = useAuth()
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWeek, setSelectedWeek] = useState(new Date())
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [tasks, setTasks] = useState<any[]>([])

  useEffect(() => {
    fetchTasks()
    fetchTimeEntries()
  }, [selectedWeek])

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks')
      setTasks(response.data)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  const fetchTimeEntries = async () => {
    try {
      const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 })
      
      const response = await api.get('/time-entries', {
        params: {
          userId: user?.id,
          startDate: weekStart.toISOString(),
          endDate: weekEnd.toISOString(),
        },
      })
      setTimeEntries(response.data)
    } catch (error) {
      console.error('Error fetching time entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const weekDays = eachDayOfInterval({
    start: startOfWeek(selectedWeek, { weekStartsOn: 1 }),
    end: endOfWeek(selectedWeek, { weekStartsOn: 1 }),
  })

  const getEntriesForDate = (date: Date) => {
    return timeEntries.filter(
      entry => format(new Date(entry.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    )
  }

  const getTotalHours = () => {
    return timeEntries.reduce((sum, entry) => sum + entry.hours, 0)
  }

  if (loading) {
    return <div>Loading time entries...</div>
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Time Tracking</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSelectedWeek(new Date(selectedWeek.getTime() - 7 * 24 * 60 * 60 * 1000))}
            className="px-4 py-2 border border-gray-300 rounded-md"
          >
            Previous Week
          </button>
          <span className="text-sm font-medium">
            {format(startOfWeek(selectedWeek, { weekStartsOn: 1 }), 'MMM d')} -{' '}
            {format(endOfWeek(selectedWeek, { weekStartsOn: 1 }), 'MMM d, yyyy')}
          </span>
          <button
            onClick={() => setSelectedWeek(new Date(selectedWeek.getTime() + 7 * 24 * 60 * 60 * 1000))}
            className="px-4 py-2 border border-gray-300 rounded-md"
          >
            Next Week
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Log Time
          </button>
        </div>
      </div>

      <div className="mb-4 bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center">
          <span className="font-semibold">Total Hours This Week:</span>
          <span className="text-2xl font-bold text-indigo-600">{getTotalHours().toFixed(1)}</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {weekDays.map((day) => (
                <th key={day.toISOString()} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {format(day, 'EEE M/d')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              {weekDays.map((day) => {
                const dayEntries = getEntriesForDate(day)
                const dayTotal = dayEntries.reduce((sum, e) => sum + e.hours, 0)
                return (
                  <td key={day.toISOString()} className="px-4 py-4">
                    <div className="text-sm font-semibold mb-2">{dayTotal.toFixed(1)}h</div>
                    <div className="space-y-1">
                      {dayEntries.map((entry) => (
                        <div key={entry.id} className="text-xs text-gray-600">
                          {entry.task?.name}: {entry.hours}h
                        </div>
                      ))}
                    </div>
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <CreateTimeEntryModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchTimeEntries}
          tasks={tasks}
        />
      )}
    </div>
  )
}

function CreateTimeEntryModal({
  onClose,
  onSuccess,
  tasks,
}: {
  onClose: () => void
  onSuccess: () => void
  tasks: any[]
}) {
  const [formData, setFormData] = useState({
    taskId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    hours: '',
    description: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/time-entries', {
        ...formData,
        hours: parseFloat(formData.hours),
      })
      onSuccess()
      onClose()
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error creating time entry')
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Log Time</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Task *</label>
            <select
              required
              value={formData.taskId}
              onChange={(e) => setFormData({ ...formData, taskId: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select Task</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.name} {task.project?.name ? `(${task.project.name})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date *</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Hours *</label>
            <input
              type="number"
              step="0.25"
              min="0.25"
              required
              value={formData.hours}
              onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Log Time
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

