import type { Cell, Premium } from './types';

export const BOARD_SIZE = 15;
export const CENTER = 7;

const TWS: Array<[number, number]> = [
  [0, 0],
  [0, 7],
  [0, 14],
  [7, 0],
  [7, 14],
  [14, 0],
  [14, 7],
  [14, 14],
];

const DWS: Array<[number, number]> = [
  [1, 1],
  [2, 2],
  [3, 3],
  [4, 4],
  [1, 13],
  [2, 12],
  [3, 11],
  [4, 10],
  [13, 1],
  [12, 2],
  [11, 3],
  [10, 4],
  [13, 13],
  [12, 12],
  [11, 11],
  [10, 10],
];

const TLS: Array<[number, number]> = [
  [1, 5],
  [1, 9],
  [5, 1],
  [5, 5],
  [5, 9],
  [5, 13],
  [9, 1],
  [9, 5],
  [9, 9],
  [9, 13],
  [13, 5],
  [13, 9],
];

const DLS: Array<[number, number]> = [
  [0, 3],
  [0, 11],
  [2, 6],
  [2, 8],
  [3, 0],
  [3, 7],
  [3, 14],
  [6, 2],
  [6, 6],
  [6, 8],
  [6, 12],
  [7, 3],
  [7, 11],
  [8, 2],
  [8, 6],
  [8, 8],
  [8, 12],
  [11, 0],
  [11, 7],
  [11, 14],
  [12, 6],
  [12, 8],
  [14, 3],
  [14, 11],
];

function key(r: number, c: number) {
  return `${r},${c}`;
}

const premiumMap = new Map<string, Premium>();
for (const [r, c] of TWS) premiumMap.set(key(r, c), 'TWS');
for (const [r, c] of DWS) premiumMap.set(key(r, c), 'DWS');
for (const [r, c] of TLS) premiumMap.set(key(r, c), 'TLS');
for (const [r, c] of DLS) premiumMap.set(key(r, c), 'DLS');
premiumMap.set(key(CENTER, CENTER), 'CENTER');

export function getPremium(row: number, col: number): Premium {
  return premiumMap.get(key(row, col)) ?? null;
}

export function createEmptyBoard(): Cell[][] {
  const board: Cell[][] = [];
  for (let r = 0; r < BOARD_SIZE; r += 1) {
    const row: Cell[] = [];
    for (let c = 0; c < BOARD_SIZE; c += 1) {
      row.push({ row: r, col: c, premium: getPremium(r, c), tile: null });
    }
    board.push(row);
  }
  return board;
}

export function premiumLabel(p: Premium): string {
  switch (p) {
    case 'TWS':
      return 'K³';
    case 'DWS':
    case 'CENTER':
      return 'K²';
    case 'TLS':
      return 'H³';
    case 'DLS':
      return 'H²';
    default:
      return '';
  }
}
