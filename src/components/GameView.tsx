import React, { useState } from 'react'
import Board from './Board/Board'
import Dice from './UI/Dice'
import PlayerCard from './UI/PlayerCard'
import GameLog from './UI/GameLog'
import TradeModal from './UI/TradeModal'
import { useGame } from '../hooks/useGame'
import { useSocket } from '../hooks/useSocket'
import type { TradeOffer } from '../../shared/types'

export default function GameView() {
  const {
    gameState, myPlayerId, isMyTurn,
    rollDice, buyProperty, declineProperty, endTurn,
    payJailFine, useGetOutOfJailCard, declareBankruptcy,
    mortgageProperty, unmortgageProperty, buildHouse, sellHouse,
  } = useGame()
  const socket = useSocket()

  const [showTrade, setShowTrade] = useState(false)
  const [selectedPropId, setSelectedPropId] = useState<number | null>(null)

  if (!gameState) return null

  const me = gameState.players.find(p => p.id === myPlayerId)
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId)
  const myPosition = me?.position ?? 0
  const cellAtMyPosition = gameState.properties.find(p => p.id === myPosition)
  const canBuyCurrentCell = isMyTurn && cellAtMyPosition && !cellAtMyPosition.ownerId

  // Dernière action possible : en prison
  const meInJail = me?.inJail ?? false

  if (gameState.phase === 'ended') {
    const winner = gameState.players.find(p => !p.isBankrupt)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-4xl font-bold text-yellow-300 mb-2">
            {winner?.name ?? 'Personne'} remporte la partie !
          </h1>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-xl font-bold"
          >
            Rejouer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 flex gap-4">
      {/* Plateau */}
      <div className="flex-shrink-0">
        <Board
          players={gameState.players.map(p => ({
            id: p.id,
            name: p.name,
            color: p.color,
            position: p.position,
          }))}
          properties={gameState.properties}
          onCellClick={idx => setSelectedPropId(selectedPropId === idx ? null : idx)}
        />
      </div>

      {/* Panneau de droite */}
      <div className="flex-1 flex flex-col gap-3 min-w-0 max-w-xs">
        {/* Info tour */}
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="text-sm text-gray-400">Tour {gameState.turn}</div>
          <div className="font-bold text-lg">
            {isMyTurn ? '⭐ Votre tour !' : `Tour de ${currentPlayer?.name ?? '…'}`}
          </div>
          {gameState.doublesCount > 0 && (
            <div className="text-yellow-400 text-sm">Double × {gameState.doublesCount} !</div>
          )}
        </div>

        {/* Dés */}
        {gameState.lastDice && (
          <div className="bg-gray-800 rounded-xl p-3">
            <Dice values={gameState.lastDice} />
          </div>
        )}

        {/* Actions */}
        {isMyTurn && !me?.isBankrupt && (
          <div className="bg-gray-800 rounded-xl p-4 space-y-2">
            <div className="text-sm text-gray-400 font-semibold mb-1">Actions</div>

            {/* Prison */}
            {meInJail && (
              <>
                <button onClick={payJailFine}
                  className="w-full bg-orange-600 hover:bg-orange-700 py-2 rounded-lg text-sm font-semibold">
                  Payer {50} F (sortir de prison)
                </button>
                {(me?.getOutOfJailCards ?? 0) > 0 && (
                  <button onClick={useGetOutOfJailCard}
                    className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg text-sm font-semibold">
                    Utiliser carte sortie de prison
                  </button>
                )}
              </>
            )}

            <button onClick={rollDice}
              className="w-full bg-green-600 hover:bg-green-700 py-2 rounded-lg font-semibold">
              🎲 Lancer les dés
            </button>

            {canBuyCurrentCell && (
              <>
                <button onClick={buyProperty}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 py-2 rounded-lg font-semibold text-black">
                  💰 Acheter la propriété
                </button>
                <button onClick={declineProperty}
                  className="w-full bg-gray-600 hover:bg-gray-700 py-2 rounded-lg text-sm">
                  Passer aux enchères
                </button>
              </>
            )}

            <button onClick={() => setShowTrade(true)}
              className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded-lg text-sm">
              🤝 Échange
            </button>

            <button onClick={endTurn}
              className="w-full bg-gray-600 hover:bg-gray-700 py-2 rounded-lg text-sm">
              Fin du tour
            </button>

            <button onClick={declareBankruptcy}
              className="w-full bg-red-800 hover:bg-red-900 py-1 rounded text-xs text-gray-400">
              Déclarer faillite
            </button>
          </div>
        )}

        {/* Réception d'échange */}
        {gameState.pendingTrade?.toPlayerId === myPlayerId && !showTrade && (
          <div className="bg-purple-900/50 border border-purple-500 rounded-xl p-3">
            <div className="text-sm font-semibold mb-2">Offre d'échange reçue !</div>
            <button onClick={() => setShowTrade(true)}
              className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded text-sm">
              Voir l'offre
            </button>
          </div>
        )}

        {/* Joueurs */}
        <div className="space-y-2 flex-1 overflow-y-auto">
          {gameState.players.map(player => (
            <PlayerCard
              key={player.id}
              player={player}
              properties={gameState.properties}
              isCurrentTurn={player.id === gameState.currentPlayerId}
              isMe={player.id === myPlayerId}
            />
          ))}
        </div>

        {/* Infos financières */}
        <div className="bg-gray-800 rounded-xl p-3 text-xs text-gray-400">
          <div>Parc Gratuit : <span className="text-yellow-300 font-bold">{gameState.freeParkingPot} F</span></div>
        </div>

        {/* Journal */}
        <GameLog events={gameState.log} />
      </div>

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
