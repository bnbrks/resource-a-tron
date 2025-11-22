import { Link, useLocation } from 'react-router-dom'

export default function Sidebar() {
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/projects', label: 'Projects' },
    { path: '/tasks', label: 'Tasks' },
    { path: '/users', label: 'Users' },
    { path: '/time-tracking', label: 'Time Tracking' },
    { path: '/resource-allocation', label: 'Resource Allocation' },
    { path: '/resource-suggestions', label: 'Resource Suggestions' },
    { path: '/analytics', label: 'Analytics' },
  ]

  return (
    <aside className="w-64 border-r border-border bg-card p-4">
      <nav className="space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`block rounded-md px-3 py-2 hover:bg-accent ${
              location.pathname === item.path ? 'bg-accent font-medium' : ''
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}


