import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { format, startOfMonth, endOfMonth, eachWeekOfInterval, startOfWeek, endOfWeek } from 'date-fns'

interface Allocation {
  id: string
  userId: string
  taskId: string
  projectId?: string
  allocatedHours: number
  startDate: string
  endDate?: string
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

export default function ResourceAllocation() {
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchUsers()
    fetchTasks()
    fetchAllocations()
  }, [selectedMonth])

  const fetchUsers = async () => {
    try {
      const users = await api.get<unknown[]>('/users')
      setUsers(Array.isArray(users) ? users : [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchTasks = async () => {
    try {
      const tasks = await api.get<unknown[]>('/tasks')
      setTasks(Array.isArray(tasks) ? tasks : [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  const fetchAllocations = async () => {
    try {
      const monthStart = startOfMonth(selectedMonth)
      const monthEnd = endOfMonth(selectedMonth)
      
      const queryParams = new URLSearchParams()
      queryParams.append('startDate', monthStart.toISOString())
      queryParams.append('endDate', monthEnd.toISOString())
      
      const allocations = await api.get<Allocation[]>(`/allocations?${queryParams.toString()}`)
      setAllocations(Array.isArray(allocations) ? allocations : [])
    } catch (error) {
      console.error('Error fetching allocations:', error)
    } finally {
      setLoading(false)
    }
  }

  const weeks = eachWeekOfInterval({
    start: startOfMonth(selectedMonth),
    end: endOfMonth(selectedMonth),
  }, { weekStartsOn: 1 })

  const getUserAllocations = (userId: string) => {
    return allocations.filter((a: Allocation) => a.userId === userId)
  }

  if (loading) {
    return <div>Loading allocations...</div>
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Resource Allocation</h1>
        <div className="flex items-center space-x-4">
          <input
            type="month"
            value={format(selectedMonth, 'yyyy-MM')}
            onChange={(e) => setSelectedMonth(new Date(e.target.value + '-01'))}
            className="px-4 py-2 border border-gray-300 rounded-md"
          />
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            New Allocation
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50 z-10">
                User
              </th>
              {weeks.map((week) => {
                const weekStart = startOfWeek(week, { weekStartsOn: 1 })
                const weekEnd = endOfWeek(week, { weekStartsOn: 1 })
                return (
                  <th
                    key={week.toISOString()}
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase min-w-[120px]"
                  >
                    {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => {
              const userAllocations = getUserAllocations(user.id)
              return (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white z-10">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  </td>
                  {weeks.map((week) => {
                    const weekStart = startOfWeek(week, { weekStartsOn: 1 })
                    const weekEnd = endOfWeek(week, { weekStartsOn: 1 })
                    const weekAllocations = userAllocations.filter((a: Allocation) => {
                      const allocStart = new Date(a.startDate)
                      const allocEnd = a.endDate ? new Date(a.endDate) : new Date('2099-12-31')
                      return allocStart <= weekEnd && allocEnd >= weekStart
                    })
                    const totalHours = weekAllocations.reduce((sum: number, a: Allocation) => sum + a.allocatedHours, 0)
                    
                    return (
                      <td key={week.toISOString()} className="px-4 py-4 text-center">
                        {totalHours > 0 ? (
                          <div className="text-sm">
                            <div className="font-semibold">{totalHours.toFixed(1)}h</div>
                            <div className="text-xs text-gray-500">
                              {weekAllocations.length} allocation{weekAllocations.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <CreateAllocationModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchAllocations}
          users={users}
          tasks={tasks}
        />
      )}
    </div>
  )
}

function CreateAllocationModal({
  onClose,
  onSuccess,
  users,
  tasks,
}: {
  onClose: () => void
  onSuccess: () => void
  users: any[]
  tasks: any[]
}) {
  const [formData, setFormData] = useState({
    userId: '',
    taskId: '',
    allocatedHours: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/allocations', {
        ...formData,
        allocatedHours: parseFloat(formData.allocatedHours),
        endDate: formData.endDate || undefined,
      })
      onSuccess()
      onClose()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error creating allocation'
      alert(errorMessage)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Create Allocation</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">User *</label>
            <select
              required
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select User</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
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
            <label className="block text-sm font-medium text-gray-700">Allocated Hours/Week *</label>
            <input
              type="number"
              step="0.25"
              min="0.25"
              required
              value={formData.allocatedHours}
              onChange={(e) => setFormData({ ...formData, allocatedHours: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date *</label>
            <input
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
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
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

