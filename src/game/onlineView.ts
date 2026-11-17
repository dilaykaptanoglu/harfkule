import type { GameState, Player, Tile } from './types';

export type OnlinePlayerView = Omit<Player, 'rack'> & {
  rack: Tile[];
  rackCount: number;
  isYou: boolean;
};

export type OnlineGameView = Omit<GameState, 'bag' | 'players' | 'phase'> & {
  bagCount: number;
  players: [OnlinePlayerView, OnlinePlayerView];
  phase: 'playing' | 'ended';
  yourSeat: 0 | 1;
  isYourTurn: boolean;
};

/** After a server-side move, skip the local pass-phone handoff. */
export function clearPassPhone(state: GameState): GameState {
  if (state.phase !== 'passPhone') return state;
  return { ...state, phase: 'playing' };
}

export function toOnlineView(state: GameState, seat: 0 | 1): OnlineGameView {
  const players = state.players.map((p, i) => {
    const isYou = i === seat;
    return {
      id: p.id,
      name: p.name,
      score: p.score,
      rack: isYou ? p.rack : [],
      rackCount: p.rack.length,
      isYou,
    };
  }) as [OnlinePlayerView, OnlinePlayerView];

  return {
    board: state.board,
    bagCount: state.bag.length,
    players,
    currentPlayer: state.currentPlayer,
    pending: [],
    consecutivePasses: state.consecutivePasses,
    phase: state.phase === 'ended' ? 'ended' : 'playing',
    lastMoveScore: state.lastMoveScore,
    lastWords: state.lastWords,
    message: state.message,
    moveCount: state.moveCount,
    winner: state.winner,
    yourSeat: seat,
    isYourTurn: state.phase !== 'ended' && state.currentPlayer === seat,
  };
}
