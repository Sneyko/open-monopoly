import React, { useState, useEffect, useRef, useMemo } from 'react'
import Board, { CELLS } from './Board/Board'
import Dice from './UI/Dice'
import PlayerCard from './UI/PlayerCard'
import PlayerDetailPanel from './UI/PlayerDetailPanel'
import GameLog from './UI/GameLog'
import TradeModal from './UI/TradeModal'
import CellInfoPanel from './UI/CellInfoPanel'
import CardRevealModal from './UI/CardRevealModal'
import EventBanner from './UI/EventBanner'
import FreeParkingModal from './UI/FreeParkingModal'
import { useGame } from '../hooks/useGame'
import { useSocket } from '../hooks/useSocket'
import { useAnimatedPlayers } from '../hooks/useAnimatedPlayers'
import { useRoomStore } from '../store/roomStore'
import type { TradeOffer } from '../../shared/types'
import karimEnerveSrc from '../assets/karim-enerve.svg'

const COLOR_HEX: Record<string, string> = {
  red: '#ef4444', blue: '#3b82f6', green: '#22c55e',
  yellow: '#eab308', purple: '#a855f7', orange: '#f97316',
}

// Positions des cartes aux coins de l'ÉCRAN (pas du plateau)
// En mode paysage, le plateau = min(100vh,100vw) = 100vh < 100vw
// → les coins écran sont dans l'espace vide à gauche/droite du plateau
const SCREEN_CORNERS: React.CSSProperties[] = [
  { top: 4,    left: 4  },   // 0: haut-gauche
  { top: 4,    right: 4 },   // 1: haut-droit
  { bottom: 4, left: 4  },   // 2: bas-gauche
  { bottom: 4, right: 4 },   // 3: bas-droit
  { top: '35%', left: 4 },   // 4: gauche-centre (5e joueur)
  { top: '35%', right: 4 },  // 5: droite-centre (6e joueur)
]

// Positions du panel de détail — apparaît juste sous/au-dessus de la carte joueur
// La carte corner fait ~120px de haut + 4px d'offset + 8px de gap = 132px
const DETAIL_POSITIONS: React.CSSProperties[] = [
  { top: 132, left: 4 },                        // 0: sous haut-gauche
  { top: 132, right: 4 },                       // 1: sous haut-droit
  { bottom: 132, left: 4 },                     // 2: au-dessus bas-gauche
  { bottom: 132, right: 4 },                    // 3: au-dessus bas-droit
  { top: 'calc(35% + 128px)', left: 4 },        // 4: sous centre-gauche
  { top: 'calc(35% + 128px)', right: 4 },       // 5: sous centre-droit
]

interface AssetMeta {
  price: number
  mortgage: number
  houseCost?: number
}

