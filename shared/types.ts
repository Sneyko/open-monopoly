// ─── Types partagés client/serveur ────────────────────────────────────────────

export type PlayerColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange'

export type GamePhase = 'lobby' | 'playing' | 'ended'

export interface Player {
  id: string
  name: string
  color: PlayerColor
  position: number       // 0–39
  money: number
  inJail: boolean
  jailTurns: number
  isBankrupt: boolean
  getOutOfJailCards: number
  isConnected: boolean
}

export interface Property {
  id: number            // index de la case (0–39)
  ownerId?: string
  houses: number        // 0–4
  hotel: boolean
  mortgaged: boolean
}

export type CardDeck = 'chance' | 'community'

export interface Card {
  id: string
  text: string
  image: string   // nom du fichier SVG, ex: 'c1.svg'
  action: CardAction
}

export type CardAction =
  | { type: 'move_to'; position: number; collectSalary: boolean }
  | { type: 'move_relative'; steps: number }
  | { type: 'move_to_nearest'; cellType: 'railroad' | 'utility' }
  | { type: 'pay'; amount: number }
  | { type: 'receive'; amount: number }
  | { type: 'pay_per_building'; houseAmount: number; hotelAmount: number }
  | { type: 'receive_per_player'; amount: number }
  | { type: 'go_to_jail' }
  | { type: 'get_out_of_jail' }
  | { type: 'go_back'; steps: number }

export interface GameEvent {
  id: string
  timestamp: number
  message: string
  playerId?: string
}

export interface TradeOffer {
  id: string
  fromPlayerId: string
  toPlayerId: string
  offer: {
    money: number
    propertyIds: number[]
    getOutOfJailCards: number
  }
  request: {
    money: number
    propertyIds: number[]
    getOutOfJailCards: number
  }
}

export interface GameState {
  phase: GamePhase
  turn: number
  currentPlayerId: string
  players: Player[]
  properties: Property[]
  deck: {
    chance: Card[]
    community: Card[]
  }
  log: GameEvent[]
  lastCard?: { deck: 'chance' | 'community'; text: string; image: string }
  lastDice?: [number, number]
  doublesCount: number
  pendingTrade?: TradeOffer
  freeParkingPot: number
  auctionState?: AuctionState
}

export interface AuctionState {
  propertyId: number
  currentBid: number
  currentBidderId: string
  participants: string[]
}

export interface RoomInfo {
  code: string
  hostId: string
  players: Array<{ id: string; name: string; color: PlayerColor; isReady: boolean }>
  phase: GamePhase
}

// ─── Événements Socket.IO ─────────────────────────────────────────────────────

export interface ServerToClientEvents {
  room_created: (data: { code: string }) => void
  room_updated: (data: { room: RoomInfo }) => void
  game_started: (data: { gameState: GameState }) => void
  state_update: (data: { gameState: GameState }) => void
  player_disconnected: (data: { playerId: string; playerName: string }) => void
  player_kicked: (data: { playerId: string; playerName: string }) => void
  game_over: (data: { winnerId: string; winnerName: string }) => void
  error: (data: { message: string }) => void
  auction_update: (data: { auction: AuctionState }) => void
}

export interface ClientToServerEvents {
  create_room: (data: { playerName: string; color: PlayerColor }) => void
  join_room: (data: { code: string; playerName: string; color: PlayerColor }) => void
  start_game: () => void
  roll_dice: () => void
  buy_property: () => void
  decline_property: () => void
  mortgage_property: (data: { propertyId: number }) => void
  unmortgage_property: (data: { propertyId: number }) => void
  build_house: (data: { propertyId: number }) => void
  sell_house: (data: { propertyId: number }) => void
  propose_trade: (data: { offer: TradeOffer }) => void
  accept_trade: (data: { tradeId: string }) => void
  refuse_trade: (data: { tradeId: string }) => void
  declare_bankruptcy: () => void
  end_turn: () => void
  pay_jail_fine: () => void
  use_get_out_of_jail_card: () => void
  auction_bid: (data: { amount: number }) => void
  auction_pass: () => void
  kick_player: (data: { targetPlayerId: string }) => void
}

