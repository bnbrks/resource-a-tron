import { useTheme } from '../theme/ThemeProvider'

export default function Header() {
  const { theme, setTheme } = useTheme()

  return (
    <header className="border-b border-border bg-card">
      <div className="flex h-16 items-center justify-between px-6">
        <h1 className="text-xl font-semibold">Resource-A-Tron</h1>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-md p-2 hover:bg-accent"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  )
}


