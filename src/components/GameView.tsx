import React, { useState, useEffect, useRef } from 'react'
import Board from './Board/Board'
import Dice from './UI/Dice'
import PlayerCard from './UI/PlayerCard'
import GameLog from './UI/GameLog'
import TradeModal from './UI/TradeModal'
import CellInfoPanel from './UI/CellInfoPanel'
import CardRevealModal from './UI/CardRevealModal'
import EventBanner from './UI/EventBanner'
import { useGame } from '../hooks/useGame'
import { useSocket } from '../hooks/useSocket'
import { useAnimatedPlayers } from '../hooks/useAnimatedPlayers'
import { useRoomStore } from '../store/roomStore'
import type { TradeOffer } from '../../shared/types'

const COLOR_HEX: Record<string, string> = {
  red: '#ef4444', blue: '#3b82f6', green: '#22c55e',
  yellow: '#eab308', purple: '#a855f7', orange: '#f97316',
}

export default function GameView() {
  const {
    gameState, myPlayerId, isMyTurn,
    rollDice, buyProperty, declineProperty, endTurn,
    payJailFine, useGetOutOfJailCard, declareBankruptcy,
  } = useGame()
  const socket = useSocket()
  const { room } = useRoomStore()
  const isHost = room?.hostId === myPlayerId
  const [showTrade, setShowTrade] = useState(false)
  const [selectedCell, setSelectedCell] = useState<number | null>(null)
  const [boardRotation, setBoardRotation] = useState(0)
  const [shownCard, setShownCard] = useState<{ deck: 'chance'|'community'; text: string; image: string } | undefined>(undefined)
  const prevCardRef = useRef<string | undefined>(undefined)

  const animatedPlayers = useAnimatedPlayers(gameState?.players ?? [])

  // Déclenche la modale quand lastCard change (nouvelle carte tirée)
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
  const canBuy = isMyTurn && !!cellAtMyPosition && !cellAtMyPosition.ownerId
  const meInJail = me?.inJail ?? false
  // A lancé les dés si lastDice est défini ET qu'on n'a pas fait de double (le double autorise à relancer)
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
    <div className="h-screen flex overflow-hidden bg-[#0f1117]">

      {/* ── Plateau (dominant) ── */}
      <div className="flex-1 flex items-center justify-center p-3 min-w-0">
        <div style={{ width: 'min(calc(100vh - 1.5rem), calc(100vw - 320px))', aspectRatio: '1', position: 'relative' }}>
          {/* Bouton rotation */}
          <button
            onClick={() => setBoardRotation(r => (r + 90) % 360)}
            title="Tourner le plateau"
            style={{
              position: 'absolute', top: 6, right: 6, zIndex: 50,
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px', padding: '6px 10px', color: 'white', cursor: 'pointer',
              fontSize: '16px', lineHeight: 1, backdropFilter: 'blur(8px)',
              transition: 'background 0.2s',
            }}
          >
            ↻
          </button>

          {/* Plateau rotatif */}
          <div style={{
            width: '100%', height: '100%',
            transform: `rotate(${boardRotation}deg)`,
            transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)',
          }}>
            <Board
              players={animatedPlayers.map(p => ({
                id: p.id, name: p.name, color: p.color, position: p.position,
              }))}
              properties={gameState.properties}
              onCellClick={(i) => setSelectedCell(prev => prev === i ? null : i)}
              selectedCell={selectedCell}
              currentPlayerId={gameState.currentPlayerId}
            />
          </div>

          {/* EventBanner — centré, hors rotation */}
          <EventBanner events={gameState.log} />

          {selectedCell !== null && (
            <CellInfoPanel
              cellIndex={selectedCell}
              property={gameState.properties.find(p => p.id === selectedCell)}
              players={gameState.players}
              onClose={() => setSelectedCell(null)}
            />
          )}
        </div>
      </div>

      {/* ── Sidebar droite ── */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-2 p-3 overflow-y-auto border-l border-white/6">

        {/* Tour en cours */}
        <div className={`rounded-xl p-3 border ${isMyTurn
          ? 'bg-yellow-400/10 border-yellow-400/40'
          : 'bg-white/4 border-white/8'}`}>
          <div className="flex items-center gap-2">
            {currentPlayer && (
              <div className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: COLOR_HEX[currentPlayer.color] ?? '#888' }} />
            )}
            <div className="min-w-0">
              <div className="text-xs text-white/40 leading-none mb-0.5">Tour {gameState.turn}</div>
              <div className="font-bold text-sm text-white truncate">
                {isMyTurn ? '⭐ Votre tour !' : `${currentPlayer?.name ?? '…'} joue`}
              </div>
            </div>
          </div>
          {gameState.doublesCount > 0 && (
            <div className="mt-1.5 text-xs text-yellow-400 font-semibold">
              🎯 Double × {gameState.doublesCount} — rejoue !
            </div>
          )}
        </div>

        {/* Dés + actions principales */}
        <div className="bg-white/4 border border-white/8 rounded-xl p-4">
          <Dice
            values={gameState.lastDice ?? null}
            onRoll={rollDice}
            isMyTurn={isMyTurn && !me?.isBankrupt}
            hasRolled={hasRolled}
          />

          {/* Prison */}
          {isMyTurn && meInJail && (
            <div className="mt-3 space-y-2">
              <div className="text-xs text-orange-300 text-center font-medium">🔒 Vous êtes en prison</div>
              <button onClick={payJailFine}
                className="w-full bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 py-2 rounded-lg text-sm font-semibold transition-all">
                Payer 50 € et sortir
              </button>
              {(me?.getOutOfJailCards ?? 0) > 0 && (
                <button onClick={useGetOutOfJailCard}
                  className="w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 py-2 rounded-lg text-sm font-semibold transition-all">
                  🃏 Utiliser la carte
                </button>
              )}
            </div>
          )}

          {/* Achat propriété */}
          {canBuy && (
            <div className="mt-3 space-y-2">
              <div className="text-xs text-center text-white/50">
                Case {me?.position} disponible à l'achat
              </div>
              <button onClick={buyProperty}
                className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold py-2.5 rounded-xl transition-all active:scale-95 shadow-md">
                💰 Acheter
              </button>
              <button onClick={declineProperty}
                className="w-full bg-white/6 hover:bg-white/10 border border-white/10 text-white/60 py-2 rounded-xl text-sm transition-all">
                Enchères
              </button>
            </div>
          )}

          {/* Fin de tour */}
          {isMyTurn && !me?.isBankrupt && (
            <div className="mt-3 space-y-1.5">
              <button onClick={() => setShowTrade(true)}
                className="w-full bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 py-2 rounded-xl text-sm font-medium transition-all">
                🤝 Proposer un échange
              </button>
              <button onClick={endTurn}
                className="w-full bg-white/6 hover:bg-white/10 border border-white/10 text-white/70 py-2 rounded-xl text-sm transition-all">
                Fin du tour →
              </button>
              <button onClick={declareBankruptcy}
                className="w-full text-red-900/60 hover:text-red-400 py-1 rounded text-xs transition-colors">
                Déclarer faillite
              </button>
            </div>
          )}
        </div>

        {/* Offre d'échange en attente */}
        {gameState.pendingTrade?.toPlayerId === myPlayerId && !showTrade && (
          <button onClick={() => setShowTrade(true)}
            className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 rounded-xl p-3 text-left transition-all fade-in-up">
            <div className="text-xs font-bold text-purple-300 mb-0.5">🤝 Offre reçue !</div>
            <div className="text-xs text-white/50">Cliquez pour voir l'échange proposé</div>
          </button>
        )}

        {/* Parc gratuit */}
        {gameState.freeParkingPot > 0 && (
          <div className="bg-white/4 border border-white/8 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-xs text-white/40">🅿️ Parc Gratuit</span>
            <span className="text-sm font-bold text-yellow-400">
              {gameState.freeParkingPot.toLocaleString()} €
            </span>
          </div>
        )}

        {/* Joueurs */}
        <div className="space-y-1.5">
          {gameState.players.map(player => (
            <div key={player.id} className="relative group">
              <PlayerCard
                player={player}
                properties={gameState.properties}
                isCurrentTurn={player.id === gameState.currentPlayerId}
                isMe={player.id === myPlayerId}
              />
              {/* Bouton kick : hôte uniquement, joueur déconnecté, pas soi-même */}
              {isHost && !player.isConnected && player.id !== myPlayerId && (
                <button
                  onClick={() => socket.emit('kick_player', { targetPlayerId: player.id })}
                  title="Exclure ce joueur déconnecté"
                  className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-200 transition-colors text-[10px] font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Journal */}
        <div className="flex-1 min-h-0 bg-white/3 border border-white/6 rounded-xl p-3" style={{ minHeight: '160px', maxHeight: '220px' }}>
          <GameLog events={gameState.log} />
        </div>
      </div>

      {/* Modale carte Chance / IZLY */}
      {shownCard && (
        <CardRevealModal
          deck={shownCard.deck}
          text={shownCard.text}
          image={shownCard.image}
          onClose={() => setShownCard(undefined)}
        />
      )}

      {/* Modale d'échange */}
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
