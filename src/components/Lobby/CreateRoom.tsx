import React, { useState } from 'react'
import type { PlayerColor } from '../../../shared/types'
import { useSocket } from '../../hooks/useSocket'
import { useRoomStore } from '../../store/roomStore'

const COLORS: PlayerColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange']
const COLOR_LABELS: Record<PlayerColor, string> = {
  red: 'Rouge', blue: 'Bleu', green: 'Vert',
  yellow: 'Jaune', purple: 'Violet', orange: 'Orange',
}
const COLOR_HEX: Record<PlayerColor, string> = {
  red: '#E24B4A', blue: '#378ADD', green: '#639922',
  yellow: '#EF9F27', purple: '#7F77DD', orange: '#D85A30',
}

export default function CreateRoom() {
  const socket = useSocket()
  const { setMyName, setMyColor } = useRoomStore()
  const [name, setName] = useState('')
  const [color, setColor] = useState<PlayerColor>('red')

  function handleCreate() {
    if (!name.trim()) return
    setMyName(name.trim())
    setMyColor(color)
    socket.emit('create_room', { playerName: name.trim(), color })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-center">Créer une partie</h2>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Votre nom</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          maxLength={20}
          className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Entrez votre nom…"
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
              title={COLOR_LABELS[c]}
            />
          ))}
        </div>
      </div>

      <button
        onClick={handleCreate}
        disabled={!name.trim()}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 py-3 rounded-lg font-bold text-lg transition-colors"
      >
        Créer la partie
      </button>
    </div>
  )
}
