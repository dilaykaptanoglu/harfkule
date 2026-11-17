import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { requireAuth, validateUsername, normalizeUsername, type AuthedRequest } from '../auth.js';
import { db, type UserRow } from '../db.js';

export const authRouter = Router();

authRouter.post('/register', (req, res) => {
  const username = normalizeUsername(String(req.body?.username ?? ''));
  const err = validateUsername(username);
  if (err) {
    res.status(400).json({ error: err });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE').get(username);
  if (existing) {
    res.status(409).json({ error: 'Bu kullanıcı adı alınmış.' });
    return;
  }

  const id = uuid();
  const token = uuid().replace(/-/g, '') + uuid().replace(/-/g, '');
  const now = Date.now();
  db.prepare(
    `INSERT INTO users (id, username, display_name, token, created_at) VALUES (?, ?, ?, ?, ?)`,
  ).run(id, username, username, token, now);

  res.status(201).json({
    user: { id, username, displayName: username },
    token,
  });
});

authRouter.post('/login', (req, res) => {
  const username = normalizeUsername(String(req.body?.username ?? ''));
  const token = String(req.body?.token ?? '').trim();
  if (!username || !token) {
    res.status(400).json({ error: 'Kullanıcı adı ve token gerekli.' });
    return;
  }
  const user = db
    .prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE AND token = ?')
    .get(username, token) as UserRow | undefined;
  if (!user) {
    res.status(401).json({ error: 'Kullanıcı veya oturum bulunamadı.' });
    return;
  }
  res.json({
    user: { id: user.id, username: user.username, displayName: user.display_name },
    token: user.token,
  });
});

authRouter.get('/me', requireAuth, (req, res) => {
  const user = (req as AuthedRequest).user;
  res.json({ user: { id: user.id, username: user.username, displayName: user.display_name } });
});
