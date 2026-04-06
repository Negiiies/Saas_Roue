'use client'

import { useRouter } from 'next/navigation'

export default function MentionsLegales() {
  const router = useRouter()

  return (
    <div style={{ fontFamily: "'Sora', sans-serif", minHeight: '100vh', background: '#05010f', color: '#e2d8f0', padding: '48px 24px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        <button onClick={() => router.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'rgba(180,140,255,0.7)', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: '40px' }}>
          ← Retour
        </button>

        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>Mentions légales</h1>
        <p style={{ color: 'rgba(180,160,220,0.5)', fontSize: '14px', marginBottom: '48px' }}>Conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN)</p>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#c4a0ff', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid rgba(140,60,255,0.2)' }}>Éditeur du site</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: 'rgba(220,200,240,0.8)', fontSize: '15px', lineHeight: '1.7' }}>
            <p><strong style={{ color: '#fff' }}>Nom :</strong> Regis MENDY</p>
            <p><strong style={{ color: '#fff' }}>Adresse :</strong> 29 Alée du buisson cocher, 77700 SERRIS</p>
            <p><strong style={{ color: '#fff' }}>SIREN :</strong> 847 955 499</p>
            <p><strong style={{ color: '#fff' }}>SIRET :</strong> 847 955 499 00029</p>
            <p><strong style={{ color: '#fff' }}>Email :</strong> <a href="mailto:contact@rytual.fr" style={{ color: '#a070ff', textDecoration: 'none' }}>contact@rytual.fr</a></p>
          </div>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#c4a0ff', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid rgba(140,60,255,0.2)' }}>Directeur de la publication</h2>
          <p style={{ color: 'rgba(220,200,240,0.8)', fontSize: '15px' }}>Regis MENDY</p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#c4a0ff', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid rgba(140,60,255,0.2)' }}>Hébergement</h2>
          <div style={{ color: 'rgba(220,200,240,0.8)', fontSize: '15px', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p><strong style={{ color: '#fff' }}>Hébergeur :</strong> Cloudflare, Inc.</p>
            <p><strong style={{ color: '#fff' }}>Adresse :</strong> 101 Townsend St, San Francisco, CA 94107, États-Unis</p>
            <p><strong style={{ color: '#fff' }}>Site :</strong> <a href="https://www.cloudflare.com" target="_blank" rel="noopener noreferrer" style={{ color: '#a070ff', textDecoration: 'none' }}>cloudflare.com</a></p>
          </div>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#c4a0ff', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid rgba(140,60,255,0.2)' }}>Propriété intellectuelle</h2>
          <p style={{ color: 'rgba(220,200,240,0.8)', fontSize: '15px', lineHeight: '1.7' }}>
            L'ensemble du contenu de ce site (textes, images, logotypes, éléments graphiques) est la propriété exclusive de Regis MENDY et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle. Toute reproduction, représentation, diffusion ou utilisation, totale ou partielle, est strictement interdite sans autorisation préalable écrite.
          </p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#c4a0ff', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid rgba(140,60,255,0.2)' }}>Données personnelles</h2>
          <p style={{ color: 'rgba(220,200,240,0.8)', fontSize: '15px', lineHeight: '1.7' }}>
            Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition aux données vous concernant. Pour exercer ces droits, contactez-nous à <a href="mailto:contact@rytual.fr" style={{ color: '#a070ff', textDecoration: 'none' }}>contact@rytual.fr</a>.
          </p>
          <p style={{ color: 'rgba(220,200,240,0.8)', fontSize: '15px', lineHeight: '1.7', marginTop: '12px' }}>
            Les données collectées (empreinte de navigateur anonymisée) sont utilisées uniquement pour limiter la participation à une roue par appareil. Aucune donnée n'est transmise à des tiers.
          </p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#c4a0ff', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid rgba(140,60,255,0.2)' }}>Cookies</h2>
          <p style={{ color: 'rgba(220,200,240,0.8)', fontSize: '15px', lineHeight: '1.7' }}>
            Ce site utilise le stockage local (localStorage) pour mémoriser votre participation aux roues. Aucun cookie de traçage ou publicitaire n'est utilisé.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#c4a0ff', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid rgba(140,60,255,0.2)' }}>Contact</h2>
          <p style={{ color: 'rgba(220,200,240,0.8)', fontSize: '15px', lineHeight: '1.7' }}>
            Pour toute question relative au fonctionnement du site : <a href="mailto:contact@rytual.fr" style={{ color: '#a070ff', textDecoration: 'none' }}>contact@rytual.fr</a>
          </p>
        </section>

        <p style={{ marginTop: '56px', color: 'rgba(140,100,180,0.3)', fontSize: '12px', textAlign: 'center' }}>
          © {new Date().getFullYear()} Regis MENDY — Tous droits réservés
        </p>

      </div>
    </div>
  )
}
