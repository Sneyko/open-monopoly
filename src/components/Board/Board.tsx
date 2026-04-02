/**
 * Board.tsx — Plateau de Monopoly avec image SVG custom + overlay interactif
 *
 * Layer 1 : plateau.svg (image statique, fond + textes + icônes)
 * Layer 2 : SVG overlay transparent (zones cliquables, pions, maisons)
 *
 * ViewBox overlay : 1860×1860 (taille de plateau.svg)
 */

import React from "react";
import plateauSrc from "../../assets/plateau.svg";

// ─── Types ───────────────────────────────────────────────────────────────────

export type PlayerColor =
  | "red"
  | "blue"
  | "green"
  | "yellow"
  | "purple"
  | "orange";

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  position: number; // 0–39
}

export interface Property {
  id: number; // 0–39, correspond à la position sur le plateau
  ownerId?: string;
  houses: number; // 0–4
  hotel: boolean;
  mortgaged: boolean;
}

interface BoardProps {
  players: Player[];
  properties: Property[];
  onCellClick?: (index: number) => void;
  selectedCell?: number | null;
  currentPlayerId?: string;
  boostedPropertyId?: number | null;
}

// ─── Données des cases ────────────────────────────────────────────────────────

const PLAYER_COLOR_CLASS: Record<PlayerColor, string> = {
  red: 'fill-player-red',
  blue: 'fill-player-blue',
  green: 'fill-player-green',
  yellow: 'fill-player-yellow',
  purple: 'fill-player-purple',
  orange: 'fill-player-orange',
}

type CellType =
  | "property"
  | "railroad"
  | "utility"
  | "tax"
  | "chance"
  | "community"
  | "go"
  | "jail"
  | "free-parking"
  | "go-to-jail";

type ColorGroup =
  | "brown"
  | "light-blue"
  | "pink"
  | "orange"
  | "red"
  | "yellow"
  | "green"
  | "dark-blue"
  | null;

interface CellData {
  index: number;
  name: string;
  type: CellType;
  colorGroup: ColorGroup;
  price?: number;
}

const PROPERTY_RENTS: Record<number, number[]> = {
  1: [2, 10, 30, 90, 160, 250],
  3: [4, 20, 60, 180, 320, 450],
  6: [6, 30, 90, 270, 400, 550],
  8: [6, 30, 90, 270, 400, 550],
  9: [8, 40, 100, 300, 450, 600],
  11: [10, 50, 150, 450, 625, 750],
  13: [10, 50, 150, 450, 625, 750],
  14: [12, 60, 180, 500, 700, 900],
  16: [14, 70, 200, 550, 750, 950],
  18: [14, 70, 200, 550, 750, 950],
  19: [16, 80, 220, 600, 800, 1000],
  21: [18, 90, 250, 700, 875, 1050],
  23: [18, 90, 250, 700, 875, 1050],
  24: [20, 100, 300, 750, 925, 1100],
  26: [22, 110, 330, 800, 975, 1150],
  27: [22, 110, 330, 800, 975, 1150],
  29: [24, 120, 360, 850, 1025, 1200],
  31: [26, 130, 390, 900, 1100, 1275],
  32: [26, 130, 390, 900, 1100, 1275],
  34: [28, 150, 450, 1000, 1200, 1400],
  37: [35, 175, 500, 1100, 1300, 1500],
  39: [50, 200, 600, 1400, 1700, 2000],
};

const RAILROAD_RENTS = [25, 50, 100, 200];

const GROUP_COLORS: Record<NonNullable<ColorGroup>, string> = {
  brown: "#8B5E3C",
  "light-blue": "#81D4FA",
  pink: "#F06292",
  orange: "#FF8A65",
  red: "#E53935",
  yellow: "#FDD835",
  green: "#43A047",
  "dark-blue": "#1565C0",
};

