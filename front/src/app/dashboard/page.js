'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import Cookies from 'js-cookie'

export default function DashboardPage() {
  const router = useRouter()
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const fetchBusinesses = () => {
    api.get('/businesses')
      .then(res => setBusinesses(res.data))
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const token = Cookies.get('token')
    if (!token) { router.push('/login'); return }
    fetchBusinesses()
  }, [])

  const filtered = businesses.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.city?.toLowerCase().includes(search.toLowerCase()) ||
    b.zipCode?.includes(search)
  )

  const handleStatus = async (b) => {
    const newStatus = b.status === 'active' ? 'blocked' : 'active'
    await api.patch(`/businesses/${b.id}/status`, { status: newStatus })
    fetchBusinesses()
  }

  const handleDelete = async (id) => {
    await api.delete(`/businesses/${id}`)
    setConfirmDelete(null)
    fetchBusinesses()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Commerces</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gérez les commerces et leurs roues</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/businesses/new')}
          className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-5 py-2.5 rounded-xl transition"
        >
          + Nouveau commerce
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom, ville ou code postal..."
          className="w-full max-w-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500 border border-gray-200 dark:border-gray-800 placeholder-gray-400 transition"
        />
      </div>

      {loading ? (
        <div className="text-gray-400">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center">
          <p className="text-4xl mb-4">🏪</p>
          <p className="text-gray-900 dark:text-white font-semibold text-lg">
            {search ? 'Aucun résultat' : 'Aucun commerce'}
          </p>
          <p className="text-gray-400 mt-2">
            {search ? 'Essayez un autre terme de recherche' : 'Créez votre premier commerce pour commencer'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(b => (
            <div
              key={b.id}
              className={`bg-white dark:bg-gray-900 border rounded-2xl p-6 transition ${
                b.status === 'blocked'
                  ? 'border-red-200 dark:border-red-500/30 opacity-75'
                  : 'border-gray-200 dark:border-gray-800 hover:border-violet-500'
              }`}
            >
              {/* Header carte */}
              <div
                className="cursor-pointer"
                onClick={() => b.status !== 'blocked' && router.push(`/dashboard/businesses/${b.id}`)}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">🏪</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-lg font-medium ${
                      b.status === 'active'
                        ? 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                    }`}>
                      {b.status === 'active' ? 'Actif' : 'Bloqué'}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">
                      {b.wheels?.length || 0} roue(s)
                    </span>
                  </div>
                </div>
                <h3 className="text-gray-900 dark:text-white font-semibold text-lg">{b.name}</h3>
                <p className="text-gray-400 text-sm mt-1">/{b.slug}</p>
                {(b.city || b.zipCode) && (
                  <p className="text-gray-400 text-sm mt-1">📍 {b.city} {b.zipCode}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => handleStatus(b)}
                  className={`flex-1 text-xs font-medium py-2 rounded-lg transition ${
                    b.status === 'active'
                      ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-500 hover:bg-orange-100 dark:hover:bg-orange-500/20'
                      : 'bg-green-50 dark:bg-green-500/10 text-green-500 hover:bg-green-100 dark:hover:bg-green-500/20'
                  }`}
                >
                  {b.status === 'active' ? '🔒 Bloquer' : '✅ Activer'}
                </button>
                <button
                  onClick={() => setConfirmDelete(b)}
                  className="flex-1 text-xs font-medium py-2 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition"
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal confirmation suppression */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-sm w-full border border-gray-200 dark:border-gray-800 shadow-2xl">
            <div className="text-center mb-6">
              <p className="text-4xl mb-4">🗑️</p>
              <h3 className="text-gray-900 dark:text-white font-semibold text-lg">Confirmer la suppression</h3>
              <p className="text-gray-400 mt-2 text-sm">
                Voulez-vous vraiment supprimer <span className="text-white font-medium">"{confirmDelete.name}"</span> ? Cette action est irréversible.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition font-medium"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.id)}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}