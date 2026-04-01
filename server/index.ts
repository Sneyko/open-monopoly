import express from 'express'
import http from 'http'
import path from 'path'
import { Server } from 'socket.io'
import { nanoid } from 'nanoid'
import type { ServerToClientEvents, ClientToServerEvents, PlayerColor, TradeOffer } from '../shared/types'
import {
  createRoom, getRoom, joinRoom, setPlayerDisconnected, updateRoom, roomToInfo, kickPlayer,
} from './rooms'

import { EVENTS } from './events'
import * as engine from './gameEngine'

const app = express()
const server = http.createServer(app)
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: { origin: '*' },
})

const PORT = process.env.PORT ?? 3001
const isProduction = process.env.NODE_ENV === 'production'
const clientDistPath = path.resolve(__dirname, '../../../dist')

app.get('/health', (_req, res) => res.json({ ok: true }))

if (isProduction) {
  app.use(express.static(clientDistPath))

  app.get(/^\/(?!api(?:\/|$)|socket\.io(?:\/|$)).*/, (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'))
  })
}

io.on('connection', (socket) => {
  let currentPlayerId: string | null = null
  let currentRoomCode: string | null = null

  // ─── Lobby ───────────────────────────────────────────────────────────────

  socket.on(EVENTS.CREATE_ROOM, ({ playerName, color }: { playerName: string; color: PlayerColor }) => {
    currentPlayerId = nanoid()
    const room = createRoom(currentPlayerId, socket.id, playerName, color)
    currentRoomCode = room.code
    socket.join(room.code)
    socket.emit(EVENTS.ROOM_CREATED, { code: room.code })
    io.to(room.code).emit(EVENTS.ROOM_UPDATED, { room: roomToInfo(room) })
  })

  socket.on(EVENTS.JOIN_ROOM, ({ code, playerName, color }: { code: string; playerName: string; color: PlayerColor }) => {
    currentPlayerId = nanoid()
    const result = joinRoom(code, currentPlayerId, socket.id, playerName, color)
    if (!result.success) {
      socket.emit(EVENTS.ERROR, { message: result.error })
      return
    }
    currentRoomCode = result.room.code
    socket.join(result.room.code)
    io.to(result.room.code).emit(EVENTS.ROOM_UPDATED, { room: roomToInfo(result.room) })
  })

  socket.on(EVENTS.START_GAME, () => {
    if (!currentPlayerId || !currentRoomCode) return
    const room = getRoom(currentRoomCode)
    if (!room) { socket.emit(EVENTS.ERROR, { message: 'Salle introuvable.' }); return }
    if (room.hostId !== currentPlayerId) { socket.emit(EVENTS.ERROR, { message: 'Seul l\'hôte peut lancer la partie.' }); return }
    if (room.players.length < 2) { socket.emit(EVENTS.ERROR, { message: 'Il faut au moins 2 joueurs.' }); return }

    const gameState = engine.initGame(room.players)
    room.gameState = gameState
    room.phase = 'playing'
    updateRoom(room)

    io.to(room.code).emit(EVENTS.GAME_STARTED, { gameState })
  })

  // ─── Actions de jeu ──────────────────────────────────────────────────────

  function withGame(handler: (state: ReturnType<typeof engine.initGame>) => void) {
    if (!currentPlayerId || !currentRoomCode) return
    const room = getRoom(currentRoomCode)
    if (!room?.gameState) { socket.emit(EVENTS.ERROR, { message: 'Partie introuvable.' }); return }
    handler(room.gameState)
  }

  function applyResult(result: { success: boolean; error?: string; state: ReturnType<typeof engine.initGame> }) {
    if (!currentRoomCode) return
    if (!result.success) { socket.emit(EVENTS.ERROR, { message: result.error ?? 'Erreur inconnue.' }); return }

    const room = getRoom(currentRoomCode)
    if (!room) return
    room.gameState = result.state
    updateRoom(room)

    if (result.state.phase === 'ended') {
      const winner = result.state.players.find(p => !p.isBankrupt)
      io.to(currentRoomCode).emit(EVENTS.GAME_OVER, {
        winnerId: winner?.id ?? '',
        winnerName: winner?.name ?? '',
      })
    } else {
      io.to(currentRoomCode).emit(EVENTS.STATE_UPDATE, { gameState: result.state })
    }

    if (result.state.auctionState) {
      io.to(currentRoomCode).emit(EVENTS.AUCTION_UPDATE, { auction: result.state.auctionState })
    }
  }

  socket.on(EVENTS.ROLL_DICE, () => {
    withGame(state => {
      applyResult(engine.rollDice(state, currentPlayerId!))
    })
  })

  socket.on(EVENTS.BUY_PROPERTY, () => {
    withGame(state => {
      applyResult(engine.buyProperty(state, currentPlayerId!))
    })
  })

  socket.on(EVENTS.DECLINE_PROPERTY, () => {
    withGame(state => {
      applyResult(engine.declineProperty(state, currentPlayerId!))
    })
  })

  socket.on(EVENTS.MORTGAGE_PROPERTY, ({ propertyId }: { propertyId: number }) => {
    withGame(state => {
      applyResult(engine.mortgageProperty(state, currentPlayerId!, propertyId))
    })
  })

  socket.on(EVENTS.UNMORTGAGE_PROPERTY, ({ propertyId }: { propertyId: number }) => {
    withGame(state => {
      applyResult(engine.unmortgageProperty(state, currentPlayerId!, propertyId))
    })
  })

  socket.on(EVENTS.BUILD_HOUSE, ({ propertyId }: { propertyId: number }) => {
    withGame(state => {
      applyResult(engine.buildHouse(state, currentPlayerId!, propertyId))
    })
  })

  socket.on(EVENTS.SELL_HOUSE, ({ propertyId }: { propertyId: number }) => {
    withGame(state => {
      applyResult(engine.sellHouse(state, currentPlayerId!, propertyId))
    })
  })

  socket.on(EVENTS.PROPOSE_TRADE, ({ offer }: { offer: TradeOffer }) => {
    withGame(state => {
      applyResult(engine.proposeTrade(state, currentPlayerId!, offer))
    })
  })

  socket.on(EVENTS.ACCEPT_TRADE, ({ tradeId }: { tradeId: string }) => {
    withGame(state => {
      applyResult(engine.acceptTrade(state, currentPlayerId!, tradeId))
    })
  })

  socket.on(EVENTS.REFUSE_TRADE, ({ tradeId }: { tradeId: string }) => {
    withGame(state => {
      applyResult(engine.refuseTrade(state, currentPlayerId!, tradeId))
    })
  })

  socket.on(EVENTS.PAY_JAIL_FINE, () => {
    withGame(state => {
      applyResult(engine.payJailFine(state, currentPlayerId!))
    })
  })

  socket.on(EVENTS.USE_GET_OUT_OF_JAIL_CARD, () => {
    withGame(state => {
      applyResult(engine.useGetOutOfJailCard(state, currentPlayerId!))
    })
  })

  socket.on(EVENTS.END_TURN, () => {
    withGame(state => {
      applyResult(engine.endTurn(state, currentPlayerId!))
    })
  })

  socket.on(EVENTS.DECLARE_BANKRUPTCY, () => {
    withGame(state => {
      applyResult(engine.bankruptcyAction(state, currentPlayerId!))
    })
  })

  socket.on(EVENTS.AUCTION_BID, ({ amount }: { amount: number }) => {
    withGame(state => {
      applyResult(engine.auctionBid(state, currentPlayerId!, amount))
    })
  })

  socket.on(EVENTS.AUCTION_PASS, () => {
    withGame(state => {
      applyResult(engine.auctionPass(state, currentPlayerId!))
    })
  })

  socket.on(EVENTS.CHOOSE_PARKING_BOOST, ({ propertyId }: { propertyId: number }) => {
    withGame(state => {
      applyResult(engine.chooseParkingBoost(state, currentPlayerId!, propertyId))
    })
  })

  socket.on(EVENTS.DECLINE_PARKING_BOOST, () => {
    withGame(state => {
      applyResult(engine.declineParkingBoost(state, currentPlayerId!))
    })
  })

  // ─── Déconnexion ─────────────────────────────────────────────────────────

  socket.on(EVENTS.KICK_PLAYER, ({ targetPlayerId }: { targetPlayerId: string }) => {
    if (!currentPlayerId || !currentRoomCode) return
    const result = kickPlayer(currentRoomCode, currentPlayerId, targetPlayerId)
    if (!result.success) { socket.emit(EVENTS.ERROR, { message: result.error }); return }

    const { room, kicked } = result
    updateRoom(room)

    // Notifier + déconnecter le joueur exclu
    const kickedSocket = io.sockets.sockets.get(kicked.socketId)
    if (kickedSocket) {
      kickedSocket.emit(EVENTS.ERROR, { message: 'Vous avez été exclu de la partie.' })
      kickedSocket.leave(room.code)
    }
    io.to(room.code).emit(EVENTS.PLAYER_KICKED, { playerId: kicked.id, playerName: kicked.name })

    if (room.phase === 'lobby') {
      io.to(room.code).emit(EVENTS.ROOM_UPDATED, { room: roomToInfo(room) })
    } else if (room.gameState) {
      io.to(room.code).emit(EVENTS.STATE_UPDATE, { gameState: room.gameState })
    }
  })

  socket.on('disconnect', () => {
    const result = setPlayerDisconnected(socket.id)
    if (!result) return
    const { room, playerId } = result
    const player = room.players.find(p => p.id === playerId)
    if (!player) return

    io.to(room.code).emit(EVENTS.PLAYER_DISCONNECTED, {
      playerId,
      playerName: player.name,
    })

    if (room.gameState) {
      io.to(room.code).emit(EVENTS.STATE_UPDATE, { gameState: room.gameState })
    } else {
      io.to(room.code).emit(EVENTS.ROOM_UPDATED, { room: roomToInfo(room) })
    }
  })
})

server.listen(PORT, () => {
  console.log('Serveur Monopoly démarré sur le port ' + PORT)
})
