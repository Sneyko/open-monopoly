import React, { useState } from 'react'
import type { GameState, TradeOffer } from '../../../shared/types'
import { nanoid } from 'nanoid'

interface TradeModalProps {
  gameState: GameState
  myPlayerId: string
  onPropose: (offer: TradeOffer) => void
  onAccept: (tradeId: string) => void
  onRefuse: (tradeId: string) => void
  onClose: () => void
}

export default function TradeModal({
  gameState, myPlayerId, onPropose, onAccept, onRefuse, onClose,
}: TradeModalProps) {
  const [targetId, setTargetId] = useState('')
  const [offerMoney, setOfferMoney] = useState(0)
  const [requestMoney, setRequestMoney] = useState(0)
  const [offerProps, setOfferProps] = useState<number[]>([])
  const [requestProps, setRequestProps] = useState<number[]>([])

  const otherPlayers = gameState.players.filter(p => p.id !== myPlayerId && !p.isBankrupt)
  const myProps = gameState.properties.filter(p => p.ownerId === myPlayerId && !p.mortgaged)
  const targetProps = gameState.properties.filter(p => p.ownerId === targetId && !p.mortgaged)

  const pendingTrade = gameState.pendingTrade
  const isTarget = pendingTrade?.toPlayerId === myPlayerId

  function toggleProp(propId: number, list: number[], setter: (l: number[]) => void) {
    setter(list.includes(propId) ? list.filter(x => x !== propId) : [...list, propId])
  }

  function handlePropose() {
    if (!targetId) return
    const offer: TradeOffer = {
      id: nanoid(),
      fromPlayerId: myPlayerId,
      toPlayerId: targetId,
      offer: { money: offerMoney, propertyIds: offerProps, getOutOfJailCards: 0 },
      request: { money: requestMoney, propertyIds: requestProps, getOutOfJailCards: 0 },
    }
    onPropose(offer)
    onClose()
  }

  if (isTarget && pendingTrade) {
    const from = gameState.players.find(p => p.id === pendingTrade.fromPlayerId)
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-xl p-6 w-96 max-w-full">
          <h2 className="text-xl font-bold mb-4">Offre d'échange de {from?.name}</h2>
          <div className="text-sm space-y-2 mb-4">
            <div>Il offre : {pendingTrade.offer.money} F + {pendingTrade.offer.propertyIds.length} propriété(s)</div>
            <div>Il demande : {pendingTrade.request.money} F + {pendingTrade.request.propertyIds.length} propriété(s)</div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { onAccept(pendingTrade.id); onClose() }}
              className="flex-1 bg-green-600 py-2 rounded font-semibold hover:bg-green-700">
              Accepter
            </button>
            <button onClick={() => { onRefuse(pendingTrade.id); onClose() }}
              className="flex-1 bg-red-600 py-2 rounded font-semibold hover:bg-red-700">
              Refuser
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-[480px] max-w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Proposer un échange</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">Avec quel joueur ?</label>
          <select
            value={targetId}
            onChange={e => setTargetId(e.target.value)}
            className="w-full bg-gray-700 rounded px-3 py-2 text-sm"
          >
            <option value="">-- Choisir --</option>
            {otherPlayers.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm text-gray-400 mb-2">Je donne</div>
            <input
              type="number" min={0} value={offerMoney}
              onChange={e => setOfferMoney(Number(e.target.value))}
              className="w-full bg-gray-700 rounded px-3 py-1 text-sm mb-2"
              placeholder="Argent (F)"
            />
            {myProps.map(p => (
              <label key={p.id} className="flex items-center gap-2 text-xs py-0.5 cursor-pointer">
                <input type="checkbox" checked={offerProps.includes(p.id)}
                  onChange={() => toggleProp(p.id, offerProps, setOfferProps)} />
                Case {p.id}
              </label>
            ))}
          </div>

          <div>
            <div className="text-sm text-gray-400 mb-2">Je reçois</div>
            <input
              type="number" min={0} value={requestMoney}
              onChange={e => setRequestMoney(Number(e.target.value))}
              className="w-full bg-gray-700 rounded px-3 py-1 text-sm mb-2"
              placeholder="Argent (F)"
            />
            {targetProps.map(p => (
              <label key={p.id} className="flex items-center gap-2 text-xs py-0.5 cursor-pointer">
                <input type="checkbox" checked={requestProps.includes(p.id)}
                  onChange={() => toggleProp(p.id, requestProps, setRequestProps)} />
                Case {p.id}
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handlePropose}
          disabled={!targetId}
          className="w-full bg-blue-600 py-2 rounded font-semibold hover:bg-blue-700 disabled:opacity-40"
        >
          Proposer l'échange
        </button>
      </div>
    </div>
  )
}
