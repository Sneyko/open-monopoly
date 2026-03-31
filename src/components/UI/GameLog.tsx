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

  return (
    <div className="bg-gray-900 rounded-lg p-3 h-48 overflow-y-auto text-sm">
      <div className="font-semibold text-gray-400 mb-2 text-xs uppercase tracking-wider">Journal</div>
      {events.slice(-50).map(event => (
        <div key={event.id} className="text-gray-300 py-0.5 border-b border-gray-800 last:border-0">
          {event.message}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
