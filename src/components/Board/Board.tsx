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
}

// ─── Données des cases ────────────────────────────────────────────────────────

const PLAYER_COLORS: Record<PlayerColor, string> = {
  red: "#E24B4A",
  blue: "#378ADD",
  green: "#639922",
  yellow: "#EF9F27",
  purple: "#7F77DD",
  orange: "#D85A30",
};

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
  { index: 0,  name: "GO",              type: "go",          colorGroup: null },
  { index: 1,  name: "Mediterranean",   type: "property",    colorGroup: "brown",      price: 60 },
  { index: 2,  name: "Community Chest", type: "community",   colorGroup: null },
  { index: 3,  name: "Baltic Ave",      type: "property",    colorGroup: "brown",      price: 60 },
  { index: 4,  name: "Income Tax",      type: "tax",         colorGroup: null },
  { index: 5,  name: "Reading RR",      type: "railroad",    colorGroup: null,         price: 200 },
  { index: 6,  name: "Oriental Ave",    type: "property",    colorGroup: "light-blue", price: 100 },
  { index: 7,  name: "Chance",          type: "chance",      colorGroup: null },
  { index: 8,  name: "Vermont Ave",     type: "property",    colorGroup: "light-blue", price: 100 },
  { index: 9,  name: "Connecticut",     type: "property",    colorGroup: "light-blue", price: 120 },
  { index: 10, name: "Jail / Visit",    type: "jail",        colorGroup: null },
  { index: 11, name: "St. Charles",     type: "property",    colorGroup: "pink",       price: 140 },
  { index: 12, name: "Electric Co.",    type: "utility",     colorGroup: null,         price: 150 },
  { index: 13, name: "States Ave",      type: "property",    colorGroup: "pink",       price: 140 },
  { index: 14, name: "Virginia Ave",    type: "property",    colorGroup: "pink",       price: 160 },
  { index: 15, name: "Pennsylvania RR", type: "railroad",    colorGroup: null,         price: 200 },
  { index: 16, name: "St. James",       type: "property",    colorGroup: "orange",     price: 180 },
  { index: 17, name: "Community Chest", type: "community",   colorGroup: null },
  { index: 18, name: "Tennessee Ave",   type: "property",    colorGroup: "orange",     price: 180 },
  { index: 19, name: "New York Ave",    type: "property",    colorGroup: "orange",     price: 200 },
  { index: 20, name: "Free Parking",    type: "free-parking",colorGroup: null },
  { index: 21, name: "Kentucky Ave",    type: "property",    colorGroup: "red",        price: 220 },
  { index: 22, name: "Chance",          type: "chance",      colorGroup: null },
  { index: 23, name: "Indiana Ave",     type: "property",    colorGroup: "red",        price: 220 },
  { index: 24, name: "Illinois Ave",    type: "property",    colorGroup: "red",        price: 240 },
  { index: 25, name: "B&O Railroad",    type: "railroad",    colorGroup: null,         price: 200 },
  { index: 26, name: "Atlantic Ave",    type: "property",    colorGroup: "yellow",     price: 260 },
  { index: 27, name: "Ventnor Ave",     type: "property",    colorGroup: "yellow",     price: 260 },
  { index: 28, name: "Water Works",     type: "utility",     colorGroup: null,         price: 150 },
  { index: 29, name: "Marvin Gardens",  type: "property",    colorGroup: "yellow",     price: 280 },
  { index: 30, name: "Go To Jail",      type: "go-to-jail",  colorGroup: null },
  { index: 31, name: "Pacific Ave",     type: "property",    colorGroup: "green",      price: 300 },
  { index: 32, name: "N. Carolina",     type: "property",    colorGroup: "green",      price: 300 },
  { index: 33, name: "Community Chest", type: "community",   colorGroup: null },
  { index: 34, name: "Pennsylvania",    type: "property",    colorGroup: "green",      price: 320 },
  { index: 35, name: "Short Line RR",   type: "railroad",    colorGroup: null,         price: 200 },
  { index: 36, name: "Chance",          type: "chance",      colorGroup: null },
  { index: 37, name: "Park Place",      type: "property",    colorGroup: "dark-blue",  price: 350 },
  { index: 38, name: "Luxury Tax",      type: "tax",         colorGroup: null },
  { index: 39, name: "Boardwalk",       type: "property",    colorGroup: "dark-blue",  price: 400 },
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

// ─── Maisons / hôtel ─────────────────────────────────────────────────────────

const BAND_H = 43; // 18 × 2.3846 — épaisseur de la bande colorée dans le SVG plateau

