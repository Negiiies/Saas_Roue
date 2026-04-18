'use client'

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import jsQR from 'jsqr'

const API = ''

export default function ValidatePage() {
  const [code, setCode] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [mounted, setMounted] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    setMounted(true)
    return () => stopScanner()
  }, [])

  const handleValidate = async (codeToCheck = code) => {
    if (!codeToCheck.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await axios.post(`${API}/api/scan/validate`, { secretCode: codeToCheck.trim() })
      setResult({ valid: true, ...res.data })
    } catch (err) {
      setResult({ valid: false, error: err.response?.data?.error || 'Erreur serveur' })
    } finally {
      setLoading(false)
    }
  }

  const startScanner = async () => {
    setScanning(true)
    setResult(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      intervalRef.current = setInterval(() => {
        const video = videoRef.current
        if (!video || !streamRef.current || video.readyState !== video.HAVE_ENOUGH_DATA) return
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height)
        if (code?.data) {
          stopScanner()
          setCode(code.data)
          handleValidate(code.data)
        }
      }, 300)
    } catch (err) {
      setScanning(false)
      const msg = err.name === 'NotAllowedError'
        ? "Accès caméra refusé. Autorisez la caméra dans les paramètres du navigateur."
        : err.name === 'NotFoundError'
        ? "Aucune caméra détectée sur cet appareil."
        : "Impossible d'accéder à la caméra (HTTPS requis)"
      setResult({ valid: false, error: msg })
    }
  }

  const stopScanner = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setScanning(false)
  }

  const reset = () => {
    setCode('')
    setResult(null)
    stopScanner()
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

        .validate-root {
          font-family: 'Outfit', sans-serif;
          min-height: 100vh;
          background: #05010f;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }
        .blob-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(120,40,200,0.25) 0%, transparent 70%);
          top: -150px; left: 50%; transform: translateX(-50%);
        }
        .blob-2 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(80,20,160,0.2) 0%, transparent 70%);
          bottom: 0; right: -50px;
        }
        .blob-3 {
          width: 200px; height: 200px;
          background: radial-gradient(circle, rgba(160,60,255,0.15) 0%, transparent 70%);
          bottom: 100px; left: -30px;
        }
        .particle {
          position: absolute;
          background: rgba(180,120,255,0.6);
          border-radius: 50%;
          animation: float-up linear infinite;
        }
        @keyframes float-up {
          0% { transform: translateY(100vh); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 0.6; }
          100% { transform: translateY(-10vh); opacity: 0; }
        }
        .card {
          width: 100%;
          max-width: 420px;
          position: relative;
          z-index: 10;
        }
        .icon-orb {
          width: 88px; height: 88px;
          margin: 0 auto 28px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .icon-orb-glow {
          position: absolute;
          inset: -10px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(140,60,255,0.3) 0%, transparent 70%);
          animation: pulse-glow 2s ease-in-out infinite alternate;
        }
        @keyframes pulse-glow {
          from { opacity: 0.5; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1.1); }
        }
        .icon-orb-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid rgba(160,80,255,0.6);
          animation: rotate 4s linear infinite;
          background: conic-gradient(from 0deg, rgba(160,80,255,0.8), transparent, rgba(160,80,255,0.8));
          -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2px), white calc(100% - 2px));
          mask: radial-gradient(farthest-side, transparent calc(100% - 2px), white calc(100% - 2px));
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .icon-orb-inner {
          width: 62px; height: 62px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2d1060, #1a0840);
          border: 1px solid rgba(140,60,255,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          position: relative;
          z-index: 1;
          box-shadow: 0 0 24px rgba(120,40,220,0.4), inset 0 1px 0 rgba(255,255,255,0.1);
        }
        .v-title { text-align: center; margin-bottom: 36px; }
        .v-title h1 {
          font-size: 28px; font-weight: 800; color: #fff;
          letter-spacing: -0.5px; margin-bottom: 6px;
        }
        .v-title p { font-size: 14px; color: rgba(180,160,220,0.7); }

        .btn-scan {
          width: 100%; padding: 16px;
          border-radius: 16px;
          border: 1px solid rgba(140,60,255,0.4);
          background: rgba(100,40,200,0.12);
          color: #c4a0ff;
          font-family: 'Outfit', sans-serif;
          font-size: 16px; font-weight: 600;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: all 0.2s;
          backdrop-filter: blur(10px);
        }
        .btn-scan:hover {
          border-color: rgba(160,80,255,0.7);
          background: rgba(120,50,220,0.22);
          color: #d8bcff;
          box-shadow: 0 0 20px rgba(120,40,220,0.15);
        }
        .divider {
          display: flex; align-items: center; gap: 12px;
          margin: 20px 0;
        }
        .divider-line {
          flex: 1; height: 1px;
          background: linear-gradient(to right, transparent, rgba(140,60,255,0.3), transparent);
        }
        .divider span {
          font-size: 12px; color: rgba(160,130,200,0.45);
          font-weight: 500; letter-spacing: 1px; text-transform: uppercase;
        }
        .code-input {
          width: 100%;
          background: rgba(20,5,40,0.8);
          border: 1px solid rgba(100,40,180,0.4);
          border-radius: 16px;
          padding: 18px 20px;
          color: #e8d8ff;
          font-family: 'JetBrains Mono', monospace;
          font-size: 22px; font-weight: 600;
          text-align: center;
          letter-spacing: 6px;
          outline: none;
          transition: all 0.2s;
          backdrop-filter: blur(10px);
          margin-bottom: 16px;
          display: block;
        }
        .code-input::placeholder {
          color: rgba(140,100,200,0.3);
          letter-spacing: 4px; font-size: 16px;
        }
        .code-input:focus {
          border-color: rgba(160,80,255,0.7);
          box-shadow: 0 0 0 3px rgba(120,40,220,0.12), 0 0 20px rgba(120,40,220,0.08);
          background: rgba(25,8,50,0.9);
        }
        .btn-validate {
          width: 100%; padding: 18px;
          border-radius: 16px; border: none;
          background: linear-gradient(135deg, #7c2ff8, #9b40ff, #c060ff);
          color: #fff;
          font-family: 'Outfit', sans-serif;
          font-size: 16px; font-weight: 700;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: all 0.2s;
          box-shadow: 0 4px 30px rgba(120,40,220,0.4), inset 0 1px 0 rgba(255,255,255,0.1);
          position: relative; overflow: hidden;
        }
        .btn-validate:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 40px rgba(120,40,220,0.5), inset 0 1px 0 rgba(255,255,255,0.15);
        }
        .btn-validate:disabled { opacity: 0.35; cursor: not-allowed; }
        .btn-shine {
          position: absolute; top: 0; left: -100%;
          width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          animation: shine 3s ease-in-out infinite;
        }
        @keyframes shine {
          0%, 100% { left: -100%; }
          50% { left: 150%; }
        }
        .result-card {
          border-radius: 20px; padding: 28px 24px;
          margin-bottom: 20px; border: 1px solid;
          text-align: center; position: relative; overflow: hidden;
          animation: result-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes result-in {
          from { opacity: 0; transform: scale(0.9) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .result-card.success {
          border-color: rgba(60,220,120,0.4);
          background: linear-gradient(135deg, rgba(20,80,40,0.4), rgba(10,40,25,0.6));
        }
        .result-card.error {
          border-color: rgba(220,60,80,0.4);
          background: linear-gradient(135deg, rgba(80,20,30,0.4), rgba(40,10,15,0.6));
        }
        .result-glow {
          position: absolute; top: -40px; left: 50%; transform: translateX(-50%);
          width: 200px; height: 200px;
          border-radius: 50%; filter: blur(40px); pointer-events: none;
        }
        .result-card.success .result-glow { background: rgba(60,220,120,0.15); }
        .result-card.error .result-glow { background: rgba(220,60,80,0.15); }
        .result-emoji { font-size: 52px; margin-bottom: 12px; display: block; }
        .result-status {
          font-size: 12px; font-weight: 700; letter-spacing: 2px;
          text-transform: uppercase; margin-bottom: 10px;
        }
        .result-card.success .result-status { color: #5eeba0; }
        .result-card.error .result-status { color: #f07080; }
        .result-reward {
          font-size: 22px; font-weight: 800; color: #fff;
          margin-bottom: 4px; letter-spacing: -0.3px;
        }
        .result-business { font-size: 13px; color: rgba(200,180,230,0.6); margin-bottom: 4px; }
        .result-time {
          font-size: 12px; color: rgba(160,140,190,0.4);
          font-family: 'JetBrains Mono', monospace;
        }
        .result-error-msg { font-size: 15px; color: rgba(240,160,170,0.8); margin-top: 4px; }
        .btn-reset {
          width: 100%; padding: 14px;
          border-radius: 14px;
          border: 1px solid rgba(140,60,255,0.3);
          background: transparent;
          color: rgba(180,140,255,0.7);
          font-family: 'Outfit', sans-serif;
          font-size: 15px; font-weight: 600;
          cursor: pointer; transition: all 0.2s; margin-top: 14px;
        }
        .btn-reset:hover {
          background: rgba(100,40,180,0.15);
          border-color: rgba(160,80,255,0.5);
          color: #c4a0ff;
        }
        .scanner-wrapper {
          border-radius: 20px; overflow: hidden;
          border: 1px solid rgba(140,60,255,0.4);
          position: relative; margin-bottom: 16px; background: #000;
        }
        .scanner-wrapper video { width: 100%; display: block; max-height: 280px; object-fit: cover; }
        .scanner-overlay {
          position: absolute; inset: 0; pointer-events: none;
        }
        .scan-corner {
          position: absolute; width: 36px; height: 36px;
          border-color: #a060ff; border-style: solid;
        }
        .scan-corner.tl { top: 14px; left: 14px; border-width: 3px 0 0 3px; border-radius: 4px 0 0 0; }
        .scan-corner.tr { top: 14px; right: 14px; border-width: 3px 3px 0 0; border-radius: 0 4px 0 0; }
        .scan-corner.bl { bottom: 14px; left: 14px; border-width: 0 0 3px 3px; border-radius: 0 0 0 4px; }
        .scan-corner.br { bottom: 14px; right: 14px; border-width: 0 3px 3px 0; border-radius: 0 0 4px 0; }
        .scan-line {
          position: absolute; left: 14px; right: 14px; height: 2px;
          background: linear-gradient(90deg, transparent, #a060ff, transparent);
          animation: scan-anim 2s ease-in-out infinite; top: 14px;
        }
        @keyframes scan-anim {
          0%, 100% { top: 14px; opacity: 0.5; }
          50% { top: calc(100% - 14px); opacity: 1; }
        }
        .loading-dots { display: inline-flex; gap: 4px; align-items: center; }
        .loading-dots span {
          width: 5px; height: 5px; border-radius: 50%;
          background: rgba(255,255,255,0.7);
          animation: dot 1.2s ease-in-out infinite;
        }
        .loading-dots span:nth-child(2) { animation-delay: 0.15s; }
        .loading-dots span:nth-child(3) { animation-delay: 0.3s; }
        @keyframes dot {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div className="validate-root">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />

        {mounted && Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="particle" style={{
            left: `${(i * 8.3) % 100}%`,
            width: i % 3 === 0 ? '3px' : '2px',
            height: i % 3 === 0 ? '3px' : '2px',
            animationDuration: `${8 + (i * 1.3) % 10}s`,
            animationDelay: `${(i * 0.8) % 10}s`,
          }} />
        ))}

        <div className="card" style={{ paddingBottom: '40px' }}>
          <div className="icon-orb">
            <div className="icon-orb-glow" />
            <div className="icon-orb-ring" />
            <div className="icon-orb-inner">✅</div>
          </div>

          <div className="v-title">
            <h1>Valider un gain</h1>
            <p>Scannez ou saisissez le code du client</p>
          </div>

          {result && (
            <div className={`result-card ${result.valid ? 'success' : 'error'}`}>
              <div className="result-glow" />
              {result.valid ? (
                <>
                  <span className="result-emoji">🎁</span>
                  <div className="result-status">✓ Gain validé</div>
                  <div className="result-reward">{result.reward?.label}</div>
                  <div className="result-business">{result.business?.name}</div>
                  <div className="result-time">Validé à {result.usedAt}</div>
                  <button className="btn-reset" onClick={reset}>Valider un autre code →</button>
                </>
              ) : (
                <>
                  <span className="result-emoji">❌</span>
                  <div className="result-status">Code refusé</div>
                  <div className="result-error-msg">{result.error}</div>
                  <button className="btn-reset" onClick={reset}>Réessayer →</button>
                </>
              )}
            </div>
          )}

          <div style={{ display: scanning ? 'block' : 'none' }}>
            <div className="scanner-wrapper">
              <video ref={videoRef} playsInline muted />
              <div className="scanner-overlay">
                <div className="scan-corner tl" />
                <div className="scan-corner tr" />
                <div className="scan-corner bl" />
                <div className="scan-corner br" />
                <div className="scan-line" />
              </div>
            </div>
            <button className="btn-reset" onClick={stopScanner}>Annuler le scan</button>
          </div>

          {!result && !scanning && (
            <>
              <button className="btn-scan" onClick={startScanner}>
                <span>📷</span>
                <span>Scanner le QR code</span>
              </button>

              <div className="divider">
                <div className="divider-line" />
                <span>ou</span>
                <div className="divider-line" />
              </div>

              <input
                className="code-input"
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleValidate()}
                placeholder="A3F7B2C1"
                maxLength={8}
                autoComplete="off"
                spellCheck={false}
              />

              <button
                className="btn-validate"
                onClick={() => handleValidate()}
                disabled={loading || !code.trim()}
              >
                <div className="btn-shine" />
                {loading ? (
                  <div className="loading-dots"><span /><span /><span /></div>
                ) : (
                  <><span>✅</span><span>Valider le code</span></>
                )}
              </button>
            </>
          )}
        </div>

        <p style={{ position: 'fixed', bottom: '16px', left: 0, right: 0, textAlign: 'center', zIndex: 20 }}>
          <a href="/mentions-legales" style={{ fontSize: '12px', color: 'rgba(140,100,180,0.4)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = 'rgba(180,140,220,0.7)'}
            onMouseLeave={e => e.target.style.color = 'rgba(140,100,180,0.4)'}>
            Mentions légales
          </a>
        </p>
      </div>
    </>
  )
}