// 40 cases dans l'ordre Monopoly standard (case 0 = GO, sens des aiguilles)
const CELLS: CellData[] = [
  { index: 0,  name: "DÉPART",          type: "go",          colorGroup: null },
  { index: 1,  name: "Reynerie",        type: "property",    colorGroup: "brown",      price: 60 },
  { index: 2,  name: "Caisse IZLY",     type: "community",   colorGroup: null },
  { index: 3,  name: "Bellefontaine",   type: "property",    colorGroup: "brown",      price: 60 },
  { index: 4,  name: "Gemini Mensuel",  type: "tax",         colorGroup: null },
  { index: 5,  name: "Nine",            type: "railroad",    colorGroup: null,         price: 200 },
  { index: 6,  name: "Basso Cambo",     type: "property",    colorGroup: "light-blue", price: 100 },
  { index: 7,  name: "Chance",          type: "chance",      colorGroup: null },
  { index: 8,  name: "Mirail-Université", type: "property",  colorGroup: "light-blue", price: 100 },
  { index: 9,  name: "Bagatelle",       type: "property",    colorGroup: "light-blue", price: 120 },
  { index: 10, name: "EN TD / SIMPLE VISITE", type: "jail",  colorGroup: null },
  { index: 11, name: "Trois Cocus",     type: "property",    colorGroup: "pink",       price: 140 },
  { index: 12, name: "Tisséo Pastel",   type: "tax",         colorGroup: null },
  { index: 13, name: "Faculté de Pharmacie", type: "property", colorGroup: "pink",     price: 140 },
  { index: 14, name: "Borderouge",      type: "property",    colorGroup: "pink",       price: 160 },
  { index: 15, name: "Café Pop",        type: "railroad",    colorGroup: null,         price: 200 },
  { index: 16, name: "Roseraie",        type: "property",    colorGroup: "orange",     price: 180 },
  { index: 17, name: "Caisse IZLY",     type: "community",   colorGroup: null },
  { index: 18, name: "Jolimont",        type: "property",    colorGroup: "orange",     price: 180 },
  { index: 19, name: "Marengo-SNCF",    type: "property",    colorGroup: "orange",     price: 200 },
  { index: 20, name: "Jardin Japonais", type: "free-parking",colorGroup: null },
  { index: 21, name: "Patte d'Oie",     type: "property",    colorGroup: "red",        price: 220 },
  { index: 22, name: "Chance",          type: "chance",      colorGroup: null },
  { index: 23, name: "St-Cyprien",      type: "property",    colorGroup: "red",        price: 220 },
  { index: 24, name: "Arènes",          type: "property",    colorGroup: "red",        price: 240 },
  { index: 25, name: "O'club",          type: "railroad",    colorGroup: null,         price: 200 },
  { index: 26, name: "Jeanne d'Arc",    type: "property",    colorGroup: "yellow",     price: 260 },
  { index: 27, name: "Compans-Caffarelli", type: "property", colorGroup: "yellow",     price: 260 },
  { index: 28, name: "Facture Fibre",   type: "tax",         colorGroup: null },
  { index: 29, name: "Palais de Justice", type: "property",  colorGroup: "yellow",     price: 280 },
  { index: 30, name: "EN TD",           type: "go-to-jail",  colorGroup: null },
  { index: 31, name: "François-Verdier", type: "property",   colorGroup: "green",      price: 300 },
  { index: 32, name: "Esquirol",        type: "property",    colorGroup: "green",      price: 300 },
  { index: 33, name: "Caisse IZLY",     type: "community",   colorGroup: null },
  { index: 34, name: "Carmes",          type: "property",    colorGroup: "green",      price: 320 },
  { index: 35, name: "Magma Club",      type: "railroad",    colorGroup: null,         price: 200 },
  { index: 36, name: "Chance",          type: "chance",      colorGroup: null },
  { index: 37, name: "Capitole",        type: "property",    colorGroup: "dark-blue",  price: 350 },
  { index: 38, name: "Frais de scolarité", type: "tax",      colorGroup: null },
  { index: 39, name: "Jean-Jaurès",     type: "property",    colorGroup: "dark-blue",  price: 400 },
];

