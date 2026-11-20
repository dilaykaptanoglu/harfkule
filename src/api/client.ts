import { API_URL, API_URL_UNCONFIGURED } from './config';
import type { Session } from './session';
import type { OnlineGameView } from '../game/onlineView';
import type { PendingPlacement } from '../game/types';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  opts: { method?: string; body?: unknown; token?: string } = {},
): Promise<T> {
  if (API_URL_UNCONFIGURED && !__DEV__) {
    throw new ApiError(
      0,
      'Çevrimiçi API adresi henüz ayarlanmadı. Yerel oyun çevrimdışı çalışır.',
    );
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: opts.method || 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new ApiError(
      0,
      'Sunucuya ulaşılamadı. İnternet bağlantını kontrol et veya yerel oyunu dene.',
    );
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, data.error || `İstek başarısız (${res.status})`);
  }
  return data as T;
}

export type PublicUser = { id: string; username: string; displayName: string };

export type GameSummary = {
  id: string;
  status: string;
  updatedAt: number;
  challenger: { id: string; username: string };
  opponent: { id: string; username: string };
  waitingOnYou?: boolean;
};

export type GamePayload = {
  id: string;
  status: string;
  updatedAt: number;
  you: PublicUser & { seat: 0 | 1 };
  challenger: PublicUser;
  opponent: PublicUser;
  view: OnlineGameView | null;
};

export const api = {
  health: () => request<{ ok: boolean }>('/health'),
  register: (username: string) =>
    request<{ user: PublicUser; token: string }>('/auth/register', {
      method: 'POST',
      body: { username },
    }),
  login: (username: string, token: string) =>
    request<{ user: PublicUser; token: string }>('/auth/login', {
      method: 'POST',
      body: { username, token },
    }),
  me: (token: string) => request<{ user: PublicUser }>('/auth/me', { token }),
  friends: (token: string) =>
    request<{ friends: Array<PublicUser & { addedAt: number }> }>('/friends', { token }),
  searchUser: (token: string, username: string) =>
    request<{ user: PublicUser; isFriend: boolean }>(
      `/friends/search?username=${encodeURIComponent(username)}`,
      { token },
    ),
  addFriend: (token: string, username: string) =>
    request<{ friend: PublicUser }>('/friends/add', {
      method: 'POST',
      token,
      body: { username },
    }),
  recent: (token: string) =>
    request<{ recent: Array<PublicUser & { gameId: string; status: string; updatedAt: number }> }>(
      '/friends/recent',
      { token },
    ),
  games: (token: string) => request<{ games: GameSummary[] }>('/games', { token }),
  challenge: (token: string, username: string) =>
    request<{ game: GamePayload }>('/games/challenge', {
      method: 'POST',
      token,
      body: { username },
    }),
  accept: (token: string, gameId: string) =>
    request<{ game: GamePayload }>(`/games/${gameId}/accept`, { method: 'POST', token }),
  decline: (token: string, gameId: string) =>
    request<{ ok: boolean }>(`/games/${gameId}/decline`, { method: 'POST', token }),
  getGame: (token: string, gameId: string) =>
    request<{ game: GamePayload }>(`/games/${gameId}`, { token }),
  move: (
    token: string,
    gameId: string,
    body:
      | { type: 'play'; pending: PendingPlacement[] }
      | { type: 'pass' }
      | { type: 'exchange'; tileIds: string[] },
  ) => request<{ game: GamePayload }>(`/games/${gameId}/move`, { method: 'POST', token, body }),
};

export async function sessionFromRegister(username: string): Promise<Session> {
  const data = await api.register(username);
  return { token: data.token, user: data.user };
}
