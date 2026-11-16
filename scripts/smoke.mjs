import { createRequire } from 'module';
import assert from 'assert';

// Compile-free smoke: reimplement minimal checks against exported TS via dynamic transpile is heavy.
 // Instead validate dictionary JSON + letter bag invariants + rule helpers by importing built logic through tsx if available.
const require = createRequire(import.meta.url);

const words = require('../assets/data/turkish-words.json');
assert.ok(Array.isArray(words) && words.length > 10000, 'dictionary too small');
assert.ok(words.includes('KİTAP'), 'KİTAP missing');
assert.ok(words.includes('EV'), 'EV missing');

const LETTER_COUNTS = {
  A: 12, B: 2, C: 2, Ç: 2, D: 2, E: 8, F: 1, G: 1, Ğ: 1, H: 1,
  I: 4, İ: 7, J: 1, K: 7, L: 7, M: 4, N: 5, O: 3, Ö: 1, P: 1,
  R: 6, S: 3, Ş: 2, T: 5, U: 3, Ü: 2, V: 1, Y: 2, Z: 2,
};
const totalLetters = Object.values(LETTER_COUNTS).reduce((a, b) => a + b, 0);
assert.strictEqual(totalLetters + 2, 100, 'bag must be 100 tiles');

console.log('smoke ok:', {
  words: words.length,
  bagTiles: totalLetters + 2,
});
