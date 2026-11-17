import type { NextFunction, Request, Response } from 'express';
import { db, type UserRow } from './db.js';

export type AuthedRequest = Request & { user: UserRow };

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    res.status(401).json({ error: 'Giriş gerekli.' });
    return;
  }
  const user = db.prepare('SELECT * FROM users WHERE token = ?').get(token) as UserRow | undefined;
  if (!user) {
    res.status(401).json({ error: 'Geçersiz oturum.' });
    return;
  }
  (req as AuthedRequest).user = user;
  next();
}

const USERNAME_RE = /^[a-zA-Z0-9çğıöşüÇĞİÖŞÜ_]{3,20}$/;

export function normalizeUsername(raw: string): string {
  return raw.trim();
}

export function validateUsername(raw: string): string | null {
  const u = normalizeUsername(raw);
  if (!USERNAME_RE.test(u)) {
    return 'Kullanıcı adı 3–20 karakter; harf, rakam, _ olabilir.';
  }
  return null;
}
