import React, { useEffect, useRef, useState } from 'react'

interface DiceProps {
  values: [number, number] | null
  onRoll?: () => void
  isMyTurn: boolean
  hasRolled: boolean
}

const DOTS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 22], [72, 22], [28, 50], [72, 50], [28, 78], [72, 78]],
}

function DieFace({ value, size = 72, state }: { value: number; size?: number; state: 'idle' | 'rolling' | 'landing' }) {
  const dots = DOTS[value] ?? []
  const cls = state === 'rolling' ? 'dice-rolling' : state === 'landing' ? 'dice-landing' : ''

  return (
    <div className={cls} style={{ display: 'inline-block' }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <defs>
          <linearGradient id="diceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e8e8e8" />
          </linearGradient>
          <filter id="diceShadow">
            <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.25" />
          </filter>
        </defs>
        <rect x="4" y="4" width="92" height="92" rx="16"
          fill="url(#diceGrad)" filter="url(#diceShadow)"
          stroke="#d1d5db" strokeWidth="1.5"
        />
        {dots.map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="8.5" fill="#1e1b4b" />
        ))}
      </svg>
    </div>
  )
}

export default function Dice({ values, onRoll, isMyTurn, hasRolled }: DiceProps) {
  const [displayValues, setDisplayValues] = useState<[number, number]>([1, 1])
  const [diceState, setDiceState] = useState<'idle' | 'rolling' | 'landing'>('idle')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevValues = useRef<[number, number] | null>(null)

  useEffect(() => {
    if (!values) return
    // Déclencher l'animation quand les valeurs changent
    if (prevValues.current?.[0] === values[0] && prevValues.current?.[1] === values[1]) return
    prevValues.current = values

    setDiceState('rolling')
    let ticks = 0
    const maxTicks = 14

    intervalRef.current = setInterval(() => {
      ticks++
      setDisplayValues([
        Math.ceil(Math.random() * 6) as 1|2|3|4|5|6,
        Math.ceil(Math.random() * 6) as 1|2|3|4|5|6,
      ])
      if (ticks >= maxTicks) {
        clearInterval(intervalRef.current!)
        setDisplayValues(values)
        setDiceState('landing')
        setTimeout(() => setDiceState('idle'), 400)
      }
    }, 50)

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [values])

  const total = values ? values[0] + values[1] : null
  const isDouble = values ? values[0] === values[1] : false

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Dés */}
      <div className="flex items-center gap-4">
        <DieFace value={displayValues[0]} size={72} state={diceState} />
        <DieFace value={displayValues[1]} size={72} state={diceState} />
      </div>

      {/* Résultat */}
      {total !== null && diceState === 'idle' && (
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
