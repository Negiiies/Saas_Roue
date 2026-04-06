'use client'

import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { useTheme } from '@/context/ThemeContext'

export default function Sidebar() {
  const router = useRouter()
  const { dark, toggle } = useTheme()

  const logout = () => {
    Cookies.remove('token')
    router.push('/login')
  }

  return (
    <aside className="w-64 min-h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">🎡 SpinReview</h1>
        <p className="text-gray-400 text-xs mt-1">Espace administration</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <a href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition">
          <span>🏪</span> Commerces
        </a>
        <a href="/dashboard/stats" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition">
          <span>📊</span> Statistiques
        </a>
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <span>{dark ? '☀️' : '🌙'}</span>
          {dark ? 'Mode clair' : 'Mode sombre'}
        </button>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 transition"
        >
          <span>🚪</span> Déconnexion
        </button>
      </div>
    </aside>
  )
}