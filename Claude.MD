# CLAUDE.md — Monopoly Web Open-Source

## Vue d'ensemble du projet

Jeu de Monopoly open-source jouable en navigateur, multijoueur en temps réel via des codes de partie. Les règles officielles sont définies dans `RULES.md` — c'est la source de vérité pour toute logique de jeu.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS + CSS Modules pour les composants de jeu |
| Temps réel | Socket.IO (WebSocket) |
| Backend | Node.js + Express |
| State management | Zustand |
| Build | Vite |
| Tests | Vitest + Testing Library |

---

## Structure du projet

```
monopoly/
├── CLAUDE.md
├── RULES.md                  # Source de vérité des règles du jeu
├── README.md
├── package.json
├── vite.config.ts
├── tsconfig.json
│
├── server/                   # Backend Node.js
│   ├── index.ts              # Point d'entrée Express + Socket.IO
│   ├── rooms.ts              # Gestion des salles / codes de partie
│   ├── gameEngine.ts         # Logique de jeu (doit respecter RULES.md)
│   ├── events.ts             # Définition des événements Socket.IO
│   └── types.ts              # Types partagés côté serveur
│
├── src/                      # Frontend React
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── Board/            # Plateau de jeu
│   │   │   ├── Board.tsx
│   │   │   ├── Cell.tsx      # Case individuelle
│   │   │   └── Pawn.tsx      # Pion joueur
│   │   ├── UI/
│   │   │   ├── Dice.tsx
│   │   │   ├── PlayerCard.tsx
│   │   │   ├── TradeModal.tsx
│   │   │   ├── PropertyCard.tsx
│   │   │   └── GameLog.tsx
│   │   └── Lobby/
│   │       ├── CreateRoom.tsx
│   │       ├── JoinRoom.tsx
│   │       └── WaitingRoom.tsx
│   ├── store/
│   │   ├── gameStore.ts      # État global Zustand
│   │   └── roomStore.ts
│   ├── hooks/
│   │   ├── useSocket.ts
│   │   └── useGame.ts
│   ├── assets/
│   │   └── sounds/           # Sons optionnels (dés, achat, etc.)
│   ├── constants/
│   │   └── board.ts          # Définition des 40 cases du plateau
│   └── types/
│       └── game.ts           # Types TypeScript partagés
│
└── shared/                   # Types/constantes partagés client-serveur
    └── types.ts
```

---

## Architecture multijoueur

### Codes de partie
- Chaque partie génère un code alphanumérique à 6 caractères (ex: `K4X9PL`)
- Le code est unique et valide 24h sans activité
- Max 6 joueurs par partie (règle standard Monopoly)
- Un joueur est désigné `host` → il peut lancer la partie

### Flux Socket.IO

```
Client                          Server
  |                               |
  |-- create_room --------------→ |  génère code, crée room
  |← room_created (code) -------- |
  |                               |
  |-- join_room (code) --------→ |  valide code, ajoute joueur
  |← room_updated (players) ----- |  broadcast à tous
  |                               |
  |-- start_game (host only) --→ |  initialise gameEngine
  |← game_started (state) ------- |  broadcast état initial
  |                               |
  |-- roll_dice ---------------→ |  vérifie que c'est le bon tour
  |← dice_result + state_update - |  broadcast nouvel état
```

### Événements Socket.IO à implémenter

```typescript
// Client → Server
'create_room'
'join_room'        // { code: string, playerName: string }
'start_game'       // host only
'roll_dice'
'buy_property'
'mortgage_property'
'build_house'      // { propertyId, quantity }
'propose_trade'    // { targetPlayerId, offer, request }
'accept_trade'
'refuse_trade'
'declare_bankruptcy'
'end_turn'

// Server → Client
'room_created'     // { code, roomId }
'room_updated'     // { players[] }
'game_started'     // { gameState }
'state_update'     // { gameState } — après chaque action
'player_disconnected'
'game_over'        // { winnerId }
'error'            // { message }
```

---

## Logique de jeu

