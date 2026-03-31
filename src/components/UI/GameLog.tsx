import React, { useEffect, useRef } from 'react'
import type { GameEvent } from '../../../shared/types'

interface GameLogProps {
  events: GameEvent[]
}

export default function GameLog({ events }: GameLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [events.length])

  const recent = events.slice(-60)

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-1.5 px-1">
        Journal
      </div>
      <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
        {recent.map((event, i) => (
          <div
            key={event.id}
            className={`text-xs px-2 py-1 rounded leading-snug transition-all
              ${i === recent.length - 1
                ? 'bg-white/8 text-white/90'
                : 'text-white/45'
              }`}
          >
            {event.message}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
