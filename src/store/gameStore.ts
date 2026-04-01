import { create } from 'zustand'
import type { GameState } from '../../shared/types'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'

interface GameStore {
  gameState: GameState | null
  setGameState: (state: GameState, myPlayerId?: string | null) => void
  reset: () => void
}

function extractAmount(message: string): number | null {
  const m = message.match(/(\d+)\s*€/)
  return m ? Number(m[1]) : null
}

function notifyEvent(message: string, eventPlayerId: string | undefined, myPlayerId?: string | null) {
  if (message.includes('paye') && message.includes('loyer')) {
    const amount = extractAmount(message)
    toast.error(amount ? `- ${amount}€ : Loyer payé` : 'Loyer payé')
  }

  if (message.includes('achète')) {
    const amount = extractAmount(message)
    toast.success(amount ? `Achat validé (-${amount}€)` : 'Achat validé')
  }

  if (message.includes('reçoit')) {
    const amount = extractAmount(message)
    toast.success(amount ? `+ ${amount}€ reçus` : 'Gain reçu')
  }

  if (myPlayerId && eventPlayerId === myPlayerId) {
    if (message.includes('passe par la case Départ') || message.includes('Jardin Japonais')) {
      confetti({
        particleCount: 90,
        spread: 60,
        origin: { y: 0.72 },
      })
    }
  }
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: null,
  setGameState: (gameState, myPlayerId) => set((state) => {
    const previous = state.gameState
    const previousLogLen = previous?.log.length ?? 0
    const newEvents = gameState.log.slice(previousLogLen)

    for (const event of newEvents) {
      notifyEvent(event.message, event.playerId, myPlayerId)
    }

    return { gameState }
  }),
  reset: () => set({ gameState: null }),
}))