// ─── Géométrie du plateau ────────────────────────────────────────────────────
// ViewBox 1860×1860 (ratio 1860/780 ≈ 2.3846 par rapport à l'ancien 780×780)
// Coins 286×286. Cases normales 143 large × 286 haut.

const S = 1860;  // taille totale SVG
const C = 286;   // taille d'un coin  (120 × 2.3846)
const W = 143;   // largeur d'une case normale (60 × 2.3846)
const H = 286;   // hauteur d'une case normale (120 × 2.3846)

function getCellRect(index: number): {
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
  isBottom: boolean;
  isTop: boolean;
  isLeft: boolean;
  isRight: boolean;
} {
  const isBottom = index >= 1 && index <= 9;
  const isTop    = index >= 21 && index <= 29;
  const isLeft   = index >= 11 && index <= 19;
  const isRight  = index >= 31 && index <= 39;

  if (index === 0) {
    return { x: S - C, y: S - C, w: C, h: C, cx: S - C / 2, cy: S - C / 2, isBottom: false, isTop: false, isLeft: false, isRight: false };
  }
  if (index === 10) {
    return { x: 0, y: S - C, w: C, h: C, cx: C / 2, cy: S - C / 2, isBottom: false, isTop: false, isLeft: false, isRight: false };
  }
  if (index === 20) {
    return { x: 0, y: 0, w: C, h: C, cx: C / 2, cy: C / 2, isBottom: false, isTop: false, isLeft: false, isRight: false };
  }
  if (index === 30) {
    return { x: S - C, y: 0, w: C, h: C, cx: S - C / 2, cy: C / 2, isBottom: false, isTop: false, isLeft: false, isRight: false };
  }

  if (isBottom) {
    const pos = 10 - index; // 9→1 depuis le coin GO
    const x = C + (pos - 1) * W;
    return { x, y: S - H, w: W, h: H, cx: x + W / 2, cy: S - H / 2, isBottom, isTop, isLeft, isRight };
  }
  if (isLeft) {
    const pos = index - 10; // 1→9
    const y = S - C - pos * W;
    return { x: 0, y, w: H, h: W, cx: H / 2, cy: y + W / 2, isBottom, isTop, isLeft, isRight };
  }
  if (isTop) {
    const pos = index - 20; // 1→9
    const x = C + (pos - 1) * W;
    return { x, y: 0, w: W, h: H, cx: x + W / 2, cy: H / 2, isBottom, isTop, isLeft, isRight };
  }
  if (isRight) {
    const pos = index - 30; // 1→9
    const y = C + (pos - 1) * W;
    return { x: S - H, y, w: H, h: W, cx: S - H / 2, cy: y + W / 2, isBottom, isTop, isLeft, isRight };
  }

  return { x: 0, y: 0, w: W, h: H, cx: W / 2, cy: H / 2, isBottom: false, isTop: false, isLeft: false, isRight: false };
}

function countOwnedRailroads(properties: Property[], ownerId: string): number {
  const railroadIds = CELLS.filter((cell) => cell.type === "railroad").map((cell) => cell.index)
  return railroadIds.filter((id) => properties.find((p) => p.id === id)?.ownerId === ownerId).length
}

function ownsFullGroup(properties: Property[], ownerId: string, colorGroup: Exclude<ColorGroup, null>): boolean {
  const groupIds = CELLS
    .filter((cell) => cell.type === "property" && cell.colorGroup === colorGroup)
    .map((cell) => cell.index)

  return groupIds.every((id) => properties.find((p) => p.id === id)?.ownerId === ownerId)
}

function getCurrentRent(
  cell: CellData,
  property: Property,
  properties: Property[],
  boostedPropertyId?: number | null,
): number | null {
  if (!property.ownerId) return null
  if (property.mortgaged) return 0

  if (cell.type === "railroad") {
    const owned = countOwnedRailroads(properties, property.ownerId)
    return RAILROAD_RENTS[Math.max(0, owned - 1)] ?? RAILROAD_RENTS[0]
  }

  if (cell.type === "property") {
    const rents = PROPERTY_RENTS[cell.index]
    if (!rents) return null

    let amount = rents[0]

    if (property.hotel) {
      amount = rents[5]
    } else if (property.houses > 0) {
      amount = rents[property.houses] ?? rents[0]
    } else if (cell.colorGroup && ownsFullGroup(properties, property.ownerId, cell.colorGroup)) {
      amount = rents[0] * 2
    }

    if (boostedPropertyId != null && boostedPropertyId === cell.index) {
      amount = amount * 3
    }

    return amount
  }

  return null
}

