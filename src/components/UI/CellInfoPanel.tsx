import React from 'react'
import type { Property, Player } from '../../../shared/types'

const PLAYER_COLOR_HEX: Record<string, string> = {
  red: '#ef4444', blue: '#3b82f6', green: '#22c55e',
  yellow: '#eab308', purple: '#a855f7', orange: '#f97316',
}

// ─── Données des cases (noms GAMES.md + loyers gameEngine) ───────────────────

interface CellInfo {
  index: number
  name: string
  type: 'property' | 'railroad' | 'utility' | 'tax' | 'chance' | 'community'
        | 'go' | 'jail' | 'free-parking' | 'go-to-jail'
  colorGroup?: string
  colorHex?: string
  price?: number
  rents?: number[]       // [base, 1m, 2m, 3m, 4m, hôtel]
  rentRailroad?: number  // multiplicateur gare
  mortgage?: number
  houseCost?: number
  tax?: number
  description?: string
}

const GROUP_HEX: Record<string, string> = {
  brown:      '#8B5E3C',
  'light-blue': '#81D4FA',
  pink:       '#F06292',
  orange:     '#FF8A65',
  red:        '#E53935',
  yellow:     '#FDD835',
  green:      '#43A047',
  'dark-blue': '#1565C0',
}

const CELL_INFO: CellInfo[] = [
  { index: 0,  name: 'DÉPART',               type: 'go',          description: 'Recevez 200 € en passant par cette case.' },
  { index: 1,  name: 'Reynerie',              type: 'property',    colorGroup: 'brown',      colorHex: GROUP_HEX.brown,       price: 60,  rents: [2,10,30,90,160,250],     mortgage: 30,  houseCost: 50 },
  { index: 2,  name: 'Caisse IZLY',           type: 'community',   description: 'Piochez une carte IZLY.' },
  { index: 3,  name: 'Bellefontaine',         type: 'property',    colorGroup: 'brown',      colorHex: GROUP_HEX.brown,       price: 60,  rents: [4,20,60,180,320,450],    mortgage: 30,  houseCost: 50 },
  { index: 4,  name: 'Gemini Mensuel',        type: 'tax',         tax: 200,  description: 'Payez 200 €.' },
  { index: 5,  name: 'Nine',                  type: 'railroad',    price: 200, rents: [25,50,100,200], mortgage: 100, description: 'Club étudiant' },
  { index: 6,  name: 'Basso Cambo',           type: 'property',    colorGroup: 'light-blue', colorHex: GROUP_HEX['light-blue'],price: 100, rents: [6,30,90,270,400,550],    mortgage: 50,  houseCost: 50 },
  { index: 7,  name: 'Chance',                type: 'chance',      description: 'Piochez une carte Chance.' },
  { index: 8,  name: 'Mirail-Université',     type: 'property',    colorGroup: 'light-blue', colorHex: GROUP_HEX['light-blue'],price: 100, rents: [6,30,90,270,400,550],    mortgage: 50,  houseCost: 50 },
  { index: 9,  name: 'Bagatelle',             type: 'property',    colorGroup: 'light-blue', colorHex: GROUP_HEX['light-blue'],price: 120, rents: [8,40,100,300,450,600],   mortgage: 60,  houseCost: 50 },
  { index: 10, name: 'EN TD / Simple Visite', type: 'jail',        description: 'Simple visite ou en TD.' },
  { index: 11, name: 'Trois Cocus',           type: 'property',    colorGroup: 'pink',       colorHex: GROUP_HEX.pink,        price: 140, rents: [10,50,150,450,625,750],  mortgage: 70,  houseCost: 100 },
  { index: 12, name: 'Tisséo Pastel',         type: 'tax',         tax: 150,  description: 'Payez 150 € à chaque passage.' },
  { index: 13, name: 'Faculté de Pharmacie',  type: 'property',    colorGroup: 'pink',       colorHex: GROUP_HEX.pink,        price: 140, rents: [10,50,150,450,625,750],  mortgage: 70,  houseCost: 100 },
  { index: 14, name: 'Borderouge',            type: 'property',    colorGroup: 'pink',       colorHex: GROUP_HEX.pink,        price: 160, rents: [12,60,180,500,700,900],  mortgage: 80,  houseCost: 100 },
  { index: 15, name: 'Café Pop',              type: 'railroad',    price: 200, rents: [25,50,100,200], mortgage: 100, description: 'Club étudiant' },
  { index: 16, name: 'Roseraie',              type: 'property',    colorGroup: 'orange',     colorHex: GROUP_HEX.orange,      price: 180, rents: [14,70,200,550,750,950],  mortgage: 90,  houseCost: 100 },
  { index: 17, name: 'Caisse IZLY',           type: 'community',   description: 'Piochez une carte IZLY.' },
  { index: 18, name: 'Jolimont',              type: 'property',    colorGroup: 'orange',     colorHex: GROUP_HEX.orange,      price: 180, rents: [14,70,200,550,750,950],  mortgage: 90,  houseCost: 100 },
  { index: 19, name: 'Marengo-SNCF',          type: 'property',    colorGroup: 'orange',     colorHex: GROUP_HEX.orange,      price: 200, rents: [16,80,220,600,800,1000], mortgage: 100, houseCost: 100 },
  { index: 20, name: 'Jardin Japonais',       type: 'free-parking',description: 'Choisissez une de vos propriétés pour tripler son loyer (×3) jusqu\'à votre prochain passage.' },
  { index: 21, name: 'Patte d\'Oie',          type: 'property',    colorGroup: 'red',        colorHex: GROUP_HEX.red,         price: 220, rents: [18,90,250,700,875,1050], mortgage: 110, houseCost: 150 },
  { index: 22, name: 'Chance',                type: 'chance',      description: 'Piochez une carte Chance.' },
  { index: 23, name: 'St-Cyprien',            type: 'property',    colorGroup: 'red',        colorHex: GROUP_HEX.red,         price: 220, rents: [18,90,250,700,875,1050], mortgage: 110, houseCost: 150 },
  { index: 24, name: 'Arènes',               type: 'property',    colorGroup: 'red',        colorHex: GROUP_HEX.red,         price: 240, rents: [20,100,300,750,925,1100], mortgage: 120, houseCost: 150 },
  { index: 25, name: 'O\'club',               type: 'railroad',    price: 200, rents: [25,50,100,200], mortgage: 100, description: 'Club étudiant' },
  { index: 26, name: 'Jeanne d\'Arc',         type: 'property',    colorGroup: 'yellow',     colorHex: GROUP_HEX.yellow,      price: 260, rents: [22,110,330,800,975,1150], mortgage: 130, houseCost: 150 },
  { index: 27, name: 'Compans-Caffarelli',    type: 'property',    colorGroup: 'yellow',     colorHex: GROUP_HEX.yellow,      price: 260, rents: [22,110,330,800,975,1150], mortgage: 130, houseCost: 150 },
  { index: 28, name: 'Facture Fibre',         type: 'tax',         tax: 150,  description: 'Payez 150 € à chaque passage.' },
  { index: 29, name: 'Palais de Justice',     type: 'property',    colorGroup: 'yellow',     colorHex: GROUP_HEX.yellow,      price: 280, rents: [24,120,360,850,1025,1200], mortgage: 140, houseCost: 150 },
  { index: 30, name: 'EN TD',                 type: 'go-to-jail',  description: 'Allez directement en TD. Ne passez pas par Départ.' },
  { index: 31, name: 'François-Verdier',      type: 'property',    colorGroup: 'green',      colorHex: GROUP_HEX.green,       price: 300, rents: [26,130,390,900,1100,1275], mortgage: 150, houseCost: 200 },
  { index: 32, name: 'Esquirol',              type: 'property',    colorGroup: 'green',      colorHex: GROUP_HEX.green,       price: 300, rents: [26,130,390,900,1100,1275], mortgage: 150, houseCost: 200 },
  { index: 33, name: 'Caisse IZLY',           type: 'community',   description: 'Piochez une carte IZLY.' },
  { index: 34, name: 'Carmes',               type: 'property',    colorGroup: 'green',      colorHex: GROUP_HEX.green,       price: 320, rents: [28,150,450,1000,1200,1400], mortgage: 160, houseCost: 200 },
  { index: 35, name: 'Magma Club',            type: 'railroad',    price: 200, rents: [25,50,100,200], mortgage: 100, description: 'Club étudiant' },
  { index: 36, name: 'Chance',                type: 'chance',      description: 'Piochez une carte Chance.' },
  { index: 37, name: 'Capitole',              type: 'property',    colorGroup: 'dark-blue',  colorHex: GROUP_HEX['dark-blue'], price: 350, rents: [35,175,500,1100,1300,1500], mortgage: 175, houseCost: 200 },
  { index: 38, name: 'Frais de scolarité',    type: 'tax',         tax: 100,  description: 'Payez 100 €.' },
  { index: 39, name: 'Jean-Jaurès',           type: 'property',    colorGroup: 'dark-blue',  colorHex: GROUP_HEX['dark-blue'], price: 400, rents: [50,200,600,1400,1700,2000], mortgage: 200, houseCost: 200 },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<CellInfo['type'], string> = {
  property:      'Propriété',
  railroad:      'Club',
  utility:       'Service public',
  tax:           'Taxe',
  chance:        'Carte Chance',
  community:     'Carte IZLY',
  go:            'Case Départ',
  jail:          'En TD',
  'free-parking':'Jardin Japonais',
  'go-to-jail':  'Allez en TD',
}

// ─── Composant ───────────────────────────────────────────────────────────────

interface Props {
  cellIndex: number
  property?: Property
  players: Player[]
  onClose: () => void
}

export default function CellInfoPanel({ cellIndex, property, players, onClose }: Props) {
  const info = CELL_INFO[cellIndex]
  if (!info) return null

  const owner = property?.ownerId ? players.find(p => p.id === property.ownerId) : null
  const houses = property?.houses ?? 0
  const hotel  = property?.hotel ?? false
  const mortgaged = property?.mortgaged ?? false

  const isProperty = info.type === 'property'
  const isRailroad = info.type === 'railroad'
  const accentColor = info.colorHex ?? '#555'

  // Loyer actuel selon l'état
  let currentRent: number | null = null
  if (isProperty && info.rents && owner) {
    if (hotel)        currentRent = info.rents[5]
    else if (houses > 0) currentRent = info.rents[houses]
    else              currentRent = info.rents[0]
  }

  return (
    <div
      className="absolute bottom-3 left-3 w-64 rounded-2xl overflow-hidden shadow-2xl"
      style={{ background: '#13151c', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Header coloré */}
      <div
        className="px-4 py-3 flex items-start justify-between gap-2"
        style={{ background: info.colorHex ? `${info.colorHex}22` : '#1e2130', borderBottom: `2px solid ${accentColor}` }}
      >
        <div className="min-w-0">
          {info.colorGroup && (
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: accentColor }} />
              <span className="text-[10px] uppercase tracking-widest font-semibold opacity-60">
                {info.colorGroup.replace('-', ' ')}
              </span>
            </div>
          )}
          <div className="font-bold text-white text-sm leading-tight">{info.name}</div>
          <div className="text-[11px] mt-0.5 opacity-50">{TYPE_LABEL[info.type]}</div>
        </div>
        <button
          onClick={onClose}
          className="text-white/30 hover:text-white/80 transition-colors flex-shrink-0 mt-0.5"
          aria-label="Fermer"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Corps */}
      <div className="px-4 py-3 space-y-3 text-sm">

        {/* Description (cases spéciales) */}
        {info.description && !isProperty && !isRailroad && (
          <p className="text-white/50 text-xs leading-relaxed">{info.description}</p>
        )}

        {/* Prix d'achat */}
        {info.price && (
          <div className="flex justify-between items-center">
            <span className="text-white/40 text-xs">Prix</span>
            <span className="font-bold text-white">{info.price.toLocaleString()} €</span>
          </div>
        )}

        {/* Taxe */}
        {info.tax && (
          <div className="flex justify-between items-center">
            <span className="text-white/40 text-xs">Montant</span>
            <span className="font-bold text-red-400">{info.tax.toLocaleString()} €</span>
          </div>
        )}

        {/* Propriétaire */}
        {owner && (
          <div className="flex justify-between items-center">
            <span className="text-white/40 text-xs">Propriétaire</span>
            <span className="font-semibold text-xs" style={{ color: PLAYER_COLOR_HEX[owner.color] ?? '#aaa' }}>
              {owner.name}
            </span>
          </div>
        )}

        {/* État hypothèque */}
        {mortgaged && (
          <div className="bg-orange-500/15 border border-orange-500/30 rounded-lg px-3 py-1.5 text-orange-300 text-xs text-center font-medium">
            Hypothéquée
          </div>
        )}

        {/* Maisons / hôtel */}
        {isProperty && owner && !mortgaged && (
          <div className="flex justify-between items-center">
            <span className="text-white/40 text-xs">Constructions</span>
            <span className="text-xs font-semibold">
              {hotel
                ? <span className="text-red-400">🏨 Hôtel</span>
                : houses > 0
                  ? <span className="text-green-400">{'🏠'.repeat(houses)}</span>
                  : <span className="text-white/30">—</span>
              }
            </span>
          </div>
        )}

        {/* Loyer actuel */}
        {currentRent !== null && owner && !mortgaged && (
          <div className="flex justify-between items-center bg-white/4 rounded-lg px-3 py-1.5">
            <span className="text-white/50 text-xs">Loyer actuel</span>
            <span className="font-bold text-yellow-400 text-sm">{currentRent.toLocaleString()} €</span>
          </div>
        )}

        {/* Tableau loyers propriété */}
        {isProperty && info.rents && (
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1.5">Loyers</div>
            {[
              ['Sans maison', info.rents[0]],
              ['1 maison',    info.rents[1]],
              ['2 maisons',   info.rents[2]],
              ['3 maisons',   info.rents[3]],
              ['4 maisons',   info.rents[4]],
              ['Hôtel',       info.rents[5]],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between text-xs">
                <span className="text-white/35">{label}</span>
                <span className="text-white/70 font-medium">{(value as number).toLocaleString()} €</span>
              </div>
            ))}
          </div>
        )}

        {/* Tableau loyers gare */}
        {isRailroad && info.rents && (
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1.5">Loyers (clubs)</div>
            {info.rents.map((rent, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-white/35">{i + 1} club{i > 0 ? 's' : ''}</span>
                <span className="text-white/70 font-medium">{rent.toLocaleString()} €</span>
              </div>
            ))}
          </div>
        )}

        {/* Hypothèque + coût maison */}
        {(info.mortgage || info.houseCost) && (
          <div className="border-t border-white/6 pt-2 space-y-1">
            {info.mortgage && (
              <div className="flex justify-between text-xs">
                <span className="text-white/30">Hypothèque</span>
                <span className="text-white/50">{info.mortgage.toLocaleString()} €</span>
              </div>
            )}
            {info.houseCost && (
              <div className="flex justify-between text-xs">
                <span className="text-white/30">Maison / Hôtel</span>
                <span className="text-white/50">{info.houseCost.toLocaleString()} €</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
