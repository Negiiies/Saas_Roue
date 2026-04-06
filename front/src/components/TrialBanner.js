'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

export default function TrialBanner() {
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/company/me').then(res => setCompany(res.data)).catch(() => {})
  }, [])

  const activateTrial = async () => {
    setLoading(true)
    try {
      await api.post('/company/trial/activate')
      const res = await api.get('/company/me')
      setCompany(res.data)
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  if (!company) return null

  // Trial pas encore activé → bouton pour l'activer
  if (!company.trialEndsAt) {
    return (
      <div className="mx-4 mt-4 bg-violet-600/10 border border-violet-500/30 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-violet-400 font-medium text-sm">🎁 Période d'essai disponible</p>
          <p className="text-gray-400 text-xs mt-0.5">Activez 30 jours d'essai gratuit pour ce client</p>
        </div>
        <button
          onClick={activateTrial}
          disabled={loading}
          className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition whitespace-nowrap disabled:opacity-50"
        >
          {loading ? '...' : 'Activer l\'essai'}
        </button>
      </div>
    )
  }

  // Trial actif → afficher les jours restants
  if (company.trialActive && company.trialDaysLeft > 0) {
    const color = company.trialDaysLeft <= 5 ? 'orange' : 'green'
    const styles = {
      green: 'bg-green-500/10 border-green-500/30 text-green-400',
      orange: 'bg-orange-500/10 border-orange-500/30 text-orange-400'
    }
    return (
      <div className={`mx-4 mt-4 border rounded-xl px-4 py-3 ${styles[color]}`}>
        <p className="font-medium text-sm">
          🕐 Période d'essai — {company.trialDaysLeft} jour{company.trialDaysLeft > 1 ? 's' : ''} restant{company.trialDaysLeft > 1 ? 's' : ''}
        </p>
        <p className="text-xs mt-0.5 opacity-70">
          Expire le {new Date(company.trialEndsAt).toLocaleDateString('fr-FR')}
        </p>
      </div>
    )
  }

  // Trial expiré
  if (company.trialEndsAt && !company.trialActive) {
    return (
      <div className="mx-4 mt-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-red-400 font-medium text-sm">⛔ Période d'essai expirée</p>
          <p className="text-gray-400 text-xs mt-0.5">Le service est actuellement désactivé</p>
        </div>
      </div>
    )
  }

  return null
}