function getPriceLabelPosition(rect: ReturnType<typeof getCellRect>) {
  if (rect.isBottom) return { x: rect.cx, y: rect.y + rect.h - 16 }
  if (rect.isTop) return { x: rect.cx, y: rect.y + 16 }
  if (rect.isLeft) return { x: rect.x + 18, y: rect.cy }
  if (rect.isRight) return { x: rect.x + rect.w - 18, y: rect.cy }
  return { x: rect.cx, y: rect.cy }
}

// ─── Maisons / hôtel ─────────────────────────────────────────────────────────

const BAND_H = 43; // 18 × 2.3846 — épaisseur de la bande colorée dans le SVG plateau

// Maison en forme de maison (carré + toit triangulaire)
// cx/cy = centre de la maison, size = largeur, angle = rotation (0 = toit vers le haut)
function HouseShape({ cx, cy, size, angle, color }: {
  cx: number; cy: number; size: number; angle: number; color: string;
}) {
  const bodyH = size * 0.55;
  const roofH = size * 0.48;
  // Corps : centré sous le toit
  const bx = cx - size / 2;
  const by = cy - bodyH / 2 + roofH * 0.3;
  // Toit : triangle au-dessus du corps
  const roofPoints = `${cx},${by - roofH} ${cx - size / 2 - 1},${by} ${cx + size / 2 + 1},${by}`;
  return (
    <g transform={`rotate(${angle}, ${cx}, ${cy})`} filter="url(#drop-shadow)">
      <rect x={bx} y={by} width={size} height={bodyH} rx="1.5" fill={color}/>
      <rect x={bx + size * 0.35} y={by + bodyH * 0.45} width={size * 0.3} height={bodyH * 0.55} rx="1" fill="rgba(0,0,0,0.25)"/>
      <polygon points={roofPoints} fill={color} style={{ filter: 'brightness(0.78)' }}/>
    </g>
  );
}

// Hôtel (bâtiment plus large avec toit plat et fenêtres)
function HotelShape({ cx, cy, w, h, angle, color }: {
  cx: number; cy: number; w: number; h: number; angle: number; color: string;
}) {
  const bx = cx - w / 2;
  const by = cy - h / 2;
  const roofH = h * 0.22;
  return (
    <g transform={`rotate(${angle}, ${cx}, ${cy})`} filter="url(#drop-shadow)">
      {/* Corps */}
      <rect x={bx} y={by + roofH} width={w} height={h - roofH} rx="2" fill={color}/>
      {/* Toit */}
      <rect x={bx - 2} y={by} width={w + 4} height={roofH + 2} rx="2" fill={color} style={{ filter: 'brightness(0.72)' }}/>
      {/* Fenêtres */}
      {[0.18, 0.42, 0.66].map((fx, i) => (
        <rect key={i} x={bx + w * fx} y={by + roofH + h * 0.28} width={w * 0.18} height={h * 0.28} rx="1" fill="rgba(255,255,255,0.22)"/>
      ))}
      {/* Porte */}
      <rect x={bx + w * 0.38} y={by + roofH + h * 0.42} width={w * 0.24} height={h * 0.38} rx="1" fill="rgba(0,0,0,0.3)"/>
    </g>
  );
}

