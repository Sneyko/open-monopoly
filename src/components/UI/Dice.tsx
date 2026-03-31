import React from 'react'

interface DiceProps {
  values: [number, number] | null
  rolling?: boolean
}

const DOTS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 20], [75, 20], [25, 50], [75, 50], [25, 80], [75, 80]],
}

function DieFace({ value, size = 64 }: { value: number; size?: number }) {
  const dots = DOTS[value] ?? []
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <rect x="4" y="4" width="92" height="92" rx="14" fill="white" stroke="#ccc" strokeWidth="2"/>
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="9" fill="#1a1a2e"/>
      ))}
    </svg>
  )
}

export default function Dice({ values, rolling }: DiceProps) {
  return (
    <div className="flex gap-3 items-center justify-center">
      <div className={rolling ? 'animate-spin' : ''}>
        <DieFace value={values?.[0] ?? 1} />
      </div>
      <div className={rolling ? 'animate-spin' : ''}>
        <DieFace value={values?.[1] ?? 1} />
      </div>
      {values && (
        <span className="text-xl font-bold text-yellow-300 ml-2">
          = {values[0] + values[1]}
        </span>
      )}
    </div>
  )
}
