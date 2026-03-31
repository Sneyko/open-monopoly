/**
 * Board.tsx — Plateau de Monopoly full-SVG, 100% programmatique
 * Zéro asset externe. 40 cases, 4 coins, couleurs par groupe de propriété.
 *
 * Usage:
 *   <Board players={players} properties={properties} />
 *
 * Le plateau SVG est un carré de 780×780 unités.
 * Chaque case = 60×120 (cases du bas/haut) ou 120×60 (cases côté).
 * Les 4 coins = 120×120.
 */

import React from "react";

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
// ViewBox 780×780. Coins 120×120. Cases normales 60 large × 120 haut.
// Rangées : bottom (0→10), left (11→20, de bas en haut), top (21→30), right (31→39+0)

const S = 780;   // taille totale SVG
const C = 120;   // taille d'un coin
const W = 60;    // largeur d'une case normale
const H = 120;   // hauteur d'une case normale

/**
 * Retourne {x, y, width, height, rotation} pour chaque case.
 * La rotation est appliquée autour du centre de la case pour que le texte
 * soit toujours lisible en regardant depuis l'extérieur du plateau.
 */
function getCellRect(index: number): {
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  cx: number; // centre x
  cy: number; // centre y
} {
  if (index === 0) {
    // GO — coin bas-droit
    return { x: S - C, y: S - C, w: C, h: C, rotation: 0, cx: S - C / 2, cy: S - C / 2 };
  }
  if (index === 10) {
    // Jail — coin bas-gauche
    return { x: 0, y: S - C, w: C, h: C, rotation: 0, cx: C / 2, cy: S - C / 2 };
  }
  if (index === 20) {
    // Free Parking — coin haut-gauche
    return { x: 0, y: 0, w: C, h: C, rotation: 0, cx: C / 2, cy: C / 2 };
  }
  if (index === 30) {
    // Go to Jail — coin haut-droit
    return { x: S - C, y: 0, w: C, h: C, rotation: 0, cx: S - C / 2, cy: C / 2 };
  }

  if (index >= 1 && index <= 9) {
    // Rangée du bas (de droite à gauche) — index 1→9
    const pos = 10 - index; // 9→1 de gauche à droite depuis le coin GO
    const x = C + (pos - 1) * W;
    return { x, y: S - H, w: W, h: H, rotation: 0, cx: x + W / 2, cy: S - H / 2 };
  }
  if (index >= 11 && index <= 19) {
    // Rangée gauche (de bas en haut)
    const pos = index - 10; // 1→9
    const y = S - C - pos * W;
    return { x: 0, y, w: H, h: W, rotation: 0, cx: H / 2, cy: y + W / 2 };
  }
  if (index >= 21 && index <= 29) {
    // Rangée du haut (de gauche à droite)
    const pos = index - 20; // 1→9
    const x = C + (pos - 1) * W;
    return { x, y: 0, w: W, h: H, rotation: 0, cx: x + W / 2, cy: H / 2 };
  }
  if (index >= 31 && index <= 39) {
    // Rangée droite (de haut en bas)
    const pos = index - 30; // 1→9
    const y = C + (pos - 1) * W;
    return { x: S - H, y, w: H, h: W, rotation: 0, cx: S - H / 2, cy: y + W / 2 };
  }

  return { x: 0, y: 0, w: W, h: H, rotation: 0, cx: W / 2, cy: H / 2 };
}

// ─── Icônes SVG inline ────────────────────────────────────────────────────────

function IconTrain({ x, y, size = 28 }: { x: number; y: number; size?: number }) {
  const s = size / 28;
  return (
    <g transform={`translate(${x - size / 2}, ${y - size / 2}) scale(${s})`}>
      <rect x="4" y="8" width="20" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="2"/>
      <rect x="8" y="4" width="12" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="9" cy="24" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="19" cy="24" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="4" y1="18" x2="24" y2="18" stroke="currentColor" strokeWidth="1.5"/>
    </g>
  );
}

