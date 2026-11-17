import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(path.join(dataDir, 'harfkule.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL COLLATE NOCASE UNIQUE,
    display_name TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS friendships (
    user_id TEXT NOT NULL,
    friend_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, friend_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    challenger_id TEXT NOT NULL,
    opponent_id TEXT NOT NULL,
    status TEXT NOT NULL,
    challenger_seat INTEGER NOT NULL DEFAULT 0,
    state_json TEXT,
    updated_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (challenger_id) REFERENCES users(id),
    FOREIGN KEY (opponent_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_games_users ON games(challenger_id, opponent_id);
  CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
`);

export type UserRow = {
  id: string;
  username: string;
  display_name: string;
  token: string;
  created_at: number;
};

export type GameRow = {
  id: string;
  challenger_id: string;
  opponent_id: string;
  status: 'pending' | 'active' | 'declined' | 'ended';
  challenger_seat: number;
  state_json: string | null;
  updated_at: number;
  created_at: number;
};