> **Toujours se référer à `RULES.md`** pour toute implémentation de règle. En cas de doute, `RULES.md` prime sur toute autre source.

### gameEngine.ts — responsabilités
- Valider que l'action demandée est légale (bonne phase, bon joueur, fonds suffisants)
- Calculer le résultat des dés et déplacer le pion
- Appliquer les effets des cases (impôts, prison, chance, communauté, etc.)
- Gérer les transactions financières (achat, loyer, hypothèque)
- Détecter les conditions de fin de partie

### État de jeu (`GameState`)

```typescript
interface GameState {
  phase: 'lobby' | 'playing' | 'ended'
  turn: number
  currentPlayerId: string
  players: Player[]
  properties: Property[]
  deck: {
    chance: Card[]
    community: Card[]
  }
  log: GameEvent[]
}

interface Player {
  id: string
  name: string
  color: PlayerColor
  position: number       // 0-39
  money: number
  inJail: boolean
  jailTurns: number
  isBankrupt: boolean
  getOutOfJailCards: number
}
```

---

## Textures & Assets

### ✅ Choix retenu : Plateau full-SVG généré en code

Zéro asset externe, zéro dépendance, 100% libre de droits. Tout est rendu programmatiquement via SVG inline dans React.

### `Board.tsx` — déjà généré

Le composant `src/components/Board/Board.tsx` contient l'intégralité du plateau :

- **40 cases** calculées géométriquement (viewBox 780×780, coins 120×120, cases 60×120)
- **Bandes colorées** par groupe de propriété, orientées vers l'extérieur du plateau
- **Rotation du texte** automatique selon la rangée (haut / bas / gauche / droite)
- **Maisons** (carrés verts) et **hôtel** (rectangle rouge) affichés dans les bandes
- **Pions** empilés par case avec offset automatique pour 1 à 6 joueurs
- **Icônes inline** SVG pour gares (train), compagnies (éclair / goutte), taxes, chance, communauté
- **Coins** dessinés à la main : GO avec flèche, Jail avec barreaux, Free Parking avec voiture, Go to Jail avec personnage

```tsx
import Board from './components/Board/Board';

<Board
  players={gameState.players}       // Player[] avec position 0-39 et couleur
  properties={gameState.properties} // Property[] avec houses, hotel, ownerId
  onCellClick={(index) => handleCellClick(index)}
/>
```

### Données des cases — `constants/board.ts`

Les 40 cases (`CELLS`) et les couleurs des groupes (`GROUP_COLORS`) sont exportés depuis `Board.tsx` :

```typescript
import { CELLS, GROUP_COLORS, PLAYER_COLORS } from './components/Board/Board';
```

### Sons (optionnels)

Les seuls assets à ajouter manuellement si souhaité — pas bloquants pour la v1 :

```
src/assets/sounds/
├── dice_roll.mp3
├── buy_property.mp3
├── pay_rent.mp3
└── go_to_jail.mp3
```

Sources libres : **freesound.org** (licence CC0), **mixkit.co**.

---

## Conventions de code

- **TypeScript strict** — `"strict": true` dans tsconfig.json
- **Nommage** : composants en PascalCase, fonctions/variables en camelCase, constantes en SCREAMING_SNAKE_CASE
- **Logique de jeu** : 0 logique métier dans les composants React → tout passe par `gameEngine.ts` côté serveur
- **Immutabilité** : l'état de jeu ne se mute jamais directement, on retourne un nouvel objet
- **Erreurs** : toutes les actions invalides retournent `{ success: false, error: string }` sans throw

---

## Commandes

```bash
# Dev (frontend + backend en parallèle)
npm run dev

# Build production
npm run build

# Tests
npm run test

# Lint
npm run lint
```

---

## Ce qui N'est PAS dans le scope

- Compte utilisateur / authentification persistante
- Base de données (l'état de partie est en mémoire)
- Monétisation, pub ou analytics
- Version mobile native (responsive web uniquement)
- IA / bot joueur (hors scope v1)