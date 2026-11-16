import { BOARD_SIZE, CENTER } from './boardLayout';
import { isValidWord } from './dictionary';
import { BINGO_BONUS, displayLetter } from './letters';
import type {
  Cell,
  Direction,
  Letter,
  PendingPlacement,
  PlayResult,
  PlacedTile,
  Tile,
} from './types';

type Occupancy = Map<string, { tile: Tile; blankAs?: Letter; isNew: boolean; premiumUsed: boolean }>;

function k(r: number, c: number) {
  return `${r},${c}`;
}

function buildOccupancy(board: Cell[][], pending: PendingPlacement[], rack: Tile[]): Occupancy | string {
  const occ: Occupancy = new Map();
  for (let r = 0; r < BOARD_SIZE; r += 1) {
    for (let c = 0; c < BOARD_SIZE; c += 1) {
      const placed = board[r][c].tile;
      if (placed) {
        occ.set(k(r, c), {
          tile: placed.tile,
          blankAs: placed.blankAs,
          isNew: false,
          premiumUsed: true, // already scored previously
        });
      }
    }
  }

  const rackById = new Map(rack.map((t) => [t.id, t]));
  const used = new Set<string>();

  for (const p of pending) {
    if (p.row < 0 || p.row >= BOARD_SIZE || p.col < 0 || p.col >= BOARD_SIZE) {
      return 'Geçersiz kare.';
    }
    const cellKey = k(p.row, p.col);
    if (occ.has(cellKey)) return 'Kare dolu.';
    if (used.has(p.tileId)) return 'Aynı taş iki kez kullanıldı.';
    const tile = rackById.get(p.tileId);
    if (!tile) return 'Taş rafta yok.';
    if (tile.isBlank && !p.blankAs) return 'Joker için harf seç.';
    used.add(p.tileId);
    occ.set(cellKey, {
      tile,
      blankAs: p.blankAs,
      isNew: true,
      premiumUsed: false,
    });
  }

  return occ;
}

function letterAt(occ: Occupancy, r: number, c: number): string | null {
  const cell = occ.get(k(r, c));
  if (!cell) return null;
  return displayLetter(cell.tile, cell.blankAs);
}

function readWord(
  occ: Occupancy,
  r: number,
  c: number,
  dir: Direction,
): { word: string; cells: Array<[number, number]>; hasNew: boolean } | null {
  const dr = dir === 'down' ? 1 : 0;
  const dc = dir === 'across' ? 1 : 0;

  let sr = r;
  let sc = c;
  while (sr - dr >= 0 && sc - dc >= 0 && letterAt(occ, sr - dr, sc - dc)) {
    sr -= dr;
    sc -= dc;
  }

  const cells: Array<[number, number]> = [];
  let word = '';
  let hasNew = false;
  let rr = sr;
  let cc = sc;
  while (rr < BOARD_SIZE && cc < BOARD_SIZE && letterAt(occ, rr, cc)) {
    word += letterAt(occ, rr, cc);
    cells.push([rr, cc]);
    const cell = occ.get(k(rr, cc))!;
    if (cell.isNew) hasNew = true;
    rr += dr;
    cc += dc;
  }

  if (word.length < 2) return null;
  return { word, cells, hasNew };
}

function scoreWord(
  board: Cell[][],
  occ: Occupancy,
  cells: Array<[number, number]>,
): number {
  let sum = 0;
  let wordMult = 1;

  for (const [r, c] of cells) {
    const cell = occ.get(k(r, c))!;
    let pts = cell.tile.points;
    if (cell.isNew && !cell.premiumUsed) {
      const premium = board[r][c].premium;
      if (premium === 'DLS') pts *= 2;
      if (premium === 'TLS') pts *= 3;
      if (premium === 'DWS' || premium === 'CENTER') wordMult *= 2;
      if (premium === 'TWS') wordMult *= 3;
    }
    sum += pts;
  }
  return sum * wordMult;
}

