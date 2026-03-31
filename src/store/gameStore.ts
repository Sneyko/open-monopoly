import { create } from 'zustand'
import type { GameState } from '../../shared/types'

interface GameStore {
  gameState: GameState | null
  setGameState: (state: GameState) => void
  reset: () => void
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: null,
  setGameState: (gameState) => set({ gameState }),
  reset: () => set({ gameState: null }),
}))
