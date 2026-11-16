import assert from 'assert';
import { createGame, placePending, confirmPlay, acknowledgePassPhone, passTurn } from '../src/game/engine';
import { isValidWord, dictionarySize } from '../src/game/dictionary';
import { CENTER } from '../src/game/boardLayout';
import type { Letter, Tile } from '../src/game/types';

assert.ok(dictionarySize() > 10000);
assert.ok(isValidWord('KİTAP'));
assert.ok(isValidWord('EV'));
assert.ok(!isValidWord('XYZQ'));

let state = createGame(['Ali', 'Ece']);
assert.strictEqual(state.players[0].rack.length, 7);
assert.strictEqual(state.players[1].rack.length, 7);
assert.ok(state.bag.length === 100 - 14);

// Force a known first play: replace current rack with K,İ,T,A,P + fillers
const mk = (letter: Letter | null, id: string): Tile => ({
  id,
  letter,
  points: letter ? ({ A:1,B:3,C:4,Ç:4,D:3,E:1,F:7,G:5,Ğ:8,H:5,I:2,İ:1,J:10,K:1,L:1,M:2,N:1,O:2,Ö:7,P:5,R:1,S:2,Ş:4,T:1,U:2,Ü:3,V:7,Y:3,Z:4 } as Record<Letter, number>)[letter] : 0,
  isBlank: letter === null,
});

state = {
  ...state,
  players: [
    { ...state.players[0], rack: [mk('K','1'), mk('İ','2'), mk('T','3'), mk('A','4'), mk('P','5'), mk('E','6'), mk('L','7')] },
    state.players[1],
  ],
};

// Place KİTAP across center: cols 5..9 row 7
const word = ['K','İ','T','A','P'] as Letter[];
const ids = ['1','2','3','4','5'];
for (let i = 0; i < 5; i++) {
  state = placePending(state, ids[i], CENTER, CENTER - 2 + i);
}
state = confirmPlay(state);
assert.ok(state.lastMoveScore > 0, 'expected positive score');
assert.ok(state.lastWords.includes('KİTAP'));
assert.strictEqual(state.phase, 'passPhone');
state = acknowledgePassPhone(state);
assert.strictEqual(state.currentPlayer, 1);
assert.strictEqual(state.phase, 'playing');

// Pass both ways enough when bag empty should end — lighter check: pass increments
const before = state.consecutivePasses;
state = passTurn(state);
assert.strictEqual(state.phase, 'passPhone');
state = acknowledgePassPhone(state);
assert.strictEqual(state.consecutivePasses, before + 1);

console.log('game-smoke ok', { score: state.players[0].score, words: state.lastWords, dict: dictionarySize() });
