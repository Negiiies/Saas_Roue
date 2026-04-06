'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import Cookies from 'js-cookie'

function StatusBadge({ business }) {
  if (business.status === 'active') return <span className="text-xs px-2 py-1 rounded-lg font-medium bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400">✅ Actif</span>
  if (business.status === 'blocked') return <span className="text-xs px-2 py-1 rounded-lg font-medium bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400">🔒 Bloqué</span>
  if (business.status === 'expired') return <span className="text-xs px-2 py-1 rounded-lg font-medium bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400">⛔ Expiré</span>
  if (business.status === 'inactive') return <span className="text-xs px-2 py-1 rounded-lg font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">⏸️ Inactif</span>
  if (business.status === 'trial') {
    const days = business.trialDaysLeft
    const color = days <= 5 ? 'orange' : 'blue'
    const styles = { orange: 'bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400', blue: 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' }
    return <span className={`text-xs px-2 py-1 rounded-lg font-medium ${styles[color]}`}>🕐 Essai — {days}j</span>
  }
  return null
}

function EngagementBar({ business }) {
  if (!business.hasEngagement || business.engagementStatus === 'none') return null
  const isRed = business.engagementStatus === 'expiring' || business.engagementStatus === 'expired'
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{isRed ? '⚠️ Expire bientôt' : '📋 Engagement'}</span>
        <span>{business.engagementDaysLeft}j restants</span>
      </div>
      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full transition-all ${isRed ? 'bg-red-500' : 'bg-green-500'}`}
          style={{ width: `${business.engagementProgress ?? 0}%` }} />
      </div>
      {business.engagementEndDate && (
        <p className="text-xs text-gray-400 mt-1">Fin : {new Date(business.engagementEndDate).toLocaleDateString('fr-FR')}</p>
      )}
    </div>
  )
}

function ConfirmModal({ config, onConfirm, onCancel }) {
  if (!config) return null
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-sm w-full border border-gray-200 dark:border-gray-800 shadow-2xl text-center">
        <p className="text-4xl mb-4">{config.icon}</p>
        <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">{config.title}</h3>
        <p className="text-gray-400 text-sm mb-6">{config.description}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-sm">Annuler</button>
          <button onClick={onConfirm} className={`flex-1 py-2.5 rounded-xl text-white transition text-sm font-semibold ${config.btnColor || 'bg-violet-600 hover:bg-violet-700'}`}>{config.btnLabel}</button>
        </div>
      </div>
    </div>
  )
}

function EditBusinessModal({ business, onClose, onSave }) {
  const [name, setName] = useState(business.name)
  const [slug, setSlug] = useState(business.slug)
  const [city, setCity] = useState(business.city || '')
  const [zipCode, setZipCode] = useState(business.zipCode || '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await api.patch(`/businesses/${business.id}`, { name, slug, city, zipCode })
      onSave(); onClose()
    } catch (err) { setError(err.response?.data?.error || 'Erreur serveur') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-200 dark:border-gray-800 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-gray-900 dark:text-white font-semibold text-lg">✏️ Modifier le commerce</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Nom</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500 border border-gray-200 dark:border-gray-700 transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Slug</label>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3">
              <span className="text-gray-400 text-sm">/spin/</span>
              <input type="text" value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} required
                className="flex-1 bg-transparent text-gray-900 dark:text-white outline-none text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Ville</label>
              <input type="text" value={city} onChange={e => setCity(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500 border border-gray-200 dark:border-gray-700 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Code postal</label>
              <input type="text" value={zipCode} onChange={e => setZipCode(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500 border border-gray-200 dark:border-gray-700 transition" />
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition">Annuler</button>
            <button type="submit" disabled={loading} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50">
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const STATUS_FILTERS = [
  { label: 'Tous', value: 'all' },
  { label: '✅ Actifs', value: 'active' },
  { label: '🕐 Essai', value: 'trial' },
  { label: '⏸️ Inactifs', value: 'inactive' },
  { label: '⛔ Expirés', value: 'expired' },
  { label: '🔒 Bloqués', value: 'blocked' },
]

const SORT_OPTIONS = [
  { label: 'Plus récent', value: 'recent' },
  { label: 'Nom A → Z', value: 'name_asc' },
  { label: 'Nom Z → A', value: 'name_desc' },
  { label: 'Engagement ↑ (bientôt)', value: 'engagement_asc' },
  { label: 'Engagement ↓ (plus tard)', value: 'engagement_desc' },
]

export default function DashboardPage() {
  const router = useRouter()
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const debounceRef = useRef(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [confirm, setConfirm] = useState(null)
  const [editBusiness, setEditBusiness] = useState(null)

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

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(debounceRef.current)
  }, [search])

  const urgentTrials = businesses.filter(b => b.status === 'trial' && b.trialDaysLeft !== null && b.trialDaysLeft <= 5)

  const filtered = businesses
    .filter(b => {
      const matchSearch = b.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        b.city?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        b.zipCode?.includes(debouncedSearch)
      const matchStatus = statusFilter === 'all' || b.status === statusFilter
      return matchSearch && matchStatus
    })
    .sort((a, b) => {
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name, 'fr')
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name, 'fr')
      if (sortBy === 'engagement_asc') {
        const da = a.engagementDaysLeft ?? Infinity
        const db = b.engagementDaysLeft ?? Infinity
        return da - db
      }
      if (sortBy === 'engagement_desc') {
        const da = a.engagementDaysLeft ?? -Infinity
        const db = b.engagementDaysLeft ?? -Infinity
        return db - da
      }
      return new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0)
    })

  const isFiltered = debouncedSearch || statusFilter !== 'all'

  const counts = businesses.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1
    return acc
  }, {})

  const askConfirm = (type, b) => {
    const configs = {
      activate: { icon: '✅', title: 'Activer définitivement ?', description: `"${b.name}" sera activé sans limitation.`, btnLabel: 'Oui, activer', btnColor: 'bg-green-600 hover:bg-green-700' },
      block: { icon: '🔒', title: 'Bloquer ce commerce ?', description: `"${b.name}" sera bloqué. Les QR codes cesseront de fonctionner.`, btnLabel: 'Oui, bloquer', btnColor: 'bg-orange-500 hover:bg-orange-600' },
      unblock: { icon: '✅', title: 'Débloquer ce commerce ?', description: `"${b.name}" sera réactivé.`, btnLabel: 'Oui, débloquer', btnColor: 'bg-green-600 hover:bg-green-700' },
      delete: { icon: '🗑️', title: 'Supprimer ce commerce ?', description: `"${b.name}" et toutes ses roues seront supprimés. Irréversible.`, btnLabel: 'Oui, supprimer', btnColor: 'bg-red-500 hover:bg-red-600' },
      engagementOn: { icon: '📋', title: 'Activer l\'engagement 365j ?', description: `"${b.name}" sera engagé pour 1 an à partir d'aujourd'hui.`, btnLabel: 'Oui, activer', btnColor: 'bg-violet-600 hover:bg-violet-700' },
      engagementOff: { icon: '📋', title: 'Désactiver l\'engagement ?', description: `L'engagement de "${b.name}" sera supprimé.`, btnLabel: 'Oui, désactiver', btnColor: 'bg-orange-500 hover:bg-orange-600' },
      autoRenewOn: { icon: '🔄', title: 'Activer le renouvellement auto ?', description: `"${b.name}" sera automatiquement renouvelé à la fin de l'engagement.`, btnLabel: 'Oui, activer', btnColor: 'bg-violet-600 hover:bg-violet-700' },
      autoRenewOff: { icon: '🔄', title: 'Désactiver le renouvellement auto ?', description: `"${b.name}" ne sera plus renouvelé automatiquement.`, btnLabel: 'Oui, désactiver', btnColor: 'bg-orange-500 hover:bg-orange-600' },
    }
    setConfirm({ type, business: b, config: configs[type] })
  }

  const handleConfirm = async () => {
    const { type, business: b } = confirm
    setConfirm(null)
    if (type === 'activate') await api.patch(`/businesses/${b.id}/activate`)
    else if (type === 'block') await api.patch(`/businesses/${b.id}/status`, { status: 'blocked' })
    else if (type === 'unblock') await api.patch(`/businesses/${b.id}/status`, { status: 'active' })
    else if (type === 'delete') await api.delete(`/businesses/${b.id}`)
    else if (type === 'engagementOn') await api.patch(`/businesses/${b.id}/engagement`, { hasEngagement: true })
    else if (type === 'engagementOff') await api.patch(`/businesses/${b.id}/engagement`, { hasEngagement: false })
    else if (type === 'autoRenewOn') await api.patch(`/businesses/${b.id}/engagement`, { autoRenew: true })
    else if (type === 'autoRenewOff') await api.patch(`/businesses/${b.id}/engagement`, { autoRenew: false })
    fetchBusinesses()
  }

  const isClickable = (b) => b.status === 'active' || b.status === 'trial'

  return (
    <div>
      <ConfirmModal config={confirm?.config} onConfirm={handleConfirm} onCancel={() => setConfirm(null)} />
      {editBusiness && <EditBusinessModal business={editBusiness} onClose={() => setEditBusiness(null)} onSave={fetchBusinesses} />}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Commerces</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{businesses.length} commerce{businesses.length > 1 ? 's' : ''} au total</p>
        </div>
        <button onClick={() => router.push('/dashboard/businesses/new')} className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-5 py-2.5 rounded-xl transition">
          + Nouveau commerce
        </button>
      </div>

      {urgentTrials.length > 0 && (
        <div className="mb-6 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 rounded-2xl px-5 py-4 flex items-start gap-3">
          <span className="text-xl mt-0.5">⚠️</span>
          <div>
            <p className="text-orange-700 dark:text-orange-400 font-semibold text-sm">
              {urgentTrials.length} essai{urgentTrials.length > 1 ? 's' : ''} expire{urgentTrials.length > 1 ? 'nt' : ''} bientôt
            </p>
            <p className="text-orange-600/70 dark:text-orange-400/70 text-xs mt-0.5">
              {urgentTrials.map(b => `${b.name} (${b.trialDaysLeft}j)`).join(' · ')}
            </p>
          </div>
        </div>
      )}

      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap gap-3">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom, ville ou code postal..."
            className="flex-1 min-w-60 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500 border border-gray-200 dark:border-gray-800 placeholder-gray-400 transition" />
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500 border border-gray-200 dark:border-gray-800 transition text-sm cursor-pointer">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map(f => {
            const count = f.value === 'all' ? businesses.length : (counts[f.value] || 0)
            const isActive = statusFilter === f.value
            return (
              <button key={f.value} onClick={() => setStatusFilter(f.value)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border transition ${isActive ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-violet-400 hover:text-violet-500'}`}>
                {f.label}
                <span className={`px-1.5 py-0.5 rounded-md text-xs font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>{count}</span>
              </button>
            )
          })}
          {isFiltered && (
            <span className="text-xs text-gray-400 ml-1">{filtered.length} résultat{filtered.length > 1 ? 's' : ''} sur {businesses.length}</span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-gray-400">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center">
          <p className="text-4xl mb-4">🏪</p>
          <p className="text-gray-900 dark:text-white font-semibold text-lg">{search || statusFilter !== 'all' ? 'Aucun résultat' : 'Aucun commerce'}</p>
          <p className="text-gray-400 mt-2">{search || statusFilter !== 'all' ? 'Essayez un autre filtre' : 'Créez votre premier commerce'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(b => (
            <div key={b.id} className={`bg-white dark:bg-gray-900 border rounded-2xl p-6 transition ${
              b.status === 'blocked' || b.status === 'expired' || b.status === 'inactive' ? 'border-gray-200 dark:border-gray-700 opacity-75'
              : b.status === 'trial' ? 'border-blue-200 dark:border-blue-500/30 hover:border-blue-400'
              : 'border-gray-200 dark:border-gray-800 hover:border-violet-500'
            }`}>

              {/* Partie cliquable */}
              <div className={isClickable(b) ? 'cursor-pointer' : ''} onClick={() => isClickable(b) && router.push(`/dashboard/businesses/${b.id}`)}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">🏪</span>
                  <div className="flex items-center gap-2">
                    <StatusBadge business={b} />
                    <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">{b.wheels?.length || 0} roue(s)</span>
                  </div>
                </div>
                <h3 className="text-gray-900 dark:text-white font-semibold text-lg">{b.name}</h3>
                <p className="text-gray-400 text-sm mt-1">/{b.slug}</p>
                {(b.city || b.zipCode) && <p className="text-gray-400 text-sm mt-1">📍 {b.city} {b.zipCode}</p>}
                {b.createdAt && <p className="text-gray-300 dark:text-gray-600 text-xs mt-1">Créé le {new Date(b.createdAt).toLocaleDateString('fr-FR')}</p>}

                {b.status === 'trial' && b.trialDaysLeft !== null && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Période d'essai</span>
                      <span>{b.trialDaysLeft} jours restants</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full transition-all ${b.trialDaysLeft <= 5 ? 'bg-orange-500' : 'bg-blue-500'}`}
                        style={{ width: `${(b.trialDaysLeft / 30) * 100}%` }} />
                    </div>
                  </div>
                )}

                <EngagementBar business={b} />
              </div>

              {/* Toggles engagement */}
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
                <div className="flex items-center justify-between" onClick={e => e.stopPropagation()}>
                  <span className="text-xs text-gray-500 font-medium">Engagement 365j</span>
                  <button
                    onClick={() => askConfirm(b.hasEngagement ? 'engagementOff' : 'engagementOn', b)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${b.hasEngagement ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${b.hasEngagement ? 'translate-x-5' : ''}`} />
                  </button>
                </div>

                {b.hasEngagement && (
                  <div className="flex items-center justify-between" onClick={e => e.stopPropagation()}>
                    <span className="text-xs text-gray-500 font-medium">Renouvellement auto</span>
                    <button
                      onClick={() => askConfirm(b.autoRenew ? 'autoRenewOff' : 'autoRenewOn', b)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${b.autoRenew ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${b.autoRenew ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button onClick={e => { e.stopPropagation(); setEditBusiness(b) }}
                  className="text-xs font-medium py-2 px-3 rounded-lg transition bg-violet-50 dark:bg-violet-500/10 text-violet-500 hover:bg-violet-100">
                  ✏️
                </button>
                {(b.status === 'inactive' || b.status === 'trial' || b.status === 'expired') && (
                  <button onClick={() => askConfirm('activate', b)} className="flex-1 text-xs font-medium py-2 rounded-lg transition bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-200">
                    ✅ Activer
                  </button>
                )}
                {b.status === 'active' && (
                  <button onClick={() => askConfirm('block', b)} className="flex-1 text-xs font-medium py-2 rounded-lg transition bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-200">
                    🔒 Bloquer
                  </button>
                )}
                {b.status === 'blocked' && (
                  <button onClick={() => askConfirm('unblock', b)} className="flex-1 text-xs font-medium py-2 rounded-lg transition bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-200">
                    ✅ Débloquer
                  </button>
                )}
                <button onClick={() => askConfirm('delete', b)} className="flex-1 text-xs font-medium py-2 rounded-lg transition bg-red-100 dark:bg-red-500/10 text-red-500 dark:text-red-400 hover:bg-red-200">
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}