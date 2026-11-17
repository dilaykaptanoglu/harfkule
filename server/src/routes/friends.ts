import { Router } from 'express';
import { requireAuth, normalizeUsername, type AuthedRequest } from '../auth.js';
import { db, type UserRow } from '../db.js';

export const friendsRouter = Router();
friendsRouter.use(requireAuth);

friendsRouter.get('/', (req, res) => {
  const user = (req as AuthedRequest).user;
  const friends = db
    .prepare(
      `SELECT u.id, u.username, u.display_name AS displayName, f.created_at AS addedAt
       FROM friendships f
       JOIN users u ON u.id = f.friend_id
       WHERE f.user_id = ?
       ORDER BY u.username COLLATE NOCASE`,
    )
    .all(user.id);
  res.json({ friends });
});

friendsRouter.get('/search', (req, res) => {
  const user = (req as AuthedRequest).user;
  const username = normalizeUsername(String(req.query.username ?? ''));
  if (!username) {
    res.status(400).json({ error: 'username gerekli.' });
    return;
  }
  const found = db
    .prepare(
      `SELECT id, username, display_name AS displayName FROM users WHERE username = ? COLLATE NOCASE`,
    )
    .get(username) as { id: string; username: string; displayName: string } | undefined;
  if (!found) {
    res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    return;
  }
  if (found.id === user.id) {
    res.status(400).json({ error: 'Kendini ekleyemezsin.' });
    return;
  }
  const already = db
    .prepare(`SELECT 1 FROM friendships WHERE user_id = ? AND friend_id = ?`)
    .get(user.id, found.id);
  res.json({ user: found, isFriend: !!already });
});

friendsRouter.post('/add', (req, res) => {
  const user = (req as AuthedRequest).user;
  const username = normalizeUsername(String(req.body?.username ?? ''));
  const found = db
    .prepare(`SELECT * FROM users WHERE username = ? COLLATE NOCASE`)
    .get(username) as UserRow | undefined;
  if (!found) {
    res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    return;
  }
  if (found.id === user.id) {
    res.status(400).json({ error: 'Kendini ekleyemezsin.' });
    return;
  }
  const now = Date.now();
  db.prepare(
    `INSERT OR IGNORE INTO friendships (user_id, friend_id, created_at) VALUES (?, ?, ?)`,
  ).run(user.id, found.id, now);
  // mutual for simplicity in MVP
  db.prepare(
    `INSERT OR IGNORE INTO friendships (user_id, friend_id, created_at) VALUES (?, ?, ?)`,
  ).run(found.id, user.id, now);

  res.json({
    friend: { id: found.id, username: found.username, displayName: found.display_name },
  });
});

friendsRouter.get('/recent', (req, res) => {
  const user = (req as AuthedRequest).user;
  const rows = db
    .prepare(
      `SELECT g.id AS gameId, g.status, g.updated_at AS updatedAt,
              CASE WHEN g.challenger_id = ? THEN o.username ELSE c.username END AS username,
              CASE WHEN g.challenger_id = ? THEN o.display_name ELSE c.display_name END AS displayName,
              CASE WHEN g.challenger_id = ? THEN o.id ELSE c.id END AS id
       FROM games g
       JOIN users c ON c.id = g.challenger_id
       JOIN users o ON o.id = g.opponent_id
       WHERE g.challenger_id = ? OR g.opponent_id = ?
       ORDER BY g.updated_at DESC
       LIMIT 20`,
    )
    .all(user.id, user.id, user.id, user.id, user.id);
  res.json({ recent: rows });
});
