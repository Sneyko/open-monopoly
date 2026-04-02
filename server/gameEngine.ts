/**
 * gameEngine.ts — Moteur de jeu Monopoly
 * Respecte RULES.md comme source de vérité.
 * Toutes les actions retournent { success, state, events } sans muter l'état en entrée.
 */

import type { GameState, Player, Property, Card, CardAction, GameEvent, TradeOffer } from '../shared/types'
import type { RoomPlayer } from './types'
import { nanoid } from 'nanoid'

// ─── Données des propriétés ───────────────────────────────────────────────────

interface CellDef {
  index: number
  name: string
  type: 'property' | 'railroad' | 'utility' | 'tax' | 'chance' | 'community' | 'go' | 'jail' | 'free-parking' | 'go-to-jail'
  colorGroup?: string
  price?: number
  rents?: number[]      // [base, 1h, 2h, 3h, 4h, hotel]
  rentRailroad?: number // base rent (×nb gares possédées)
  mortgage?: number
  houseCost?: number
  hotelCost?: number
  tax?: number
}

const CELLS: CellDef[] = [
  { index: 0,  name: 'Départ',                type: 'go' },
  { index: 1,  name: 'Reynerie',              type: 'property', colorGroup: 'brown',      price: 60,  rents: [2,10,30,90,160,250],     mortgage: 30,  houseCost: 50,  hotelCost: 50 },
  { index: 2,  name: 'Caisse IZLY',           type: 'community' },
  { index: 3,  name: 'Bellefontaine',         type: 'property', colorGroup: 'brown',      price: 60,  rents: [4,20,60,180,320,450],    mortgage: 30,  houseCost: 50,  hotelCost: 50 },
  { index: 4,  name: 'Gemini Mensuel',        type: 'tax', tax: 200 },
  { index: 5,  name: 'Nine',                  type: 'railroad', price: 200, rents: [25,50,100,200], mortgage: 100 },
  { index: 6,  name: 'Basso Cambo',           type: 'property', colorGroup: 'light-blue', price: 100, rents: [6,30,90,270,400,550],    mortgage: 50,  houseCost: 50,  hotelCost: 50 },
  { index: 7,  name: 'Chance',                type: 'chance' },
  { index: 8,  name: 'Mirail-Université',     type: 'property', colorGroup: 'light-blue', price: 100, rents: [6,30,90,270,400,550],    mortgage: 50,  houseCost: 50,  hotelCost: 50 },
  { index: 9,  name: 'Bagatelle',             type: 'property', colorGroup: 'light-blue', price: 120, rents: [8,40,100,300,450,600],   mortgage: 60,  houseCost: 50,  hotelCost: 50 },
  { index: 10, name: 'En TD / Simple Visite', type: 'jail' },
  { index: 11, name: 'Trois Cocus',           type: 'property', colorGroup: 'pink',       price: 140, rents: [10,50,150,450,625,750],  mortgage: 70,  houseCost: 100, hotelCost: 100 },
  { index: 12, name: 'Tisséo Pastel',         type: 'tax', tax: 150 },
  { index: 13, name: 'Faculté de Pharmacie',  type: 'property', colorGroup: 'pink',       price: 140, rents: [10,50,150,450,625,750],  mortgage: 70,  houseCost: 100, hotelCost: 100 },
  { index: 14, name: 'Borderouge',            type: 'property', colorGroup: 'pink',       price: 160, rents: [12,60,180,500,700,900],  mortgage: 80,  houseCost: 100, hotelCost: 100 },
  { index: 15, name: 'Café Pop',              type: 'railroad', price: 200, rents: [25,50,100,200], mortgage: 100 },
  { index: 16, name: 'Roseraie',              type: 'property', colorGroup: 'orange',     price: 180, rents: [14,70,200,550,750,950],  mortgage: 90,  houseCost: 100, hotelCost: 100 },
  { index: 17, name: 'Caisse IZLY',           type: 'community' },
  { index: 18, name: 'Jolimont',              type: 'property', colorGroup: 'orange',     price: 180, rents: [14,70,200,550,750,950],  mortgage: 90,  houseCost: 100, hotelCost: 100 },
  { index: 19, name: 'Marengo-SNCF',          type: 'property', colorGroup: 'orange',     price: 200, rents: [16,80,220,600,800,1000], mortgage: 100, houseCost: 100, hotelCost: 100 },
  { index: 20, name: 'Jardin Japonais',       type: 'free-parking' },
  { index: 21, name: "Patte d'Oie",           type: 'property', colorGroup: 'red',        price: 220, rents: [18,90,250,700,875,1050], mortgage: 110, houseCost: 150, hotelCost: 150 },
  { index: 22, name: 'Chance',                type: 'chance' },
  { index: 23, name: 'St-Cyprien',            type: 'property', colorGroup: 'red',        price: 220, rents: [18,90,250,700,875,1050], mortgage: 110, houseCost: 150, hotelCost: 150 },
  { index: 24, name: 'Arènes',                type: 'property', colorGroup: 'red',        price: 240, rents: [20,100,300,750,925,1100], mortgage: 120, houseCost: 150, hotelCost: 150 },
  { index: 25, name: "O'club",                type: 'railroad', price: 200, rents: [25,50,100,200], mortgage: 100 },
  { index: 26, name: "Jeanne d'Arc",          type: 'property', colorGroup: 'yellow',     price: 260, rents: [22,110,330,800,975,1150], mortgage: 130, houseCost: 150, hotelCost: 150 },
  { index: 27, name: 'Compans-Caffarelli',    type: 'property', colorGroup: 'yellow',     price: 260, rents: [22,110,330,800,975,1150], mortgage: 130, houseCost: 150, hotelCost: 150 },
  { index: 28, name: 'Facture Fibre',         type: 'tax', tax: 150 },
  { index: 29, name: 'Palais de Justice',     type: 'property', colorGroup: 'yellow',     price: 280, rents: [24,120,360,850,1025,1200], mortgage: 140, houseCost: 150, hotelCost: 150 },
  { index: 30, name: 'Allez en TD',           type: 'go-to-jail' },
  { index: 31, name: 'François-Verdier',      type: 'property', colorGroup: 'green',      price: 300, rents: [26,130,390,900,1100,1275], mortgage: 150, houseCost: 200, hotelCost: 200 },
  { index: 32, name: 'Esquirol',              type: 'property', colorGroup: 'green',      price: 300, rents: [26,130,390,900,1100,1275], mortgage: 150, houseCost: 200, hotelCost: 200 },
  { index: 33, name: 'Caisse IZLY',           type: 'community' },
  { index: 34, name: 'Carmes',                type: 'property', colorGroup: 'green',      price: 320, rents: [28,150,450,1000,1200,1400], mortgage: 160, houseCost: 200, hotelCost: 200 },
  { index: 35, name: 'Magma Club',            type: 'railroad', price: 200, rents: [25,50,100,200], mortgage: 100 },
  { index: 36, name: 'Chance',                type: 'chance' },
  { index: 37, name: 'Capitole',              type: 'property', colorGroup: 'dark-blue',  price: 350, rents: [35,175,500,1100,1300,1500], mortgage: 175, houseCost: 200, hotelCost: 200 },
  { index: 38, name: 'Frais de scolarité',    type: 'tax', tax: 100 },
  { index: 39, name: 'Jean-Jaurès',           type: 'property', colorGroup: 'dark-blue',  price: 400, rents: [50,200,600,1400,1700,2000], mortgage: 200, houseCost: 200, hotelCost: 200 },
]

