'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import axios from 'axios'

function StarBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      alpha: Math.random(),
      speed: Math.random() * 0.008 + 0.003,
      dir: Math.random() > 0.5 ? 1 : -1
    }))

    let animId
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      stars.forEach(s => {
        s.alpha += s.speed * s.dir
        if (s.alpha >= 1 || s.alpha <= 0) s.dir *= -1
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, 2 * Math.PI)
        ctx.fillStyle = `rgba(255,255,255,${s.alpha})`
        ctx.fill()
      })
      animId = requestAnimationFrame(animate)
    }
    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  )
}

export default function SpinContent() {
  const { slug } = useParams()
  const searchParams = useSearchParams()
  const wheelId = searchParams.get('wheel')

  const [step, setStep] = useState('loading')
  const [wheel, setWheel] = useState(null)
  const [token, setToken] = useState(null)
  const [result, setResult] = useState(null)
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [showPopup, setShowPopup] = useState(false)
  const canvasRef = useRef(null)
  const storageKey = `spun_${wheelId}`

  useEffect(() => {
    if (!wheelId) { setStep('error'); return }

    const alreadySpun = localStorage.getItem(storageKey)
if (alreadySpun) {
  try {
    const data = JSON.parse(alreadySpun)
    setResult(data)
    setStep('already')
  } catch(e) {
    localStorage.removeItem(storageKey)
  }
  return
}

    axios.get(`http://localhost:3000/api/scan/${wheelId}`)
      .then(res => {
        setWheel(res.data.wheel)
        setToken(res.data.token)
        setStep('review')
      })
      .catch(() => setStep('error'))
  }, [wheelId])

  useEffect(() => {
    if (wheel && canvasRef.current && step === 'spin') drawWheel(rotation)
  }, [wheel, rotation, step])

  const drawWheel = (rot) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const size = canvas.width
    const center = size / 2
    const radius = center - 10
    const rewards = wheel.rewards
    const total = rewards.reduce((s, r) => s + r.probability, 0)

    ctx.clearRect(0, 0, size, size)

    let startAngle = (rot * Math.PI) / 180

    rewards.forEach((r) => {
      const slice = (r.probability / total) * 2 * Math.PI

      ctx.beginPath()
      ctx.moveTo(center, center)
      ctx.arc(center, center, radius, startAngle, startAngle + slice)
      ctx.closePath()
      ctx.fillStyle = r.color
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.save()
      ctx.translate(center, center)
      ctx.rotate(startAngle + slice / 2)
      ctx.textAlign = 'right'
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 12px Sora, sans-serif'
      ctx.shadowColor = 'rgba(0,0,0,0.5)'
      ctx.shadowBlur = 6
      const text = r.label.length > 14 ? r.label.substring(0, 13) + '...' : r.label
      ctx.fillText(text, radius - 12, 5)
      ctx.restore()

      startAngle += slice
    })

    ctx.beginPath()
    ctx.arc(center, center, radius, 0, 2 * Math.PI)
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'
    ctx.lineWidth = 3
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(center, center, 22, 0, 2 * Math.PI)
    ctx.fillStyle = '#1f1f2e'
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.font = '16px serif'
    ctx.textAlign = 'center'
    ctx.fillText('🎡', center, center + 6)
  }

  const handleSpin = async () => {
    if (spinning) return
    setSpinning(true)

    try {
      const res = await axios.post('http://localhost:3000/api/scan/spin', { token })
      const { reward, dailyCode, wonAt } = res.data

      const rewards = wheel.rewards
      const total = rewards.reduce((s, r) => s + r.probability, 0)
      let targetAngle = 0
      let cumul = 0

      for (const r of rewards) {
        const slice = (r.probability / total) * 360
        if (r.id === reward.id) {
          targetAngle = cumul + slice / 2
          break
        }
        cumul += slice
      }

      const spinTurns = 5 * 360
      const finalRotation = spinTurns + (360 - targetAngle)

      let start = null
      const duration = 5000
      const startRot = rotation

      const animate = (timestamp) => {
        if (!start) start = timestamp
        const elapsed = timestamp - start
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        const current = startRot + finalRotation * eased

        setRotation(current)
        drawWheel(current)

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          localStorage.setItem(storageKey, JSON.stringify({
            reward,
            dailyCode,
            wonAt,
            date: new Date().toLocaleDateString('fr-FR')
          }))
          setResult({ reward, dailyCode, wonAt, date: new Date().toLocaleDateString('fr-FR') })
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
      if (err.response?.status === 400) {
        setStep('already')
      } else {
        setStep('error')
      }
      setSpinning(false)
    }
  }

  const bgStyle = {
    background: 'radial-gradient(ellipse at top, #1a0533 0%, #0d0d1a 50%, #000000 100%)',
    fontFamily: "'Sora', sans-serif",
    minHeight: '100vh'
  }

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

  if (step === 'already') return (
    <div style={bgStyle} className="flex items-center justify-center p-4">
      <StarBackground />
      <div className="relative z-10 text-center w-full max-w-sm">
        <p className="text-5xl mb-4">🎡</p>
        <h1 className="text-white text-xl font-bold mb-2">Vous avez déjà participé</h1>
        <p className="text-gray-400 text-sm mb-6">Voici votre récompense :</p>

        {result && !result.reward?.isLosing ? (
          <div>
            <div className="rounded-2xl p-6 mb-4 border border-gray-700" style={{
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(10px)'
            }}>
              <div
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl"
                style={{ backgroundColor: result.reward?.color }}
              >
                🎁
              </div>
              <h2 className="text-white text-xl font-bold">{result.reward?.label}</h2>
            </div>

            <div className="rounded-xl p-4 mb-4 border border-violet-500/30" style={{
              background: 'rgba(139, 92, 246, 0.1)'
            }}>
              <p className="text-gray-400 text-sm mb-2">Votre code de validation</p>
              <p className="text-4xl font-bold text-violet-400 tracking-widest">{result.dailyCode}</p>
              <p className="text-gray-500 text-xs mt-2">{result.wonAt} — {result.date}</p>
            </div>

            <p className="text-gray-500 text-sm">Montrez ce code au comptoir pour récupérer votre récompense</p>
          </div>
        ) : (
          <div>
            <p className="text-5xl mb-4">😢</p>
            <p className="text-gray-400">Vous n'avez pas gagné cette fois</p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div style={bgStyle} className="flex flex-col items-center justify-center p-4 relative">
      <StarBackground />

      {showPopup && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            <p className="text-4xl mb-4">⭐</p>
            <h2 className="text-white font-bold text-xl mb-3">Laisser un avis Google</h2>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Vous allez être redirigé vers Google pour laisser votre avis. Revenez ensuite sur cette page pour tourner la roue et gagner votre récompense !
            </p>
            <a
              href={wheel?.googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShowPopup(false)}
              className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3.5 rounded-xl transition mb-3"
            >
              ⭐ Aller sur Google
            </a>
            <button
              onClick={() => setShowPopup(false)}
              className="w-full text-gray-500 hover:text-gray-300 text-sm transition py-2"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="relative z-10 w-full max-w-sm">

        {step === 'review' && (
          <div className="text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-violet-600/20 border border-violet-500/30 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
                🎡
              </div>
              <h1 className="text-2xl font-bold text-white">{wheel?.business?.name || 'Merci !'}</h1>
              <p className="text-gray-400 mt-2 text-sm leading-relaxed">
                Laissez-nous un avis Google et tentez de gagner une récompense !
              </p>
            </div>

            <button
              onClick={() => setShowPopup(true)}
              className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 rounded-2xl transition mb-4"
            >
              ⭐ Laisser un avis Google
            </button>

            <button
              onClick={() => setStep('spin')}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-4 rounded-2xl transition"
            >
              🎰 J'ai laissé mon avis, je tourne !
            </button>

            <p className="text-gray-600 text-xs mt-4">En participant vous confirmez avoir laissé un avis sincère</p>
          </div>
        )}

        {step === 'spin' && (
          <div className="text-center">
            <h1 className="text-xl font-bold text-white mb-4">Tournez la roue !</h1>

            <div className="flex justify-center mb-1">
              <div className="text-2xl text-violet-400 drop-shadow-lg">▼</div>
            </div>

            <div className="flex justify-center mb-6 relative">
              <div className="absolute rounded-full" style={{
                width: '300px',
                height: '300px',
                boxShadow: '0 0 60px rgba(139, 92, 246, 0.4)'
              }} />
              <canvas
                ref={canvasRef}
                width={300}
                height={300}
                className="relative z-10"
                style={{ borderRadius: '50%' }}
              />
            </div>

            <button
              onClick={handleSpin}
              disabled={spinning}
              className="w-full font-bold py-4 rounded-2xl transition text-lg disabled:opacity-50 text-white"
              style={{
                background: spinning ? '#4c1d95' : 'linear-gradient(135deg, #7c3aed, #ec4899)',
                boxShadow: spinning ? 'none' : '0 0 30px rgba(139, 92, 246, 0.5)'
              }}
            >
              {spinning ? '🎡 La roue tourne...' : '🎰 TOURNER !'}
            </button>
          </div>
        )}

        {step === 'result' && result && (
          <div className="text-center">
            {result.reward.isLosing ? (
              <div>
                <p className="text-7xl mb-4 animate-bounce">😢</p>
                <h1 className="text-2xl font-bold text-white mb-2">Pas de chance !</h1>
                <p className="text-gray-400">Revenez demain pour une nouvelle tentative</p>
              </div>
            ) : (
              <div>
                <p className="text-6xl mb-4">🎉</p>
                <h1 className="text-2xl font-bold text-white mb-2">Félicitations !</h1>
                <p className="text-gray-400 mb-6">Vous avez gagné :</p>

                <div className="rounded-2xl p-6 mb-6 border border-gray-700" style={{
                  background: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div
                    className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl shadow-lg"
                    style={{ backgroundColor: result.reward.color }}
                  >
                    🎁
                  </div>
                  <h2 className="text-white text-xl font-bold">{result.reward.label}</h2>
                </div>

                <div className="rounded-xl p-4 mb-4 border border-violet-500/30" style={{
                  background: 'rgba(139, 92, 246, 0.1)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <p className="text-gray-400 text-sm mb-2">Votre code de validation</p>
                  <p className="text-4xl font-bold text-violet-400 tracking-widest">{result.dailyCode}</p>
                  <p className="text-gray-500 text-xs mt-2">{result.wonAt} — {result.date}</p>
                </div>

                <p className="text-gray-500 text-sm">Montrez ce code au comptoir pour récupérer votre récompense</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}