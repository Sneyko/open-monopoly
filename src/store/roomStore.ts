import { create } from 'zustand'
import type { RoomInfo, PlayerColor } from '../../shared/types'

interface RoomStore {
  room: RoomInfo | null
  myPlayerId: string | null
  myName: string
  myColor: PlayerColor
  setRoom: (room: RoomInfo) => void
  setMyPlayerId: (id: string) => void
  setMyName: (name: string) => void
  setMyColor: (color: PlayerColor) => void
  reset: () => void
}

export const useRoomStore = create<RoomStore>((set) => ({
  room: null,
  myPlayerId: null,
  myName: '',
  myColor: 'red',
  setRoom: (room) => set({ room }),
  setMyPlayerId: (id) => set({ myPlayerId: id }),
  setMyName: (name) => set({ myName: name }),
  setMyColor: (color) => set({ myColor: color }),
  reset: () => set({ room: null, myPlayerId: null }),
}))