function HouseIndicator({
  x, y, w, h, houses, hotel, isBottom, isTop, isLeft, isRight,
}: {
  x: number; y: number; w: number; h: number;
  houses: number; hotel: boolean;
  isBottom: boolean; isTop: boolean; isLeft: boolean; isRight: boolean;
}) {
  const green  = "#3ec853";
  const red    = "#e63c3c";

  // Orientation : angle de rotation pour que le toit pointe vers l'intérieur du plateau
  // isBottom → toit vers le haut (0°), isTop → toit vers le bas (180°), isLeft → toit vers la droite (90°), isRight → toit vers la gauche (270°)
  const angle = isBottom ? 0 : isTop ? 180 : isLeft ? 90 : 270;

  // Bande où on doit dessiner (zone colorée)
  const bandY = isBottom ? y            : isTop ? y + h - BAND_H : y;
  const bandX = isLeft   ? x + w - BAND_H : isRight ? x          : x;
  const bandW = (isLeft || isRight) ? BAND_H : w;
  const bandH = (isLeft || isRight) ? h       : BAND_H;

  if (hotel) {
    const cx = bandX + bandW / 2;
    const cy = bandY + bandH / 2;
    const hw = (isLeft || isRight) ? BAND_H * 0.72 : Math.min(bandW * 0.7, 52);
    const hh = (isLeft || isRight) ? Math.min(bandH * 0.72, 52) : BAND_H * 0.78;
    return <HotelShape cx={cx} cy={cy} w={hw} h={hh} angle={angle} color={red}/>;
  }

  const houseSize = Math.min(
    (isLeft || isRight) ? (bandH - 8) / houses - 4 : (bandW - 8) / houses - 3,
    28,
  );
  const gap = 3;
  const count = houses;

  if (isBottom || isTop) {
    const total = count * (houseSize + gap) - gap;
    const startX = bandX + bandW / 2 - total / 2 + houseSize / 2;
    const cy = bandY + bandH / 2;
    return (
      <g>
        {Array.from({ length: count }).map((_, i) => (
          <HouseShape key={i} cx={startX + i * (houseSize + gap)} cy={cy} size={houseSize} angle={angle} color={green}/>
        ))}
      </g>
    );
  }
  // isLeft || isRight
  const total = count * (houseSize + gap) - gap;
  const startY = bandY + bandH / 2 - total / 2 + houseSize / 2;
  const cx = bandX + bandW / 2;
  return (
    <g>
      {Array.from({ length: count }).map((_, i) => (
        <HouseShape key={i} cx={cx} cy={startY + i * (houseSize + gap)} size={houseSize} angle={angle} color={green}/>
      ))}
    </g>
  );
}

// ─── Pions ────────────────────────────────────────────────────────────────────

const PAWN_OFFSETS = [
  { dx: 0, dy: 0 },
  { dx: -28, dy: -20 },
  { dx: 28, dy: -20 },
  { dx: -28, dy: 20 },
  { dx: 28, dy: 20 },
  { dx: 0, dy: -40 },
]

