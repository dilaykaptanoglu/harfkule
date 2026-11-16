export type Premium = 'TWS' | 'DWS' | 'TLS' | 'DLS' | 'CENTER' | null;

export type Letter =
  | 'A'
  | 'B'
  | 'C'
  | 'Ç'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'Ğ'
  | 'H'
  | 'I'
  | 'İ'
  | 'J'
  | 'K'
  | 'L'
  | 'M'
  | 'N'
  | 'O'
  | 'Ö'
  | 'P'
  | 'R'
  | 'S'
  | 'Ş'
  | 'T'
  | 'U'
  | 'Ü'
  | 'V'
  | 'Y'
  | 'Z';

export interface Tile {
  id: string;
  letter: Letter | null; // null = blank / joker
  points: number;
  isBlank: boolean;
}

export interface PlacedTile {
  tile: Tile;
  row: number;
  col: number;
  /** Letter blank represents when placed */
  blankAs?: Letter;
}

export interface Cell {
  row: number;
  col: number;
  premium: Premium;
  tile: PlacedTile | null;
}

export type Direction = 'across' | 'down';

export interface PendingPlacement {
  tileId: string;
  row: number;
  col: number;
  blankAs?: Letter;
}

export interface Player {
  id: 0 | 1;
  name: string;
  rack: Tile[];
  score: number;
}

export type GamePhase = 'playing' | 'passPhone' | 'ended';

export interface GameState {
  board: Cell[][];
  bag: Tile[];
  players: [Player, Player];
  currentPlayer: 0 | 1;
  pending: PendingPlacement[];
  consecutivePasses: number;
  phase: GamePhase;
  lastMoveScore: number;
  lastWords: string[];
  message: string | null;
  moveCount: number;
  winner: 0 | 1 | 'draw' | null;
}

export interface PlayResult {
  ok: boolean;
  error?: string;
  score?: number;
  words?: string[];
}