function IconLightning({ x, y, size = 22 }: { x: number; y: number; size?: number }) {
  const s = size / 22;
  return (
    <g transform={`translate(${x - size / 2}, ${y - size / 2}) scale(${s})`}>
      <path d="M13 2L4 13h7l-2 9 11-13h-7z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    </g>
  );
}

function IconDroplet({ x, y, size = 22 }: { x: number; y: number; size?: number }) {
  const s = size / 22;
  return (
    <g transform={`translate(${x - size / 2}, ${y - size / 2}) scale(${s})`}>
      <path d="M11 3L5 13a6 6 0 0012 0L11 3z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    </g>
  );
}

function IconQuestion({ x, y, size = 22 }: { x: number; y: number; size?: number }) {
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
      fontSize={size} fontWeight="bold" fill="currentColor">?</text>
  );
}

function IconCard({ x, y, size = 22 }: { x: number; y: number; size?: number }) {
  const s = size / 22;
  return (
    <g transform={`translate(${x - size / 2}, ${y - size / 2}) scale(${s})`}>
      <rect x="2" y="4" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8"/>
      <line x1="2" y1="9" x2="20" y2="9" stroke="currentColor" strokeWidth="1.5"/>
    </g>
  );
}

// ─── Rendu d'une case ─────────────────────────────────────────────────────────

function Cell({
  cell,
  rect,
  property,
  pawns,
  onClick,
}: {
  cell: CellData;
  rect: ReturnType<typeof getCellRect>;
  property?: Property;
  pawns: Player[];
  onClick?: () => void;
}) {
  const { x, y, w, h } = rect;
  const isCorner = [0, 10, 20, 30].includes(cell.index);

  // Couleur de fond
  const bgColor = "#FAFAF8";
  const borderColor = "#3d3d3a";

  // Bande colorée (propriétés uniquement)
  const bandH = 18;
  const hasBand = cell.type === "property" && cell.colorGroup;
  const bandColor = hasBand ? GROUP_COLORS[cell.colorGroup!] : null;

  // Orientation du texte selon la rangée
  const isBottom = cell.index >= 1 && cell.index <= 9;
  const isTop = cell.index >= 21 && cell.index <= 29;
  const isLeft = cell.index >= 11 && cell.index <= 19;
  const isRight = cell.index >= 31 && cell.index <= 39;

  // Rotation du groupe (pour que le texte soit lisible depuis l'extérieur)
  let textTransform = "";
  const midX = x + w / 2;
  const midY = y + h / 2;
  if (isLeft) textTransform = `rotate(90, ${midX}, ${midY})`;
  if (isRight) textTransform = `rotate(-90, ${midX}, ${midY})`;
  if (isTop) textTransform = `rotate(180, ${midX}, ${midY})`;

  // Taille de police adaptée
  const fontSize = isCorner ? 9 : Math.min(8, (w - 4) / Math.max(...cell.name.split(" ").map((s) => s.length)) * 1.4);

  // Maisons / hôtel
  const houses = property?.houses ?? 0;
  const hotel = property?.hotel ?? false;

  // Propriétaire
  const owned = property?.ownerId !== undefined;

  return (
    <g
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      {/* Fond */}
      <rect
        x={x} y={y} width={w} height={h}
        fill={bgColor}
        stroke={borderColor}
        strokeWidth="0.8"
      />

      {/* Bande couleur (propriétés) — en haut de la case vue de l'extérieur */}
      {hasBand && bandColor && (
        <>
          {/* Bottom row : bande en haut de la case (y minimal) */}
          {isBottom && <rect x={x} y={y} width={w} height={bandH} fill={bandColor}/>}
          {/* Top row : bande en bas de la case (y + h - bandH) */}
          {isTop && <rect x={x} y={y + h - bandH} width={w} height={bandH} fill={bandColor}/>}
          {/* Left col : bande à droite de la case (x + w - bandH) */}
          {isLeft && <rect x={x + w - bandH} y={y} width={bandH} height={h} fill={bandColor}/>}
          {/* Right col : bande à gauche de la case (x) */}
          {isRight && <rect x={x} y={y} width={bandH} height={h} fill={bandColor}/>}
        </>
      )}

      {/* Contenu textuel (rotatif) */}
      <g transform={textTransform}>
        {isCorner ? (
          <CornerContent cell={cell} x={x} y={y} w={w} h={h} />
        ) : (
          <NormalContent cell={cell} x={x} y={y} w={w} h={h} fontSize={fontSize} hasBand={!!hasBand} owned={owned}/>
        )}
      </g>

      {/* Maisons / hôtel */}
      {(houses > 0 || hotel) && !isCorner && (
        <HouseIndicator x={x} y={y} w={w} h={h} houses={houses} hotel={hotel}
          isBottom={isBottom} isTop={isTop} isLeft={isLeft} isRight={isRight} bandH={bandH}/>
      )}

      {/* Pions */}
      {pawns.length > 0 && (
        <PawnCluster pawns={pawns} cx={midX} cy={midY} />
      )}
    </g>
  );
}

