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

// Maison en forme de maison (carré + toit triangulaire)
// cx/cy = centre de la maison, size = largeur, angle = rotation (0 = toit vers le haut)
function HouseShape({ cx, cy, size, angle, color, shadow }: {
  cx: number; cy: number; size: number; angle: number; color: string; shadow?: string;
}) {
  const bodyH = size * 0.55;
  const roofH = size * 0.48;
  // Corps : centré sous le toit
  const bx = cx - size / 2;
  const by = cy - bodyH / 2 + roofH * 0.3;
  // Toit : triangle au-dessus du corps
  const roofPoints = `${cx},${by - roofH} ${cx - size / 2 - 1},${by} ${cx + size / 2 + 1},${by}`;
  return (
    <g transform={`rotate(${angle}, ${cx}, ${cy})`}>
      {shadow && <rect x={bx + 1} y={by + 1} width={size} height={bodyH} rx="1.5" fill={shadow} opacity="0.4"/>}
      <rect x={bx} y={by} width={size} height={bodyH} rx="1.5" fill={color}/>
      <rect x={bx + size * 0.35} y={by + bodyH * 0.45} width={size * 0.3} height={bodyH * 0.55} rx="1" fill="rgba(0,0,0,0.25)"/>
      {shadow && <polygon points={`${cx},${by - roofH - 0.5} ${cx - size / 2 - 1},${by + 0.5} ${cx + size / 2 + 1},${by + 0.5}`} fill={shadow} opacity="0.4" transform={`translate(1,1)`}/>}
      <polygon points={roofPoints} fill={color} style={{ filter: 'brightness(0.78)' }}/>
    </g>
  );
}

// Hôtel (bâtiment plus large avec toit plat et fenêtres)
function HotelShape({ cx, cy, w, h, angle, color, shadow }: {
  cx: number; cy: number; w: number; h: number; angle: number; color: string; shadow?: string;
}) {
  const bx = cx - w / 2;
  const by = cy - h / 2;
  const roofH = h * 0.22;
  return (
    <g transform={`rotate(${angle}, ${cx}, ${cy})`}>
      {shadow && <rect x={bx + 1.5} y={by + 1.5} width={w} height={h} rx="2.5" fill={shadow} opacity="0.4"/>}
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
  const shadow = "#000000";

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
    return <HotelShape cx={cx} cy={cy} w={hw} h={hh} angle={angle} color={red} shadow={shadow}/>;
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
          <HouseShape key={i} cx={startX + i * (houseSize + gap)} cy={cy} size={houseSize} angle={angle} color={green} shadow={shadow}/>
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
        <HouseShape key={i} cx={cx} cy={startY + i * (houseSize + gap)} size={houseSize} angle={angle} color={green} shadow={shadow}/>
      ))}
    </g>
  );
}

// ─── Pions ────────────────────────────────────────────────────────────────────

function PawnCluster({ pawns, cx, cy, currentPlayerId }: { pawns: Player[]; cx: number; cy: number; currentPlayerId?: string }) {
  const offsets = [
    { dx: 0,   dy: 0   },
    { dx: -28, dy: -20 },
    { dx: 28,  dy: -20 },
    { dx: -28, dy: 20  },
    { dx: 28,  dy: 20  },
    { dx: 0,   dy: -40 },
  ];

  return (
    <g>
      {pawns.map((player, i) => {
        const off = offsets[i % offsets.length];
        const px = cx + off.dx;
        const py = cy + off.dy;
        const color = PLAYER_COLORS[player.color];
        const isActive = player.id === currentPlayerId;

        return (
          <g key={player.id}>
            {/* Halo pour le joueur actif */}
            {isActive && (
              <circle cx={px} cy={py - 9} r="22" fill={color} opacity="0.25"
                style={{ filter: `drop-shadow(0 0 8px ${color})` }}/>
            )}
            {/* Anneau extérieur blanc pour visibilité */}
            <circle cx={px} cy={py - 9} r={isActive ? 17 : 15}
              fill="none" stroke="white" strokeWidth={isActive ? 3 : 1.5} opacity={isActive ? 0.9 : 0.5}/>
            {/* Ombre portée */}
            <ellipse cx={px} cy={py + 20} rx="17" ry="8" fill="black" opacity="0.5"/>
            {/* Corps */}
            <ellipse cx={px} cy={py + 17} rx="16" ry="7" fill={color} opacity="0.9"/>
            <rect x={px - 10} y={py} width="20" height="19" rx="3" fill={color}/>
            {/* Tête */}
            <circle cx={px} cy={py - 9} r={isActive ? 16 : 14} fill={color}/>
            {/* Contour couleur vive */}
            <circle cx={px} cy={py - 9} r={isActive ? 16 : 14}
              fill="none" stroke={isActive ? 'white' : 'rgba(255,255,255,0.4)'} strokeWidth={isActive ? 2.5 : 1.5}/>
            {/* Reflet */}
            <circle cx={px - 5} cy={py - 15} r={isActive ? 6 : 5} fill="white" opacity={isActive ? 0.5 : 0.3}/>
          </g>
        );
      })}
    </g>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

const Board: React.FC<BoardProps> = ({ players, properties, onCellClick, selectedCell, currentPlayerId }) => {
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
          const isOwned = !isCorner && !!property?.ownerId && !hasHouses;
          const ownerColor = isOwned
            ? PLAYER_COLORS[(players.find(p => p.id === property!.ownerId)?.color ?? 'red')]
            : null;
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

              {/* Indicateur propriétaire (sans maison) : bande colorée opaque + pastille */}
              {isOwned && ownerColor && (() => {
                // Coordonnées de la bande colorée selon la rangée
                const bandX = isLeft ? x + w - BAND_H : isRight ? x : x;
                const bandY = isBottom ? y : isTop ? y + h - BAND_H : y;
                const bandW = (isLeft || isRight) ? BAND_H : w;
                const bandH2 = (isLeft || isRight) ? h : BAND_H;
                const cx2 = bandX + bandW / 2;
                const cy2 = bandY + bandH2 / 2;
                const r = Math.min(bandW, bandH2) * 0.28;
                return (
                  <g>
                    {/* Fond semi-transparent couleur joueur sur la bande */}
                    <rect x={bandX} y={bandY} width={bandW} height={bandH2}
                      fill={ownerColor} opacity={0.28} rx={2}/>
                    {/* Pastille centrale */}
                    <circle cx={cx2} cy={cy2} r={r + 2} fill="rgba(0,0,0,0.55)"/>
                    <circle cx={cx2} cy={cy2} r={r} fill={ownerColor}/>
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
          const { cx, cy } = getCellRect(cell.index);
          const pawns = pawnsByPosition.get(cell.index) ?? [];
          if (pawns.length === 0) return null;
          return <PawnCluster key={`pawns-${cell.index}`} pawns={pawns} cx={cx} cy={cy} currentPlayerId={currentPlayerId} />;
        })}
      </svg>
    </div>
  );
};

export default Board;
export { CELLS, GROUP_COLORS, PLAYER_COLORS };
