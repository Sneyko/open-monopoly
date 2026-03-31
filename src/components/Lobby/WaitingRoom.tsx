import React from 'react'
import type { RoomInfo } from '../../../shared/types'
import { useSocket } from '../../hooks/useSocket'

const COLOR_HEX: Record<string, string> = {
  red: '#E24B4A', blue: '#378ADD', green: '#639922',
  yellow: '#EF9F27', purple: '#7F77DD', orange: '#D85A30',
}

interface WaitingRoomProps {
  room: RoomInfo
  myPlayerId: string | null
}

export default function WaitingRoom({ room, myPlayerId }: WaitingRoomProps) {
  const socket = useSocket()
  const isHost = room.hostId === myPlayerId

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center mb-2">Salle d'attente</h2>

      <div className="text-center mb-6">
        <div className="text-sm text-gray-400 mb-1">Code de la partie</div>
        <div className="text-4xl font-mono font-bold tracking-widest text-yellow-300 bg-gray-800 inline-block px-6 py-2 rounded-lg">
          {room.code}
        </div>
        <div className="text-xs text-gray-500 mt-1">Partagez ce code avec vos amis</div>
      </div>

      <div className="bg-gray-800 rounded-xl p-4 mb-6">
        <div className="text-sm text-gray-400 mb-3">
          Joueurs ({room.players.length}/6)
        </div>
        <div className="space-y-2">
          {room.players.map(player => (
            <div key={player.id} className="flex items-center gap-3">
              <div
                className="w-5 h-5 rounded-full border-2 border-white/30"
                style={{ backgroundColor: COLOR_HEX[player.color] ?? '#888' }}
              />
              <span className="font-medium">{player.name}</span>
              {player.id === room.hostId && (
                <span className="ml-auto text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded">Hôte</span>
              )}
              {player.id === myPlayerId && player.id !== room.hostId && (
                <span className="ml-auto text-xs text-gray-400">(vous)</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {isHost ? (
        <button
          onClick={() => socket.emit('start_game')}
          disabled={room.players.length < 2}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-40 py-4 rounded-xl font-bold text-xl transition-colors"
        >
          Lancer la partie
        </button>
      ) : (
        <div className="text-center text-gray-400 py-4">
          En attente du lancement par l'hôte…
        </div>
      )}
    </div>
  )
}
