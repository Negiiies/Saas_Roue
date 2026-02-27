'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export default function NewBusinessPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [city, setCity] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const generateSlug = (val) => {
    return val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  const handleNameChange = (e) => {
    const val = e.target.value
    setName(val)
    setSlug(generateSlug(val))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/businesses', { name, slug, city, zipCode })
      router.push('/dashboard')
    } catch (err) {
      setError(err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Erreur serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition text-sm mb-4 flex items-center gap-2">
          ← Retour
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nouveau commerce</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Ajoutez un commerce client</p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Nom du commerce</label>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              required
              placeholder="Donut Sushi Club"
              className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500 border border-gray-200 dark:border-gray-700 placeholder-gray-400 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Slug (URL)</label>
            <div className="flex items-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-violet-500">
              <span className="px-3 text-gray-400 text-sm border-r border-gray-200 dark:border-gray-700 py-3">/spin/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                placeholder="donut-sushi-club"
                className="flex-1 bg-transparent text-gray-900 dark:text-white px-3 py-3 outline-none placeholder-gray-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Ville</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                required
                placeholder="Paris"
                className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500 border border-gray-200 dark:border-gray-700 placeholder-gray-400 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Code postal</label>
              <input
                type="text"
                value={zipCode}
                onChange={e => setZipCode(e.target.value)}
                required
                placeholder="75001"
                className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500 border border-gray-200 dark:border-gray-700 placeholder-gray-400 transition"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-3">
              <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
          >
            {loading ? 'Création...' : 'Créer le commerce'}
          </button>
        </form>
      </div>
    </div>
  )
}