function PawnCluster({ pawns, cx, cy, currentPlayerId }: { pawns: Player[]; cx: number; cy: number; currentPlayerId?: string }) {
  return (
    <g pointerEvents="none">
      {pawns.map((player, i) => {
        const off = PAWN_OFFSETS[i % PAWN_OFFSETS.length]
        const isActive = player.id === currentPlayerId
        const colorClass = PLAYER_COLOR_CLASS[player.color]
        const scale = isActive ? 1.08 : 1
        const lift = isActive ? -6 : 0

        return (
          <g key={player.id} transform={`translate(${cx + off.dx}, ${cy + off.dy + lift}) scale(${scale})`}>
            {isActive && (
              <circle cx={0} cy={-9} r="22" className={`${colorClass} opacity-25`} />
            )}
            <g filter="url(#drop-shadow)">
              <circle cx={0} cy={-9} r={isActive ? 17 : 15}
                fill="none" stroke="white" strokeWidth={isActive ? 3 : 1.5} opacity={isActive ? 0.9 : 0.5}/>
              <ellipse cx={0} cy={17} rx="16" ry="7" className={`${colorClass} opacity-90`} />
              <rect x={-10} y={0} width="20" height="19" rx="3" className={colorClass}/>
              <circle cx={0} cy={-9} r={isActive ? 16 : 14} className={colorClass}/>
              <circle cx={0} cy={-9} r={isActive ? 16 : 14}
                fill="none" stroke={isActive ? 'white' : 'rgba(255,255,255,0.4)'} strokeWidth={isActive ? 2.5 : 1.5}/>
              <circle cx={-5} cy={-15} r={isActive ? 6 : 5} fill="white" opacity={isActive ? 0.5 : 0.3}/>
            </g>
          </g>
        )
      })}
    </g>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

const Board: React.FC<BoardProps> = ({ players, properties, onCellClick, selectedCell, currentPlayerId, boostedPropertyId }) => {
  const propertyMap = new Map<number, Property>(
    properties.map((p) => [p.id, p])
  );

  const pawnsByPosition = new Map<number, Player[]>();
  for (const player of players) {
    const arr = pawnsByPosition.get(player.position) ?? [];
    arr.push(player);
    pawnsByPosition.set(player.position, arr);
  }

  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "1" }}>
      {/* Layer 1 — image plateau */}
      <img
        src={plateauSrc}
        alt="Monopoly board"
        style={{ width: "100%", height: "100%", display: "block" }}
      />

      {/* Layer 2 — overlay interactif */}
      <svg
        viewBox={`0 0 ${S} ${S}`}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        aria-hidden="true"
      >
        <defs>
          <style>{`
            @keyframes boost-pulse {
              0%,100% { opacity: 0.55; r: 6; }
              50%      { opacity: 1;    r: 9; }
            }
            @keyframes boost-ring {
              0%,100% { stroke-dashoffset: 0; }
              100%    { stroke-dashoffset: -60; }
            }
            .boost-dot { animation: boost-pulse 1.4s ease-in-out infinite; }
            .boost-ring-anim { animation: boost-ring 2s linear infinite; }
          `}</style>
          <filter id="drop-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2.5" stdDeviation="3" floodOpacity="0.45" />
          </filter>
        </defs>
        {/* Passe 1 : highlights hover/sélection + maisons */}
        {CELLS.map((cell) => {
          const rect = getCellRect(cell.index);
          const { x, y, w, h, isBottom, isTop, isLeft, isRight } = rect;
          const property = propertyMap.get(cell.index);
          const isCorner = [0, 10, 20, 30].includes(cell.index);
          const hasHouses = !isCorner && ((property?.houses ?? 0) > 0 || (property?.hotel ?? false));
          const isOwned = !isCorner && !!property?.ownerId && !hasHouses;
          const ownerColorClass = isOwned
            ? PLAYER_COLOR_CLASS[(players.find(p => p.id === property!.ownerId)?.color ?? 'red')]
            : 'fill-player-red';
          const isBoosted = boostedPropertyId != null && cell.index === boostedPropertyId;
          const isSelected = selectedCell === cell.index;
          const isBuyable = cell.type === "property" || cell.type === "railroad" || cell.type === "utility";

          let amountLabel: string | null = null
          let amountLabelColor = "#fde68a"

          if (isBuyable) {
            if (property?.ownerId) {
              const rent = getCurrentRent(cell, property, properties, boostedPropertyId)
              if (rent != null) {
                amountLabel = `${rent} €`
                amountLabelColor = "#93c5fd"
              }
            } else if (cell.price) {
              amountLabel = `${cell.price} €`
              amountLabelColor = "#fde68a"
            }
          }

          const amountPos = getPriceLabelPosition(rect)

          return (
            <g key={cell.index}>
              {/* Zone cliquable + hover */}
              <rect
                x={x} y={y} width={w} height={h}
                fill={isSelected ? "rgba(255,210,0,0.18)" : "transparent"}
                stroke={isSelected ? "rgba(255,210,0,0.85)" : "transparent"}
                strokeWidth={isSelected ? 4 : 3}
                rx={isCorner ? 6 : 3}
                onClick={onCellClick ? () => onCellClick(cell.index) : undefined}
                className={onCellClick
                  ? 'hover:fill-white/10 hover:stroke-white/45 transition-colors duration-150 cursor-pointer'
                  : ''}
              />

              {/* Maisons / hôtel */}
              {hasHouses && (
                <g pointerEvents="none">
                  <HouseIndicator
                    x={x} y={y} w={w} h={h}
                    houses={property!.houses}
                    hotel={property!.hotel}
                    isBottom={isBottom} isTop={isTop} isLeft={isLeft} isRight={isRight}
                  />
                </g>
              )}

              {/* Boost Jardin Japonais - halo animé sur toute la case */}
              {isBoosted && (() => {
                const margin = 5;
                const bcx = rect.cx;
                const bcy = rect.cy;
                return (
                  <g pointerEvents="none">
                    {/* Halo doré clignotant */}
                    <rect
                      x={x + margin} y={y + margin}
                      width={w - margin * 2} height={h - margin * 2}
                      rx={isCorner ? 4 : 3}
                      fill="rgba(250,204,21,0.10)"
                      stroke="#facc15"
                      strokeWidth="3"
                      strokeDasharray="18 8"
                      className="boost-ring-anim"
                    />
                    {/* Badge boost centré */}
                    <circle cx={bcx} cy={bcy} r={16} fill="rgba(0,0,0,0.7)" className="boost-dot"/>
                    <text x={bcx} y={bcy + 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="white" style={{ userSelect:'none' }}>x3</text>
                  </g>
                );
              })()}

              {/* Prix dynamique : prix d'achat si libre, loyer actuel si possédée */}
              {amountLabel && !isCorner && (
                <g pointerEvents="none">
                  <rect
                    x={amountPos.x - 22}
                    y={amountPos.y - 8}
                    width={44}
                    height={16}
                    rx={5}
                    fill="rgba(0,0,0,0.58)"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth={0.8}
                  />
                  <text
                    x={amountPos.x}
                    y={amountPos.y + 3}
                    textAnchor="middle"
                    fontSize="8"
                    fontWeight="700"
                    fill={amountLabelColor}
                    style={{ userSelect: "none" }}
                  >
                    {amountLabel}
                  </text>
                </g>
              )}

              {/* Indicateur propriétaire (sans maison) : bande colorée opaque + pastille */}
              {isOwned && (() => {
                // Coordonnées de la bande colorée selon la rangée
                const bandX = isLeft ? x + w - BAND_H : isRight ? x : x;
                const bandY = isBottom ? y : isTop ? y + h - BAND_H : y;
                const bandW = (isLeft || isRight) ? BAND_H : w;
                const bandH2 = (isLeft || isRight) ? h : BAND_H;
                const cx2 = bandX + bandW / 2;
                const cy2 = bandY + bandH2 / 2;
                const r = Math.min(bandW, bandH2) * 0.28;
                return (
                  <g pointerEvents="none">
                    {/* Fond semi-transparent couleur joueur sur la bande */}
                    <rect x={bandX} y={bandY} width={bandW} height={bandH2}
                      className={ownerColorClass} opacity={0.28} rx={2}/>
                    {/* Pastille centrale */}
                    <circle cx={cx2} cy={cy2} r={r + 2} fill="rgba(0,0,0,0.55)"/>
                    <circle cx={cx2} cy={cy2} r={r} className={ownerColorClass}/>
                    {/* Mini croix/maison blanche pour signifier "acheté" */}
                    <circle cx={cx2} cy={cy2} r={r * 0.42} fill="white" opacity={0.9}/>
                  </g>
                );
              })()}
            </g>
          );
        })}

        {/* Passe 2 : pions (toujours au-dessus de tout) */}
        {CELLS.map((cell) => {
          const { cx, cy } = getCellRect(cell.index)
          const pawns = pawnsByPosition.get(cell.index) ?? []
          if (pawns.length === 0) return null
          return <PawnCluster key={`pawns-${cell.index}`} pawns={pawns} cx={cx} cy={cy} currentPlayerId={currentPlayerId} />
        })}
      </svg>
    </div>
  );
};

export default Board;
export { CELLS, GROUP_COLORS };
