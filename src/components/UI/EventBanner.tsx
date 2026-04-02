import React, { useEffect, useRef, useState } from 'react'
import type { GameEvent } from '../../../shared/types'

// Évènements à ne PAS afficher (trop verbeux)
const SKIP_PATTERNS = [
  's\'arrête sur',
  'tourne les dés',
  'enchérit',
]

interface BannerItem {
  id: string
  message: string
  tag: string
  color: string
  bg: string
}

function parseEvent(event: GameEvent): BannerItem | null {
  const m = event.message
  if (SKIP_PATTERNS.some(p => m.includes(p))) return null

  let tag = 'INFO'
  let color = '#94a3b8'
  let bg = 'rgba(148,163,184,0.12)'

  if (m.includes('achète'))                               { tag = 'ACHAT'; color = '#34d399'; bg = 'rgba(52,211,153,0.12)' }
  else if (m.includes('construit un hôtel'))              { tag = 'HOTEL'; color = '#f87171'; bg = 'rgba(248,113,113,0.12)' }
  else if (m.includes('construit une maison'))            { tag = 'MAISON'; color = '#4ade80'; bg = 'rgba(74,222,128,0.12)' }
  else if (m.includes('paye') && m.includes('loyer'))     { tag = 'LOYER'; color = '#fb923c'; bg = 'rgba(251,146,60,0.12)' }
  else if (m.includes('passe par la case Départ'))        { tag = 'DEPART'; color = '#facc15'; bg = 'rgba(250,204,21,0.12)' }
  else if (m.includes('prison') || m.includes('TD'))      { tag = 'TD'; color = '#f97316'; bg = 'rgba(249,115,22,0.12)' }
  else if (m.includes('tire une carte'))                  { tag = 'CARTE'; color = '#a78bfa'; bg = 'rgba(167,139,250,0.12)' }
  else if (m.includes('faillite'))                        { tag = 'KO'; color = '#f87171'; bg = 'rgba(248,113,113,0.15)' }
  else if (m.includes('ramasse') && m.includes('Parc'))   { tag = 'PARC'; color = '#60a5fa'; bg = 'rgba(96,165,250,0.12)' }
  else if (m.includes('hypothèque'))                      { tag = 'HYPOTHEQUE'; color = '#fbbf24'; bg = 'rgba(251,191,36,0.12)' }
  else if (m.includes('enchère') || m.includes('remporte'))  { tag = 'ENCHERE'; color = '#38bdf8'; bg = 'rgba(56,189,248,0.12)' }
  else if (m.includes('vend'))                            { tag = 'VENTE'; color = '#94a3b8'; bg = 'rgba(148,163,184,0.12)' }
  else if (m.includes('paye') && m.includes('impôt'))     { tag = 'IMPOT'; color = '#fb923c'; bg = 'rgba(251,146,60,0.12)' }
  else if (m.includes('lève l\'hypothèque'))              { tag = 'LIBERATION'; color = '#4ade80'; bg = 'rgba(74,222,128,0.12)' }
  else return null

  return { id: event.id, message: m, tag, color, bg }
}

interface Props {
  events: GameEvent[]
}

export default function EventBanner({ events }: Props) {
  const [queue, setQueue]     = useState<BannerItem[]>([])
  const [current, setCurrent] = useState<BannerItem | null>(null)
  const [visible, setVisible] = useState(false)
  const seenRef  = useRef<Set<string>>(new Set())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Détecte les nouveaux événements
  useEffect(() => {
    const newItems: BannerItem[] = []
    for (const event of events) {
      if (seenRef.current.has(event.id)) continue
      seenRef.current.add(event.id)
      const item = parseEvent(event)
      if (item) newItems.push(item)
    }
    if (newItems.length > 0) {
      setQueue(q => [...q, ...newItems])
    }
  }, [events])

  // Dépile la queue et affiche un par un
  useEffect(() => {
    if (current || queue.length === 0) return

    const [next, ...rest] = queue
    setQueue(rest)
    setCurrent(next)
    setVisible(true)

    timerRef.current = setTimeout(() => {
      setVisible(false)
      setTimeout(() => setCurrent(null), 350)
    }, 2800)
  }, [queue, current])

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  if (!current) return null

  return (
    <>
      <style>{`
        @keyframes banner-in {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes banner-out {
          from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          to   { opacity: 0; transform: translate(-50%, -50%) scale(0.85); }
        }
        .banner-enter { animation: banner-in  0.3s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .banner-leave  { animation: banner-out 0.35s ease-in forwards; }
      `}</style>

      <div
        className={visible ? 'banner-enter' : 'banner-leave'}
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 40,
          pointerEvents: 'none',
          maxWidth: '75%',
          textAlign: 'center',
        }}
      >
        <div style={{
          background: `#13151cee`,
          border: `2px solid ${current.color}99`,
          borderRadius: '20px',
          padding: '16px 24px',
          boxShadow: `0 16px 56px rgba(0,0,0,0.85), 0 0 0 1px ${current.color}33, inset 0 0 32px ${current.color}11`,
        }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.72rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontWeight: 800,
              color: current.color,
              border: `1px solid ${current.color}55`,
              background: current.bg,
              borderRadius: '999px',
              padding: '4px 10px',
              marginBottom: '10px',
            }}
          >
            {current.tag}
          </div>
          <p style={{
            color: current.color,
            fontWeight: 700,
            fontSize: '0.95rem',
            lineHeight: 1.35,
            margin: 0,
            textShadow: `0 0 20px ${current.color}66`,
          }}>
            {current.message}
          </p>
        </div>
      </div>
    </>
  )
}
