'use client'

import { useEffect, useState } from 'react'

function Star({ style }) {
  return <div className="absolute rounded-full bg-white" style={style} />
}

export default function LandingPage() {
  const [stars, setStars] = useState([])

  useEffect(() => {
    setStars(Array.from({ length: 40 }, (_, i) => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      width: `${Math.random() * 2 + 1}px`,
      height: `${Math.random() * 2 + 1}px`,
      opacity: Math.random() * 0.5 + 0.1,
      animation: `pulse ${Math.random() * 3 + 2}s ease-in-out infinite alternate`,
    })))
  }, [])

  return (
    <div style={{ fontFamily: "'Sora', sans-serif", background: 'radial-gradient(ellipse at top, #1a0533 0%, #0d0d1a 50%, #000 100%)' }}
      className="min-h-screen text-white overflow-hidden relative">

      {/* Stars */}
      <div className="fixed inset-0 pointer-events-none">
        {stars.map((s, i) => <Star key={i} style={s} />)}
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-16 py-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎡</span>
          <span className="text-xl font-bold">Ryturn</span>
        </div>
        <a href="mailto:contact@rytual.fr"
          className="text-sm text-gray-400 hover:text-white transition hidden sm:block">
          contact@rytual.fr
        </a>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-20 pb-32">
        <div className="mb-8 relative">
          <div className="w-32 h-32 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(236,72,153,0.3))', boxShadow: '0 0 60px rgba(139,92,246,0.3)' }}>
            <span className="text-6xl">🎡</span>
          </div>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight max-w-3xl mb-6">
          Transformez chaque client en
          <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent"> ambassadeur</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-xl mb-10 leading-relaxed">
          Une roue de la fortune interactive qui booste vos avis Google et fidélise vos clients. Simple, ludique, efficace.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <a href="mailto:contact@rytual.fr"
            className="px-8 py-4 rounded-2xl font-bold text-lg transition"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)', boxShadow: '0 0 30px rgba(139,92,246,0.4)' }}>
            Demander une demo
          </a>
          <a href="#comment-ca-marche"
            className="px-8 py-4 rounded-2xl font-bold text-lg border border-gray-700 text-gray-300 hover:border-violet-500 hover:text-white transition">
            Comment ca marche ?
          </a>
        </div>

        {/* Stats */}
        <div className="flex gap-12 mt-16">
          {[
            ['+340%', "d'avis Google"],
            ['98%', 'de satisfaction'],
            ['2 min', 'de mise en place'],
          ].map(([val, label]) => (
            <div key={label} className="text-center">
              <div className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">{val}</div>
              <div className="text-gray-500 text-sm mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Comment ca marche */}
      <section id="comment-ca-marche" className="relative z-10 px-6 md:px-16 py-24">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Comment ca marche ?</h2>
        <p className="text-gray-400 text-center mb-16 max-w-lg mx-auto">Un parcours simple en 3 etapes pour vos clients</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { icon: '📱', step: '1', title: 'Le client scanne', desc: 'Un QR code sur table, comptoir ou ticket. Un scan = un jeu.' },
            { icon: '⭐', step: '2', title: 'Il laisse un avis', desc: "Redirection vers Google pour laisser un avis avant de jouer." },
            { icon: '🎁', step: '3', title: 'Il tourne la roue', desc: "Il gagne une recompense et la presente au comptoir." },
          ].map(({ icon, step, title, desc }) => (
            <div key={step} className="rounded-2xl p-8 text-center border border-gray-800 hover:border-violet-500/50 transition"
              style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)' }}>
              <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center text-3xl"
                style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(236,72,153,0.2))' }}>
                {icon}
              </div>
              <div className="text-violet-400 text-sm font-bold mb-2">ETAPE {step}</div>
              <h3 className="text-xl font-bold mb-3">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Avantages */}
      <section className="relative z-10 px-6 md:px-16 py-24">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Pourquoi Ryturn ?</h2>
        <p className="text-gray-400 text-center mb-16 max-w-lg mx-auto">Tout ce dont vous avez besoin pour booster vos avis</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {[
            { icon: '🎯', title: 'Plus d\'avis Google', desc: 'La gamification motive vos clients a laisser un avis spontanement.' },
            { icon: '🎨', title: 'Roues personnalisables', desc: 'Couleurs, recompenses, probabilites : tout est configurable.' },
            { icon: '📊', title: 'Statistiques en temps reel', desc: 'Suivez les scans, spins, gains et taux de conversion.' },
            { icon: '⚡', title: 'Installation en 2 minutes', desc: 'Creez votre commerce, configurez la roue, imprimez le QR code.' },
            { icon: '🔒', title: 'Anti-triche', desc: 'Chaque appareil ne peut jouer qu\'une seule fois par roue.' },
            { icon: '✅', title: 'Validation simple', desc: 'Vos employes scannent le QR du client pour valider le gain.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex gap-4 p-6 rounded-2xl border border-gray-800/50 hover:border-violet-500/30 transition"
              style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="text-3xl flex-shrink-0 mt-1">{icon}</div>
              <div>
                <h3 className="font-bold text-lg mb-1">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 md:px-16 py-24">
        <div className="max-w-2xl mx-auto text-center rounded-3xl p-12 border border-violet-500/30"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(236,72,153,0.1))' }}>
          <span className="text-5xl mb-6 block">🚀</span>
          <h2 className="text-3xl font-bold mb-4">Pret a booster vos avis ?</h2>
          <p className="text-gray-400 mb-8">Contactez-nous pour une demonstration gratuite et sans engagement.</p>
          <a href="mailto:contact@rytual.fr"
            className="inline-block px-10 py-4 rounded-2xl font-bold text-lg transition"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)', boxShadow: '0 0 30px rgba(139,92,246,0.4)' }}>
            Contactez-nous
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800/50 px-6 md:px-16 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <span>🎡</span>
            <span className="font-bold">Ryturn</span>
            <span className="text-gray-600 text-sm ml-2">&copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="/mentions-legales" className="hover:text-gray-300 transition">Mentions legales</a>
            <a href="mailto:contact@rytual.fr" className="hover:text-gray-300 transition">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
