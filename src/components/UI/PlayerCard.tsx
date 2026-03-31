import React from 'react'
import type { Player, Property } from '../../../shared/types'

const COLOR_HEX: Record<string, string> = {
  red: '#ef4444', blue: '#3b82f6', green: '#22c55e',
  yellow: '#eab308', purple: '#a855f7', orange: '#f97316',
}

interface PlayerCardProps {
  player: Player
  properties: Property[]
  isCurrentTurn: boolean
  isMe: boolean
}

export default function PlayerCard({ player, properties, isCurrentTurn, isMe }: PlayerCardProps) {
  const owned = properties.filter(p => p.ownerId === player.id)
  const houses = owned.reduce((s, p) => s + p.houses, 0)
  const hotels = owned.filter(p => p.hotel).length
  const color = COLOR_HEX[player.color] ?? '#888'

  return (
    <div className={`
      relative rounded-xl p-3 transition-all duration-200 border
      ${isCurrentTurn
        ? 'border-yellow-400/60 bg-yellow-400/8 shadow-[0_0_12px_rgba(234,179,8,0.15)]'
        : 'border-white/8 bg-white/4'
      }
      ${player.isBankrupt ? 'opacity-35' : ''}
    `}>
      {/* Barre de couleur */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ backgroundColor: color }} />

      <div className="pl-2">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-3 h-3 rounded-full ring-1 ring-white/30 flex-shrink-0"
            style={{ backgroundColor: color }} />
          <span className="font-semibold text-sm text-white leading-none truncate">
            {player.name}
          </span>
          {isMe && <span className="text-[10px] text-white/40 font-medium">vous</span>}
          {isCurrentTurn && <span className="ml-auto text-yellow-400 text-xs">▶</span>}
          {!player.isConnected && !player.isBankrupt &&
            <span className="ml-auto text-xs text-red-400">déco.</span>}
          {player.isBankrupt &&
            <span className="ml-auto text-xs text-red-500 font-bold">FAILLITE</span>}
        </div>

        <div className="flex items-end justify-between">
          <span className="text-lg font-black text-emerald-400 leading-none">
            {player.money.toLocaleString()} €
          </span>
          <div className="flex items-center gap-2 text-xs text-white/50">
            {owned.length > 0 && <span>{owned.length} prop.</span>}
            {houses > 0 && <span className="text-green-400">🏠{houses}</span>}
            {hotels > 0 && <span className="text-red-400">🏨{hotels}</span>}
          </div>
        </div>

        {(player.inJail || player.getOutOfJailCards > 0) && (
          <div className="flex gap-2 mt-1.5 text-[10px]">
            {player.inJail &&
              <span className="bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded">
                🔒 Prison {player.jailTurns}/3
              </span>}
            {player.getOutOfJailCards > 0 &&
              <span className="bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">
                🃏 ×{player.getOutOfJailCards}
              </span>}
          </div>
        )}
      </div>
    </div>
  )
}
