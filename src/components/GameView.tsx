import React, { useState, useEffect, useRef } from 'react'
import Board from './Board/Board'
import Dice from './UI/Dice'
import PlayerCard from './UI/PlayerCard'
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

const COLOR_HEX: Record<string, string> = {
  red: '#ef4444', blue: '#3b82f6', green: '#22c55e',
  yellow: '#eab308', purple: '#a855f7', orange: '#f97316',
}

// Taille de la zone réservée aux cartes joueurs dans chaque coin (px)
const CARD_ZONE = 160

// Positions des cartes dans les coins EN DEHORS du plateau
const CORNER_POSITIONS: React.CSSProperties[] = [
  { top: 0, left: 0 },           // 0: haut-gauche
  { top: 0, right: 0 },          // 1: haut-droit
  { bottom: 0, left: 0 },        // 2: bas-gauche
  { bottom: 0, right: 0 },       // 3: bas-droit
  { top: '33%', left: 0 },       // 4: côté gauche (5e joueur)
  { top: '33%', right: 0 },      // 5: côté droit  (6e joueur)
]

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
  const [boardRotation, setBoardRotation] = useState(0)
  const [shownCard, setShownCard] = useState<{ deck: 'chance'|'community'; text: string; image: string } | undefined>(undefined)
  const prevCardRef = useRef<string | undefined>(undefined)

  const animatedPlayers = useAnimatedPlayers(gameState?.players ?? [])

  useEffect(() => {
    if (!gameState?.lastCard) return
    const key = `${gameState.lastCard.image}-${gameState.lastCard.text}`
    if (key !== prevCardRef.current) {
      prevCardRef.current = key
      setShownCard(gameState.lastCard)
    }
  }, [gameState?.lastCard])

  if (!gameState) return null

  const me = gameState.players.find(p => p.id === myPlayerId)
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId)
  const cellAtMyPosition = gameState.properties.find(p => p.id === (me?.position ?? -1))
  // canBuy : uniquement si les dés ont été lancés CE tour (lastDice != null)
  const canBuy = isMyTurn && gameState.lastDice != null && !!cellAtMyPosition && !cellAtMyPosition.ownerId
  const meInJail = me?.inJail ?? false
  const hasRolled = !isMyTurn || (gameState.lastDice != null && gameState.doublesCount === 0)

  if (gameState.phase === 'ended') {
    const winner = gameState.players.find(p => !p.isBankrupt)
    return (
      <div className="h-screen flex items-center justify-center bg-[#0f1117]">
        <div className="text-center fade-in-up">
          <div className="text-8xl mb-6">🏆</div>
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
    <div className="h-screen w-screen bg-[#0f1117] flex items-center justify-center overflow-hidden">

      {/* ── Cadre principal : plateau central + coins pour les joueurs ── */}
      <div
        className="relative"
        style={{ width: 'min(100vh, 100vw)', height: 'min(100vh, 100vw)' }}
      >

        {/* ── Zone plateau (inset = CARD_ZONE de chaque côté) ── */}
        <div
          className="absolute"
          style={{ top: CARD_ZONE, left: CARD_ZONE, right: CARD_ZONE, bottom: CARD_ZONE }}
        >
          {/* Plateau rotatif */}
          <div
            className="absolute inset-0"
            style={{
              transform: `rotate(${boardRotation}deg)`,
              transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)',
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

          {/* ── Overlay central : dés + actions (pointer-events-none wrapper) ── */}
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
                    {isMyTurn ? '⭐ Votre tour !' : `${currentPlayer?.name ?? '…'} joue`}
                  </span>
                </div>
                {gameState.doublesCount > 0 && (
                  <div className="text-[10px] text-yellow-400 font-semibold mt-0.5">
                    🎯 Double × {gameState.doublesCount}
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
                  <div className="text-[10px] text-orange-300 text-center font-medium">🔒 En prison</div>
                  <button onClick={payJailFine}
                    className="w-full bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 py-1.5 rounded-lg text-xs font-semibold transition-all">
                    Payer 200 € et sortir
                  </button>
                  {(me?.getOutOfJailCards ?? 0) > 0 && (
                    <button onClick={useGetOutOfJailCard}
                      className="w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 py-1.5 rounded-lg text-xs font-semibold transition-all">
                      🃏 Utiliser la carte
                    </button>
                  )}
                </div>
              )}

              {/* Achat propriété */}
              {canBuy && (
                <div className="w-full space-y-1.5">
                  <button onClick={buyProperty}
                    className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold py-2 rounded-xl text-sm transition-all active:scale-95 shadow-md">
                    💰 Acheter
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
                  <div className="text-[10px] font-bold text-purple-300 mb-0.5">🤝 Offre reçue !</div>
                  <div className="text-[9px] text-white/50">Voir l'échange proposé</div>
                </button>
              )}

              {/* Fin de tour + actions secondaires */}
              {isMyTurn && !me?.isBankrupt && (
                <div className="w-full space-y-1">
                  <button onClick={endTurn}
                    className="w-full bg-white/8 hover:bg-white/14 border border-white/12 text-white/80 py-2 rounded-xl text-xs font-semibold transition-all">
                    Fin du tour →
                  </button>
                  <div className="flex gap-1.5">
                    <button onClick={() => setShowTrade(true)}
                      className="flex-1 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 py-1.5 rounded-lg text-[10px] font-medium transition-all">
                      🤝 Échanger
                    </button>
                    <button onClick={declareBankruptcy}
                      className="flex-1 text-red-900/60 hover:text-red-400 border border-red-900/20 hover:border-red-400/30 py-1.5 rounded-lg text-[10px] transition-colors">
                      Faillite
                    </button>
                  </div>
                </div>
              )}

              {/* Parc Gratuit */}
              {gameState.freeParkingPot > 0 && (
                <div className="w-full flex items-center justify-between px-1">
                  <span className="text-[10px] text-white/40">🅿️ Parc Gratuit</span>
                  <span className="text-xs font-bold text-yellow-400">
                    {gameState.freeParkingPot.toLocaleString()} €
                  </span>
                </div>
              )}

              {/* Bouton Journal */}
              <button
                onClick={() => setShowLog(v => !v)}
                className={`w-full py-1.5 rounded-lg text-[10px] font-medium transition-all border ${
                  showLog
                    ? 'bg-blue-500/20 border-blue-400/30 text-blue-300'
                    : 'bg-white/5 border-white/8 text-white/40 hover:text-white/60'
                }`}
              >
                📋 Journal {showLog ? '▲' : '▼'}
              </button>
            </div>
          </div>

          {/* Bouton rotation */}
          <button
            onClick={() => setBoardRotation(r => (r + 90) % 360)}
            title="Tourner le plateau"
            className="absolute z-50 bottom-2 right-2"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8, padding: '5px 9px',
              color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
              fontSize: 14, lineHeight: 1, backdropFilter: 'blur(8px)',
            }}
          >
            ↻
          </button>

          {/* Drawer Journal */}
          {showLog && (
            <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-auto">
              <div
                className="bg-[#161920]/95 border border-white/10 rounded-t-2xl p-3"
                style={{ height: 220 }}
              >
                <GameLog events={gameState.log} />
              </div>
            </div>
          )}
        </div>

        {/* ── Cartes joueurs dans les coins (EN DEHORS du plateau) ── */}
        {gameState.players.map((player, i) => (
          <div
            key={player.id}
            className="absolute z-20"
            style={{ ...CORNER_POSITIONS[i] ?? CORNER_POSITIONS[3], width: CARD_ZONE }}
          >
            <div className="relative p-1">
              <PlayerCard
                player={player}
                properties={gameState.properties}
                isCurrentTurn={player.id === gameState.currentPlayerId}
                isMe={player.id === myPlayerId}
                corner
              />
              {/* Bouton kick (hôte uniquement, joueur déconnecté) */}
              {isHost && !player.isConnected && player.id !== myPlayerId && (
                <button
                  onClick={() => socket.emit('kick_player', { targetPlayerId: player.id })}
                  title="Exclure ce joueur déconnecté"
                  className="absolute top-2 right-2 w-4 h-4 flex items-center justify-center rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-200 transition-colors text-[9px] font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}

      </div>

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
    </div>
  )
}
