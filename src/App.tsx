import React, { useEffect, useState } from 'react'
import { useSocket } from './hooks/useSocket'
import { useRoomStore } from './store/roomStore'
import { useGameStore } from './store/gameStore'
import CreateRoom from './components/Lobby/CreateRoom'
import JoinRoom from './components/Lobby/JoinRoom'
import WaitingRoom from './components/Lobby/WaitingRoom'
import GameView from './components/GameView'
import logoSrc from './assets/logo.svg'

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
    function onRoomCreated() { setScreen('waiting') }
    function onRoomUpdated(data: { room: typeof room }) {
      setRoom(data.room!)
      setScreen('waiting')
    }
    function onGameStarted(data: { gameState: NonNullable<typeof gameState> }) {
      setGameState(data.gameState, myPlayerId)
      setScreen('playing')
    }
    function onStateUpdate(data: { gameState: NonNullable<typeof gameState> }) {
      setGameState(data.gameState, myPlayerId)
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
  }, [socket, setRoom, setGameState, myPlayerId])

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
      <div className="h-screen flex items-center justify-center p-4 bg-[#0f1117]">
        <WaitingRoom room={room} myPlayerId={myPlayerId} />
      </div>
    )
  }

  return (
    <div className="h-screen flex items-center justify-center p-4 bg-[#0f1117]">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <img src={logoSrc} alt="Logo Puceaupoly" className="w-36 h-36 mx-auto mb-4 select-none" />
          <p className="text-white/30 text-sm">Open-source · Multijoueur · En ligne</p>
          <div className={`mt-3 text-xs inline-flex items-center gap-1.5 px-3 py-1 rounded-full border
            ${connected
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-red-500/30 bg-red-500/10 text-red-400'
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400'}`} />
            {connected ? 'Serveur connecté' : 'Connexion en cours…'}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3 mb-4 text-red-300 text-sm text-center fade-in-up">
            {error}
          </div>
        )}

        {screen === 'home' && (
          <div className="space-y-3 fade-in-up">
            <button
              onClick={() => setScreen('create')}
              disabled={!connected}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-30 py-4 rounded-2xl font-bold text-lg transition-all active:scale-98 shadow-lg shadow-blue-600/20"
            >
              Créer une partie
            </button>
            <button
              onClick={() => setScreen('join')}
              disabled={!connected}
              className="w-full bg-white/8 hover:bg-white/12 disabled:opacity-30 border border-white/10 py-4 rounded-2xl font-bold text-lg transition-all active:scale-98"
            >
              Rejoindre une partie
            </button>
          </div>
        )}

        {(screen === 'create' || screen === 'join') && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 fade-in-up">
            <button onClick={() => setScreen('home')}
              className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm mb-5 transition-colors">
              ← Retour
            </button>
            {screen === 'create' ? <CreateRoom /> : <JoinRoom />}
          </div>
        )}
      </div>
    </div>
  )
}