const SALARY = 200           // 200 € en passant par GO
const STARTING_MONEY = 1500 // en centaines de francs → simplifié à 1500 pour l'interface
const JAIL_FINE = 200
const JAIL_POSITION = 10
const GO_TO_JAIL_POSITION = 30
const MORTGAGE_INTEREST = 0.1

// ─── Cartes Chance & Communauté ───────────────────────────────────────────────

function buildChanceDeck(): Card[] {
  const cards: Card[] = [
    { id: 'ch1', text: 'Départ immédiat : avancez jusqu\'à la case Départ. Recevez 200 €.', image: 'c1.svg', action: { type: 'move_to', position: 0, collectSalary: true } },
    { id: 'ch2', text: 'Mauvais itinéraire : reculez de 3 cases.', image: 'c2.svg', action: { type: 'go_back', steps: 3 } },
    { id: 'ch3', text: 'Correspondance express : rendez-vous à Jean-Jaurès. Si vous passez par Départ, recevez 200 €.', image: 'c3.svg', action: { type: 'move_to', position: 39, collectSalary: true } },
    { id: 'ch4', text: 'Soirée étudiante : allez au Nine. Si vous passez par Départ, recevez 200 €.', image: 'c4.svg', action: { type: 'move_to', position: 5, collectSalary: true } },
    { id: 'ch5', text: 'Success Story : Magnaud vous verse un dividende de 110010 (50 €).', image: 'c5.svg', action: { type: 'receive', amount: 50 } },
    { id: 'ch6', text: 'Contrôle Tisséo : fraude au métro Faculté de Pharmacie. Payez 15 €.', image: 'c6.svg', action: { type: 'pay', amount: 15 } },
  ]
  return shuffle(cards)
}

