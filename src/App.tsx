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
  const { room, myPlayerId, myName, myColor, setRoom, setMyPlayerId } = useRoomStore()
  const { gameState, setGameState } = useGameStore()
  const [screen, setScreen] = useState<Screen>('home')
  const [error, setError] = useState('')
  const [connected, setConnected] = useState(socket.connected)

  useEffect(() => {
    function onConnect() { setConnected(true) }
    function onDisconnect() { setConnected(false) }

    function onRoomCreated() {
      setScreen('waiting')
    }

    function onRoomUpdated(data: { room: typeof room }) {
      setRoom(data.room!)
      setScreen('waiting')
    }

    function onGameStarted(data: { gameState: NonNullable<typeof gameState> }) {
      setGameState(data.gameState)
      setScreen('playing')
    }

    function onStateUpdate(data: { gameState: NonNullable<typeof gameState> }) {
      setGameState(data.gameState)
    }

    function onError({ message }: { message: string }) {
      setError(message)
      setTimeout(() => setError(''), 4000)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('room_created', onRoomCreated)
    socket.on('room_updated', onRoomUpdated as never)
    socket.on('game_started', onGameStarted as never)
    socket.on('state_update', onStateUpdate as never)
    socket.on('error', onError as never)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('room_created', onRoomCreated)
      socket.off('room_updated', onRoomUpdated as never)
      socket.off('game_started', onGameStarted as never)
      socket.off('state_update', onStateUpdate as never)
      socket.off('error', onError as never)
    }
  }, [socket, setRoom, setGameState])

  // Résoudre le playerId dès que la room est disponible
  useEffect(() => {
    if (room && myName && !myPlayerId) {
      const me = room.players.find(p => p.name === myName && p.color === myColor)
      if (me) setMyPlayerId(me.id)
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
        <div className="text-center mb-8">
          <h1 className="text-5xl font-extrabold text-white mb-1">🎩 Monopoly</h1>
          <p className="text-gray-400 text-sm">Open-source • Multijoueur • En ligne</p>
          <div className={`mt-2 text-xs inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${connected ? 'text-green-400' : 'text-red-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
            {connected ? 'Connecté au serveur' : 'Connexion au serveur…'}
          </div>
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
              disabled={!connected}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 py-4 rounded-xl font-bold text-xl transition-colors"
            >
              Créer une partie
            </button>
            <button
              onClick={() => setScreen('join')}
              disabled={!connected}
              className="w-full bg-gray-700 hover:bg-gray-600 disabled:opacity-40 py-4 rounded-xl font-bold text-xl transition-colors"
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
