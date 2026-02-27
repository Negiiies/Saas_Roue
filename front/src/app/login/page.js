'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import Cookies from 'js-cookie'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      Cookies.set('token', res.data.token, { expires: 7 })
      router.push('/dashboard')
    } catch (err) {
      setError('Identifiants incorrects')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ fontFamily: "'Sora', sans-serif" }} className="min-h-screen flex">

      {/* Panneau gauche */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 items-center justify-center">
        {/* Cercles décoratifs */}
        <div className="absolute top-[-80px] left-[-80px] w-80 h-80 rounded-full bg-white opacity-5" />
        <div className="absolute bottom-[-60px] right-[-60px] w-96 h-96 rounded-full bg-white opacity-5" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-white opacity-5" />

        <div className="relative z-10 text-center px-12">
          {/* Illustration roue stylisée */}
          <div className="mb-8 flex justify-center">
            <div className="relative w-48 h-48">
              <div className="absolute inset-0 rounded-full border-8 border-white opacity-20 animate-spin" style={{ animationDuration: '20s' }} />
              <div className="absolute inset-4 rounded-full border-4 border-white opacity-30 animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-7xl">🎡</span>
              </div>
              {/* Segments colorés */}
              {['bg-pink-400', 'bg-yellow-400', 'bg-green-400', 'bg-blue-400'].map((color, i) => (
                <div
                  key={i}
                  className={`absolute w-4 h-4 rounded-full ${color} opacity-80`}
                  style={{
                    top: `${50 + 45 * Math.sin((i * Math.PI) / 2)}%`,
                    left: `${50 + 45 * Math.cos((i * Math.PI) / 2)}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              ))}
            </div>
          </div>

          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            Boostez vos<br />avis Google
          </h2>
          <p className="text-purple-200 text-lg leading-relaxed">
            Transformez chaque client en ambassadeur grâce à la gamification.
          </p>

          {/* Stats */}
          <div className="mt-10 flex gap-8 justify-center">
            {[['+340%', "d'avis"], ['98%', 'satisfaction'], ['2min', 'setup']].map(([val, label]) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-bold text-white">{val}</div>
                <div className="text-purple-300 text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panneau droit */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-950 px-8">
        <div className="w-full max-w-md">

          <div className="mb-10">
            <h1 className="text-2xl font-bold text-white mb-1">🎡 SpinReview</h1>
            <h2 className="text-3xl font-bold text-white mt-6">Bon retour !</h2>
            <p className="text-gray-400 mt-2">Connectez-vous à votre espace admin</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Adresse email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@monentreprise.com"
                className="w-full bg-gray-900 text-white rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-violet-500 border border-gray-800 placeholder-gray-600 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-gray-900 text-white rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-violet-500 border border-gray-800 placeholder-gray-600 transition pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connexion...
                </span>
              ) : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-gray-600 text-sm mt-8">
            © 2026 SpinReview — Espace réservé aux administrateurs
          </p>
        </div>
      </div>
    </div>
  )
}