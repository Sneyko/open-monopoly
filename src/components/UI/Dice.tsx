import React, { useEffect, useRef, useState, useId } from 'react'

interface DiceProps {
  values: [number, number] | null
  onRoll?: () => void
  isMyTurn: boolean
  hasRolled: boolean
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
  const dots    = DOTS[value] ?? DOTS[1]
  const gradId  = `dg-${uid}`
  const shadId  = `ds-${uid}`

  return (
    <div style={{ display: 'inline-block' }}>
      <svg
        width={size} height={size} viewBox="0 0 100 100"
        style={{
          transition: rolling ? 'none' : 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          transform: 'scale(1)',
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
        <rect
          x="4" y="4" width="92" height="92" rx="18"
          fill={`url(#${gradId})`}
          filter={`url(#${shadId})`}
          stroke="#c8c8c8" strokeWidth="1"
        />
        {dots.map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="9" fill="#1e1b4b" />
        ))}
      </svg>
    </div>
  )
}

export default function Dice({ values, onRoll, isMyTurn, hasRolled }: DiceProps) {
  // useId produit un ID unique par instance — évite les conflits SVG entre les deux dés
  const uid = useId().replace(/:/g, 'x')

  const [display, setDisplay] = useState<[number, number]>([1, 1])
  const [rolling, setRolling] = useState(false)

  const prevValuesRef = useRef<string>('')
  const rafRef        = useRef<number | null>(null)
  const startRef      = useRef<number>(0)

  useEffect(() => {
    if (!values) return

    const key = `${values[0]}-${values[1]}`
    if (key === prevValuesRef.current) return
    prevValuesRef.current = key

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)

    const DURATION = 750
    setRolling(true)
    startRef.current = performance.now()

    const tick = (now: number) => {
      const t = (now - startRef.current) / DURATION
      const progress = Math.min(t, 1)

      // Fréquence de changement décroît en fin d'animation
      if (Math.random() < (1 - progress) * 1.5 + 0.05) {
        setDisplay([
          (Math.ceil(Math.random() * 6)) as 1|2|3|4|5|6,
          (Math.ceil(Math.random() * 6)) as 1|2|3|4|5|6,
        ])
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setDisplay(values)
        setRolling(false)
        rafRef.current = null
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current) }
  }, [values])

  const total    = values ? values[0] + values[1] : null
  const isDouble = values ? values[0] === values[1] : false

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-4">
        <DieFace value={display[0]} size={72} rolling={rolling} uid={`${uid}a`} />
        <DieFace value={display[1]} size={72} rolling={rolling} uid={`${uid}b`} />
      </div>

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

      {isMyTurn && !hasRolled && (
        <button
          onClick={onRoll}
          className="my-turn-glow mt-1 w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold py-3 px-6 rounded-xl text-base transition-all active:scale-95 shadow-lg"
        >
          🎲 Lancer les dés
        </button>
      )}
    </div>
  )
}