export function validateAndScore(
  board: Cell[][],
  pending: PendingPlacement[],
  rack: Tile[],
  isFirstMove: boolean,
): PlayResult {
  if (pending.length === 0) return { ok: false, error: 'Taş yerleştir.' };

  const occOrErr = buildOccupancy(board, pending, rack);
  if (typeof occOrErr === 'string') return { ok: false, error: occOrErr };
  const occ = occOrErr;

  const rows = [...new Set(pending.map((p) => p.row))];
  const cols = [...new Set(pending.map((p) => p.col))];
  if (rows.length > 1 && cols.length > 1) {
    return { ok: false, error: 'Taşlar aynı satır veya sütunda olmalı.' };
  }

  const dir: Direction = rows.length === 1 ? 'across' : 'down';
  const mainAnchor = pending[0];

  // Contiguity along the main line: between min and max, every cell filled
  if (dir === 'across') {
    const r = rows[0];
    const minC = Math.min(...pending.map((p) => p.col));
    const maxC = Math.max(...pending.map((p) => p.col));
    for (let c = minC; c <= maxC; c += 1) {
      if (!letterAt(occ, r, c)) return { ok: false, error: 'Kelimede boşluk olamaz.' };
    }
  } else {
    const c = cols[0];
    const minR = Math.min(...pending.map((p) => p.row));
    const maxR = Math.max(...pending.map((p) => p.row));
    for (let r = minR; r <= maxR; r += 1) {
      if (!letterAt(occ, r, c)) return { ok: false, error: 'Kelimede boşluk olamaz.' };
    }
  }

  if (isFirstMove) {
    if (!pending.some((p) => p.row === CENTER && p.col === CENTER)) {
      return { ok: false, error: 'İlk kelime merkezi kaplamalı.' };
    }
  } else {
    // Must touch an existing tile
    const touches = pending.some((p) => {
      const neighbors = [
        [p.row - 1, p.col],
        [p.row + 1, p.col],
        [p.row, p.col - 1],
        [p.row, p.col + 1],
      ];
      return neighbors.some(([nr, nc]) => {
        if (nr < 0 || nc < 0 || nr >= BOARD_SIZE || nc >= BOARD_SIZE) return false;
        const cell = occ.get(k(nr, nc));
        return cell && !cell.isNew;
      });
    });
    if (!touches) return { ok: false, error: 'Mevcut harflere değmeli.' };
  }

  const main = readWord(occ, mainAnchor.row, mainAnchor.col, dir);
  if (!main || !main.hasNew) {
    // Single letter attached crosswise can still form only cross words
    // If main is length 1, require at least one cross word
  }

  const formed: Array<{ word: string; cells: Array<[number, number]> }> = [];
  if (main && main.word.length >= 2) formed.push(main);

  const crossDir: Direction = dir === 'across' ? 'down' : 'across';
  for (const p of pending) {
    const cross = readWord(occ, p.row, p.col, crossDir);
    if (cross && cross.hasNew && cross.word.length >= 2) {
      formed.push(cross);
    }
  }

  // Deduplicate by word+start cell
  const uniq = new Map<string, { word: string; cells: Array<[number, number]> }>();
  for (const f of formed) {
    const id = `${f.word}@${f.cells[0][0]},${f.cells[0][1]}`;
    uniq.set(id, f);
  }
  const words = [...uniq.values()];

  if (words.length === 0) {
    // Allow first move single? No — Scrabble needs at least 2 letters
    if (pending.length === 1 && isFirstMove) {
      return { ok: false, error: 'En az 2 harfli kelime kur.' };
    }
    return { ok: false, error: 'Geçerli kelime oluşmadı.' };
  }

  for (const w of words) {
    if (!isValidWord(w.word)) {
      return { ok: false, error: `Geçersiz kelime: ${w.word}` };
    }
  }

  let score = 0;
  for (const w of words) {
    score += scoreWord(board, occ, w.cells);
  }
  if (pending.length === 7) score += BINGO_BONUS;

  return { ok: true, score, words: words.map((w) => w.word) };
}

export function commitPending(
  board: Cell[][],
  pending: PendingPlacement[],
  rack: Tile[],
): { board: Cell[][]; rack: Tile[] } {
  const nextBoard = board.map((row) => row.map((cell) => ({ ...cell, tile: cell.tile })));
  const rackById = new Map(rack.map((t) => [t.id, t]));
  const used = new Set(pending.map((p) => p.tileId));

  for (const p of pending) {
    const tile = rackById.get(p.tileId)!;
    const placed: PlacedTile = {
      tile,
      row: p.row,
      col: p.col,
      blankAs: p.blankAs,
    };
    nextBoard[p.row][p.col] = { ...nextBoard[p.row][p.col], tile: placed };
  }

  return {
    board: nextBoard,
    rack: rack.filter((t) => !used.has(t.id)),
  };
}

export function boardHasTiles(board: Cell[][]): boolean {
  return board.some((row) => row.some((c) => c.tile));
}
