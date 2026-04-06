'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import api from '@/lib/api'

const PERIODS = [
  { label: "Auj.", value: 'today' },
  { label: '7j', value: '7d' },
  { label: '30j', value: '30d' },
  { label: 'Tout', value: 'all' },
]

function getDateRange(period) {
  const now = new Date()
  const to = now.toISOString().split('T')[0]
  if (period === 'today') return { from: to, to }
  if (period === '7d') { const from = new Date(now); from.setDate(from.getDate() - 7); return { from: from.toISOString().split('T')[0], to } }
  if (period === '30d') { const from = new Date(now); from.setDate(from.getDate() - 30); return { from: from.toISOString().split('T')[0], to } }
  return {}
}

function WheelStats({ wheelId }) {
  const [period, setPeriod] = useState('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [stats, setStats] = useState(null)
  const [loadingStats, setLoadingStats] = useState(false)

  const fetchStats = useCallback(async (p, from, to) => {
    setLoadingStats(true)
    try {
      let params = p === 'custom' ? {} : getDateRange(p)
      if (p === 'custom') { if (from) params.from = from; if (to) params.to = to }
      const query = new URLSearchParams(params).toString()
      const res = await api.get(`/wheels/${wheelId}/stats${query ? `?${query}` : ''}`)
      setStats(res.data)
    } catch (_) { setStats(null) }
    finally { setLoadingStats(false) }
  }, [wheelId])

  useEffect(() => { fetchStats(period) }, [period, fetchStats])

  return (
    <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-400 font-medium">Statistiques</span>
        <div className="flex gap-1">
          {PERIODS.map(p => (
            <button key={p.value} onClick={() => { setPeriod(p.value); setShowCustom(false) }}
              className={`text-xs px-2 py-1 rounded-lg transition font-medium ${period === p.value && !showCustom ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
              {p.label}
            </button>
          ))}
          <button onClick={() => { setShowCustom(!showCustom); setPeriod('custom') }}
            className={`text-xs px-2 py-1 rounded-lg transition font-medium ${showCustom ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
            📅
          </button>
        </div>
      </div>
      {showCustom && (
        <div className="flex gap-2 mb-3 items-center">
          <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
            className="flex-1 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-gray-700 dark:text-gray-300 outline-none focus:ring-1 focus:ring-violet-500" />
          <span className="text-gray-400 text-xs">→</span>
          <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
            className="flex-1 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-gray-700 dark:text-gray-300 outline-none focus:ring-1 focus:ring-violet-500" />
          <button onClick={() => fetchStats('custom', customFrom, customTo)}
            className="text-xs bg-violet-600 hover:bg-violet-700 text-white px-2 py-1.5 rounded-lg transition font-medium">OK</button>
        </div>
      )}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Scans', value: stats?.totalScans ?? 0, color: 'text-gray-700 dark:text-gray-200' },
          { label: 'Spins', value: stats?.totalSpins ?? 0, color: 'text-violet-500' },
          { label: 'Gains', value: stats?.totalWins ?? 0, color: 'text-green-500' },
          { label: 'Validés', value: stats?.totalValidated ?? 0, color: 'text-blue-500' },
        ].map(s => (
          <div key={s.label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5 text-center">
            {loadingStats ? <div className="h-6 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto mb-1" /> : <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>}
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// Barre engagement basée sur le commerce
function EngagementSection({ business, onUpdate }) {
  const [loading, setLoading] = useState(false)

  if (!business) return null

  const toggle = async (field, value) => {
    setLoading(true)
    try {
      await api.patch(`/businesses/${business.id}/engagement`, { [field]: value })
      onUpdate()
    } catch (_) {}
    finally { setLoading(false) }
  }

  const isRed = business.engagementStatus === 'expiring' || business.engagementStatus === 'expired'
  const barColor = isRed ? 'bg-red-500' : 'bg-green-500'

  return (
    <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 font-medium">Engagement 365j</span>
        <button disabled={loading} onClick={() => toggle('hasEngagement', !business.hasEngagement)}
          className={`relative w-10 h-5 rounded-full transition-colors ${business.hasEngagement ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${business.hasEngagement ? 'translate-x-5' : ''}`} />
        </button>
      </div>

      {business.hasEngagement && business.engagementStatus !== 'none' && (
        <>
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{isRed ? '⚠️ Expire bientôt' : '✅ Actif'}</span>
              <span>{business.engagementDaysLeft ?? 0}j restants</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
              <div className={`h-2 rounded-full transition-all ${barColor}`} style={{ width: `${business.engagementProgress ?? 0}%` }} />
            </div>
            {business.engagementEndDate && (
              <p className="text-xs text-gray-400 mt-1">Fin : {new Date(business.engagementEndDate).toLocaleDateString('fr-FR')}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Renouvellement auto</span>
            <button disabled={loading} onClick={() => toggle('autoRenew', !business.autoRenew)}
              className={`relative w-10 h-5 rounded-full transition-colors ${business.autoRenew ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${business.autoRenew ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function BusinessPage() {
  const router = useRouter()
  const { id } = useParams()
  const [business, setBusiness] = useState(null)
  const [wheels, setWheels] = useState([])
  const [loading, setLoading] = useState(true)
  const [qrWheel, setQrWheel] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [editWheel, setEditWheel] = useState(null)

  const [showForm, setShowForm] = useState(false)
  const [wheelName, setWheelName] = useState('')
  const [googleUrl, setGoogleUrl] = useState('')
  const [rewards, setRewards] = useState([
    { label: '', probability: 25, color: '#8B5CF6', isLosing: false },
    { label: '', probability: 25, color: '#EC4899', isLosing: false },
    { label: '', probability: 25, color: '#F59E0B', isLosing: false },
    { label: '', probability: 25, color: '#10B981', isLosing: false },
  ])
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const [editName, setEditName] = useState('')
  const [editGoogleUrl, setEditGoogleUrl] = useState('')
  const [editRewards, setEditRewards] = useState([])
  const [editError, setEditError] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  const fetchBusiness = useCallback(() => {
    api.get('/businesses').then(res => {
      const b = res.data.find(b => b.id === parseInt(id))
      if (!b) { router.push('/dashboard'); return }
      setBusiness(b)
    })
  }, [id])

  const fetchWheels = useCallback(() => {
    api.get(`/wheels/business/${id}`).then(res => setWheels(res.data))
  }, [id])

  useEffect(() => {
    fetchBusiness()
    fetchWheels()
    setLoading(false)
  }, [id])

  const openEdit = (w) => {
    setEditWheel(w); setEditName(w.name); setEditGoogleUrl(w.googleReviewUrl || '')
    setEditRewards(w.rewards.map(r => ({ ...r }))); setEditError('')
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault(); setEditError('')
    const total = editRewards.reduce((sum, r) => sum + r.probability, 0)
    if (Math.round(total) !== 100) { setEditError('Les probabilités doivent totaliser 100%'); return }
    setEditLoading(true)
    try {
      await api.patch(`/wheels/${editWheel.id}`, { name: editName, googleReviewUrl: editGoogleUrl, rewards: editRewards })
      fetchWheels(); setEditWheel(null)
    } catch (err) { setEditError(err.response?.data?.error || 'Erreur serveur') }
    finally { setEditLoading(false) }
  }

  const updateEditReward = (i, field, value) => {
    const updated = [...editRewards]
    updated[i][field] = field === 'probability' ? parseFloat(value) || 0 : value
    setEditRewards(updated)
  }

  const addReward = () => setRewards([...rewards, { label: '', probability: 0, color: '#6366F1', isLosing: false }])
  const removeReward = (i) => setRewards(rewards.filter((_, idx) => idx !== i))
  const updateReward = (i, field, value) => {
    const updated = [...rewards]
    updated[i][field] = field === 'probability' ? parseFloat(value) || 0 : value
    setRewards(updated)
  }

  const totalProb = rewards.reduce((sum, r) => sum + r.probability, 0)
  const editTotalProb = editRewards.reduce((sum, r) => sum + r.probability, 0)

  const handleCreateWheel = async (e) => {
    e.preventDefault(); setFormError('')
    if (Math.round(totalProb) !== 100) { setFormError('Les probabilités doivent totaliser 100%'); return }
    setFormLoading(true)
    try {
      await api.post('/wheels', { name: wheelName, businessId: parseInt(id), googleReviewUrl: googleUrl, rewards })
      fetchWheels(); setShowForm(false); setWheelName(''); setGoogleUrl('')
      setRewards([
        { label: '', probability: 25, color: '#8B5CF6', isLosing: false },
        { label: '', probability: 25, color: '#EC4899', isLosing: false },
        { label: '', probability: 25, color: '#F59E0B', isLosing: false },
        { label: '', probability: 25, color: '#10B981', isLosing: false },
      ])
    } catch (err) { setFormError(err.response?.data?.error || 'Erreur serveur') }
    finally { setFormLoading(false) }
  }

  const askDelete = (w) => {
    setConfirm({
      icon: '🗑️', title: 'Supprimer cette roue ?',
      description: `"${w.name}" et tous ses scans seront supprimés. Action irréversible.`,
      btnLabel: 'Oui, supprimer', btnColor: 'bg-red-500 hover:bg-red-600',
      onConfirm: async () => { await api.delete(`/wheels/${w.id}`); fetchWheels(); setConfirm(null) }
    })
  }

  const downloadQR = () => {
    const svg = document.querySelector('#qr-download svg')
    const svgData = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `qr-${business?.slug}.svg`; a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="text-gray-400">Chargement...</div>

  return (
    <div>
      {confirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-sm w-full border border-gray-200 dark:border-gray-800 shadow-2xl text-center">
            <p className="text-4xl mb-4">{confirm.icon}</p>
            <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">{confirm.title}</h3>
            <p className="text-gray-400 text-sm mb-6">{confirm.description}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-sm">Annuler</button>
              <button onClick={confirm.onConfirm} className={`flex-1 py-2.5 rounded-xl text-white transition text-sm font-semibold ${confirm.btnColor}`}>{confirm.btnLabel}</button>
            </div>
          </div>
        </div>
      )}

      {editWheel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-lg w-full border border-gray-200 dark:border-gray-800 shadow-2xl my-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-gray-900 dark:text-white font-semibold text-lg">✏️ Modifier la roue</h3>
              <button onClick={() => setEditWheel(null)} className="text-gray-400 hover:text-white text-2xl leading-none">×</button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Nom</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} required
                  className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500 border border-gray-200 dark:border-gray-700 transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Lien Google Review</label>
                <input type="url" value={editGoogleUrl} onChange={e => setEditGoogleUrl(e.target.value)} required
                  className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500 border border-gray-200 dark:border-gray-700 transition" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Récompenses <span className={`ml-2 text-xs font-semibold ${Math.round(editTotalProb) === 100 ? 'text-green-400' : 'text-red-400'}`}>{editTotalProb}% / 100%</span>
                  </label>
                  <button type="button" onClick={() => setEditRewards([...editRewards, { label: '', probability: 0, color: '#6366F1', isLosing: false }])} className="text-violet-500 hover:text-violet-400 text-sm">+ Ajouter</button>
                </div>
                <div className="space-y-3">
                  {editRewards.map((r, i) => (
                    <div key={i} className="flex gap-3 items-center">
                      <input type="color" value={r.color} onChange={e => updateEditReward(i, 'color', e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200 dark:border-gray-700 p-0.5 bg-transparent" />
                      <input type="text" value={r.label} onChange={e => updateEditReward(i, 'label', e.target.value)} required placeholder="Récompense"
                        className="flex-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-500 border border-gray-200 dark:border-gray-700 text-sm" />
                      <div className="flex items-center gap-1">
                        <input type="number" value={r.probability} onChange={e => updateEditReward(i, 'probability', e.target.value)} min="0" max="100" required
                          className="w-20 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-500 border border-gray-200 dark:border-gray-700 text-sm text-center" />
                        <span className="text-gray-400 text-sm">%</span>
                      </div>
                      <button type="button" onClick={() => updateEditReward(i, 'isLosing', !r.isLosing)}
                        className={`text-xs px-2 py-1.5 rounded-lg font-medium transition ${r.isLosing ? 'bg-red-100 dark:bg-red-500/20 text-red-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                        {r.isLosing ? '💀' : '🎁'}
                      </button>
                      {editRewards.length > 2 && <button type="button" onClick={() => setEditRewards(editRewards.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-300 text-xl leading-none">×</button>}
                    </div>
                  ))}
                </div>
              </div>
              {editError && <p className="text-red-400 text-sm">{editError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditWheel(null)} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition">Annuler</button>
                <button type="submit" disabled={editLoading} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50">
                  {editLoading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition text-sm mb-6 flex items-center gap-2">← Retour</button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{business?.name}</h1>
          <p className="text-gray-400 text-sm mt-1">/spin/{business?.slug}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-5 py-2.5 rounded-xl transition">
          {showForm ? 'Annuler' : '+ Nouvelle roue'}
        </button>
      </div>

      {/* Section engagement du commerce */}
      {business && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Engagement du commerce</h2>
          <p className="text-xs text-gray-400 mb-3">Cet engagement s'applique à toutes les roues de ce commerce</p>
          <EngagementSection business={business} onUpdate={fetchBusiness} />
        </div>
      )}

      {showForm && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Créer une roue</h2>
          <form onSubmit={handleCreateWheel} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Nom de la roue</label>
              <input type="text" value={wheelName} onChange={e => setWheelName(e.target.value)} required placeholder="Roue printemps 2026"
                className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500 border border-gray-200 dark:border-gray-700 placeholder-gray-400 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Lien Google Review</label>
              <input type="url" value={googleUrl} onChange={e => setGoogleUrl(e.target.value)} required placeholder="https://g.page/r/XXXXXX/review"
                className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500 border border-gray-200 dark:border-gray-700 placeholder-gray-400 transition" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                  Récompenses <span className={`ml-2 text-xs font-semibold ${Math.round(totalProb) === 100 ? 'text-green-400' : 'text-red-400'}`}>{totalProb}% / 100%</span>
                </label>
                <button type="button" onClick={addReward} className="text-violet-500 hover:text-violet-400 text-sm transition">+ Ajouter</button>
              </div>
              <div className="space-y-3">
                {rewards.map((r, i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <input type="color" value={r.color} onChange={e => updateReward(i, 'color', e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200 dark:border-gray-700 p-0.5 bg-transparent" />
                    <input type="text" value={r.label} onChange={e => updateReward(i, 'label', e.target.value)} required placeholder="Ex: 10% de réduction"
                      className="flex-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-500 border border-gray-200 dark:border-gray-700 placeholder-gray-400 transition text-sm" />
                    <div className="flex items-center gap-1">
                      <input type="number" value={r.probability} onChange={e => updateReward(i, 'probability', e.target.value)} min="0" max="100" required
                        className="w-20 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-500 border border-gray-200 dark:border-gray-700 text-sm text-center" />
                      <span className="text-gray-400 text-sm">%</span>
                    </div>
                    <button type="button" onClick={() => updateReward(i, 'isLosing', !r.isLosing)}
                      className={`text-xs px-2 py-1.5 rounded-lg font-medium transition flex-shrink-0 ${r.isLosing ? 'bg-red-100 dark:bg-red-500/20 text-red-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                      {r.isLosing ? '💀 Perdu' : '🎁 Gain'}
                    </button>
                    {rewards.length > 2 && <button type="button" onClick={() => removeReward(i)} className="text-red-400 hover:text-red-300 transition text-xl leading-none">×</button>}
                  </div>
                ))}
              </div>
            </div>
            {formError && <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-3"><p className="text-red-500 dark:text-red-400 text-sm">{formError}</p></div>}
            <button type="submit" disabled={formLoading} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50">
              {formLoading ? 'Création...' : 'Créer la roue'}
            </button>
          </form>
        </div>
      )}

      {wheels.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center">
          <p className="text-4xl mb-4">🎡</p>
          <p className="text-gray-900 dark:text-white font-semibold text-lg">Aucune roue</p>
          <p className="text-gray-400 mt-2">Créez votre première roue pour ce commerce</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {wheels.map(w => (
            <div key={w.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">🎡</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">{w.rewards?.length || 0} récompenses</span>
                  <button onClick={() => openEdit(w)} className="text-xs text-violet-500 hover:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-2 py-1 rounded-lg transition">✏️</button>
                  <button onClick={() => askDelete(w)} className="text-xs text-red-500 hover:text-red-400 bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-lg transition">🗑️</button>
                </div>
              </div>

              <h3 className="text-gray-900 dark:text-white font-semibold mb-4">{w.name}</h3>

              <div className="space-y-2 mb-2">
                {w.rewards?.map(r => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: r.color }} />
                      <span className="text-gray-500 dark:text-gray-400">{r.label}</span>
                      {r.isLosing && <span className="text-xs text-red-400">💀</span>}
                    </div>
                    <span className="text-violet-500 font-medium">{r.probability}%</span>
                  </div>
                ))}
              </div>

              {/* Barre engagement du commerce */}
              {business?.hasEngagement && business?.engagementStatus !== 'none' && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{business.engagementStatus === 'expiring' || business.engagementStatus === 'expired' ? '⚠️ Expire bientôt' : '📋 Engagement'}</span>
                    <span>{business.engagementDaysLeft}j restants</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full transition-all ${business.engagementStatus === 'expiring' || business.engagementStatus === 'expired' ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ width: `${business.engagementProgress ?? 0}%` }} />
                  </div>
                </div>
              )}

              <WheelStats wheelId={w.id} />

              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button onClick={() => setQrWheel(w)} className="w-full text-sm text-violet-500 hover:text-violet-400 transition">📱 Voir le QR Code</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {qrWheel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-sm w-full border border-gray-200 dark:border-gray-800 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-gray-900 dark:text-white font-semibold">{qrWheel.name}</h3>
                <p className="text-gray-400 text-sm">{business?.name}</p>
              </div>
              <button onClick={() => setQrWheel(null)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition text-2xl leading-none">×</button>
            </div>
            <div id="qr-download" className="flex justify-center bg-white p-4 rounded-xl">
              <QRCodeSVG value={`${window.location.origin}/spin/${business?.slug}?wheel=${qrWheel.id}`} size={200} bgColor="#ffffff" fgColor="#000000" level="H" />
            </div>
            <p className="text-center text-gray-400 text-xs mt-4">Scanne ce QR code pour accéder à la roue</p>
            <button onClick={downloadQR} className="w-full mt-4 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl transition">⬇️ Télécharger le QR Code</button>
          </div>
        </div>
      )}
    </div>
  )
}