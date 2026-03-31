import type { GameState, Player, PlayerColor } from '../shared/types'

export interface Room {
  code: string
  hostId: string
  players: RoomPlayer[]
  phase: 'lobby' | 'playing' | 'ended'
  gameState?: GameState
  lastActivity: number
}

export interface RoomPlayer {
  id: string
  socketId: string
  name: string
  color: PlayerColor
  isReady: boolean
  isConnected: boolean
}
