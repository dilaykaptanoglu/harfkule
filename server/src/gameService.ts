import { createGame, confirmPlay, exchangeTiles, passTurn, placePending, recallAll } from '../../src/game/engine';
import { clearPassPhone, toOnlineView } from '../../src/game/onlineView';
import type { GameState, Letter, PendingPlacement } from '../../src/game/types';
import { db, type GameRow, type UserRow } from './db.js';

export function seatForUser(game: GameRow, userId: string): 0 | 1 | null {
  if (game.challenger_id === userId) return game.challenger_seat as 0 | 1;
  if (game.opponent_id === userId) return (1 - game.challenger_seat) as 0 | 1;
  return null;
}

export function parseState(game: GameRow): GameState {
  if (!game.state_json) throw new Error('Oyun durumu yok.');
  return JSON.parse(game.state_json) as GameState;
}

export function saveState(gameId: string, state: GameState, status?: GameRow['status']) {
  const now = Date.now();
  const nextStatus = status ?? (state.phase === 'ended' ? 'ended' : 'active');
  db.prepare(
    `UPDATE games SET state_json = ?, status = ?, updated_at = ? WHERE id = ?`,
  ).run(JSON.stringify(state), nextStatus, now, gameId);
}

export function getGame(gameId: string): GameRow | undefined {
  return db.prepare('SELECT * FROM games WHERE id = ?').get(gameId) as GameRow | undefined;
}

export function publicGamePayload(game: GameRow, user: UserRow) {
  const seat = seatForUser(game, user.id);
  if (seat === null) return null;

  const challenger = db.prepare('SELECT id, username, display_name FROM users WHERE id = ?').get(
    game.challenger_id,
  ) as { id: string; username: string; display_name: string };
  const opponent = db.prepare('SELECT id, username, display_name FROM users WHERE id = ?').get(
    game.opponent_id,
  ) as { id: string; username: string; display_name: string };

  let view = null;
  if (game.state_json && (game.status === 'active' || game.status === 'ended')) {
    view = toOnlineView(parseState(game), seat);
  }

  return {
    id: game.id,
    status: game.status,
    updatedAt: game.updated_at,
    you: { id: user.id, username: user.username, displayName: user.display_name, seat },
    challenger,
    opponent,
    view,
  };
}

export function startGameState(challenger: UserRow, opponent: UserRow, challengerSeat: 0 | 1): GameState {
  const names: [string, string] =
    challengerSeat === 0
      ? [challenger.display_name, opponent.display_name]
      : [opponent.display_name, challenger.display_name];
  return clearPassPhone(createGame(names));
}

export type MoveBody =
  | { type: 'play'; pending: PendingPlacement[] }
  | { type: 'pass' }
  | { type: 'exchange'; tileIds: string[] };

export function applyMove(game: GameRow, user: UserRow, body: MoveBody): { ok: true; state: GameState } | { ok: false; error: string } {
  if (game.status !== 'active' || !game.state_json) {
    return { ok: false, error: 'Oyun aktif değil.' };
  }
  const seat = seatForUser(game, user.id);
  if (seat === null) return { ok: false, error: 'Bu oyunda değilsin.' };

  let state = parseState(game);
  if (state.phase === 'ended') return { ok: false, error: 'Oyun bitmiş.' };
  state = clearPassPhone(state);
  if (state.currentPlayer !== seat) return { ok: false, error: 'Sıra sende değil.' };

  state = recallAll(state);

  if (body.type === 'play') {
    if (!body.pending?.length) return { ok: false, error: 'Taş yerleştir.' };
    for (const p of body.pending) {
      state = placePending(state, p.tileId, p.row, p.col, p.blankAs as Letter | undefined);
      if (state.message && state.message.includes('Joker')) {
        return { ok: false, error: state.message };
      }
    }
    const before = state.moveCount;
    state = confirmPlay(state);
    state = clearPassPhone(state);
    if (state.moveCount === before && state.phase !== 'ended') {
      return { ok: false, error: state.message ?? 'Geçersiz hamle.' };
    }
  } else if (body.type === 'pass') {
    state = clearPassPhone(passTurn(state));
  } else if (body.type === 'exchange') {
    if (!body.tileIds?.length) return { ok: false, error: 'Değişecek taş seç.' };
    const beforePasses = state.consecutivePasses;
    const beforeBag = state.bag.length;
    state = exchangeTiles(state, body.tileIds);
    state = clearPassPhone(state);
    if (state.consecutivePasses === beforePasses && state.bag.length === beforeBag && state.phase !== 'ended') {
      // exchange failed (message set, turn not switched)
      if (state.message && !state.message.includes('değiştirdi')) {
        return { ok: false, error: state.message };
      }
    }
    if (state.message && state.message.includes('yetersiz')) {
      return { ok: false, error: state.message };
    }
  } else {
    return { ok: false, error: 'Bilinmeyen hamle.' };
  }

  saveState(game.id, state);
  return { ok: true, state };
}
