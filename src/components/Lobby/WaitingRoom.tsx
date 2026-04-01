import React from 'react'
import type { RoomInfo } from '../../../shared/types'
import { useSocket } from '../../hooks/useSocket'
import logoSrc from '../../assets/logo.svg'

const COLOR_HEX: Record<string, string> = {
  red: '#ef4444', blue: '#3b82f6', green: '#22c55e',
  yellow: '#eab308', purple: '#a855f7', orange: '#f97316',
}

interface WaitingRoomProps {
  room: RoomInfo
  myPlayerId: string | null
}

export default function WaitingRoom({ room, myPlayerId }: WaitingRoomProps) {
  const socket = useSocket()
  const isHost = room.hostId === myPlayerId
  const canStart = room.players.length >= 2

  return (
    <div className="w-full max-w-sm fade-in-up">
      <div className="text-center mb-8">
        <img src={logoSrc} alt="Logo Puceaupoly" className="w-16 h-16 mx-auto mb-3 select-none" />
        <h2 className="text-2xl font-black text-white mb-1">Salle d'attente</h2>
        <p className="text-white/30 text-sm">Partagez le code avec vos amis</p>
      </div>

      {/* Code */}
      <div className="bg-white/6 border border-white/12 rounded-2xl p-5 mb-4 text-center">
        <div className="text-xs text-white/30 uppercase tracking-widest mb-2">Code de la partie</div>
        <div className="text-5xl font-black tracking-[0.2em] text-yellow-300 font-mono">
          {room.code}
        </div>
      </div>

      {/* Joueurs */}
      <div className="bg-white/4 border border-white/8 rounded-2xl p-4 mb-4">
        <div className="text-xs text-white/30 uppercase tracking-widest mb-3">
          Joueurs ({room.players.length}/6)
        </div>
        <div className="space-y-2">
          {room.players.map(player => (
            <div key={player.id} className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full ring-2 ring-white/10 flex-shrink-0"
                style={{ backgroundColor: COLOR_HEX[player.color] ?? '#888' }} />
              <span className="font-medium text-sm text-white truncate">{player.name}</span>
              <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                {player.id === myPlayerId &&
                  <span className="text-[10px] text-white/30">vous</span>}
                {player.id === room.hostId &&
                  <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full font-semibold">
                    Hôte
                  </span>}
                {isHost && player.id !== myPlayerId && (
                  <button
                    onClick={() => socket.emit('kick_player', { targetPlayerId: player.id })}
                    title="Exclure ce joueur"
                    className="w-5 h-5 flex items-center justify-center rounded-full bg-red-500/15 hover:bg-red-500/35 text-red-400 hover:text-red-300 transition-colors text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Slots vides */}
          {Array.from({ length: Math.max(0, 2 - room.players.length) }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 opacity-30">
              <div className="w-4 h-4 rounded-full border-2 border-dashed border-white/30" />
              <span className="text-sm text-white/30 italic">En attente…</span>
            </div>
          ))}
        </div>
      </div>

      {isHost ? (
        <button
          onClick={() => socket.emit('start_game')}
          disabled={!canStart}
          className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 disabled:opacity-30 py-4 rounded-2xl font-bold text-lg transition-all active:scale-98 shadow-lg shadow-emerald-600/20"
        >
          {canStart ? 'Lancer la partie →' : `Attendez encore ${2 - room.players.length} joueur(s)`}
        </button>
      ) : (
        <div className="text-center text-white/30 text-sm py-4">
          En attente que l'hôte lance la partie…
        </div>
      )}
    </div>
  )
}
