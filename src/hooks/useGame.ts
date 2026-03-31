import { useSocket } from './useSocket'
import { useGameStore } from '../store/gameStore'
import { useRoomStore } from '../store/roomStore'

export function useGame() {
  const socket = useSocket()
  const gameState = useGameStore(s => s.gameState)
  const myPlayerId = useRoomStore(s => s.myPlayerId)

  const isMyTurn = gameState?.currentPlayerId === myPlayerId

  function rollDice() { socket.emit('roll_dice') }
  function buyProperty() { socket.emit('buy_property') }
  function declineProperty() { socket.emit('decline_property') }
  function endTurn() { socket.emit('end_turn') }
  function payJailFine() { socket.emit('pay_jail_fine') }
  function useGetOutOfJailCard() { socket.emit('use_get_out_of_jail_card') }
  function declareBankruptcy() { socket.emit('declare_bankruptcy') }
  function mortgageProperty(propertyId: number) { socket.emit('mortgage_property', { propertyId }) }
  function unmortgageProperty(propertyId: number) { socket.emit('unmortgage_property', { propertyId }) }
  function buildHouse(propertyId: number) { socket.emit('build_house', { propertyId }) }
  function sellHouse(propertyId: number) { socket.emit('sell_house', { propertyId }) }

  return {
    gameState,
    myPlayerId,
    isMyTurn,
    rollDice,
    buyProperty,
    declineProperty,
    endTurn,
    payJailFine,
    useGetOutOfJailCard,
    declareBankruptcy,
    mortgageProperty,
    unmortgageProperty,
    buildHouse,
    sellHouse,
  }
}