function HouseIndicator({
  x, y, w, h, houses, hotel, isBottom, isTop, isLeft, isRight,
}: {
  x: number; y: number; w: number; h: number;
  houses: number; hotel: boolean;
  isBottom: boolean; isTop: boolean; isLeft: boolean; isRight: boolean;
}) {
  const green = "#43A047";
  const red = "#E24B4A";

  if (hotel) {
    if (isBottom) return <rect x={x + w * 0.2} y={y + 5} width={w * 0.6} height={BAND_H - 10} rx="4" fill={red}/>;
    if (isTop)   return <rect x={x + w * 0.2} y={y + h - BAND_H + 5} width={w * 0.6} height={BAND_H - 10} rx="4" fill={red}/>;
    if (isLeft)  return <rect x={x + w - BAND_H + 5} y={y + h * 0.2} width={BAND_H - 10} height={h * 0.6} rx="4" fill={red}/>;
    if (isRight) return <rect x={x + 5} y={y + h * 0.2} width={BAND_H - 10} height={h * 0.6} rx="4" fill={red}/>;
    return null;
  }

  const houseSize = 19; // 8 × 2.3846
  const gap = 5;        // 2 × 2.3846
  const total = houses * (houseSize + gap) - gap;
  const startX = x + w / 2 - total / 2;

  if (isBottom) {
    return (
      <g>
        {Array.from({ length: houses }).map((_, i) => (
          <rect key={i} x={startX + i * (houseSize + gap)} y={y + 5} width={houseSize} height={BAND_H - 10} rx="2" fill={green}/>
        ))}
      </g>
    );
  }
  if (isTop) {
    return (
      <g>
        {Array.from({ length: houses }).map((_, i) => (
          <rect key={i} x={startX + i * (houseSize + gap)} y={y + h - BAND_H + 5} width={houseSize} height={BAND_H - 10} rx="2" fill={green}/>
        ))}
      </g>
    );
  }
  const startY = y + h / 2 - total / 2;
  if (isLeft) {
    return (
      <g>
        {Array.from({ length: houses }).map((_, i) => (
          <rect key={i} x={x + w - BAND_H + 5} y={startY + i * (houseSize + gap)} width={BAND_H - 10} height={houseSize} rx="2" fill={green}/>
        ))}
      </g>
    );
  }
  if (isRight) {
    return (
      <g>
        {Array.from({ length: houses }).map((_, i) => (
          <rect key={i} x={x + 5} y={startY + i * (houseSize + gap)} width={BAND_H - 10} height={houseSize} rx="2" fill={green}/>
        ))}
      </g>
    );
  }
  return null;
}

// ─── Pions ────────────────────────────────────────────────────────────────────

function PawnCluster({ pawns, cx, cy }: { pawns: Player[]; cx: number; cy: number }) {
  const offsets = [
    { dx: 0,   dy: 0   },
    { dx: -26, dy: -18 },
    { dx: 26,  dy: -18 },
    { dx: -26, dy: 18  },
    { dx: 26,  dy: 18  },
    { dx: 0,   dy: -36 },
  ];

  return (
    <g>
      {pawns.map((player, i) => {
        const off = offsets[i % offsets.length];
        const px = cx + off.dx;
        const py = cy + off.dy;
        const color = PLAYER_COLORS[player.color];
        return (
          <g key={player.id}>
            {/* Ombre portée */}
            <ellipse cx={px} cy={py + 18} rx="16" ry="8" fill="black" opacity="0.35"/>
            {/* Corps */}
            <ellipse cx={px} cy={py + 16} rx="15" ry="7" fill={color} opacity="0.6"/>
            <rect x={px - 9} y={py} width="18" height="18" rx="3" fill={color}/>
            {/* Tête */}
            <circle cx={px} cy={py - 9} r="13" fill={color}/>
            {/* Reflet */}
            <circle cx={px - 4} cy={py - 13} r="5" fill="white" opacity="0.35"/>
            {/* Bordure sombre pour lisibilité */}
            <circle cx={px} cy={py - 9} r="13" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5"/>
          </g>
        );
      })}
    </g>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

const Board: React.FC<BoardProps> = ({ players, properties, onCellClick, selectedCell }) => {
  const [hoveredCell, setHoveredCell] = React.useState<number | null>(null);

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
        {/* Passe 1 : highlights hover/sélection + maisons */}
        {CELLS.map((cell) => {
          const rect = getCellRect(cell.index);
          const { x, y, w, h, isBottom, isTop, isLeft, isRight } = rect;
          const property = propertyMap.get(cell.index);
          const isCorner = [0, 10, 20, 30].includes(cell.index);
          const hasHouses = !isCorner && ((property?.houses ?? 0) > 0 || (property?.hotel ?? false));
          const isSelected = selectedCell === cell.index;
          const isHovered  = hoveredCell  === cell.index;

          return (
            <g key={cell.index}>
              {/* Zone cliquable + hover */}
              <rect
                x={x} y={y} width={w} height={h}
                fill={
                  isSelected ? "rgba(255,210,0,0.18)"
                  : isHovered ? "rgba(255,255,255,0.10)"
                  : "transparent"
                }
                stroke={
                  isSelected ? "rgba(255,210,0,0.85)"
                  : isHovered ? "rgba(255,255,255,0.45)"
                  : "none"
                }
                strokeWidth={isSelected ? 4 : 3}
                rx={isCorner ? 6 : 3}
                onClick={onCellClick ? () => onCellClick(cell.index) : undefined}
                onMouseEnter={() => setHoveredCell(cell.index)}
                onMouseLeave={() => setHoveredCell(null)}
                style={{ cursor: onCellClick ? "pointer" : "default" }}
              />

              {/* Maisons / hôtel */}
              {hasHouses && (
                <HouseIndicator
                  x={x} y={y} w={w} h={h}
                  houses={property!.houses}
                  hotel={property!.hotel}
                  isBottom={isBottom} isTop={isTop} isLeft={isLeft} isRight={isRight}
                />
              )}
            </g>
          );
        })}

        {/* Passe 2 : pions (toujours au-dessus de tout) */}
        {CELLS.map((cell) => {
          const { cx, cy } = getCellRect(cell.index);
          const pawns = pawnsByPosition.get(cell.index) ?? [];
          if (pawns.length === 0) return null;
          return <PawnCluster key={`pawns-${cell.index}`} pawns={pawns} cx={cx} cy={cy} />;
        })}
      </svg>
    </div>
  );
};

export default Board;
export { CELLS, GROUP_COLORS, PLAYER_COLORS };
