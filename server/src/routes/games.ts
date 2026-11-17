import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { requireAuth, type AuthedRequest } from '../auth.js';
import { db, type GameRow, type UserRow } from '../db.js';
import {
  applyMove,
  getGame,
  publicGamePayload,
  saveState,
  startGameState,
  type MoveBody,
} from '../gameService.js';

export const gamesRouter = Router();
gamesRouter.use(requireAuth);

gamesRouter.get('/', (req, res) => {
  const user = (req as AuthedRequest).user;
  const rows = db
    .prepare(
      `SELECT g.*, 
              c.username AS challenger_username,
              o.username AS opponent_username
       FROM games g
       JOIN users c ON c.id = g.challenger_id
       JOIN users o ON o.id = g.opponent_id
       WHERE g.challenger_id = ? OR g.opponent_id = ?
       ORDER BY g.updated_at DESC
       LIMIT 50`,
    )
    .all(user.id, user.id);
  res.json({
    games: rows.map((g: any) => ({
      id: g.id,
      status: g.status,
      updatedAt: g.updated_at,
      challenger: { id: g.challenger_id, username: g.challenger_username },
      opponent: { id: g.opponent_id, username: g.opponent_username },
      waitingOnYou:
        g.status === 'pending' && g.opponent_id === user.id
          ? true
          : g.status === 'active' && g.state_json
            ? JSON.parse(g.state_json).currentPlayer ===
              (g.challenger_id === user.id ? g.challenger_seat : 1 - g.challenger_seat)
            : false,
    })),
  });
});

gamesRouter.post('/challenge', (req, res) => {
  const user = (req as AuthedRequest).user;
  const username = String(req.body?.username ?? '').trim();
  const opponent = db
    .prepare(`SELECT * FROM users WHERE username = ? COLLATE NOCASE`)
    .get(username) as UserRow | undefined;
  if (!opponent) {
    res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    return;
  }
  if (opponent.id === user.id) {
    res.status(400).json({ error: 'Kendine meydan okuyamazsın.' });
    return;
  }

  const open = db
    .prepare(
      `SELECT id FROM games
       WHERE status IN ('pending','active')
         AND ((challenger_id = ? AND opponent_id = ?) OR (challenger_id = ? AND opponent_id = ?))
       LIMIT 1`,
    )
    .get(user.id, opponent.id, opponent.id, user.id);
  if (open) {
    res.status(409).json({ error: 'Bu arkadaşla zaten açık bir oyun/davet var.', gameId: (open as { id: string }).id });
    return;
  }

  const id = uuid();
  const now = Date.now();
  db.prepare(
    `INSERT INTO games (id, challenger_id, opponent_id, status, challenger_seat, state_json, updated_at, created_at)
     VALUES (?, ?, ?, 'pending', 0, NULL, ?, ?)`,
  ).run(id, user.id, opponent.id, now, now);

  const game = getGame(id)!;
  res.status(201).json({ game: publicGamePayload(game, user) });
});

gamesRouter.post('/:id/accept', (req, res) => {
  const user = (req as unknown as AuthedRequest).user;
  const game = getGame(String(req.params.id));
  if (!game) {
    res.status(404).json({ error: 'Oyun yok.' });
    return;
  }
  if (game.opponent_id !== user.id) {
    res.status(403).json({ error: 'Bu daveti yalnızca rakip kabul edebilir.' });
    return;
  }
  if (game.status !== 'pending') {
    res.status(400).json({ error: 'Davet beklenmiyor.' });
    return;
  }

  const challenger = db.prepare('SELECT * FROM users WHERE id = ?').get(game.challenger_id) as UserRow;
  const state = startGameState(challenger, user, game.challenger_seat as 0 | 1);
  saveState(game.id, state, 'active');
  // also ensure friendship
  const now = Date.now();
  db.prepare(`INSERT OR IGNORE INTO friendships (user_id, friend_id, created_at) VALUES (?, ?, ?)`).run(
    user.id,
    challenger.id,
    now,
  );
  db.prepare(`INSERT OR IGNORE INTO friendships (user_id, friend_id, created_at) VALUES (?, ?, ?)`).run(
    challenger.id,
    user.id,
    now,
  );

  res.json({ game: publicGamePayload(getGame(game.id)!, user) });
});

gamesRouter.post('/:id/decline', (req, res) => {
  const user = (req as unknown as AuthedRequest).user;
  const game = getGame(String(req.params.id));
  if (!game) {
    res.status(404).json({ error: 'Oyun yok.' });
    return;
  }
  if (game.opponent_id !== user.id && game.challenger_id !== user.id) {
    res.status(403).json({ error: 'Yetki yok.' });
    return;
  }
  if (game.status !== 'pending') {
    res.status(400).json({ error: 'Davet beklenmiyor.' });
    return;
  }
  db.prepare(`UPDATE games SET status = 'declined', updated_at = ? WHERE id = ?`).run(Date.now(), game.id);
  res.json({ ok: true });
});

gamesRouter.get('/:id', (req, res) => {
  const user = (req as unknown as AuthedRequest).user;
  const game = getGame(String(req.params.id));
  if (!game) {
    res.status(404).json({ error: 'Oyun yok.' });
    return;
  }
  const payload = publicGamePayload(game, user);
  if (!payload) {
    res.status(403).json({ error: 'Yetki yok.' });
    return;
  }
  res.json({ game: payload });
});

gamesRouter.post('/:id/move', (req, res) => {
  const user = (req as unknown as AuthedRequest).user;
  const game = getGame(String(req.params.id));
  if (!game) {
    res.status(404).json({ error: 'Oyun yok.' });
    return;
  }
  const body = req.body as MoveBody;
  const result = applyMove(game, user, body);
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ game: publicGamePayload(getGame(game.id)!, user) });
});