function CornerContent({ cell, x, y, w, h }: { cell: CellData; x: number; y: number; w: number; h: number }) {
  const cx = x + w / 2;
  const cy = y + h / 2;

  switch (cell.type) {
    case "go":
      return (
        <>
          <text x={cx} y={cy - 14} textAnchor="middle" dominantBaseline="central" fontSize="22" fontWeight="bold" fill="#E24B4A">GO</text>
          <text x={cx} y={cy + 10} textAnchor="middle" dominantBaseline="central" fontSize="7.5" fill="#3d3d3a">Collect $200</text>
          {/* Arrow right-down */}
          <path d={`M${cx - 14},${cy + 30} L${cx + 14},${cy + 30} L${cx + 14},${cy + 22}`} fill="none" stroke="#E24B4A" strokeWidth="2.5" strokeLinejoin="round"/>
          <path d={`M${cx + 10},${cy + 18} L${cx + 14},${cy + 22} L${cx + 18},${cy + 18}`} fill="none" stroke="#E24B4A" strokeWidth="2.5"/>
        </>
      );
    case "jail":
      return (
        <>
          <text x={cx - 10} y={cy - 20} textAnchor="middle" dominantBaseline="central" fontSize="7" fill="#666">Just</text>
          <text x={cx - 10} y={cy - 10} textAnchor="middle" dominantBaseline="central" fontSize="7" fill="#666">visiting</text>
          <line x1={x + 32} y1={y} x2={x + 32} y2={y + h} stroke="#3d3d3a" strokeWidth="0.6"/>
          <line x1={x} y1={y + 32} x2={x + w} y2={y + 32} stroke="#3d3d3a" strokeWidth="0.6"/>
          {/* Barreaux */}
          {[40, 50, 60, 70, 80, 90].map((bx) => (
            <line key={bx} x1={x + bx} y1={y + 34} x2={x + bx} y2={y + h - 4} stroke="#3d3d3a" strokeWidth="0.8" strokeOpacity="0.5"/>
          ))}
          <text x={cx + 15} y={cy + 18} textAnchor="middle" dominantBaseline="central" fontSize="8.5" fontWeight="bold" fill="#E24B4A">JAIL</text>
        </>
      );
    case "free-parking":
      return (
        <>
          <text x={cx} y={cy - 16} textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="bold" fill="#3d3d3a">FREE</text>
          <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="bold" fill="#3d3d3a">PARKING</text>
          {/* Voiture stylisée */}
          <g transform={`translate(${cx - 18}, ${cy + 8})`}>
            <rect x="0" y="8" width="36" height="12" rx="4" fill="none" stroke="#3d3d3a" strokeWidth="1.2"/>
            <path d="M6 8 Q8 2 14 2 L22 2 Q28 2 30 8" fill="none" stroke="#3d3d3a" strokeWidth="1.2"/>
            <circle cx="9" cy="21" r="3" fill="none" stroke="#3d3d3a" strokeWidth="1.2"/>
            <circle cx="27" cy="21" r="3" fill="none" stroke="#3d3d3a" strokeWidth="1.2"/>
          </g>
        </>
      );
    case "go-to-jail":
      return (
        <>
          <text x={cx} y={cy - 18} textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="bold" fill="#E24B4A">GO TO</text>
          <text x={cx} y={cy - 6} textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="bold" fill="#E24B4A">JAIL</text>
          {/* Policier stylisé */}
          <circle cx={cx} cy={cy + 14} r="8" fill="none" stroke="#E24B4A" strokeWidth="1.2"/>
          <line x1={cx} y1={cy + 22} x2={cx} y2={cy + 36} stroke="#E24B4A" strokeWidth="1.2"/>
          <line x1={cx - 8} y1={cy + 28} x2={cx + 8} y2={cy + 28} stroke="#E24B4A" strokeWidth="1.2"/>
          <line x1={cx} y1={cy + 36} x2={cx - 6} y2={cy + 46} stroke="#E24B4A" strokeWidth="1.2"/>
          <line x1={cx} y1={cy + 36} x2={cx + 6} y2={cy + 46} stroke="#E24B4A" strokeWidth="1.2"/>
        </>
      );
    default:
      return null;
  }
}

