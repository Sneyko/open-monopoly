import React from 'react'
import type { Player, Property } from '../../../shared/types'

const COLOR_MAP: Record<string, string> = {
  red: '#E24B4A',
  blue: '#378ADD',
  green: '#639922',
  yellow: '#EF9F27',
  purple: '#7F77DD',
  orange: '#D85A30',
}

interface PlayerCardProps {
  player: Player
  properties: Property[]
  isCurrentTurn: boolean
  isMe: boolean
}

export default function PlayerCard({ player, properties, isCurrentTurn, isMe }: PlayerCardProps) {
  const owned = properties.filter(p => p.ownerId === player.id)

  return (
    <div className={`
      rounded-lg p-3 border-2 transition-all
      ${isCurrentTurn ? 'border-yellow-400 bg-yellow-400/10' : 'border-gray-600 bg-gray-800/50'}
      ${player.isBankrupt ? 'opacity-40' : ''}
      ${isMe ? 'ring-2 ring-white/30' : ''}
    `}>
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-4 h-4 rounded-full border-2 border-white/50 flex-shrink-0"
          style={{ backgroundColor: COLOR_MAP[player.color] ?? '#888' }}
        />
        <span className="font-semibold text-sm truncate">
          {player.name} {isMe && '(vous)'}
        </span>
        {isCurrentTurn && <span className="ml-auto text-yellow-300 text-xs">▶</span>}
        {!player.isConnected && <span className="ml-auto text-red-400 text-xs">⚡</span>}
      </div>

      <div className="text-lg font-bold text-green-400">{player.money} F</div>

      {player.inJail && (
        <div className="text-xs text-orange-400 mt-1">🔒 En prison ({player.jailTurns}/3)</div>
      )}
      {player.getOutOfJailCards > 0 && (
        <div className="text-xs text-blue-300 mt-1">🃏 ×{player.getOutOfJailCards} carte prison</div>
      )}

      <div className="text-xs text-gray-400 mt-1">
        {owned.length} propriété{owned.length !== 1 ? 's' : ''}
        {owned.some(p => p.houses > 0 || p.hotel) && (
          <span className="ml-2">
            🏠 {owned.reduce((sum, p) => sum + p.houses, 0)}
            {owned.some(p => p.hotel) && ` 🏨 ${owned.filter(p => p.hotel).length}`}
          </span>
        )}
      </div>
    </div>
  )
}
