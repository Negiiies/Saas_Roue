'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import api from '@/lib/api'

export default function BusinessPage() {
  const router = useRouter()
  const { id } = useParams()
  const [business, setBusiness] = useState(null)
  const [wheels, setWheels] = useState([])
  const [loading, setLoading] = useState(true)
  const [qrWheel, setQrWheel] = useState(null)

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

  useEffect(() => {
    api.get('/businesses').then(res => {
      const b = res.data.find(b => b.id === parseInt(id))
      if (!b) { router.push('/dashboard'); return }
      setBusiness(b)
    })

    api.get(`/wheels/business/${id}`).then(res => {
      setWheels(res.data)
    }).finally(() => setLoading(false))
  }, [id])

  const addReward = () => setRewards([...rewards, { label: '', probability: 0, color: '#6366F1', isLosing: false }])
  const removeReward = (i) => setRewards(rewards.filter((_, idx) => idx !== i))
  const updateReward = (i, field, value) => {
    const updated = [...rewards]
    updated[i][field] = field === 'probability' ? parseFloat(value) || 0 : value
    setRewards(updated)
  }

  const totalProb = rewards.reduce((sum, r) => sum + r.probability, 0)

  const handleCreateWheel = async (e) => {
    e.preventDefault()
    setFormError('')
    if (Math.round(totalProb) !== 100) {
      setFormError('Les probabilités doivent totaliser 100%')
      return
    }
    setFormLoading(true)
    try {
      await api.post('/wheels', {
        name: wheelName,
        businessId: parseInt(id),
        googleReviewUrl: googleUrl,
        rewards
      })
      const res = await api.get(`/wheels/business/${id}`)
      setWheels(res.data)
      setShowForm(false)
      setWheelName('')
      setGoogleUrl('')
      setRewards([
        { label: '', probability: 25, color: '#8B5CF6', isLosing: false },
        { label: '', probability: 25, color: '#EC4899', isLosing: false },
        { label: '', probability: 25, color: '#F59E0B', isLosing: false },
        { label: '', probability: 25, color: '#10B981', isLosing: false },
      ])
    } catch (err) {
      setFormError(err.response?.data?.error || 'Erreur serveur')
    } finally {
      setFormLoading(false)
    }
  }

  const downloadQR = () => {
    const svg = document.querySelector('#qr-download svg')
    const svgData = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `qr-${business?.slug}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="text-gray-400">Chargement...</div>

  return (
    <div>
      <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition text-sm mb-6 flex items-center gap-2">
        ← Retour
      </button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{business?.name}</h1>
          <p className="text-gray-400 text-sm mt-1">/spin/{business?.slug}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-5 py-2.5 rounded-xl transition"
        >
          {showForm ? 'Annuler' : '+ Nouvelle roue'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Créer une roue</h2>
          <form onSubmit={handleCreateWheel} className="space-y-5">

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Nom de la roue</label>
              <input
                type="text"
                value={wheelName}
                onChange={e => setWheelName(e.target.value)}
                required
                placeholder="Roue printemps 2026"
                className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500 border border-gray-200 dark:border-gray-700 placeholder-gray-400 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Lien Google Review</label>
              <input
                type="url"
                value={googleUrl}
                onChange={e => setGoogleUrl(e.target.value)}
                required
                placeholder="https://g.page/r/XXXXXX/review"
                className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500 border border-gray-200 dark:border-gray-700 placeholder-gray-400 transition"
              />
              <p className="text-xs text-gray-400 mt-1">Récupère ce lien depuis Google Business Profile du commerce</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                  Récompenses
                  <span className={`ml-2 text-xs font-semibold ${Math.round(totalProb) === 100 ? 'text-green-400' : 'text-red-400'}`}>
                    {totalProb}% / 100%
                  </span>
                </label>
                <button type="button" onClick={addReward} className="text-violet-500 hover:text-violet-400 text-sm transition">
                  + Ajouter
                </button>
              </div>

              <div className="space-y-3">
                {rewards.map((r, i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <input
                      type="color"
                      value={r.color}
                      onChange={e => updateReward(i, 'color', e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200 dark:border-gray-700 p-0.5 bg-transparent"
                      title="Choisir une couleur"
                    />
                    <input
                      type="text"
                      value={r.label}
                      onChange={e => updateReward(i, 'label', e.target.value)}
                      required
                      placeholder="Ex: 10% de réduction"
                      className="flex-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-500 border border-gray-200 dark:border-gray-700 placeholder-gray-400 transition text-sm"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={r.probability}
                        onChange={e => updateReward(i, 'probability', e.target.value)}
                        min="0"
                        max="100"
                        required
                        className="w-20 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-500 border border-gray-200 dark:border-gray-700 text-sm text-center"
                      />
                      <span className="text-gray-400 text-sm">%</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => updateReward(i, 'isLosing', !r.isLosing)}
                      className={`text-xs px-2 py-1.5 rounded-lg font-medium transition flex-shrink-0 ${
                        r.isLosing
                          ? 'bg-red-100 dark:bg-red-500/20 text-red-500'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                      }`}
                    >
                      {r.isLosing ? '💀 Perdu' : '🎁 Gain'}
                    </button>

                    {rewards.length > 2 && (
                      <button type="button" onClick={() => removeReward(i)} className="text-red-400 hover:text-red-300 transition text-xl leading-none">×</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {formError && (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-3">
                <p className="text-red-500 dark:text-red-400 text-sm">{formError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={formLoading}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
            >
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
                <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">{w.rewards?.length || 0} récompenses</span>
              </div>
              <h3 className="text-gray-900 dark:text-white font-semibold">{w.name}</h3>

              <div className="mt-4 space-y-2">
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

              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => setQrWheel(w)}
                  className="w-full text-sm text-violet-500 hover:text-violet-400 transition"
                >
                  📱 Voir le QR Code
                </button>
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
              <QRCodeSVG
                value={`http://localhost:3001/spin/${business?.slug}?wheel=${qrWheel.id}`}
                size={200}
                bgColor="#ffffff"
                fgColor="#000000"
                level="H"
              />
            </div>

            <p className="text-center text-gray-400 text-xs mt-4">
              Scanne ce QR code pour accéder à la roue
            </p>

            <button
              onClick={downloadQR}
              className="w-full mt-4 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl transition"
            >
              ⬇️ Télécharger le QR Code
            </button>
          </div>
        </div>
      )}
    </div>
  )
}