function NormalContent({
  cell, x, y, w, h, fontSize, hasBand, owned
}: {
  cell: CellData; x: number; y: number; w: number; h: number;
  fontSize: number; hasBand: boolean; owned: boolean;
}) {
  const cx = x + w / 2;
  const bandOffset = hasBand ? 22 : 6;
  const availableH = h - bandOffset - 4;
  const iconY = y + bandOffset + availableH * 0.38;
  const nameY1 = y + bandOffset + availableH * 0.62;
  const nameY2 = y + bandOffset + availableH * 0.76;
  const priceY = y + bandOffset + availableH * 0.92;

  // Diviser le nom en max 2 lignes
  const words = cell.name.split(" ");
  let line1 = "";
  let line2 = "";
  if (words.length === 1) {
    line1 = words[0];
  } else if (words.length === 2) {
    line1 = words[0];
    line2 = words[1];
  } else {
    const mid = Math.ceil(words.length / 2);
    line1 = words.slice(0, mid).join(" ");
    line2 = words.slice(mid).join(" ");
  }

  const textColor = "#2C2C2A";
  const subColor = "#5F5E5A";

  return (
    <>
      {/* Icône */}
      <g color={subColor}>
        {cell.type === "railroad" && <IconTrain x={cx} y={iconY} size={20}/>}
        {cell.type === "utility" && cell.name.includes("Electric") && <IconLightning x={cx} y={iconY} size={20}/>}
        {cell.type === "utility" && cell.name.includes("Water") && <IconDroplet x={cx} y={iconY} size={20}/>}
        {cell.type === "chance" && <IconQuestion x={cx} y={iconY} size={18}/>}
        {cell.type === "community" && <IconCard x={cx} y={iconY} size={18}/>}
        {cell.type === "tax" && (
          <text x={cx} y={iconY} textAnchor="middle" dominantBaseline="central" fontSize="16" fill={textColor}>%</text>
        )}
      </g>

      {/* Nom (1 ou 2 lignes) */}
      <text
        x={cx} y={line2 ? nameY1 : (nameY1 + nameY2) / 2}
        textAnchor="middle" dominantBaseline="central"
        fontSize={fontSize} fontWeight="500" fill={textColor}
      >{line1}</text>
      {line2 && (
        <text x={cx} y={nameY2} textAnchor="middle" dominantBaseline="central"
          fontSize={fontSize} fontWeight="500" fill={textColor}>{line2}</text>
      )}

      {/* Prix */}
      {cell.price && (
        <text x={cx} y={priceY} textAnchor="middle" dominantBaseline="central"
          fontSize={Math.max(6, fontSize - 0.5)} fill={subColor}>${cell.price}</text>
      )}

      {/* Indicateur propriété achetée */}
      {owned && (
        <circle cx={cx + w * 0.3} cy={y + bandOffset + 6} r="3" fill="#E24B4A" opacity="0.8"/>
      )}
    </>
  );
}