function buildCommunityDeck(): Card[] {
  const cards: Card[] = [
    { id: 'cc1', text: 'Erreur du CROUS en votre faveur. Recevez 200 €.', image: 'i1.svg', action: { type: 'receive', amount: 200 } },
    { id: 'cc2', text: 'Vous avez revendu vos anciens cours de BUT Info. Recevez 50 €.', image: 'i2.svg', action: { type: 'receive', amount: 50 } },
    { id: 'cc3', text: 'Remboursement partiel de votre CVEC. Recevez 100 €.', image: 'i3.svg', action: { type: 'receive', amount: 100 } },
    { id: 'cc4', text: 'Vous avez mangé au RU toute la semaine. Recevez 25 €.', image: 'i4.svg', action: { type: 'receive', amount: 25 } },
    { id: 'cc5', text: 'Frais d\'hospitalisation après une chute en VélôToulouse. Payez 100 €.', image: 'i5.svg', action: { type: 'pay', amount: 100 } },
    { id: 'cc6', text: 'Vous avez un justificatif d\'absence valide. Libéré de TD.', image: 'i6.svg', action: { type: 'get_out_of_jail' } },
    { id: 'cc7', text: 'Allez en TD. Ne passez pas par la case Départ.', image: 'i7.svg', action: { type: 'go_to_jail' } },
  ]
  return shuffle(cards)
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function rollDie(): number {
  return Math.floor(Math.random() * 6) + 1
}

function log(state: GameState, message: string, playerId?: string): GameState {
  const event: GameEvent = {
    id: nanoid(),
    timestamp: Date.now(),
    message,
    playerId,
  }
  return { ...state, log: [...state.log, event] }
}

function getCellDef(index: number): CellDef {
  return CELLS[index]
}

function getGroupCells(colorGroup: string): CellDef[] {
  return CELLS.filter(c => c.colorGroup === colorGroup && c.type === 'property')
}

function getRailroads(): CellDef[] {
  return CELLS.filter(c => c.type === 'railroad')
}

function getUtilities(): CellDef[] {
  return CELLS.filter(c => c.type === 'utility')
}

function ownsFullGroup(state: GameState, playerId: string, colorGroup: string): boolean {
  const group = getGroupCells(colorGroup)
  return group.every(c => {
    const prop = state.properties.find(p => p.id === c.index)
    return prop?.ownerId === playerId
  })
}

function countOwnedRailroads(state: GameState, playerId: string): number {
  return getRailroads().filter(c => {
    const prop = state.properties.find(p => p.id === c.index)
    return prop?.ownerId === playerId
  }).length
}

function countOwnedUtilities(state: GameState, playerId: string): number {
  return getUtilities().filter(c => {
    const prop = state.properties.find(p => p.id === c.index)
    return prop?.ownerId === playerId
  }).length
}

function calculateRent(state: GameState, landingPlayerId: string, propertyIndex: number, diceTotal?: number): number {
  const cell = getCellDef(propertyIndex)
  const prop = state.properties.find(p => p.id === propertyIndex)
  if (!prop || !prop.ownerId || prop.mortgaged) return 0
  if (prop.ownerId === landingPlayerId) return 0

  const ownerId = prop.ownerId

  if (cell.type === 'railroad') {
    const owned = countOwnedRailroads(state, ownerId)
    const baseRents = cell.rents ?? [25, 50, 100, 200]
    return baseRents[owned - 1] ?? 25
  }

  if (cell.type === 'utility') {
    const owned = countOwnedUtilities(state, ownerId)
    const multiplier = owned === 2 ? 10 : 4
    return (diceTotal ?? 7) * multiplier
  }

  if (cell.type === 'property' && cell.colorGroup && cell.rents) {
    let base: number
    if (prop.hotel) base = cell.rents[5]
    else if (prop.houses > 0) base = cell.rents[prop.houses]
    else if (ownsFullGroup(state, ownerId, cell.colorGroup)) base = cell.rents[0] * 2
    else base = cell.rents[0]

    // Boost Jardin Japonais ×3
    if (state.freeParkingBoost?.propertyId === propertyIndex && state.freeParkingBoost?.playerId === ownerId) {
      base = base * 3
    }
    return base
  }

  return 0
}

function transferMoney(
  state: GameState,
  fromId: string | 'bank',
  toId: string | 'bank',
  amount: number,
): GameState {
  if (amount <= 0) return state
  let players = state.players.map(p => ({ ...p }))

  if (fromId !== 'bank') {
    players = players.map(p => p.id === fromId ? { ...p, money: p.money - amount } : p)
  }
  if (toId !== 'bank') {
    players = players.map(p => p.id === toId ? { ...p, money: p.money + amount } : p)
  }
  return { ...state, players }
}

function movePlayer(
  state: GameState,
  playerId: string,
  newPosition: number,
  passedGo: boolean,
): GameState {
  let s = {
    ...state,
    players: state.players.map(p =>
      p.id === playerId ? { ...p, position: newPosition } : p
    ),
  }
  if (passedGo) {
    s = transferMoney(s, 'bank', playerId, SALARY)
    s = log(s, `${s.players.find(p => p.id === playerId)?.name} passe par la case Départ et reçoit ${SALARY} €.`, playerId)
  }
  return s
}

function goToJail(state: GameState, playerId: string): GameState {
  let s = {
    ...state,
    players: state.players.map(p =>
      p.id === playerId ? { ...p, position: JAIL_POSITION, inJail: true, jailTurns: 0 } : p
    ),
    doublesCount: 0,
  }
  const player = s.players.find(p => p.id === playerId)!
  s = log(s, `${player.name} est envoyé en TD !`, playerId)
  return s
}

function nextPlayer(state: GameState): GameState {
  const activePlayers = state.players.filter(p => !p.isBankrupt)
  if (activePlayers.length === 0) return state
  const currentIndex = activePlayers.findIndex(p => p.id === state.currentPlayerId)
  const nextIndex = (currentIndex + 1) % activePlayers.length
  return {
    ...state,
    currentPlayerId: activePlayers[nextIndex].id,
    doublesCount: 0,
    turn: state.turn + 1,
    lastDice: undefined,         // réinitialise pour que le prochain joueur puisse lancer
    awaitingParkingChoice: false, // toujours effacer entre les tours
    awaitingPropertyDecision: false,
  }
}

function lastRollWasDouble(state: GameState): boolean {
  return !!state.lastDice && state.lastDice[0] === state.lastDice[1]
}

function finishTurnAfterAction(state: GameState, keepTurnOnDouble: boolean): GameState {
  if (keepTurnOnDouble && lastRollWasDouble(state)) return state
  return nextPlayer(state)
}

function drawCard(state: GameState, deck: 'chance' | 'community'): { state: GameState; card: Card } {
  const deckCards = deck === 'chance' ? [...state.deck.chance] : [...state.deck.community]
  const card = deckCards.shift()!

  // Remettre la carte en bas sauf si c'est une carte sortie du TD
  if (card.action.type !== 'get_out_of_jail') {
    deckCards.push(card)
  }

  const newDeck = deck === 'chance'
    ? { ...state.deck, chance: deckCards }
    : { ...state.deck, community: deckCards }

  return { state: { ...state, deck: newDeck }, card }
}

function applyCardAction(
  state: GameState,
  playerId: string,
  action: CardAction,
  diceTotal: number,
): GameState {
  const player = state.players.find(p => p.id === playerId)!

  switch (action.type) {
    case 'move_to': {
      const passed = action.collectSalary && action.position <= player.position && action.position !== player.position
      return movePlayer(state, playerId, action.position, passed)
    }
    case 'go_back': {
      const newPos = (player.position - action.steps + 40) % 40
      return movePlayer(state, playerId, newPos, false)
    }
    case 'move_to_nearest': {
      const targets = action.cellType === 'railroad'
        ? [5, 15, 25, 35]
        : [12, 28]
      let nearest = targets[0]
      let minDist = 40
      for (const t of targets) {
        const dist = (t - player.position + 40) % 40
        if (dist < minDist) { minDist = dist; nearest = t }
      }
      const passed = nearest < player.position
      return movePlayer(state, playerId, nearest, passed)
    }
    case 'pay': {
      return transferMoney(state, playerId, 'bank', action.amount)
    }
    case 'receive': {
      return transferMoney(state, 'bank', playerId, action.amount)
    }
    case 'pay_per_building': {
      let total = 0
      for (const prop of state.properties) {
        if (prop.ownerId === playerId) {
          if (prop.hotel) total += action.hotelAmount
          else total += prop.houses * action.houseAmount
        }
      }
      return transferMoney(state, playerId, 'bank', total)
    }
    case 'receive_per_player': {
      let s = state
      const otherPlayers = state.players.filter(p => p.id !== playerId && !p.isBankrupt)
      for (const other of otherPlayers) {
        s = transferMoney(s, other.id, playerId, action.amount)
      }
      return s
    }
    case 'go_to_jail': {
      return goToJail(state, playerId)
    }
    case 'get_out_of_jail': {
      return {
        ...state,
        players: state.players.map(p =>
          p.id === playerId ? { ...p, getOutOfJailCards: p.getOutOfJailCards + 1 } : p
        ),
      }
    }
    default:
      return state
  }
}

function isMovementCardAction(action: CardAction): boolean {
  return (
    action.type === 'move_to' ||
    action.type === 'go_back' ||
    action.type === 'move_to_nearest' ||
    action.type === 'move_relative'
  )
}

function checkBankruptcy(state: GameState, playerId: string): GameState {
  const player = state.players.find(p => p.id === playerId)
  if (!player || player.money >= 0) return state

  // Vérifier si le joueur peut lever des hypothèques / vendre des maisons
  const canSell = state.properties.some(p =>
    p.ownerId === playerId && (p.houses > 0 || p.hotel)
  )
  if (canSell) return state // Le joueur doit vendre manuellement

  // Faillite automatique si impossible de récupérer de l'argent
  const hasAssets = state.properties.some(p => p.ownerId === playerId && !p.mortgaged)
  if (hasAssets) return state // Laisser le joueur gérer

  return declareBankruptcy(state, playerId, 'bank')
}

function declareBankruptcy(state: GameState, playerId: string, creditorId: string | 'bank'): GameState {
  const player = state.players.find(p => p.id === playerId)!
  let s: GameState = {
    ...state,
    players: state.players.map(p =>
      p.id === playerId ? { ...p, isBankrupt: true, money: 0 } : p
    ),
  }

  // Transférer propriétés au créancier ou à la banque pour enchères
  const playerProps = s.properties.filter(p => p.ownerId === playerId)

  if (creditorId !== 'bank') {
    // Vendre maisons/hôtels à la banque et transférer l'argent au créancier
    let houseProceeds = 0
    for (const prop of playerProps) {
      const cell = getCellDef(prop.id)
      if (prop.hotel && cell.houseCost) houseProceeds += cell.houseCost * 2.5
      else if (prop.houses > 0 && cell.houseCost) houseProceeds += prop.houses * (cell.houseCost / 2)
    }
    s = transferMoney(s, 'bank', creditorId, houseProceeds + Math.max(0, player.money))
    s = {
      ...s,
      properties: s.properties.map(p =>
        p.ownerId === playerId
          ? { ...p, ownerId: creditorId, houses: 0, hotel: false }
          : p
      ),
    }
  } else {
    // Remettre les propriétés en vente (enchères gérées par le serveur)
    s = {
      ...s,
      properties: s.properties.map(p =>
        p.ownerId === playerId
          ? { ...p, ownerId: undefined, houses: 0, hotel: false, mortgaged: false }
          : p
      ),
    }
  }

  s = log(s, `${player.name} est en faillite !`, playerId)

  // Vérifier si la partie est terminée
  const activePlayers = s.players.filter(p => !p.isBankrupt)
  if (activePlayers.length === 1) {
    s = { ...s, phase: 'ended' }
    s = log(s, `${activePlayers[0].name} remporte la partie !`, activePlayers[0].id)
  } else if (s.currentPlayerId === playerId) {
    s = nextPlayer(s)
  }

  return s
}

// ─── API publique ─────────────────────────────────────────────────────────────

export function initGame(roomPlayers: RoomPlayer[]): GameState {
  const players: Player[] = roomPlayers.map(rp => ({
    id: rp.id,
    name: rp.name,
    color: rp.color,
    position: 0,
    money: STARTING_MONEY,
    inJail: false,
    jailTurns: 0,
    isBankrupt: false,
    getOutOfJailCards: 0,
    isConnected: rp.isConnected,
  }))

  // Déterminer l'ordre de jeu : le joueur avec le plus haut dé commence
  const shuffled = shuffle(players)

  const properties: Property[] = CELLS
    .filter(c => ['property', 'railroad', 'utility'].includes(c.type))
    .map(c => ({
      id: c.index,
      ownerId: undefined,
      houses: 0,
      hotel: false,
      mortgaged: false,
    }))

  const state: GameState = {
    phase: 'playing',
    turn: 1,
    currentPlayerId: shuffled[0].id,
    players: shuffled,
    properties,
    deck: {
      chance: buildChanceDeck(),
      community: buildCommunityDeck(),
    },
    log: [],
    doublesCount: 0,
    freeParkingPot: 0,
  }

  return log(state, `La partie commence ! C'est au tour de ${shuffled[0].name}.`)
}

export function rollDice(
  state: GameState,
  playerId: string,
): { success: boolean; error?: string; state: GameState } {
  if (state.phase !== 'playing') return { success: false, error: 'La partie n\'est pas en cours.', state }
  if (state.currentPlayerId !== playerId) return { success: false, error: 'Ce n\'est pas votre tour.', state }

  let s: GameState = state
  if (s.auctionState) {
    s = { ...s, auctionState: undefined }
    s = log(s, 'Enchère annulée automatiquement pour débloquer la partie.')
  }

  if (s.awaitingParkingChoice) return { success: false, error: 'Vous devez d\'abord faire votre choix au Jardin Japonais.', state: s }
  if (s.awaitingPropertyDecision) return { success: false, error: 'Vous devez d\'abord acheter ou refuser la propriété.', state: s }
  if (s.lastDice && !lastRollWasDouble(s)) {
    return { success: false, error: 'Vous avez déjà lancé les dés ce tour-ci.', state: s }
  }

  const die1 = rollDie()
  const die2 = rollDie()
  const total = die1 + die2
  const isDouble = die1 === die2

  const player = s.players.find(p => p.id === playerId)!
  s = { ...s, lastDice: [die1, die2] }

  s = log(s, `${player.name} lance les dés : ${die1} + ${die2} = ${total}${isDouble ? ' (double !)' : ''}.`, playerId)

  // Gestion du TD
  if (player.inJail) {
    if (isDouble) {
      const newDoubles = s.doublesCount + 1
      s = {
        ...s,
        players: s.players.map(p =>
          p.id === playerId ? { ...p, inJail: false, jailTurns: 0 } : p
        ),
        doublesCount: newDoubles,
      }
      s = log(s, `${player.name} sort du TD avec un double !`, playerId)
    } else {
      const newJailTurns = player.jailTurns + 1
      if (newJailTurns >= 3) {
        // 3e tour en TD — doit payer l'amende et sortir
        s = transferMoney(s, playerId, 'bank', JAIL_FINE)
        s = {
          ...s,
          players: s.players.map(p =>
            p.id === playerId ? { ...p, inJail: false, jailTurns: 0 } : p
          ),
        }
        s = log(s, `${player.name} paye ${JAIL_FINE} € d'amende et sort du TD.`, playerId)
      } else {
        s = {
          ...s,
          players: s.players.map(p =>
            p.id === playerId ? { ...p, jailTurns: newJailTurns } : p
          ),
        }
        s = log(s, `${player.name} reste en TD (tour ${newJailTurns}/3).`, playerId)
        s = nextPlayer(s)
        return { success: true, state: s }
      }
      s = { ...s, doublesCount: 0 }
    }
  } else {
    // Gestion des doubles hors TD
    if (isDouble) {
      const newDoubles = s.doublesCount + 1
      if (newDoubles >= 3) {
        s = goToJail(s, playerId)
        s = nextPlayer(s)
        return { success: true, state: s }
      }
      s = { ...s, doublesCount: newDoubles }
    } else {
      s = { ...s, doublesCount: 0 }
    }
  }

  // Déplacement
  const movedPlayer = s.players.find(p => p.id === playerId)!
  const newPosition = (movedPlayer.position + total) % 40
  const passedGo = !movedPlayer.inJail && (movedPlayer.position + total) >= 40

  s = movePlayer(s, playerId, newPosition, passedGo)

  // Appliquer les effets de la case
  s = applyCellEffect(s, playerId, newPosition, total, isDouble)

  return { success: true, state: s }
}

function applyCellEffect(state: GameState, playerId: string, position: number, diceTotal: number, keepTurnOnDouble: boolean): GameState {
  const cell = getCellDef(position)
  const player = state.players.find(p => p.id === playerId)!
  let s = state

  switch (cell.type) {
    case 'go':
      // Déjà géré dans movePlayer (passage)
      break

    case 'tax': {
      const amount = cell.tax ?? 0
      s = transferMoney(s, playerId, 'bank', amount)
      s = log(s, `${player.name} paye ${amount} € sur ${cell.name}.`, playerId)
      s = finishTurnAfterAction(s, keepTurnOnDouble)
      break
    }

    case 'go-to-jail':
      s = log(s, `${player.name} tombe sur Allez en TD !`, playerId)
      s = goToJail(s, playerId)
      // Pas de fin de tour automatique — le prochain joueur joue
      s = nextPlayer(s)
      break

    case 'jail':
      // Simple visite — pas en TD, fin de tour normale
      s = log(s, `${player.name} est en simple visite au TD.`, playerId)
      s = finishTurnAfterAction(s, keepTurnOnDouble)
      break

    case 'free-parking': {
      // Le joueur a la possibilité de payer 200 € pour booster une de ses propriétés (loyer ×3)
      const myProps = s.properties.filter(p => p.ownerId === playerId && !p.mortgaged)
      if (myProps.length > 0) {
        // Met le jeu en attente du choix du joueur
        s = { ...s, awaitingParkingChoice: true }
        const alreadyOwnsBoost = s.freeParkingBoost?.playerId === playerId
        if (alreadyOwnsBoost) {
          s = log(s, `${player.name} est au Jardin Japonais. Il peut changer sa propriété boostée (200 €) ou conserver l'actuelle (0 €).`, playerId)
        } else {
          s = log(s, `${player.name} est au Jardin Japonais. Payer 200 € pour booster une propriété ×3 ?`, playerId)
        }
        // Ne pas appeler nextPlayer — attend choose_parking_boost ou decline_parking_boost
      } else {
        s = log(s, `${player.name} se repose au Jardin Japonais (aucune propriété à booster).`, playerId)
        s = finishTurnAfterAction(s, keepTurnOnDouble)
      }
      break
    }

    case 'chance': {
      const { state: s2, card } = drawCard(s, 'chance')
      s = { ...s2, lastCard: { deck: 'chance', text: card.text, image: card.image } }
      s = log(s, `${player.name} tire une carte Chance : "${card.text}"`, playerId)
      const beforeCardPos = s.players.find(p => p.id === playerId)?.position ?? position
      s = applyCardAction(s, playerId, card.action, diceTotal)
      if (card.action.type === 'go_to_jail') {
        s = nextPlayer(s)
      } else if (isMovementCardAction(card.action)) {
        const afterCardPos = s.players.find(p => p.id === playerId)?.position ?? beforeCardPos
        s = applyCellEffect(s, playerId, afterCardPos, diceTotal, keepTurnOnDouble)
      } else {
        s = finishTurnAfterAction(s, keepTurnOnDouble)
      }
      break
    }

    case 'community': {
      const { state: s2, card } = drawCard(s, 'community')
      s = { ...s2, lastCard: { deck: 'community', text: card.text, image: card.image } }
      s = log(s, `${player.name} tire une carte IZLY : "${card.text}"`, playerId)
      const beforeCardPos = s.players.find(p => p.id === playerId)?.position ?? position
      s = applyCardAction(s, playerId, card.action, diceTotal)
      if (card.action.type === 'go_to_jail') {
        s = nextPlayer(s)
      } else if (isMovementCardAction(card.action)) {
        const afterCardPos = s.players.find(p => p.id === playerId)?.position ?? beforeCardPos
        s = applyCellEffect(s, playerId, afterCardPos, diceTotal, keepTurnOnDouble)
      } else {
        s = finishTurnAfterAction(s, keepTurnOnDouble)
      }
      break
    }

    case 'property':
    case 'railroad':
    case 'utility': {
      const prop = s.properties.find(p => p.id === position)
      if (!prop) { s = finishTurnAfterAction(s, keepTurnOnDouble); break }

      if (!prop.ownerId) {
        const price = cell.price ?? 0
        if (player.money < price) {
          s = log(s, `${player.name} tombe sur ${cell.name} (${price} €) : argent insuffisant. Tour suivant.`, playerId)
          s = nextPlayer(s)
          break
        }

        // Proposer l'achat — l'état reste en attente de buy_property ou decline_property
        s = { ...s, awaitingPropertyDecision: true }
        s = log(s, `${player.name} s'arrête sur ${cell.name} (${cell.price} €). Achat possible.`, playerId)
        // Ne pas appeler nextPlayer — le joueur doit décider
        break
      }

      if (prop.ownerId === playerId) {
        s = log(s, `${player.name} s'arrête sur sa propre propriété ${cell.name}.`, playerId)
        s = finishTurnAfterAction(s, keepTurnOnDouble)
        break
      }

      if (prop.mortgaged) {
        s = log(s, `${cell.name} est hypothéquée, pas de loyer.`, playerId)
        s = finishTurnAfterAction(s, keepTurnOnDouble)
        break
      }

      const boostedRentActive =
        s.freeParkingBoost?.propertyId === position &&
        s.freeParkingBoost?.playerId === prop.ownerId
      const rent = calculateRent(s, playerId, position, diceTotal)
      s = transferMoney(s, playerId, prop.ownerId, rent)
      const owner = s.players.find(p => p.id === prop.ownerId)!
      s = log(
        s,
        `${player.name} paye ${rent} € de loyer à ${owner.name} pour ${cell.name}${boostedRentActive ? ' (boost x3 actif)' : ''}.`,
        playerId,
      )
      s = checkBankruptcy(s, playerId)
      if (!s.players.find(p => p.id === playerId)?.isBankrupt) s = finishTurnAfterAction(s, keepTurnOnDouble)
      break
    }

    default:
      s = finishTurnAfterAction(s, keepTurnOnDouble)
  }

  return s
}

export function buyProperty(
  state: GameState,
  playerId: string,
): { success: boolean; error?: string; state: GameState } {
  if (state.currentPlayerId !== playerId) return { success: false, error: 'Ce n\'est pas votre tour.', state }
  if (!state.lastDice) return { success: false, error: 'Vous devez lancer les dés d\'abord.', state }
  if (!state.awaitingPropertyDecision) return { success: false, error: 'Aucun achat en attente.', state }

  const player = state.players.find(p => p.id === playerId)!
  const cell = getCellDef(player.position)

  if (!['property', 'railroad', 'utility'].includes(cell.type)) {
    return { success: false, error: 'Cette case n\'est pas achetable.', state }
  }

  const prop = state.properties.find(p => p.id === player.position)
  if (!prop || prop.ownerId) return { success: false, error: 'Cette propriété est déjà achetée.', state }

  const price = cell.price ?? 0
  if (player.money < price) return { success: false, error: 'Fonds insuffisants.', state }

  let s = transferMoney(state, playerId, 'bank', price)
  s = {
    ...s,
    properties: s.properties.map(p =>
      p.id === player.position ? { ...p, ownerId: playerId } : p
    ),
    awaitingPropertyDecision: false,
  }
  s = log(s, `${player.name} achète ${cell.name} pour ${price} €.`, playerId)
  s = finishTurnAfterAction(s, true)

  return { success: true, state: s }
}

export function declineProperty(
  state: GameState,
  playerId: string,
): { success: boolean; error?: string; state: GameState } {
  if (state.currentPlayerId !== playerId) return { success: false, error: 'Ce n\'est pas votre tour.', state }
  if (!state.awaitingPropertyDecision) return { success: false, error: 'Aucune décision d\'achat en attente.', state }

  const player = state.players.find(p => p.id === playerId)!
  const cell = getCellDef(player.position)
  let s = log(state, `${player.name} décline l'achat de ${cell.name}. Tour suivant.`, playerId)
  s = { ...s, awaitingPropertyDecision: false, auctionState: undefined }
  s = finishTurnAfterAction(s, true)
  return { success: true, state: s }
}

// ─── Jardin Japonais — boost de loyer ─────────────────────────────────────────

export function chooseParkingBoost(
  state: GameState,
  playerId: string,
  propertyId: number,
): { success: boolean; error?: string; state: GameState } {
  if (state.currentPlayerId !== playerId) return { success: false, error: 'Ce n\'est pas votre tour.', state }
  if (!state.awaitingParkingChoice) return { success: false, error: 'Pas de choix en attente.', state }

  const player = state.players.find(p => p.id === playerId)!
  const prop = state.properties.find(p => p.id === propertyId)

  if (!prop || prop.ownerId !== playerId) {
    return { success: false, error: 'Vous ne possédez pas cette propriété.', state }
  }
  if (prop.mortgaged) {
    return { success: false, error: 'Cette propriété est hypothéquée.', state }
  }
  if (player.money < 200) {
    return { success: false, error: 'Fonds insuffisants (200 € requis).', state }
  }

  const cell = getCellDef(propertyId)
  let s: GameState = transferMoney(state, playerId, 'bank', 200)
  s = { ...s, freeParkingBoost: { playerId, propertyId }, awaitingParkingChoice: false }
  s = log(s, `${player.name} paie 200 € et booste le loyer de ${cell.name} ×3 !`, playerId)
  s = finishTurnAfterAction(s, true)
  return { success: true, state: s }
}

export function declineParkingBoost(
  state: GameState,
  playerId: string,
): { success: boolean; error?: string; state: GameState } {
  if (state.currentPlayerId !== playerId) return { success: false, error: 'Ce n\'est pas votre tour.', state }
  if (!state.awaitingParkingChoice) return { success: false, error: 'Pas de choix en attente.', state }

  const player = state.players.find(p => p.id === playerId)!
  let s: GameState = { ...state, awaitingParkingChoice: false }
  s = log(s, `${player.name} passe son tour au Jardin Japonais sans booster.`, playerId)
  s = finishTurnAfterAction(s, true)
  return { success: true, state: s }
}

export function auctionBid(
  state: GameState,
  playerId: string,
  amount: number,
): { success: boolean; error?: string; state: GameState } {
  if (!state.auctionState) return { success: false, error: 'Pas d\'enchère en cours.', state }
  if (!state.auctionState.participants.includes(playerId)) {
    return { success: false, error: 'Vous ne participez plus à cette enchère.', state }
  }
  if (amount <= state.auctionState.currentBid) {
    return { success: false, error: 'L\'offre doit dépasser l\'enchère actuelle.', state }
  }
  const player = state.players.find(p => p.id === playerId)!
  if (player.money < amount) return { success: false, error: 'Fonds insuffisants.', state }

  let s: GameState = {
    ...state,
    auctionState: {
      ...state.auctionState,
      currentBid: amount,
      currentBidderId: playerId,
    },
  }
  s = log(s, `${player.name} enchérit ${amount} €.`, playerId)
  return { success: true, state: s }
}

export function auctionPass(
  state: GameState,
  playerId: string,
): { success: boolean; error?: string; state: GameState } {
  if (!state.auctionState) return { success: false, error: 'Pas d\'enchère en cours.', state }

  const remaining = state.auctionState.participants.filter(id => id !== playerId)
  let s = state

  if (remaining.length === 0 || (remaining.length === 1 && state.auctionState.currentBid > 0)) {
    // Enchère terminée
    const winner = state.auctionState.currentBidderId
    const bid = state.auctionState.currentBid
    const propId = state.auctionState.propertyId
    const cell = getCellDef(propId)

    if (winner && bid > 0) {
      s = transferMoney(s, winner, 'bank', bid)
      s = {
        ...s,
        properties: s.properties.map(p =>
          p.id === propId ? { ...p, ownerId: winner } : p
        ),
        auctionState: undefined,
      }
      const winnerPlayer = s.players.find(p => p.id === winner)!
      s = log(s, `${winnerPlayer.name} remporte l'enchère pour ${cell.name} à ${bid} €.`, winner)
    } else {
      // Personne n'a enchéri
      s = { ...s, auctionState: undefined }
      s = log(s, `L'enchère pour ${cell.name} n'a pas trouvé preneur.`)
    }
    s = finishTurnAfterAction(s, true)
  } else {
    s = {
      ...s,
      auctionState: {
        ...state.auctionState,
        participants: remaining,
      },
    }
  }
  return { success: true, state: s }
}

export function mortgageProperty(
  state: GameState,
  playerId: string,
  propertyId: number,
): { success: boolean; error?: string; state: GameState } {
  const prop = state.properties.find(p => p.id === propertyId)
  if (!prop || prop.ownerId !== playerId) return { success: false, error: 'Vous ne possédez pas cette propriété.', state }
  if (prop.mortgaged) return { success: false, error: 'Cette propriété est déjà hypothéquée.', state }
  if (prop.houses > 0 || prop.hotel) return { success: false, error: 'Vendez les constructions avant d\'hypothéquer.', state }

  const cell = getCellDef(propertyId)
  const mortgageValue = cell.mortgage ?? 0

  let s = transferMoney(state, 'bank', playerId, mortgageValue)
  s = {
    ...s,
    properties: s.properties.map(p =>
      p.id === propertyId ? { ...p, mortgaged: true } : p
    ),
  }
  const player = s.players.find(p => p.id === playerId)!
  s = log(s, `${player.name} hypothèque ${cell.name} pour ${mortgageValue} €.`, playerId)

  return { success: true, state: s }
}

export function unmortgageProperty(
  state: GameState,
  playerId: string,
  propertyId: number,
): { success: boolean; error?: string; state: GameState } {
  const prop = state.properties.find(p => p.id === propertyId)
  if (!prop || prop.ownerId !== playerId) return { success: false, error: 'Vous ne possédez pas cette propriété.', state }
  if (!prop.mortgaged) return { success: false, error: 'Cette propriété n\'est pas hypothéquée.', state }

  const cell = getCellDef(propertyId)
  const liftCost = Math.floor((cell.mortgage ?? 0) * (1 + MORTGAGE_INTEREST))
  const player = state.players.find(p => p.id === playerId)!

  if (player.money < liftCost) return { success: false, error: `Fonds insuffisants (${liftCost} € requis).`, state }

  let s = transferMoney(state, playerId, 'bank', liftCost)
  s = {
    ...s,
    properties: s.properties.map(p =>
      p.id === propertyId ? { ...p, mortgaged: false } : p
    ),
  }
  s = log(s, `${player.name} lève l'hypothèque sur ${cell.name} pour ${liftCost} €.`, playerId)

  return { success: true, state: s }
}

export function buildHouse(
  state: GameState,
  playerId: string,
  propertyId: number,
): { success: boolean; error?: string; state: GameState } {
  const prop = state.properties.find(p => p.id === propertyId)
  if (!prop || prop.ownerId !== playerId) return { success: false, error: 'Vous ne possédez pas cette propriété.', state }

  const cell = getCellDef(propertyId)
  if (cell.type !== 'property' || !cell.colorGroup) return { success: false, error: 'Impossible de construire sur cette propriété.', state }
  if (!ownsFullGroup(state, playerId, cell.colorGroup)) return { success: false, error: 'Vous devez posséder tout le groupe de couleur.', state }
  if (prop.mortgaged) return { success: false, error: 'Cette propriété est hypothéquée.', state }

  // Vérifier construction uniforme
  const groupCells = getGroupCells(cell.colorGroup)
  const groupProps = groupCells.map(c => state.properties.find(p => p.id === c.index)!)
  const minHouses = Math.min(...groupProps.map(p => p.hotel ? 5 : p.houses))
  const currentHouses = prop.hotel ? 5 : prop.houses

  if (currentHouses > minHouses) {
    return { success: false, error: 'Construisez uniformément sur tout le groupe.', state }
  }
  if (prop.hotel) return { success: false, error: 'Cette propriété a déjà un hôtel.', state }

  const player = state.players.find(p => p.id === playerId)!

  if (prop.houses === 4) {
    // Construire un hôtel
    const hotelCost = cell.hotelCost ?? 0
    if (player.money < hotelCost) return { success: false, error: 'Fonds insuffisants.', state }

    let s = transferMoney(state, playerId, 'bank', hotelCost)
    s = {
      ...s,
      properties: s.properties.map(p =>
        p.id === propertyId ? { ...p, houses: 0, hotel: true } : p
      ),
    }
    s = log(s, `${player.name} construit un hôtel sur ${cell.name}.`, playerId)
    return { success: true, state: s }
  }

  const houseCost = cell.houseCost ?? 0
  if (player.money < houseCost) return { success: false, error: 'Fonds insuffisants.', state }

  let s = transferMoney(state, playerId, 'bank', houseCost)
  s = {
    ...s,
    properties: s.properties.map(p =>
      p.id === propertyId ? { ...p, houses: p.houses + 1 } : p
    ),
  }
  s = log(s, `${player.name} construit une maison sur ${cell.name}.`, playerId)
  return { success: true, state: s }
}

export function sellHouse(
  state: GameState,
  playerId: string,
  propertyId: number,
): { success: boolean; error?: string; state: GameState } {
  const prop = state.properties.find(p => p.id === propertyId)
  if (!prop || prop.ownerId !== playerId) return { success: false, error: 'Vous ne possédez pas cette propriété.', state }
  if (!prop.hotel && prop.houses === 0) return { success: false, error: 'Pas de construction à vendre.', state }

  const cell = getCellDef(propertyId)

  // Vérifier déconstruction uniforme
  if (cell.colorGroup) {
    const groupCells = getGroupCells(cell.colorGroup)
    const groupProps = groupCells.map(c => state.properties.find(p => p.id === c.index)!)
    const maxHouses = Math.max(...groupProps.map(p => p.hotel ? 5 : p.houses))
    const currentHouses = prop.hotel ? 5 : prop.houses
    if (currentHouses < maxHouses) {
      return { success: false, error: 'Déconstruisez uniformément sur tout le groupe.', state }
    }
  }

  const player = state.players.find(p => p.id === playerId)!

  if (prop.hotel) {
    const salePrice = Math.floor((cell.hotelCost ?? 0) / 2)
    let s = transferMoney(state, 'bank', playerId, salePrice)
    s = {
      ...s,
      properties: s.properties.map(p =>
        p.id === propertyId ? { ...p, hotel: false, houses: 4 } : p
      ),
    }
    s = log(s, `${player.name} vend l'hôtel de ${cell.name} pour ${salePrice} €.`, playerId)
    return { success: true, state: s }
  }

  const salePrice = Math.floor((cell.houseCost ?? 0) / 2)
  let s = transferMoney(state, 'bank', playerId, salePrice)
  s = {
    ...s,
    properties: s.properties.map(p =>
      p.id === propertyId ? { ...p, houses: p.houses - 1 } : p
    ),
  }
  s = log(s, `${player.name} vend une maison sur ${cell.name} pour ${salePrice} €.`, playerId)
  return { success: true, state: s }
}

export function proposeTrade(
  state: GameState,
  playerId: string,
  offer: TradeOffer,
): { success: boolean; error?: string; state: GameState } {
  // Valider que les propriétés offertes appartiennent bien au proposant
  for (const propId of offer.offer.propertyIds) {
    const prop = state.properties.find(p => p.id === propId)
    if (!prop || prop.ownerId !== playerId) {
      return { success: false, error: 'Vous ne possédez pas toutes les propriétés offertes.', state }
    }
  }

  const player = state.players.find(p => p.id === playerId)!
  if (player.money < offer.offer.money) {
    return { success: false, error: 'Fonds insuffisants pour cette offre.', state }
  }

  let s: GameState = { ...state, pendingTrade: offer }
  const target = s.players.find(p => p.id === offer.toPlayerId)!
  s = log(s, `${player.name} propose un échange à ${target.name}.`, playerId)

  return { success: true, state: s }
}

export function acceptTrade(
  state: GameState,
  playerId: string,
  tradeId: string,
): { success: boolean; error?: string; state: GameState } {
  const trade = state.pendingTrade
  if (!trade || trade.id !== tradeId) return { success: false, error: 'Échange introuvable.', state }
  if (trade.toPlayerId !== playerId) return { success: false, error: 'Cet échange ne vous est pas destiné.', state }

  let s = state

  // Transférer l'argent
  s = transferMoney(s, trade.fromPlayerId, trade.toPlayerId, trade.offer.money)
  s = transferMoney(s, trade.toPlayerId, trade.fromPlayerId, trade.request.money)

  // Transférer les propriétés
  s = {
    ...s,
    properties: s.properties.map(p => {
      if (trade.offer.propertyIds.includes(p.id)) return { ...p, ownerId: trade.toPlayerId }
      if (trade.request.propertyIds.includes(p.id)) return { ...p, ownerId: trade.fromPlayerId }
      return p
    }),
    pendingTrade: undefined,
  }

  // Transférer les cartes sortie du TD
  if (trade.offer.getOutOfJailCards > 0) {
    s = {
      ...s,
      players: s.players.map(p => {
        if (p.id === trade.fromPlayerId) return { ...p, getOutOfJailCards: p.getOutOfJailCards - trade.offer.getOutOfJailCards }
        if (p.id === trade.toPlayerId) return { ...p, getOutOfJailCards: p.getOutOfJailCards + trade.offer.getOutOfJailCards }
        return p
      }),
    }
  }

  const fromPlayer = s.players.find(p => p.id === trade.fromPlayerId)!
  const toPlayer = s.players.find(p => p.id === trade.toPlayerId)!
  s = log(s, `Échange accepté entre ${fromPlayer.name} et ${toPlayer.name}.`)

  return { success: true, state: s }
}

export function refuseTrade(
  state: GameState,
  playerId: string,
  tradeId: string,
): { success: boolean; error?: string; state: GameState } {
  const trade = state.pendingTrade
  if (!trade || trade.id !== tradeId) return { success: false, error: 'Échange introuvable.', state }
  if (trade.toPlayerId !== playerId) return { success: false, error: 'Cet échange ne vous est pas destiné.', state }

  let s: GameState = { ...state, pendingTrade: undefined }
  const target = s.players.find(p => p.id === playerId)!
  s = log(s, `${target.name} refuse l'échange.`, playerId)

  return { success: true, state: s }
}

export function payJailFine(
  state: GameState,
  playerId: string,
): { success: boolean; error?: string; state: GameState } {
  const player = state.players.find(p => p.id === playerId)!
  if (!player.inJail) return { success: false, error: 'Vous n\'êtes pas en TD.', state }
  if (state.currentPlayerId !== playerId) return { success: false, error: 'Ce n\'est pas votre tour.', state }
  if (player.money < JAIL_FINE) return { success: false, error: 'Fonds insuffisants.', state }

  let s = transferMoney(state, playerId, 'bank', JAIL_FINE)
  s = {
    ...s,
    players: s.players.map(p =>
      p.id === playerId ? { ...p, inJail: false, jailTurns: 0 } : p
    ),
  }
  s = log(s, `${player.name} paye ${JAIL_FINE} € et sort du TD.`, playerId)

  return { success: true, state: s }
}

export function useGetOutOfJailCard(
  state: GameState,
  playerId: string,
): { success: boolean; error?: string; state: GameState } {
  const player = state.players.find(p => p.id === playerId)!
  if (!player.inJail) return { success: false, error: 'Vous n\'êtes pas en TD.', state }
  if (state.currentPlayerId !== playerId) return { success: false, error: 'Ce n\'est pas votre tour.', state }
  if (player.getOutOfJailCards <= 0) return { success: false, error: 'Vous n\'avez pas de carte sortie du TD.', state }

  let s: GameState = {
    ...state,
    players: state.players.map(p =>
      p.id === playerId
        ? { ...p, inJail: false, jailTurns: 0, getOutOfJailCards: p.getOutOfJailCards - 1 }
        : p
    ),
  }
  // Remettre la carte dans le tas
  s = { ...s, deck: { ...s.deck, chance: [...s.deck.chance, { id: 'ch8', text: 'Vous êtes libéré du TD.', image: 'c1.svg', action: { type: 'get_out_of_jail' } as CardAction }] } }
  s = log(s, `${player.name} utilise sa carte "Libéré du TD".`, playerId)

  return { success: true, state: s }
}

export function endTurn(
  state: GameState,
  playerId: string,
): { success: boolean; error?: string; state: GameState } {
  let s = state
  if (state.currentPlayerId !== playerId) return { success: false, error: 'Ce n\'est pas votre tour.', state }
  if (s.auctionState) {
    s = { ...s, auctionState: undefined }
    s = log(s, 'Enchère annulée automatiquement pour débloquer la partie.')
  }
  if (!s.lastDice) return { success: false, error: 'Vous devez d\'abord lancer les dés.', state: s }
  if (s.awaitingParkingChoice) return { success: false, error: 'Vous devez d\'abord choisir pour le Jardin Japonais.', state: s }
  if (s.awaitingPropertyDecision) return { success: false, error: 'Vous devez d\'abord décider pour la propriété en attente.', state: s }
  if (lastRollWasDouble(s)) return { success: false, error: 'Vous avez fait un double, vous devez relancer les dés.', state: s }

  return { success: true, state: nextPlayer(s) }
}

export function skipDisconnectedCurrentPlayer(
  state: GameState,
  playerId: string,
): { success: boolean; error?: string; state: GameState } {
  if (state.currentPlayerId !== playerId) return { success: false, error: 'Le joueur déconnecté n\'est pas le joueur courant.', state }

  const player = state.players.find(p => p.id === playerId)
  let s: GameState = {
    ...state,
    awaitingParkingChoice: false,
    awaitingPropertyDecision: false,
    auctionState: undefined,
  }
  s = log(s, `${player?.name ?? 'Un joueur'} est déconnecté. Tour passé automatiquement.`, playerId)
  s = nextPlayer(s)
  return { success: true, state: s }
}

export function bankruptcyAction(
  state: GameState,
  playerId: string,
): { success: boolean; error?: string; state: GameState } {
  const player = state.players.find(p => p.id === playerId)!
  if (player.isBankrupt) return { success: false, error: 'Vous êtes déjà en faillite.', state }

  const s = declareBankruptcy(state, playerId, 'bank')
  return { success: true, state: s }
}
