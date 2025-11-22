import { useEffect, useState } from 'react'
import api from '../lib/api'
import { User, UserSkill, ProficiencyLevel } from '../types'

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users')
      setUsers(response.data)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading users...</div>
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Users</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Skills
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500">
                    {user.skills?.length || 0} skills
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdate={fetchUsers}
        />
      )}
    </div>
  )
}

function UserDetailModal({
  user,
  onClose,
  onUpdate,
}: {
  user: User
  onClose: () => void
  onUpdate: () => void
}) {
  const [skills] = useState<UserSkill[]>(user.skills || [])
  const [newSkill, setNewSkill] = useState({ skillName: '', proficiencyLevel: ProficiencyLevel.INTERMEDIATE, certified: false })

  const handleAddSkill = async () => {
    try {
      await api.post(`/users/${user.id}/skills`, newSkill)
      onUpdate()
      setNewSkill({ skillName: '', proficiencyLevel: ProficiencyLevel.INTERMEDIATE, certified: false })
    } catch (error) {
      console.error('Error adding skill:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">{user.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Email: {user.email}</p>
            <p className="text-sm text-gray-600">Role: {user.role}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Skills</h4>
            {skills.length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {skills.map((skill) => (
                  <li key={skill.id} className="text-sm">
                    {skill.skillName} - {skill.proficiencyLevel}
                    {skill.certified && ' (Certified)'}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No skills added</p>
            )}
          </div>
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">Add Skill</h4>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Skill name"
                value={newSkill.skillName}
                onChange={(e) => setNewSkill({ ...newSkill, skillName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <select
                value={newSkill.proficiencyLevel}
                onChange={(e) => setNewSkill({ ...newSkill, proficiencyLevel: e.target.value as ProficiencyLevel })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {Object.values(ProficiencyLevel).map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newSkill.certified}
                  onChange={(e) => setNewSkill({ ...newSkill, certified: e.target.checked })}
                  className="mr-2"
                />
                Certified
              </label>
              <button
                onClick={handleAddSkill}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Add Skill
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

