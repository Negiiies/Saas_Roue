'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

function StatCard({ label, value, sub, color = 'violet' }) {
  const colors = {
    violet: 'border-violet-500/30 text-violet-400',
    green: 'border-green-500/30 text-green-400',
    blue: 'border-blue-500/30 text-blue-400',
    orange: 'border-orange-500/30 text-orange-400',
    red: 'border-red-500/30 text-red-400',
  }
  return (
    <div className={`bg-white dark:bg-gray-900 border rounded-2xl p-5 ${colors[color]}`}>
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className={`text-3xl font-bold ${colors[color].split(' ')[1]}`}>{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}

function MiniChart({ data }) {
  if (!data?.length) return <p className="text-gray-500 text-sm text-center py-8">Aucune donnée cette semaine</p>

  const maxSpins = Math.max(...data.map(d => d.spins), 1)

  return (
    <div className="flex items-end gap-2 h-32 mt-4">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex flex-col justify-end gap-0.5" style={{ height: '100px' }}>
            <div
              className="w-full bg-violet-500/30 rounded-t"
              style={{ height: `${(d.spins / maxSpins) * 100}%` }}
            />
            <div
              className="w-full bg-green-500 rounded-t"
              style={{ height: `${(d.wins / maxSpins) * 100}%` }}
            />
          </div>
          <span className="text-gray-500 text-xs">{d.date.slice(5)}</span>
        </div>
      ))}
    </div>
  )
}

export default function StatsPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/stats/global')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-gray-400">Chargement des statistiques...</p>
  if (!stats) return <p className="text-gray-400">Impossible de charger les statistiques</p>

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Statistiques globales</h1>
        <p className="text-gray-400 text-sm mt-1">Vue d'ensemble de toutes vos campagnes</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total scans" value={stats.totalScans} color="blue" />
        <StatCard label="Roues tournées" value={stats.totalSpins} color="violet" />
        <StatCard label="Récompenses gagnées" value={stats.totalWins} color="green" />
        <StatCard label="Récompenses utilisées" value={stats.totalUsed} color="orange" sub="Validées au comptoir" />
        <StatCard label="Taux de conversion" value={`${stats.conversionRate}%`} color="violet" sub="Spins → Gains" />
        <StatCard label="Taux de récupération" value={`${stats.redemptionRate}%`} color="green" sub="Gains → Utilisés" />
      </div>

      {/* Graphique 7 jours */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-6">
        <h2 className="text-gray-900 dark:text-white font-semibold mb-1">Activité — 7 derniers jours</h2>
        <div className="flex gap-4 mt-1 mb-2">
          <span className="flex items-center gap-1 text-xs text-gray-400"><span className="w-3 h-3 rounded bg-violet-500/30 inline-block" /> Spins</span>
          <span className="flex items-center gap-1 text-xs text-gray-400"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> Gains</span>
        </div>
        <MiniChart data={stats.chartData} />
      </div>
    </div>
  )
}