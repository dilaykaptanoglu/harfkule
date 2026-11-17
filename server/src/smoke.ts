import assert from 'node:assert/strict';
import { db } from './db.js';
import { getGame, parseState, saveState } from './gameService.js';
import type { Letter, Tile } from '../../src/game/types';

const BASE = process.env.API_URL || 'http://127.0.0.1:8787';

async function json(path: string, init?: RequestInit & { token?: string }) {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...(init?.headers as Record<string, string>),
  };
  if (init?.token) headers.authorization = `Bearer ${init.token}`;
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  const body = await res.json().catch(() => ({}));
  return { res, body };
}

function mk(letter: Letter, id: string): Tile {
  const points: Record<Letter, number> = {
    A: 1, B: 3, C: 4, Ç: 4, D: 3, E: 1, F: 7, G: 5, Ğ: 8, H: 5, I: 2, İ: 1, J: 10,
    K: 1, L: 1, M: 2, N: 1, O: 2, Ö: 7, P: 5, R: 1, S: 2, Ş: 4, T: 1, U: 2, Ü: 3,
    V: 7, Y: 3, Z: 4,
  };
  return { id, letter, points: points[letter], isBlank: false };
}

async function main() {
  const health = await fetch(`${BASE}/health`);
  assert.equal(health.status, 200);

  const u1 = `oyuncu_${Date.now().toString(36)}`;
  const u2 = `rakip_${Date.now().toString(36)}`;

  const a = await json('/auth/register', { method: 'POST', body: JSON.stringify({ username: u1 }) });
  assert.equal(a.res.status, 201, JSON.stringify(a.body));
  const b = await json('/auth/register', { method: 'POST', body: JSON.stringify({ username: u2 }) });
  assert.equal(b.res.status, 201, JSON.stringify(b.body));

  const tokenA = a.body.token as string;
  const tokenB = b.body.token as string;

  const add = await json('/friends/add', {
    method: 'POST',
    token: tokenA,
    body: JSON.stringify({ username: u2 }),
  });
  assert.equal(add.res.status, 200, JSON.stringify(add.body));

  const challenge = await json('/games/challenge', {
    method: 'POST',
    token: tokenA,
    body: JSON.stringify({ username: u2 }),
  });
  assert.equal(challenge.res.status, 201, JSON.stringify(challenge.body));
  const gameId = challenge.body.game.id as string;

  const accept = await json(`/games/${gameId}/accept`, { method: 'POST', token: tokenB });
  assert.equal(accept.res.status, 200, JSON.stringify(accept.body));
  assert.equal(accept.body.game.status, 'active');
  assert.ok(accept.body.game.view);
  assert.equal(accept.body.game.view.players[accept.body.game.you.seat].rack.length, 7);
  const otherSeat = 1 - accept.body.game.you.seat;
  assert.equal(accept.body.game.view.players[otherSeat].rack.length, 0);
  assert.equal(accept.body.game.view.players[otherSeat].rackCount, 7);

  // Force seat 0 rack to KİTAPEL and play KİTAP across center
  const row = getGame(gameId)!;
  const state = parseState(row);
  state.players[0].rack = [
    mk('K', '1'),
    mk('İ', '2'),
    mk('T', '3'),
    mk('A', '4'),
    mk('P', '5'),
    mk('E', '6'),
    mk('L', '7'),
  ];
  saveState(gameId, state);

  const g0 = await json(`/games/${gameId}`, { token: tokenA });
  const seatA = g0.body.game.you.seat as 0 | 1;
  assert.equal(seatA, 0);

  const pending = [
    { tileId: '1', row: 7, col: 5 },
    { tileId: '2', row: 7, col: 6 },
    { tileId: '3', row: 7, col: 7 },
    { tileId: '4', row: 7, col: 8 },
    { tileId: '5', row: 7, col: 9 },
  ];
  const play = await json(`/games/${gameId}/move`, {
    method: 'POST',
    token: tokenA,
    body: JSON.stringify({ type: 'play', pending }),
  });
  assert.equal(play.res.status, 200, JSON.stringify(play.body));
  assert.ok(play.body.game.view.lastWords.includes('KİTAP'));
  assert.ok(play.body.game.view.lastMoveScore > 0);
  assert.equal(play.body.game.view.isYourTurn, false);

  const gB = await json(`/games/${gameId}`, { token: tokenB });
  assert.equal(gB.body.game.view.isYourTurn, true);
  assert.ok(gB.body.game.view.board[7][7].tile);

  const friends = await json('/friends', { token: tokenB });
  assert.ok(friends.body.friends.some((f: { username: string }) => f.username === u1));

  console.log('server smoke ok', {
    u1,
    u2,
    gameId,
    score: play.body.game.view.players[0].score,
    words: play.body.game.view.lastWords,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