function HouseIndicator({
  x, y, w, h, houses, hotel, isBottom, isTop, isLeft, isRight, bandH
}: {
  x: number; y: number; w: number; h: number;
  houses: number; hotel: boolean;
  isBottom: boolean; isTop: boolean; isLeft: boolean; isRight: boolean;
  bandH: number;
}) {
  const green = "#43A047";
  const red = "#E24B4A";

  if (hotel) {
    // Hôtel = grand rectangle rouge dans la bande
    if (isBottom) return <rect x={x + w * 0.2} y={y + 2} width={w * 0.6} height={bandH - 4} rx="2" fill={red}/>;
    if (isTop) return <rect x={x + w * 0.2} y={y + h - bandH + 2} width={w * 0.6} height={bandH - 4} rx="2" fill={red}/>;
    if (isLeft) return <rect x={x + w - bandH + 2} y={y + h * 0.2} width={bandH - 4} height={h * 0.6} rx="2" fill={red}/>;
    if (isRight) return <rect x={x + 2} y={y + h * 0.2} width={bandH - 4} height={h * 0.6} rx="2" fill={red}/>;
  }

  // Maisons = petits carrés verts
  const houseSize = 8;
  const gap = 2;
  const total = houses * (houseSize + gap) - gap;
  const startX = x + w / 2 - total / 2;

  if (isBottom) {
    return (
      <g>
        {Array.from({ length: houses }).map((_, i) => (
          <rect key={i} x={startX + i * (houseSize + gap)} y={y + 2} width={houseSize} height={bandH - 4} rx="1" fill={green}/>
        ))}
      </g>
    );
  }
  if (isTop) {
    return (
      <g>
        {Array.from({ length: houses }).map((_, i) => (
          <rect key={i} x={startX + i * (houseSize + gap)} y={y + h - bandH + 2} width={houseSize} height={bandH - 4} rx="1" fill={green}/>
        ))}
      </g>
    );
  }
  // Left/Right : maisons empilées verticalement
  const startY = y + h / 2 - total / 2;
  if (isLeft) {
    return (
      <g>
        {Array.from({ length: houses }).map((_, i) => (
          <rect key={i} x={x + w - bandH + 2} y={startY + i * (houseSize + gap)} width={bandH - 4} height={houseSize} rx="1" fill={green}/>
        ))}
      </g>
    );
  }
  if (isRight) {
    return (
      <g>
        {Array.from({ length: houses }).map((_, i) => (
          <rect key={i} x={x + 2} y={startY + i * (houseSize + gap)} width={bandH - 4} height={houseSize} rx="1" fill={green}/>
        ))}
      </g>
    );
  }
  return null;
}

function PawnCluster({ pawns, cx, cy }: { pawns: Player[]; cx: number; cy: number }) {
  const n = pawns.length;
  const offsets = [
    { dx: 0, dy: 0 },
    { dx: -8, dy: -5 },
    { dx: 8, dy: -5 },
    { dx: -8, dy: 5 },
    { dx: 8, dy: 5 },
    { dx: 0, dy: -10 },
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
            {/* Corps du pion */}
            <ellipse cx={px} cy={py + 5} rx="5" ry="2.5" fill={color} opacity="0.5"/>
            <rect x={px - 3} y={py} width="6" height="6" rx="1" fill={color}/>
            <circle cx={px} cy={py - 3} r="4" fill={color}/>
            <circle cx={px} cy={py - 3} r="2" fill="white" opacity="0.4"/>
          </g>
        );
      })}
    </g>
  );
}

// ─── Centre du plateau ───────────────────────────────────────────────────────

