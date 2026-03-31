import { useEffect, useRef, useState } from 'react'
import type { Player } from '../../shared/types'

/**
 * Anime les pions case par case lors d'un déplacement.
 * Retourne un tableau de joueurs dont la position est la position visuelle animée.
 * La vitesse est adaptée au nombre de cases à parcourir (~1s max).
 */
export function useAnimatedPlayers(players: Player[]): Player[] {
  // Map playerId → position affichée (peut être en cours d'animation)
  const [animPos, setAnimPos] = useState<Record<string, number>>(() =>
    Object.fromEntries(players.map(p => [p.id, p.position]))
  )

  // Map playerId → dernière position réelle connue (cible actuelle)
  const prevRealPos = useRef<Record<string, number>>(
    Object.fromEntries(players.map(p => [p.id, p.position]))
  )

  // Timers en cours par joueur
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  // Ref pour éviter les mises à jour sur composant démonté
  const mounted = useRef(true)
  useEffect(() => () => {
    mounted.current = false
    Object.values(timers.current).forEach(clearTimeout)
  }, [])

  useEffect(() => {
    for (const player of players) {
      const prevPos = prevRealPos.current[player.id]

      if (prevPos === undefined) {
        // Nouveau joueur : positionner immédiatement sans animation
        prevRealPos.current[player.id] = player.position
        setAnimPos(p => ({ ...p, [player.id]: player.position }))
        continue
      }

      if (prevPos === player.position) {
        // Position inchangée : synchronise les autres données sans bouger le pion
        continue
      }

      // Position changée → animation
      const from = prevPos
      const to   = player.position
      prevRealPos.current[player.id] = to

      // Chemin en avant sur le plateau (0-39, circulaire)
      const path: number[] = []
      let cur = from
      while (cur !== to) {
        cur = (cur + 1) % 40
        path.push(cur)
      }

      // Délai par case : entre 80ms et 150ms, total visé ~1s max
      const delay = Math.max(80, Math.min(150, 1000 / path.length))

      // Annule l'animation précédente pour ce joueur
      clearTimeout(timers.current[player.id])

      const playerId = player.id
      let step = 0

      // Démarre après un léger délai pour laisser l'animation des dés se terminer
      const run = () => {
        if (!mounted.current) return
        if (step >= path.length) return

        const pos = path[step++]
        setAnimPos(prev => ({ ...prev, [playerId]: pos }))

        if (step < path.length) {
          timers.current[playerId] = setTimeout(run, delay)
        }
      }

      timers.current[playerId] = setTimeout(run, 500)
    }
  }, [players])

  // Retourne les joueurs avec leur position animée
  return players.map(p => ({
    ...p,
    position: animPos[p.id] ?? p.position,
  }))
}
