import { useEffect, useState } from 'react'
import api from '../lib/api'
import { format } from 'date-fns'

interface ResourceSuggestion {
  userId: string
  userName: string
  confidenceScore: number
  reasons: string[]
  availableFrom?: string
  skillsMatch: number
  currentUtilization: number
}

export default function ResourceSuggestions() {
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState('')
  const [suggestions, setSuggestions] = useState<ResourceSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    requiredHoursPerWeek: '20',
  })

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects')
      setProjects(response.data)
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const handleGetSuggestions = async () => {
    if (!selectedProject) {
      alert('Please select a project')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/suggestions/resources', {
        projectId: selectedProject,
        ...formData,
        requiredHoursPerWeek: parseFloat(formData.requiredHoursPerWeek),
      })
      setSuggestions(response.data)
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error getting suggestions')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Resource Suggestions</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Project Requirements</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Project *</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select Project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hours/Week *</label>
              <input
                type="number"
                step="0.25"
                min="0.25"
                value={formData.requiredHoursPerWeek}
                onChange={(e) => setFormData({ ...formData, requiredHoursPerWeek: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <button
            onClick={handleGetSuggestions}
            disabled={loading || !selectedProject}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Getting Suggestions...' : 'Get Suggestions'}
          </button>
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <h2 className="text-xl font-semibold p-6 border-b">Suggested Resources</h2>
          <div className="divide-y divide-gray-200">
            {suggestions.map((suggestion) => (
              <div key={suggestion.userId} className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-semibold">{suggestion.userName}</h3>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        suggestion.confidenceScore >= 80 ? 'bg-green-100 text-green-800' :
                        suggestion.confidenceScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        Confidence: {suggestion.confidenceScore.toFixed(1)}%
                      </span>
                      <span className="text-sm text-gray-600">
                        Skills Match: {suggestion.skillsMatch.toFixed(1)}%
                      </span>
                      <span className="text-sm text-gray-600">
                        Utilization: {suggestion.currentUtilization.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  {suggestion.availableFrom && (
                    <div className="text-sm text-gray-600">
                      Available from: {format(new Date(suggestion.availableFrom), 'MMM d, yyyy')}
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Reasons:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {suggestion.reasons.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

