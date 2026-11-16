import { createEmptyBoard } from './boardLayout';
import { createBag, drawTiles, RACK_SIZE, shuffle } from './letters';
import { boardHasTiles, commitPending, validateAndScore } from './rules';
import type { GameState, Letter, PendingPlacement, Player } from './types';

function fillRack(player: Player, bag: TileBag): { player: Player; bag: TileBag } {
  const need = RACK_SIZE - player.rack.length;
  if (need <= 0) return { player, bag };
  const { drawn, bag: nextBag } = drawTiles(bag, need);
  return {
    player: { ...player, rack: [...player.rack, ...drawn] },
    bag: nextBag,
  };
}

type TileBag = GameState['bag'];

export function createGame(names?: [string, string]): GameState {
  let bag = createBag();
  const p0: Player = { id: 0, name: names?.[0] ?? 'Oyuncu 1', rack: [], score: 0 };
  const p1: Player = { id: 1, name: names?.[1] ?? 'Oyuncu 2', rack: [], score: 0 };

  let r0 = fillRack(p0, bag);
  bag = r0.bag;
  let r1 = fillRack(p1, bag);
  bag = r1.bag;

  return {
    board: createEmptyBoard(),
    bag,
    players: [r0.player, r1.player],
    currentPlayer: 0,
    pending: [],
    consecutivePasses: 0,
    phase: 'playing',
    lastMoveScore: 0,
    lastWords: [],
    message: 'İlk kelimeyi merkezden kur.',
    moveCount: 0,
    winner: null,
  };
}

function endIfNeeded(state: GameState): GameState {
  const [a, b] = state.players;
  // Classic: bag empty and a player empties rack
  if (state.bag.length === 0 && (a.rack.length === 0 || b.rack.length === 0)) {
    return finalizeScores(state);
  }
  // Both players passed twice in a row (4 passes) or 2 passes when bag empty
  if (state.consecutivePasses >= 2 && state.bag.length === 0) {
    return finalizeScores(state);
  }
  if (state.consecutivePasses >= 4) {
    return finalizeScores(state);
  }
  return state;
}

function finalizeScores(state: GameState): GameState {
  const players = state.players.map((p) => {
    const leftover = p.rack.reduce((s, t) => s + t.points, 0);
    return { ...p, score: Math.max(0, p.score - leftover) };
  }) as [Player, Player];

  let winner: GameState['winner'] = 'draw';
  if (players[0].score > players[1].score) winner = 0;
  else if (players[1].score > players[0].score) winner = 1;

  return {
    ...state,
    players,
    phase: 'ended',
    winner,
    message:
      winner === 'draw'
        ? 'Berabere!'
        : `${players[winner].name} kazandı!`,
  };
}

function switchTurn(state: GameState, message: string): GameState {
  const next: 0 | 1 = state.currentPlayer === 0 ? 1 : 0;
  return {
    ...state,
    currentPlayer: next,
    pending: [],
    phase: 'passPhone',
    message,
  };
}

export function acknowledgePassPhone(state: GameState): GameState {
  if (state.phase !== 'passPhone') return state;
  return { ...state, phase: 'playing' };
}

export function placePending(
  state: GameState,
  tileId: string,
  row: number,
  col: number,
  blankAs?: Letter,
): GameState {
  if (state.phase !== 'playing') return state;
  const player = state.players[state.currentPlayer];
  const tile = player.rack.find((t) => t.id === tileId);
  if (!tile) return state;
  if (state.board[row][col].tile) return { ...state, message: 'Kare dolu.' };
  if (state.pending.some((p) => p.row === row && p.col === col)) {
    return { ...state, message: 'Kare dolu.' };
  }
  if (state.pending.some((p) => p.tileId === tileId)) {
    // move existing pending tile
    return {
      ...state,
      pending: state.pending.map((p) =>
        p.tileId === tileId ? { tileId, row, col, blankAs: blankAs ?? p.blankAs } : p,
      ),
      message: null,
    };
  }
  if (tile.isBlank && !blankAs) {
    return { ...state, message: 'Joker için harf seç.' };
  }

  const pending: PendingPlacement[] = [
    ...state.pending,
    { tileId, row, col, blankAs },
  ];
  return { ...state, pending, message: null };
}

export function recallTile(state: GameState, tileId: string): GameState {
  return {
    ...state,
    pending: state.pending.filter((p) => p.tileId !== tileId),
  };
}

export function recallAll(state: GameState): GameState {
  return { ...state, pending: [], message: null };
}

export function setBlankLetter(state: GameState, tileId: string, letter: Letter): GameState {
  return {
    ...state,
    pending: state.pending.map((p) => (p.tileId === tileId ? { ...p, blankAs: letter } : p)),
  };
}

export function confirmPlay(state: GameState): GameState {
  if (state.phase !== 'playing') return state;
  const player = state.players[state.currentPlayer];
  const first = !boardHasTiles(state.board);
  const result = validateAndScore(state.board, state.pending, player.rack, first);
  if (!result.ok) {
    return { ...state, message: result.error ?? 'Geçersiz hamle.' };
  }

  const { board, rack } = commitPending(state.board, state.pending, player.rack);
  let bag = state.bag;
  let updated: Player = {
    ...player,
    rack,
    score: player.score + (result.score ?? 0),
  };
  const filled = fillRack(updated, bag);
  updated = filled.player;
  bag = filled.bag;

  const players = [...state.players] as [Player, Player];
  players[state.currentPlayer] = updated;

  let next: GameState = {
    ...state,
    board,
    bag,
    players,
    pending: [],
    consecutivePasses: 0,
    lastMoveScore: result.score ?? 0,
    lastWords: result.words ?? [],
    moveCount: state.moveCount + 1,
    message: `+${result.score}: ${(result.words ?? []).join(', ')}`,
  };

  next = endIfNeeded(next);
  if (next.phase === 'ended') return next;
  return switchTurn(next, next.message ?? 'Hamle tamam.');
}

export function passTurn(state: GameState): GameState {
  if (state.phase !== 'playing') return state;
  let next: GameState = {
    ...state,
    pending: [],
    consecutivePasses: state.consecutivePasses + 1,
    message: `${state.players[state.currentPlayer].name} pas geçti.`,
  };
  next = endIfNeeded(next);
  if (next.phase === 'ended') return next;
  return switchTurn(next, next.message ?? 'Pas.');
}

export function exchangeTiles(state: GameState, tileIds: string[]): GameState {
  if (state.phase !== 'playing') return state;
  if (state.bag.length < tileIds.length) {
    return { ...state, message: 'Torba yetersiz; değiştirilemez.' };
  }
  if (tileIds.length === 0) return { ...state, message: 'Değişecek taş seç.' };

  const player = state.players[state.currentPlayer];
  const returning = player.rack.filter((t) => tileIds.includes(t.id));
  if (returning.length !== tileIds.length) {
    return { ...state, message: 'Geçersiz taş seçimi.' };
  }

  let bag = [...state.bag, ...returning];
  bag = shuffle(bag);
  const kept = player.rack.filter((t) => !tileIds.includes(t.id));
  const { drawn, bag: nextBag } = drawTiles(bag, returning.length);
  const updated: Player = { ...player, rack: [...kept, ...drawn] };
  const players = [...state.players] as [Player, Player];
  players[state.currentPlayer] = updated;

  const next: GameState = {
    ...state,
    bag: nextBag,
    players,
    pending: [],
    consecutivePasses: state.consecutivePasses + 1,
    message: `${player.name} taş değiştirdi.`,
  };
  return switchTurn(next, next.message ?? 'Taş değiştirildi.');
}
