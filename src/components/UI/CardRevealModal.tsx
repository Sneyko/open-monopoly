import React, { useEffect, useState } from 'react'

// Import des dos de cartes
import rectoChance from '../../assets/recto-chance.svg'
import rectoIzly   from '../../assets/recto-izly.svg'

// Import des faces de cartes Chance
import c1 from '../../assets/c1.svg'
import c2 from '../../assets/c2.svg'
import c3 from '../../assets/c3.svg'
import c4 from '../../assets/c4.svg'
import c5 from '../../assets/c5.svg'
import c6 from '../../assets/c6.svg'

// Import des faces de cartes IZLY
import i1 from '../../assets/i1.svg'
import i2 from '../../assets/i2.svg'
import i3 from '../../assets/i3.svg'
import i4 from '../../assets/i4.svg'
import i5 from '../../assets/i5.svg'
import i6 from '../../assets/i6.svg'
import i7 from '../../assets/i7.svg'

const CARD_IMAGES: Record<string, string> = {
  'c1.svg': c1, 'c2.svg': c2, 'c3.svg': c3,
  'c4.svg': c4, 'c5.svg': c5, 'c6.svg': c6,
  'i1.svg': i1, 'i2.svg': i2, 'i3.svg': i3,
  'i4.svg': i4, 'i5.svg': i5, 'i6.svg': i6, 'i7.svg': i7,
}

if (typeof window !== 'undefined') {
  const preloadedBacks = [rectoChance, rectoIzly]
  for (const src of preloadedBacks) {
    const img = new window.Image()
    img.decoding = 'async'
    img.src = src
  }
}

interface Props {
  deck: 'chance' | 'community'
  text: string
  image: string
  onClose: () => void
}

export default function CardRevealModal({ deck, text, image, onClose }: Props) {
  // Phase d'animation : 'in' → montre le dos → 'flip' → montre la face → 'out'
  const [phase, setPhase] = useState<'in' | 'flipping' | 'face' | 'out'>('in')

  const isChance   = deck === 'chance'
  const rectoSrc   = isChance ? rectoChance : rectoIzly
  const faceSrc    = CARD_IMAGES[image] ?? rectoSrc
  const accentColor = isChance ? '#f59e0b' : '#6366f1'
  const label       = isChance ? 'Carte Chance' : 'Carte IZLY'

  useEffect(() => {
    // Étape 1 : entrée → flip après 0.8s
    const t1 = setTimeout(() => setPhase('flipping'), 800)
    // Étape 2 : mi-flip → switch face après 0.3s (mi-animation)
    const t2 = setTimeout(() => setPhase('face'), 1100)
    // Étape 3 : auto-fermeture après 5s
    const t3 = setTimeout(() => { setPhase('out'); setTimeout(onClose, 400) }, 5500)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  const cardStyle: React.CSSProperties = {
    transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.4s',
    transform:
      phase === 'in'      ? 'scale(0.6) rotateY(0deg)'   :
      phase === 'flipping'? 'scale(1)   rotateY(90deg)'  :
      phase === 'face'    ? 'scale(1)   rotateY(0deg)'   :
      /* out */             'scale(0.8) rotateY(0deg)',
    opacity: phase === 'out' ? 0 : 1,
    perspective: '800px',
  }

  const overlayStyle: React.CSSProperties = {
    opacity: phase === 'out' ? 0 : 1,
    transition: 'opacity 0.4s',
  }

  return (
    <>
      {/* Styles d'animation inline */}
      <style>{`
        @keyframes card-enter {
          from { opacity: 0; transform: scale(0.6) translateY(-20px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }
        @keyframes backdrop-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .card-modal-backdrop { animation: backdrop-in 0.25s ease forwards; }
        .card-modal-enter    { animation: card-enter 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards; }
      `}</style>

      {/* Backdrop */}
      <div
        className="card-modal-backdrop fixed inset-0 z-50 flex items-center justify-center"
        style={{ ...overlayStyle, background: 'rgba(0,0,0,0.86)', backdropFilter: 'blur(6px)' }}
        onClick={() => { setPhase('out'); setTimeout(onClose, 400) }}
      >
        <div
          className="card-modal-enter flex flex-col items-center gap-4"
          onClick={e => e.stopPropagation()}
        >
          {/* Label */}
          <div
            className="text-sm font-bold tracking-widest uppercase px-4 py-1.5 rounded-full"
            style={{ background: `${accentColor}22`, color: accentColor, border: `1px solid ${accentColor}55` }}
          >
            {label}
          </div>

          {/* Carte avec flip */}
          <div style={{ perspective: '800px' }}>
            <div style={cardStyle}>
              <img
                src={phase === 'face' ? faceSrc : rectoSrc}
                alt={phase === 'face' ? text : label}
                loading="eager"
                style={{
                  width: 'min(72vw, 340px)',
                  height: 'auto',
                  borderRadius: '16px',
                  boxShadow: `0 24px 80px rgba(0,0,0,0.7), 0 0 0 2px ${accentColor}44`,
                  display: 'block',
                }}
              />
            </div>
          </div>

          {/* Texte de la carte (visible après flip) */}
          <div
            style={{
              maxWidth: 'min(72vw, 340px)',
              opacity: phase === 'face' ? 1 : 0,
              transition: 'opacity 0.4s 0.1s',
            }}
          >
            <p className="text-white/80 text-sm text-center leading-relaxed">{text}</p>
          </div>

          {/* Bouton fermer */}
          <button
            onClick={() => { setPhase('out'); setTimeout(onClose, 400) }}
            className="text-white/30 hover:text-white/70 text-xs transition-colors mt-1"
            style={{ opacity: phase === 'face' ? 1 : 0, transition: 'opacity 0.4s 0.3s' }}
          >
            Appuyer pour continuer
          </button>
        </div>
      </div>
    </>
  )
}
