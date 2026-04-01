import React, { useEffect, useRef, useState, useId, useCallback } from 'react'

const TURN_TIMEOUT = 30 // secondes avant auto-lancer

interface DiceProps {
  values: [number, number] | null
  onRoll?: () => void
  isMyTurn: boolean
  hasRolled: boolean
  diceSize?: number
}

const DOTS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[30, 30], [70, 70]],
  3: [[30, 30], [50, 50], [70, 70]],
  4: [[30, 30], [70, 30], [30, 70], [70, 70]],
  5: [[30, 30], [70, 30], [50, 50], [30, 70], [70, 70]],
  6: [[30, 22], [70, 22], [30, 50], [70, 50], [30, 78], [70, 78]],
}

function DieFace({
  value, size = 72, rolling, uid,
}: { value: number; size?: number; rolling: boolean; uid: string }) {
  const dots   = DOTS[value] ?? DOTS[1]
  const gradId = `dg-${uid}`
  const shadId = `ds-${uid}`

  return (
    <div style={{ display: 'inline-block' }}>
      <svg
        width={size} height={size} viewBox="0 0 100 100"
        style={{
          transition: rolling ? 'none' : 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          animation: rolling ? 'dice-spin 0.8s ease-out' : 'none',
          transformStyle: 'preserve-3d',
          display: 'block',
        }}
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e2e2e2" />
          </linearGradient>
          <filter id={shadId} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="2.5" stdDeviation="2.5" floodOpacity="0.28" />
          </filter>
        </defs>
        <rect x="4" y="4" width="92" height="92" rx="18"
          fill={`url(#${gradId})`} filter={`url(#${shadId})`}
          stroke="#c8c8c8" strokeWidth="1" />
        {dots.map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="9" fill="#1e1b4b" />
        ))}
      </svg>
    </div>
  )
}

export default function Dice({ values, onRoll, isMyTurn, hasRolled, diceSize = 72 }: DiceProps) {
  const uid = useId().replace(/:/g, 'x')

  // ── Animation des dés ──────────────────────────────────────────────────────
  const [display, setDisplay]   = useState<[number, number]>([1, 1])
  const [rolling, setRolling]   = useState(false)
  const prevValuesRef = useRef<string>('')
  const pendingResultRef = useRef<[number, number] | null>(null)
  const rollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!values) return
    const key = `${values[0]}-${values[1]}`
    if (key === prevValuesRef.current) return
    prevValuesRef.current = key

    pendingResultRef.current = values
    if (!rolling) {
      setDisplay(values)
    }
  }, [values, rolling])

  useEffect(() => {
    return () => {
      if (rollTimeoutRef.current) clearTimeout(rollTimeoutRef.current)
    }
  }, [])

  const triggerRoll = useCallback(() => {
    if (rolling) return

    setRolling(true)
    pendingResultRef.current = null
    onRoll?.()

    if (rollTimeoutRef.current) clearTimeout(rollTimeoutRef.current)
    rollTimeoutRef.current = setTimeout(() => {
      const finalValues = pendingResultRef.current ?? values
      if (finalValues) setDisplay(finalValues)
      setRolling(false)
      rollTimeoutRef.current = null
    }, 800)
  }, [onRoll, rolling, values])

  // ── Timer auto-lancer ─────────────────────────────────────────────────────
  const [timeLeft, setTimeLeft]   = useState(TURN_TIMEOUT)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const shouldRun = isMyTurn && !hasRolled

  useEffect(() => {
    if (!shouldRun) {
      // Réinitialise le timer quand ce n'est plus mon tour ou que j'ai lancé
      setTimeLeft(TURN_TIMEOUT)
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      return
    }

    // Démarre le décompte
    setTimeLeft(TURN_TIMEOUT)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          timerRef.current = null
          triggerRoll()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }
  }, [shouldRun, triggerRoll])

  const total    = values ? values[0] + values[1] : null
  const isDouble = values ? values[0] === values[1] : false

  // Barre de progression : 0% = temps écoulé, 100% = plein
  const progress = timeLeft / TURN_TIMEOUT  // 1 → 0
  const urgent   = timeLeft <= 10

  // Arc SVG pour le timer circulaire (r=22, circonférence ≈ 138.2)
  const R   = 22
  const C   = 2 * Math.PI * R
  const arc = C * progress

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Dés */}
      <div className="flex items-center gap-4">
        <DieFace value={display[0]} size={diceSize} rolling={rolling} uid={`${uid}a`} />
        <DieFace value={display[1]} size={diceSize} rolling={rolling} uid={`${uid}b`} />
      </div>

      {/* Timer (séparé des dés pour éviter la superposition) */}
      {shouldRun && (
        <div className="w-full flex items-center justify-center gap-2 fade-in-up">
          <div className="w-10 h-10 flex items-center justify-center relative">
            <svg width="40" height="40" viewBox="0 0 48 48" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="24" cy="24" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
              <circle
                cx="24"
                cy="24"
                r={R}
                fill="none"
                stroke={urgent ? '#ef4444' : '#10b981'}
                strokeWidth="3"
                strokeDasharray={`${arc} ${C}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.9s linear, stroke 0.3s' }}
              />
            </svg>
            <span className="absolute text-[11px] font-bold tabular-nums" style={{ color: urgent ? '#ef4444' : '#10b981' }}>
              {timeLeft}
            </span>
          </div>
          <span className="text-[11px] text-white/55">avant lancer auto</span>
        </div>
      )}

      {/* Résultat du lancer */}
      {total !== null && !rolling && (
        <div className="fade-in-up text-center">
          <span className="text-2xl font-black text-white">{total}</span>
          {isDouble && (
            <span className="ml-2 text-xs font-bold text-yellow-400 bg-yellow-400/15 px-2 py-0.5 rounded-full">
              DOUBLE !
            </span>
          )}
        </div>
      )}

      {/* Bouton lancer */}
      {shouldRun && (
        <button
          onClick={triggerRoll}
          className="my-turn-glow mt-1 w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold py-3 px-6 rounded-xl text-base transition-all active:scale-95 shadow-lg"
        >
          🎲 Lancer les dés
        </button>
      )}
    </div>
  )
}
