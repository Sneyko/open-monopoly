import type { Room, RoomPlayer } from './types'
import type { PlayerColor, RoomInfo } from '../shared/types'

export function roomToInfo(room: Room): RoomInfo {
  return {
    code: room.code,
    hostId: room.hostId,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      color: p.color,
      isReady: p.isReady,
    })),
    phase: room.phase,
  }
}

const rooms = new Map<string, Room>()
const ROOM_TTL_MS = 24 * 60 * 60 * 1000 // 24h

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export function createRoom(playerId: string, socketId: string, playerName: string, color: PlayerColor): Room {
  let code: string
  do {
    code = generateCode()
  } while (rooms.has(code))

  const player: RoomPlayer = {
    id: playerId,
    socketId,
    name: playerName,
    color,
    isReady: false,
    isConnected: true,
  }

  const room: Room = {
    code,
    hostId: playerId,
    players: [player],
    phase: 'lobby',
    lastActivity: Date.now(),
  }

  rooms.set(code, room)
  return room
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code.toUpperCase())
}

export function getRoomByPlayerId(playerId: string): Room | undefined {
  for (const room of rooms.values()) {
    if (room.players.some(p => p.id === playerId)) return room
  }
  return undefined
}

export function getRoomBySocketId(socketId: string): Room | undefined {
  for (const room of rooms.values()) {
    if (room.players.some(p => p.socketId === socketId)) return room
  }
  return undefined
}

export function joinRoom(
  code: string,
  playerId: string,
  socketId: string,
  playerName: string,
  color: PlayerColor,
): { success: true; room: Room } | { success: false; error: string } {
  const room = rooms.get(code.toUpperCase())
  if (!room) return { success: false, error: 'Salle introuvable.' }
  if (room.phase !== 'lobby') return { success: false, error: 'La partie a déjà commencé.' }
  if (room.players.length >= 6) return { success: false, error: 'La salle est pleine (6 joueurs max).' }
  if (room.players.some(p => p.name === playerName)) {
    return { success: false, error: 'Ce nom est déjà pris dans cette salle.' }
  }

  const player: RoomPlayer = {
    id: playerId,
    socketId,
    name: playerName,
    color,
    isReady: false,
    isConnected: true,
  }

  room.players.push(player)
  room.lastActivity = Date.now()
  return { success: true, room }
}

export function setPlayerDisconnected(socketId: string): { room: Room; playerId: string } | null {
  const room = getRoomBySocketId(socketId)
  if (!room) return null
  const player = room.players.find(p => p.socketId === socketId)
  if (!player) return null
  player.isConnected = false
  if (room.gameState) {
    const gs = room.gameState
    const gp = gs.players.find(p => p.id === player.id)
    if (gp) gp.isConnected = false
  }
  return { room, playerId: player.id }
}

export function reconnectPlayer(
  code: string,
  playerId: string,
  newSocketId: string,
): Room | null {
  const room = rooms.get(code.toUpperCase())
  if (!room) return null
  const player = room.players.find(p => p.id === playerId)
  if (!player) return null
  player.socketId = newSocketId
  player.isConnected = true
  if (room.gameState) {
    const gp = room.gameState.players.find(p => p.id === playerId)
    if (gp) gp.isConnected = true
  }
  return room
}

export function updateRoom(room: Room): void {
  room.lastActivity = Date.now()
  rooms.set(room.code, room)
}

// Nettoyage des salles expirées
setInterval(() => {
  const now = Date.now()
  for (const [code, room] of rooms.entries()) {
    if (now - room.lastActivity > ROOM_TTL_MS) {
      rooms.delete(code)
    }
  }
}, 60 * 60 * 1000)
