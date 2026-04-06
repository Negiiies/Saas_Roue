'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import axios from 'axios'
import { QRCodeSVG } from 'qrcode.react'

const API = ''

// ─── Fingerprint ──────────────────────────────────────────────────────────────
function getFingerprint() {
  return btoa([
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency || '',
    navigator.platform || ''
  ].join('|')).slice(0, 64)
}

// ─── Étoiles ──────────────────────────────────────────────────────────────────
function StarBackground() {
  const [stars, setStars] = useState([])
  useEffect(() => {
    setStars(Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.6 + 0.2,
      duration: Math.random() * 3 + 2,
    })))
  }, [])
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {stars.map(star => (
        <div key={star.id} className="absolute rounded-full bg-white" style={{
          left: `${star.x}%`, top: `${star.y}%`,
          width: `${star.size}px`, height: `${star.size}px`,
          opacity: star.opacity,
          animation: `pulse ${star.duration}s ease-in-out infinite alternate`
        }} />
      ))}
    </div>
  )
}

// ─── Dessin roue ──────────────────────────────────────────────────────────────
function drawEqualWheel(canvas, rewards, rotation = 0) {
  if (!canvas || !rewards.length) return
  const ctx = canvas.getContext('2d')
  const { width, height } = canvas
  const cx = width / 2
  const cy = height / 2
  const radius = Math.min(cx, cy) - 10

  ctx.clearRect(0, 0, width, height)

  const n = rewards.length
  const sliceAngle = (2 * Math.PI) / n

  rewards.forEach((reward, i) => {
    const startAngle = rotation + i * sliceAngle
    const endAngle = startAngle + sliceAngle

    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, radius, startAngle, endAngle)
    ctx.closePath()
    ctx.fillStyle = reward.color
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(startAngle + sliceAngle / 2)
    ctx.textAlign = 'right'
    ctx.fillStyle = '#fff'
    ctx.font = `bold ${Math.max(10, Math.min(13, 200 / n))}px Sora, sans-serif`
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = 4
    const text = reward.label.length > 14 ? reward.label.slice(0, 13) + '…' : reward.label
    ctx.fillText(text, radius - 14, 5)
    ctx.restore()
  })

  // Cercle central
  ctx.beginPath()
  ctx.arc(cx, cy, 18, 0, 2 * Math.PI)
  ctx.fillStyle = '#1a0533'
  ctx.fill()
  ctx.strokeStyle = 'rgba(139,92,246,0.8)'
  ctx.lineWidth = 3
  ctx.stroke()
}

