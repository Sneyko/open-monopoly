import React, { useEffect, useState } from 'react'
import { useSocket } from './hooks/useSocket'
import { useRoomStore } from './store/roomStore'
import { useGameStore } from './store/gameStore'
import CreateRoom from './components/Lobby/CreateRoom'
import JoinRoom from './components/Lobby/JoinRoom'
import WaitingRoom from './components/Lobby/WaitingRoom'
import GameView from './components/GameView'

type Screen = 'home' | 'create' | 'join' | 'waiting' | 'playing'

export default function App() {
  const socket = useSocket()
  const { room, myPlayerId, setRoom, setMyPlayerId } = useRoomStore()
  const { gameState, setGameState } = useGameStore()
  const [screen, setScreen] = useState<Screen>('home')
  const [error, setError] = useState('')

  useEffect(() => {
    socket.on('room_created', ({ code }) => {
      setScreen('waiting')
    })

    socket.on('room_updated', ({ room: roomInfo }) => {
      setRoom(roomInfo)
      // Identifier notre playerId à partir des joueurs
      // On le stocke dans la room mais pas encore dans myPlayerId
      // → on va chercher qui est nouveau à chaque update
      setScreen('waiting')
    })

    socket.on('game_started', ({ gameState: gs }) => {
      setGameState(gs)
      setScreen('playing')
    })

    socket.on('state_update', ({ gameState: gs }) => {
      setGameState(gs)
    })

    socket.on('game_over', ({ winnerId, winnerName }) => {
      // GameView affiche le résultat
    })

    socket.on('error', ({ message }) => {
      setError(message)
      setTimeout(() => setError(''), 4000)
    })

    return () => {
      socket.off('room_created')
      socket.off('room_updated')
      socket.off('game_started')
      socket.off('state_update')
      socket.off('game_over')
      socket.off('error')
    }
  }, [socket, setRoom, setGameState])

  // Déterminer le playerId en comparant le nom
  const { myName, myColor } = useRoomStore.getState()
  useEffect(() => {
    if (room && myName) {
      const me = room.players.find(p => p.name === myName && p.color === myColor)
      if (me && !myPlayerId) {
        setMyPlayerId(me.id)
      }
    }
  }, [room, myName, myColor, myPlayerId, setMyPlayerId])

  if (screen === 'playing' || gameState?.phase === 'playing' || gameState?.phase === 'ended') {
    return <GameView />
  }

  if (screen === 'waiting' && room) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <WaitingRoom room={room} myPlayerId={myPlayerId} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-extrabold text-white mb-1">
            🎩 Monopoly
          </h1>
          <p className="text-gray-400 text-sm">Open-source • Multijoueur • En ligne</p>
        </div>

        {error && (
          <div className="bg-red-900/80 border border-red-500 rounded-lg px-4 py-3 mb-4 text-red-200 text-sm text-center">
            {error}
          </div>
        )}

        {screen === 'home' && (
          <div className="space-y-4">
            <button
              onClick={() => setScreen('create')}
              className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-xl font-bold text-xl transition-colors"
            >
              Créer une partie
            </button>
            <button
              onClick={() => setScreen('join')}
              className="w-full bg-gray-700 hover:bg-gray-600 py-4 rounded-xl font-bold text-xl transition-colors"
            >
              Rejoindre une partie
            </button>
          </div>
        )}

        {screen === 'create' && (
          <div className="bg-gray-800 rounded-2xl p-6">
            <button onClick={() => setScreen('home')} className="text-gray-400 hover:text-white text-sm mb-4 block">
              ← Retour
            </button>
            <CreateRoom />
          </div>
        )}

        {screen === 'join' && (
          <div className="bg-gray-800 rounded-2xl p-6">
            <button onClick={() => setScreen('home')} className="text-gray-400 hover:text-white text-sm mb-4 block">
              ← Retour
            </button>
            <JoinRoom />
          </div>
        )}
      </div>
    </div>
  )
}
