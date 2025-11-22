import { Project } from '../types'
import { format } from 'date-fns'

interface ProjectTimelineProps {
  projects: Project[]
}

export default function ProjectTimeline({ projects }: ProjectTimelineProps) {
  const sortedProjects = [...projects].sort((a: Project, b: Project) => {
    const dateA = a.startDate ? new Date(a.startDate).getTime() : 0
    const dateB = b.startDate ? new Date(b.startDate).getTime() : 0
    return dateA - dateB
  })

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Project Timeline</h2>
      <div className="space-y-4">
        {sortedProjects.map((project) => (
          <div key={project.id} className="border-l-4 border-indigo-500 pl-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-900">{project.name}</h3>
                {project.startDate && project.endDate && (
                  <p className="text-sm text-gray-600">
                    {format(new Date(project.startDate), 'MMM d, yyyy')} -{' '}
                    {format(new Date(project.endDate), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                project.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                project.status === 'PLANNING' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {project.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

