import { useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import type { ServerToClientEvents, ClientToServerEvents } from '../../shared/types'

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? '/'

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null

export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (!socket) {
    socket = io(SERVER_URL, { transports: ['websocket', 'polling'] })
  }
  return socket
}

export function useSocket() {
  const socketRef = useRef(getSocket())
  return socketRef.current
}
