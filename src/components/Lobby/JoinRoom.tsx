import React, { useState } from 'react'
import type { PlayerColor } from '../../../shared/types'
import { useSocket } from '../../hooks/useSocket'
import { useRoomStore } from '../../store/roomStore'

const COLORS: PlayerColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange']
const COLOR_HEX: Record<PlayerColor, string> = {
  red: '#E24B4A', blue: '#378ADD', green: '#639922',
  yellow: '#EF9F27', purple: '#7F77DD', orange: '#D85A30',
}

export default function JoinRoom() {
  const socket = useSocket()
  const { setMyName, setMyColor } = useRoomStore()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [color, setColor] = useState<PlayerColor>('blue')
  const [error, setError] = useState('')

  function handleJoin() {
    if (!name.trim() || !code.trim()) return
    setMyName(name.trim())
    setMyColor(color)
    setError('')
    socket.emit('join_room', { code: code.toUpperCase(), playerName: name.trim(), color })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-center">Rejoindre une partie</h2>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Code de la partie</label>
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          maxLength={6}
          className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white font-mono text-xl text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="ABC123"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Votre nom</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleJoin()}
          maxLength={20}
          className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Entrez votre nom..."
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Couleur du pion</label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-10 h-10 rounded-full border-4 transition-all ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: COLOR_HEX[c] }}
            />
          ))}
        </div>
      </div>

      {error && <div className="text-red-400 text-sm text-center">{error}</div>}

      <button
        onClick={handleJoin}
        disabled={!name.trim() || code.length < 4}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-40 py-3 rounded-lg font-bold text-lg transition-colors"
      >
        Rejoindre
      </button>
    </div>
  )
}
