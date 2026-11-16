import type { Letter, Tile } from './types';

/**
 * Turkish Scrabble / Kelimelik letter distribution and point values.
 * Sources:
 * - https://gtoal.com/scrabble/details/turkish/
 * - Kelimelik help tables (commonly cited as matching Turkish Scrabble)
 * Total: 100 tiles (98 letters + 2 blanks).
 */
export const LETTER_POINTS: Record<Letter, number> = {
  A: 1,
  B: 3,
  C: 4,
  Ç: 4,
  D: 3,
  E: 1,
  F: 7,
  G: 5,
  Ğ: 8,
  H: 5,
  I: 2,
  İ: 1,
  J: 10,
  K: 1,
  L: 1,
  M: 2,
  N: 1,
  O: 2,
  Ö: 7,
  P: 5,
  R: 1,
  S: 2,
  Ş: 4,
  T: 1,
  U: 2,
  Ü: 3,
  V: 7,
  Y: 3,
  Z: 4,
};

export const LETTER_COUNTS: Record<Letter, number> = {
  A: 12,
  B: 2,
  C: 2,
  Ç: 2,
  D: 2,
  E: 8,
  F: 1,
  G: 1,
  Ğ: 1,
  H: 1,
  I: 4,
  İ: 7,
  J: 1,
  K: 7,
  L: 7,
  M: 4,
  N: 5,
  O: 3,
  Ö: 1,
  P: 1,
  R: 6,
  S: 3,
  Ş: 2,
  T: 5,
  U: 3,
  Ü: 2,
  V: 1,
  Y: 2,
  Z: 2,
};

export const BLANK_COUNT = 2;
export const RACK_SIZE = 7;
export const BINGO_BONUS = 50;

export const ALL_LETTERS = Object.keys(LETTER_POINTS) as Letter[];

let tileSeq = 0;

export function createTile(letter: Letter | null): Tile {
  tileSeq += 1;
  const isBlank = letter === null;
  return {
    id: `t${tileSeq}`,
    letter,
    points: isBlank ? 0 : LETTER_POINTS[letter!],
    isBlank,
  };
}

export function createBag(): Tile[] {
  tileSeq = 0;
  const bag: Tile[] = [];
  for (const letter of ALL_LETTERS) {
    for (let i = 0; i < LETTER_COUNTS[letter]; i += 1) {
      bag.push(createTile(letter));
    }
  }
  for (let i = 0; i < BLANK_COUNT; i += 1) {
    bag.push(createTile(null));
  }
  return shuffle(bag);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function drawTiles(bag: Tile[], n: number): { drawn: Tile[]; bag: Tile[] } {
  const drawn = bag.slice(0, n);
  return { drawn, bag: bag.slice(n) };
}

export function displayLetter(tile: Tile, blankAs?: Letter): string {
  if (tile.isBlank) return blankAs ?? '?';
  return tile.letter ?? '?';
}