const ASSET_VALUES: Record<number, AssetMeta> = {
  1: { price: 60, mortgage: 30, houseCost: 50 },
  3: { price: 60, mortgage: 30, houseCost: 50 },
  5: { price: 200, mortgage: 100 },
  6: { price: 100, mortgage: 50, houseCost: 50 },
  8: { price: 100, mortgage: 50, houseCost: 50 },
  9: { price: 120, mortgage: 60, houseCost: 50 },
  11: { price: 140, mortgage: 70, houseCost: 100 },
  13: { price: 140, mortgage: 70, houseCost: 100 },
  14: { price: 160, mortgage: 80, houseCost: 100 },
  15: { price: 200, mortgage: 100 },
  16: { price: 180, mortgage: 90, houseCost: 100 },
  18: { price: 180, mortgage: 90, houseCost: 100 },
  19: { price: 200, mortgage: 100, houseCost: 100 },
  21: { price: 220, mortgage: 110, houseCost: 150 },
  23: { price: 220, mortgage: 110, houseCost: 150 },
  24: { price: 240, mortgage: 120, houseCost: 150 },
  25: { price: 200, mortgage: 100 },
  26: { price: 260, mortgage: 130, houseCost: 150 },
  27: { price: 260, mortgage: 130, houseCost: 150 },
  29: { price: 280, mortgage: 140, houseCost: 150 },
  31: { price: 300, mortgage: 150, houseCost: 200 },
  32: { price: 300, mortgage: 150, houseCost: 200 },
  34: { price: 320, mortgage: 160, houseCost: 200 },
  35: { price: 200, mortgage: 100 },
  37: { price: 350, mortgage: 175, houseCost: 200 },
  39: { price: 400, mortgage: 200, houseCost: 200 },
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
      fill="none"
      aria-hidden="true"
    >
      <path d="M2 4.5L6 8L10 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export default function GameView() {
  const {
    gameState, myPlayerId, isMyTurn,
    rollDice, buyProperty, declineProperty, endTurn,
    payJailFine, useGetOutOfJailCard, declareBankruptcy,
    chooseParkingBoost, declineParkingBoost,
  } = useGame()
  const socket = useSocket()
  const { room } = useRoomStore()
  const isHost = room?.hostId === myPlayerId
  const [showTrade, setShowTrade] = useState(false)
  const [showLog, setShowLog] = useState(false)
  const [selectedCell, setSelectedCell] = useState<number | null>(null)
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [boardRotation, setBoardRotation] = useState(0)
  const [pendingCard, setPendingCard] = useState<{ deck: 'chance'|'community'; text: string; image: string } | undefined>(undefined)
  const [shownCard, setShownCard] = useState<{ deck: 'chance'|'community'; text: string; image: string } | undefined>(undefined)
  const [showKarimTdAnim, setShowKarimTdAnim] = useState(false)
  const [billAnimLabel, setBillAnimLabel] = useState<string | null>(null)
  const [showRanking, setShowRanking] = useState(false)
  const prevCardRef = useRef<string | undefined>(undefined)
  const prevTdTriggerRef = useRef<string | undefined>(undefined)
  const prevBillTriggerRef = useRef<string | undefined>(undefined)
  const animatedPlayers = useAnimatedPlayers(gameState?.players ?? [])

  // ── Auto-rotation : la rangée du pion du joueur reste toujours en bas ──
  const myPosition = gameState?.players.find(p => p.id === myPlayerId)?.position
  useEffect(() => {
    if (myPosition == null) return
    const rawTarget = myPosition <= 9 ? 0 : myPosition <= 19 ? 270 : myPosition <= 29 ? 180 : 90
    setBoardRotation(prev => {
      const normalized = ((prev % 360) + 360) % 360
      let diff = rawTarget - normalized
      if (diff > 180) diff -= 360
      if (diff < -180) diff += 360
      return prev + diff
    })
  }, [myPosition])

  useEffect(() => {
    if (!gameState?.lastCard) return
    const key = `${gameState.lastCard.image}-${gameState.lastCard.text}`
    if (key !== prevCardRef.current) {
      prevCardRef.current = key
      setPendingCard(gameState.lastCard)
    }
  }, [gameState?.lastCard])

  const animatedCurrentPos = gameState?.currentPlayerId
    ? animatedPlayers.find(p => p.id === gameState.currentPlayerId)?.position
    : undefined
  const realCurrentPos = gameState?.currentPlayerId
    ? gameState.players.find(p => p.id === gameState.currentPlayerId)?.position
    : undefined

  useEffect(() => {
    if (!pendingCard || shownCard) return

    const pawnArrived =
      realCurrentPos == null ||
      animatedCurrentPos == null ||
      realCurrentPos === animatedCurrentPos

    if (!pawnArrived) return

    const timer = window.setTimeout(() => {
      setShownCard(pendingCard)
      setPendingCard(undefined)
    }, 80)

    return () => window.clearTimeout(timer)
  }, [pendingCard, shownCard, realCurrentPos, animatedCurrentPos])

  useEffect(() => {
    if (!gameState?.log?.length) return
    const lastEvent = gameState.log[gameState.log.length - 1]
    if (!lastEvent.message.includes('tombe sur Allez en TD')) return
    if (prevTdTriggerRef.current === lastEvent.id) return

    prevTdTriggerRef.current = lastEvent.id
    setShowKarimTdAnim(true)
    const timer = window.setTimeout(() => setShowKarimTdAnim(false), 1700)
    return () => window.clearTimeout(timer)
  }, [gameState?.log])

  useEffect(() => {
    if (!gameState?.log?.length) return
    const lastEvent = gameState.log[gameState.log.length - 1]
    if (prevBillTriggerRef.current === lastEvent.id) return

    const bills = ['Facture Fibre', 'Tisséo Pastel', 'Gemini Mensuel', 'Frais de scolarité']
    const matched = bills.find(label =>
      lastEvent.message.includes('paye') && lastEvent.message.includes(`sur ${label}`)
    )
    if (!matched) return

    prevBillTriggerRef.current = lastEvent.id
    setBillAnimLabel(matched)
    const timer = window.setTimeout(() => setBillAnimLabel(null), 1700)
    return () => window.clearTimeout(timer)
  }, [gameState?.log])

  if (!gameState) return null

  const me = gameState.players.find(p => p.id === myPlayerId)
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId)
  const cellAtMyPosition = gameState.properties.find(p => p.id === (me?.position ?? -1))
  const lastWasDouble = !!gameState.lastDice && gameState.lastDice[0] === gameState.lastDice[1]
  const hasPendingTurnResolution = !!gameState.awaitingParkingChoice || !!gameState.awaitingPropertyDecision
  const canRollNow = isMyTurn && !me?.isBankrupt && (!gameState.lastDice || (lastWasDouble && !hasPendingTurnResolution))
  const canBuy = isMyTurn && !!gameState.awaitingPropertyDecision && !!cellAtMyPosition && !cellAtMyPosition.ownerId
  const meInJail = me?.inJail ?? false
  const hasRolled = !canRollNow
  const canEndTurn = isMyTurn && !me?.isBankrupt && !!gameState.lastDice && !gameState.awaitingParkingChoice && !gameState.awaitingPropertyDecision && !lastWasDouble
  const buyCell = cellAtMyPosition ? CELLS.find(cell => cell.index === cellAtMyPosition.id) : null
  const buyPrice = cellAtMyPosition ? ASSET_VALUES[cellAtMyPosition.id]?.price : null
  const buyLabel = buyCell && buyPrice
    ? `Acheter ${buyCell.name} pour ${buyPrice.toLocaleString()} €`
    : 'Acheter la propriété'

  const ranking = useMemo(() => {
    const byOwner = new Map<string, typeof gameState.properties>()
    for (const prop of gameState.properties) {
      if (!prop.ownerId) continue
      const arr = byOwner.get(prop.ownerId) ?? []
      arr.push(prop)
      byOwner.set(prop.ownerId, arr)
    }

    return gameState.players
      .map(player => {
        const owned = byOwner.get(player.id) ?? []
        const assets = owned.reduce((sum, prop) => {
          const meta = ASSET_VALUES[prop.id]
          if (!meta) return sum

          const baseValue = prop.mortgaged ? meta.mortgage : meta.price
          const houseCost = meta.houseCost ?? 0
          const buildingsValue = prop.mortgaged
            ? 0
            : (prop.hotel ? houseCost * 5 : prop.houses * houseCost)

          return sum + baseValue + buildingsValue
        }, 0)

        return {
          player,
          wealth: player.money + assets,
          assets,
          propertiesCount: owned.length,
        }
      })
      .sort((a, b) => b.wealth - a.wealth)
  }, [gameState.players, gameState.properties])

  if (gameState.phase === 'ended') {
    const winner = gameState.players.find(p => !p.isBankrupt)
    return (
      <div className="h-screen flex items-center justify-center bg-[#0f1117]">
        <div className="text-center fade-in-up">
          <div className="text-xs tracking-[0.25em] uppercase text-yellow-300/70 mb-3">Victoire</div>
          <h1 className="text-5xl font-black text-yellow-300 mb-3">
            {winner?.name ?? 'Personne'} remporte la partie !
          </h1>
          <p className="text-white/40 mb-8">Félicitations !</p>
          <button onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-10 py-4 rounded-2xl font-bold text-lg transition-all active:scale-95 shadow-xl">
            Rejouer
          </button>
        </div>
      </div>
    )
  }

  return (
    // Écran complet — le plateau est centré, les cartes joueurs aux coins de l'écran
    <div className="h-screen w-screen bg-[#0f1117] relative overflow-hidden">

      {/* ── Classement patrimoine (plié par défaut) ── */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
        <div className="bg-black/65 backdrop-blur-md border border-white/12 rounded-xl shadow-xl overflow-hidden min-w-[220px]">
          <button
            onClick={() => setShowRanking(v => !v)}
            className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
          >
            <span className="text-[11px] font-semibold text-white/85 uppercase tracking-wider">Classement patrimoine</span>
            <span className="text-white/60"><ChevronIcon expanded={showRanking} /></span>
          </button>

          {showRanking && (
            <div className="px-2 pb-2 space-y-1.5 fade-in-up">
              {ranking.map((entry, index) => (
                <div key={entry.player.id} className="bg-white/5 border border-white/8 rounded-lg px-2 py-1.5 flex items-center gap-2">
                  <span className="w-5 text-center text-[11px] font-bold text-white/70">#{index + 1}</span>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLOR_HEX[entry.player.color] ?? '#888' }} />
                  <span className="text-xs text-white/85 truncate max-w-[95px]">{entry.player.name}</span>
                  <span className="ml-auto text-xs font-bold text-emerald-300">{entry.wealth.toLocaleString()} €</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Plateau : centré, pleine taille min(100vh, 100vw) ── */}
      <div
        className="absolute"
        style={{
          width: 'min(100vh, 100vw)',
          height: 'min(100vh, 100vw)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Plateau rotatif */}
        <div
          className="absolute inset-0"
          style={{
            transform: `rotate(${boardRotation}deg)`,
            transition: 'transform 0.7s cubic-bezier(0.65,0,0.35,1)',
          }}
        >
          <Board
            players={animatedPlayers.map(p => ({
              id: p.id, name: p.name, color: p.color, position: p.position,
            }))}
            properties={gameState.properties}
            onCellClick={(i) => setSelectedCell(prev => prev === i ? null : i)}
            selectedCell={selectedCell}
            currentPlayerId={gameState.currentPlayerId}
            boostedPropertyId={gameState.freeParkingBoost?.propertyId ?? null}
          />
        </div>

        {/* EventBanner (hors rotation) */}
        <EventBanner events={gameState.log} />

        {/* CellInfoPanel */}
        {selectedCell !== null && (
          <CellInfoPanel
            cellIndex={selectedCell}
            property={gameState.properties.find(p => p.id === selectedCell)}
            players={gameState.players}
            onClose={() => setSelectedCell(null)}
          />
        )}

        {/* ── Overlay central : dés + contrôles ── */}
        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
          <div className="pointer-events-auto flex flex-col items-center gap-2 bg-black/55 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/10 shadow-2xl min-w-[200px] max-w-[260px]">

            {/* Indicateur de tour */}
            <div className={`w-full rounded-lg px-3 py-1.5 text-center ${
              isMyTurn ? 'bg-yellow-400/15 border border-yellow-400/30' : 'bg-white/5'
            }`}>
              <div className="flex items-center justify-center gap-1.5">
                {currentPlayer && (
                  <div className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLOR_HEX[currentPlayer.color] ?? '#888' }} />
                )}
                <span className="text-xs font-bold text-white/90 leading-none">
                  {isMyTurn ? 'Votre tour' : `${currentPlayer?.name ?? '...'} joue`}
                </span>
              </div>
              {gameState.doublesCount > 0 && (
                <div className="text-[10px] text-yellow-400 font-semibold mt-0.5">
                  Double x {gameState.doublesCount}
                </div>
              )}
              <div className="text-[9px] text-white/30 mt-0.5">Tour {gameState.turn}</div>
            </div>

            {/* Dés */}
            <Dice
              values={gameState.lastDice ?? null}
              onRoll={rollDice}
              isMyTurn={isMyTurn && !me?.isBankrupt}
              hasRolled={hasRolled}
              diceSize={52}
            />

            {/* Prison */}
            {isMyTurn && meInJail && (
              <div className="w-full space-y-1.5">
                <div className="text-[10px] text-orange-300 text-center font-medium">En TD</div>
                <button onClick={payJailFine}
                  className="w-full bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 py-1.5 rounded-lg text-xs font-semibold transition-all">
                  Payer 200 € et sortir
                </button>
                {(me?.getOutOfJailCards ?? 0) > 0 && (
                  <button onClick={useGetOutOfJailCard}
                    className="w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 py-1.5 rounded-lg text-xs font-semibold transition-all">
                    Utiliser la carte
                  </button>
                )}
              </div>
            )}

            {/* Achat propriété */}
            {canBuy && (
              <div className="w-full space-y-1.5">
                <button onClick={buyProperty}
                  className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold py-2 rounded-xl text-sm transition-all active:scale-95 shadow-md">
                  {buyLabel}
                </button>
                <button onClick={declineProperty}
                  className="w-full bg-white/6 hover:bg-white/10 border border-white/10 text-white/60 py-1.5 rounded-xl text-xs transition-all">
                  Enchères
                </button>
              </div>
            )}

            {/* Offre d'échange reçue */}
            {gameState.pendingTrade?.toPlayerId === myPlayerId && !showTrade && (
              <button onClick={() => setShowTrade(true)}
                className="w-full bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 rounded-xl p-2 text-left transition-all">
                <div className="text-[10px] font-bold text-purple-300 mb-0.5">Offre reçue</div>
                <div className="text-[9px] text-white/50">Voir l'échange proposé</div>
              </button>
            )}

            {/* Fin de tour + actions secondaires */}
            {canEndTurn && (
              <div className="w-full space-y-1">
                <button onClick={endTurn}
                  className="w-full bg-white/8 hover:bg-white/14 border border-white/12 text-white/80 py-2 rounded-xl text-xs font-semibold transition-all">
                  Fin du tour
                </button>
                <div className="flex gap-1.5">
                  <button onClick={() => setShowTrade(true)}
                    className="flex-1 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 py-1.5 rounded-lg text-[10px] font-medium transition-all">
                    Échanger
                  </button>
                  <button onClick={declareBankruptcy}
                    className="flex-1 text-red-900/60 hover:text-red-400 border border-red-900/20 hover:border-red-400/30 py-1.5 rounded-lg text-[10px] transition-colors">
                    Faillite
                  </button>
                </div>
              </div>
            )}

            {/* Bouton Journal */}
            <button
              onClick={() => setShowLog(v => !v)}
              className={`w-full py-1.5 rounded-lg text-[10px] font-medium transition-all border flex items-center justify-center gap-1 ${
                showLog
                  ? 'bg-blue-500/20 border-blue-400/30 text-blue-300'
                  : 'bg-white/5 border-white/8 text-white/40 hover:text-white/60'
              }`}
            >
              <span>Journal</span>
              <ChevronIcon expanded={showLog} />
            </button>
          </div>
        </div>


        {/* Drawer Journal */}
        {showLog && (
          <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-auto">
            <div className="bg-[#161920]/95 border border-white/10 rounded-t-2xl p-3" style={{ height: 220 }}>
              <GameLog events={gameState.log} />
            </div>
          </div>
        )}
      </div>

      {/* ── Cartes joueurs : coins de l'ÉCRAN, en dehors du plateau ── */}
      {gameState.players.map((player, i) => (
        <div
          key={player.id}
          className="absolute z-20 w-40"
          style={SCREEN_CORNERS[i] ?? SCREEN_CORNERS[3]}
        >
          <div className="relative">
            <div
              className="cursor-pointer"
              onClick={() => setSelectedPlayerId(prev => prev === player.id ? null : player.id)}
            >
              <PlayerCard
                player={player}
                properties={gameState.properties}
                isCurrentTurn={player.id === gameState.currentPlayerId}
                isMe={player.id === myPlayerId}
                corner
              />
            </div>
            {isHost && !player.isConnected && player.id !== myPlayerId && (
              <button
                onClick={() => socket.emit('kick_player', { targetPlayerId: player.id })}
                title="Exclure ce joueur déconnecté"
                className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-200 transition-colors text-[9px] font-bold"
              >
                <CloseIcon />
              </button>
            )}
          </div>
        </div>
      ))}

      {/* ── Panel détail joueur ── */}
      {selectedPlayerId && (() => {
        const idx = gameState.players.findIndex(p => p.id === selectedPlayerId)
        const player = gameState.players[idx]
        if (!player) return null
        return (
          <PlayerDetailPanel
            player={player}
            properties={gameState.properties}
            style={DETAIL_POSITIONS[idx] ?? DETAIL_POSITIONS[3]}
            onClose={() => setSelectedPlayerId(null)}
          />
        )
      })()}

      {/* ── Modale carte Chance / IZLY ── */}
      {shownCard && (
        <CardRevealModal
          deck={shownCard.deck}
          text={shownCard.text}
          image={shownCard.image}
          onClose={() => setShownCard(undefined)}
        />
      )}

      {/* ── Modale Jardin Japonais ── */}
      {isMyTurn && gameState.awaitingParkingChoice && me && (
        <FreeParkingModal
          gameState={gameState}
          me={me}
          onChoose={chooseParkingBoost}
          onDecline={declineParkingBoost}
        />
      )}

      {/* ── Modale d'échange ── */}
      {showTrade && (
        <TradeModal
          gameState={gameState}
          myPlayerId={myPlayerId ?? ''}
          onPropose={(offer: TradeOffer) => socket.emit('propose_trade', { offer })}
          onAccept={(id: string) => socket.emit('accept_trade', { tradeId: id })}
          onRefuse={(id: string) => socket.emit('refuse_trade', { tradeId: id })}
          onClose={() => setShowTrade(false)}
        />
      )}

      {/* ── Animation Allez en TD ── */}
      {showKarimTdAnim && (
        <div className="karim-td-overlay pointer-events-none">
          <img src={karimEnerveSrc} alt="Karim énervé" className="karim-td-image" />
          <div className="karim-td-text">Direction TD</div>
        </div>
      )}

      {/* ── Animation Facture / Taxe ── */}
      {billAnimLabel && (
        <div className="bill-overlay pointer-events-none">
          <div className="bill-chip">FACTURE</div>
          <div className="bill-title">{billAnimLabel}</div>
          <div className="bill-subtitle">Paiement en cours</div>
        </div>
      )}
    </div>
  )
}