// ─── Footer légal ─────────────────────────────────────────────────────────────
function LegalFooter() {
  return (
    <div className="relative z-10 pb-6 text-center">
      <a href="/mentions-legales" className="text-xs text-gray-600 hover:text-gray-400 transition">
        Mentions légales
      </a>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function SpinContent({ slug }) {
  const canvasRef = useRef(null)
  const rotationRef = useRef(0)

  // step: loading | ready | popup | spin | result | already | error
  const [step, setStep] = useState('loading')
  const [wheel, setWheel] = useState(null)
  const [token, setToken] = useState(null)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState(null)
  const [hasReviewed, setHasReviewed] = useState(false)

  const storageKey = `spinned_wheel_${slug}`

  // ─── Dessiner la roue (appelé dès que canvas + wheel sont dispo) ────────────
  const drawWheel = useCallback(() => {
    if (wheel?.rewards && canvasRef.current) {
      drawEqualWheel(canvasRef.current, wheel.rewards, rotationRef.current)
    }
  }, [wheel])

  // Redessiner quand wheel change ou quand le canvas devient visible
  useEffect(() => {
    if (!wheel?.rewards) return
    // Petit délai pour laisser le DOM se mettre à jour
    const t = setTimeout(() => drawWheel(), 50)
    return () => clearTimeout(t)
  }, [wheel, step, drawWheel])

  // ─── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!slug) return

    const params = new URLSearchParams(window.location.search)
    const wId = params.get('wheel')
    if (!wId) { setStep('error'); return }

    const cached = localStorage.getItem(storageKey)
    if (cached) {
      try {
        const data = JSON.parse(cached)
        setResult(data)
        setStep('already')
        return
      } catch (_) {}
    }

    const fingerprint = getFingerprint()

    axios.get(`${API}/api/scan/${wId}`, {
      headers: { 'x-fingerprint': fingerprint }
    })
      .then(res => {
        setWheel(res.data.wheel)
        setToken(res.data.token)

        if (res.data.alreadyScanned && res.data.hasSpun) {
          const s = res.data.existingScan
          const data = { reward: s.reward, secretCode: s.secretCode, status: s.status }
          setResult(data)
          localStorage.setItem(storageKey, JSON.stringify(data))
          setStep('already')
        } else {
          setStep('ready') // ← affiche la roue directement
        }
      })
      .catch(() => setStep('error'))
  }, [slug])

  // ─── Ouvrir Google Reviews ─────────────────────────────────────────────────
  const handleOpenGoogle = () => {
    if (wheel?.googleReviewUrl) {
      window.open(wheel.googleReviewUrl, '_blank')
    }
    setHasReviewed(true)
    setStep('popup') // montre le popup de confirmation
  }

  // ─── Lancer le spin ────────────────────────────────────────────────────────
  const handleSpin = async () => {
    if (spinning || !token) return
    setSpinning(true)
    setStep('spin')

    try {
      const res = await axios.post(`${API}/api/scan/spin`, { token })
      const { reward, secretCode, wonAt, date } = res.data

      const rewards = wheel.rewards
      const n = rewards.length
      const sliceAngle = (2 * Math.PI) / n
      const winnerIndex = rewards.findIndex(r => r.id === reward.id)

      const targetAngle = -(winnerIndex * sliceAngle + sliceAngle / 2) - Math.PI / 2
      const spins = 6 * 2 * Math.PI
      const startRot = rotationRef.current
      const finalRotation = spins + targetAngle - (startRot % (2 * Math.PI))

      const duration = 4500
      let start = null

      function animate(timestamp) {
        if (!start) start = timestamp
        const elapsed = timestamp - start
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 4)
        const current = startRot + finalRotation * eased

        rotationRef.current = current
        drawEqualWheel(canvasRef.current, rewards, current)

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          const data = {
            reward, secretCode, wonAt,
            date: date || new Date().toLocaleDateString('fr-FR')
          }
          localStorage.setItem(storageKey, JSON.stringify(data))
          setResult(data)
          setStep('result')
          setSpinning(false)

          if (!reward.isLosing) {
            import('canvas-confetti').then(({ default: confetti }) => {
              confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 } })
              setTimeout(() => confetti({ particleCount: 100, spread: 60, origin: { y: 0.4, x: 0.2 } }), 400)
              setTimeout(() => confetti({ particleCount: 100, spread: 60, origin: { y: 0.4, x: 0.8 } }), 700)
            })
          }
        }
      }

      requestAnimationFrame(animate)
    } catch (err) {
      setStep(err.response?.status === 400 ? 'already' : 'error')
      setSpinning(false)
    }
  }

  // ─── Styles ────────────────────────────────────────────────────────────────
  const bgStyle = {
    background: 'radial-gradient(ellipse at top, #1a0533 0%, #0d0d1a 50%, #000000 100%)',
    fontFamily: "'Sora', sans-serif",
    minHeight: '100vh'
  }

  // ─── Écrans statiques ──────────────────────────────────────────────────────
  if (step === 'loading') return (
    <div style={bgStyle} className="flex items-center justify-center">
      <StarBackground />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Chargement...</p>
      </div>
    </div>
  )

  if (step === 'error') return (
    <div style={bgStyle} className="flex items-center justify-center p-4">
      <StarBackground />
      <div className="relative z-10 text-center">
        <p className="text-6xl mb-4">😕</p>
        <h1 className="text-white text-xl font-bold">Page introuvable</h1>
        <p className="text-gray-400 mt-2">Ce QR code n'est plus valide</p>
      </div>
    </div>
  )

  const ResultWon = ({ res }) => (
    <div className="text-center">
      <p className="text-6xl mb-4">🎉</p>
      <h1 className="text-2xl font-bold text-white mb-2">Félicitations !</h1>
      <p className="text-gray-400 mb-6">Vous avez gagné :</p>
      <div className="rounded-2xl p-5 mb-5 border border-gray-700" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
        <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl shadow-lg" style={{ backgroundColor: res.reward?.color }}>
          🎁
        </div>
        <h2 className="text-white text-xl font-bold">{res.reward?.label}</h2>
      </div>
      <div className="rounded-xl p-5 mb-4 border border-violet-500/30" style={{ background: 'rgba(139,92,246,0.1)', backdropFilter: 'blur(10px)' }}>
        <p className="text-gray-400 text-sm mb-3">Présentez ce QR code au comptoir</p>
        <div className="flex justify-center bg-white p-3 rounded-xl mb-3">
          <QRCodeSVG value={res.secretCode || ''} size={160} bgColor="#ffffff" fgColor="#1a0533" level="H" />
        </div>
        <p className="text-violet-400 font-mono font-bold text-lg tracking-widest">{res.secretCode}</p>
        <p className="text-gray-500 text-xs mt-2">Valable 24h après obtention</p>
      </div>
      <p className="text-gray-500 text-sm">Le personnel scannera votre QR code pour valider la récompense</p>
    </div>
  )

  if (step === 'already') return (
    <div style={bgStyle} className="flex flex-col items-center justify-center p-4 min-h-screen">
      <StarBackground />
      <div className="relative z-10 text-center w-full max-w-sm flex-1 flex items-center justify-center">
        {result && !result.reward?.isLosing && result.secretCode ? (
          <ResultWon res={result} />
        ) : (
          <>
            <p className="text-5xl mb-4">🎡</p>
            <h1 className="text-white text-xl font-bold mb-2">Vous avez déjà participé</h1>
            <p className="text-gray-400 text-sm">Vous avez déjà utilisé cette roue !</p>
          </>
        )}
      </div>
      <LegalFooter />
    </div>
  )

  if (step === 'result') return (
    <div style={bgStyle} className="flex flex-col items-center justify-center p-4 min-h-screen">
      <StarBackground />
      <div className="relative z-10 w-full max-w-sm flex-1 flex items-center justify-center">
        {result?.reward?.isLosing ? (
          <div className="text-center">
            <p className="text-7xl mb-4 animate-bounce">😢</p>
            <h1 className="text-2xl font-bold text-white mb-2">Pas de chance !</h1>
            <p className="text-gray-400">Vous avez déjà utilisé cette roue !</p>
          </div>
        ) : (
          <ResultWon res={result} />
        )}
      </div>
      <LegalFooter />
    </div>
  )

  // ─── Écran principal : roue toujours visible ───────────────────────────────
  return (
    <div style={bgStyle} className="flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <StarBackground />

      {/* Popup Google obligatoire */}
      {step === 'popup' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            {hasReviewed ? (
              <>
                <p className="text-4xl mb-4">✅</p>
                <h2 className="text-white font-bold text-xl mb-3">Merci pour votre avis !</h2>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                  Vous pouvez maintenant tourner la roue et tenter de gagner une récompense !
                </p>
                <button
                  onClick={() => { setStep('spin'); setSpinning(false) }}
                  className="block w-full text-white font-bold py-4 rounded-2xl transition mb-3"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}
                >
                  🎰 Tourner la roue !
                </button>
                <button
                  onClick={() => setStep('ready')}
                  className="w-full text-gray-500 hover:text-gray-300 text-sm transition py-2"
                >
                  Retour
                </button>
              </>
            ) : (
              <>
                <p className="text-4xl mb-4">⭐</p>
                <h2 className="text-white font-bold text-xl mb-3">Laisser un avis Google</h2>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                  Vous allez être redirigé vers Google. Une fois votre avis posté, revenez ici pour tourner la roue !
                </p>
                <button
                  onClick={handleOpenGoogle}
                  className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3.5 rounded-xl transition mb-3"
                >
                  ⭐ Aller sur Google
                </button>
                <button onClick={() => setStep('ready')} className="w-full text-gray-500 hover:text-gray-300 text-sm transition py-2">
                  Annuler
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-6 pb-10">

        {/* Nom du commerce */}
        <h1 className="text-xl font-bold text-white text-center">
          {wheel?.business?.name || wheel?.name}
        </h1>

        {/* Roue — toujours visible */}
        <div className="relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10 text-2xl">▼</div>
          <canvas
            ref={canvasRef}
            width={300}
            height={300}
            className="rounded-full shadow-2xl"
            style={{ boxShadow: '0 0 40px rgba(139,92,246,0.4)' }}
          />
        </div>

        {/* Boutons selon l'étape */}
        {step === 'ready' && (
          <div className="w-full space-y-3">
            <p className="text-gray-400 text-sm text-center leading-relaxed">
              Laissez un avis Google pour débloquer la roue et tenter de gagner une récompense !
            </p>
            <button
              onClick={() => setStep('popup')}
              className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 rounded-2xl transition"
            >
              ⭐ Laisser un avis Google
            </button>
          </div>
        )}

        {step === 'spin' && (
          <button
            onClick={handleSpin}
            disabled={spinning}
            className="w-full py-4 rounded-2xl font-bold text-white text-lg transition disabled:opacity-50"
            style={{
              background: spinning ? '#4c1d95' : 'linear-gradient(135deg, #7c3aed, #ec4899)',
              boxShadow: spinning ? 'none' : '0 0 30px rgba(139,92,246,0.5)'
            }}
          >
            {spinning ? '🎡 La roue tourne...' : '🎰 TOURNER !'}
          </button>
        )}

      </div>
      <LegalFooter />
    </div>
  )
}