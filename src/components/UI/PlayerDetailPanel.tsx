import React from 'react'
import type { Player, Property } from '../../../shared/types'
import { CELLS, GROUP_COLORS } from '../Board/Board'
import c1 from '../../assets/c1.svg'

const PLAYER_COLOR_HEX: Record<string, string> = {
  red: '#ef4444', blue: '#3b82f6', green: '#22c55e',
  yellow: '#eab308', purple: '#a855f7', orange: '#f97316',
}

// Noms français des cases achetables (propriétés + clubs)
const CELL_NAMES: Record<number, string> = {
  1: 'Reynerie', 3: 'Bellefontaine',
  5: 'Nine', 6: 'Basso Cambo', 8: 'Mirail-Université', 9: 'Bagatelle',
  11: 'Trois Cocus', 13: 'Faculté de Pharmacie', 14: 'Borderouge',
  15: 'Café Pop', 16: 'Roseraie', 18: 'Jolimont', 19: 'Marengo-SNCF',
  21: "Patte d'Oie", 23: 'St-Cyprien', 24: 'Arènes',
  25: "O'club", 26: "Jeanne d'Arc", 27: 'Compans-Caffarelli',
  29: 'Palais de Justice', 31: 'François-Verdier', 32: 'Esquirol',
  34: 'Carmes', 35: 'Magma Club', 37: 'Capitole', 39: 'Jean-Jaurès',
}

interface Props {
  player: Player
  properties: Property[]
  style: React.CSSProperties
  onClose: () => void
}

export default function PlayerDetailPanel({ player, properties, style, onClose }: Props) {
  const owned = properties.filter(p => p.ownerId === player.id)
  const color = PLAYER_COLOR_HEX[player.color] ?? '#888'
  const houses = owned.reduce((s, p) => s + p.houses, 0)
  const hotels = owned.filter(p => p.hotel).length

  return (
    <>
      <style>{`
        @keyframes pdpIn {
          from { opacity: 0; transform: translateY(6px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)  scale(1); }
        }
      `}</style>
      <div
        className="absolute z-30 w-52 rounded-2xl overflow-hidden shadow-2xl"
        style={{
          ...style,
          background: '#13151c',
          border: '1px solid rgba(255,255,255,0.10)',
          animation: 'pdpIn 0.18s cubic-bezier(0.34,1.56,0.64,1) forwards',
        }}
      >
        {/* ── Header ── */}
        <div
          className="relative px-3 py-2.5 flex items-center gap-2"
          style={{ background: `${color}18`, borderBottom: `1.5px solid ${color}33` }}
        >
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-white/20"
            style={{ backgroundColor: color }} />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white text-xs leading-none truncate">{player.name}</div>
            <div className="text-emerald-400 font-black text-sm leading-tight mt-0.5">
              {player.money.toLocaleString()} €
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-white/40 mr-1">
            {houses > 0 && <span className="text-green-400">🏠{houses}</span>}
            {hotels > 0 && <span className="text-red-400">🏨{hotels}</span>}
          </div>
          <button
            onClick={onClose}
            className="text-white/25 hover:text-white/70 transition-colors flex-shrink-0"
            aria-label="Fermer"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* ── Body scrollable ── */}
        <div className="overflow-y-auto" style={{ maxHeight: 300 }}>

          {/* Cartes en stock (sorties du TD) */}
          {player.getOutOfJailCards > 0 && (
            <div className="px-3 pt-2.5 pb-2">
              <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">
                Cartes en stock
              </div>
              <div className="flex gap-2 flex-wrap">
                {Array.from({ length: player.getOutOfJailCards }).map((_, i) => (
                  <div
                    key={i}
                    className="relative rounded-lg overflow-hidden shadow-lg"
                    style={{
                      width: 52, height: 74,
                      border: '1px solid rgba(255,255,255,0.18)',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={c1}
                      alt="Libéré du TD"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-black/65 text-center py-0.5">
                      <span className="text-[7px] font-bold text-amber-300 leading-none">Libéré du TD</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Propriétés */}
          <div className="px-3 pt-2.5 pb-3">
            {owned.length > 0 ? (
              <>
                <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1.5">
                  Propriétés · {owned.length}
                </div>
                <div className="space-y-1">
                  {owned.map(p => {
                    const cell = CELLS.find(c => c.index === p.id)
                    const bg = cell?.colorGroup ? GROUP_COLORS[cell.colorGroup] : '#555'
                    const name = CELL_NAMES[p.id] ?? cell?.name ?? `#${p.id}`
                    const isRailroad = cell?.type === 'railroad'
                    return (
                      <div
                        key={p.id}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                      >
                        {/* Bande couleur */}
                        <div
                          className="w-1 h-8 rounded-full flex-shrink-0"
                          style={{ backgroundColor: bg }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-semibold text-white/85 truncate leading-tight">
                            {name}
                          </div>
                          <div className="text-[9px] mt-0.5">
                            {p.mortgaged ? (
                              <span className="text-orange-400">Hypothéquée</span>
                            ) : p.hotel ? (
                              <span className="text-red-400">🏨 Hôtel</span>
                            ) : p.houses > 0 ? (
                              <span className="text-green-400">{'🏠'.repeat(p.houses)}</span>
                            ) : isRailroad ? (
                              <span className="text-white/30">🚉 Club</span>
                            ) : (
                              <span className="text-white/25">—</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="text-center text-[11px] text-white/25 py-3">
                Aucune propriété
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