function BoardCenter() {
  const cx = S / 2;
  const cy = S / 2;
  const innerSize = S - 2 * C; // 540

  return (
    <g>
      {/* Fond du centre */}
      <rect x={C} y={C} width={innerSize} height={innerSize} fill="#F5F3EE"/>

      {/* Logo / titre */}
      <text x={cx} y={cy - 60} textAnchor="middle" dominantBaseline="central"
        fontSize="52" fontWeight="900" letterSpacing="4"
        style={{ fontFamily: "Georgia, serif" }}
        fill="#1a1a18">
        MONOPOLY
      </text>
      <text x={cx} y={cy - 8} textAnchor="middle" dominantBaseline="central"
        fontSize="13" letterSpacing="8" fill="#5F5E5A">
        OPEN · SOURCE
      </text>

      {/* Ligne décorative */}
      <line x1={cx - 120} y1={cy + 10} x2={cx + 120} y2={cy + 10} stroke="#3d3d3a" strokeWidth="0.5" opacity="0.4"/>
      <line x1={cx - 80} y1={cy + 16} x2={cx + 80} y2={cy + 16} stroke="#3d3d3a" strokeWidth="0.5" opacity="0.2"/>

      {/* Dés décoratifs */}
      <g transform={`translate(${cx - 44}, ${cy + 34})`} opacity="0.6">
        <rect width="34" height="34" rx="6" fill="white" stroke="#3d3d3a" strokeWidth="1"/>
        <circle cx="10" cy="10" r="3" fill="#3d3d3a"/>
        <circle cx="24" cy="10" r="3" fill="#3d3d3a"/>
        <circle cx="17" cy="17" r="3" fill="#3d3d3a"/>
        <circle cx="10" cy="24" r="3" fill="#3d3d3a"/>
        <circle cx="24" cy="24" r="3" fill="#3d3d3a"/>
      </g>
      <g transform={`translate(${cx + 10}, ${cy + 34})`} opacity="0.6">
        <rect width="34" height="34" rx="6" fill="white" stroke="#3d3d3a" strokeWidth="1"/>
        <circle cx="17" cy="11" r="3" fill="#3d3d3a"/>
        <circle cx="10" cy="17" r="3" fill="#3d3d3a"/>
        <circle cx="24" cy="17" r="3" fill="#3d3d3a"/>
        <circle cx="17" cy="23" r="3" fill="#3d3d3a"/>
      </g>

      {/* Légende groupes de couleur */}
      <g transform={`translate(${cx - 200}, ${cy + 90})`}>
        {Object.entries(GROUP_COLORS).map(([group, color], i) => {
          const col = i % 4;
          const row = Math.floor(i / 4);
          return (
            <g key={group} transform={`translate(${col * 100}, ${row * 20})`}>
              <rect width="12" height="12" rx="2" fill={color} y="0"/>
              <text x="16" y="9" fontSize="9" fill="#5F5E5A" dominantBaseline="central">
                {group.charAt(0).toUpperCase() + group.slice(1)}
              </text>
            </g>
          );
        })}
      </g>
    </g>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

const Board: React.FC<BoardProps> = ({ players, properties, onCellClick }) => {
  const propertyMap = new Map<number, Property>(
    properties.map((p) => [p.id, p])
  );

  // Regrouper les pions par position
  const pawnsByPosition = new Map<number, Player[]>();
  for (const player of players) {
    const arr = pawnsByPosition.get(player.position) ?? [];
    arr.push(player);
    pawnsByPosition.set(player.position, arr);
  }

  return (
    <svg
      viewBox={`0 0 ${S} ${S}`}
      width="100%"
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        border: "3px solid #2C2C2A",
        borderRadius: "8px",
        background: "#FAFAF8",
        boxShadow: "0 12px 60px rgba(0,0,0,0.5)",
      }}
      aria-label="Monopoly board"
    >
      {/* Centre */}
      <BoardCenter />

      {/* 40 cases */}
      {CELLS.map((cell) => {
        const rect = getCellRect(cell.index);
        const property = propertyMap.get(cell.index);
        const pawns = pawnsByPosition.get(cell.index) ?? [];

        return (
          <Cell
            key={cell.index}
            cell={cell}
            rect={rect}
            property={property}
            pawns={pawns}
            onClick={onCellClick ? () => onCellClick(cell.index) : undefined}
          />
        );
      })}
    </svg>
  );
};

export default Board;
export { CELLS, GROUP_COLORS, PLAYER_COLORS };
