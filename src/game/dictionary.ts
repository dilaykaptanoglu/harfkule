import words from '../../assets/data/turkish-words.json';

const WORD_SET: Set<string> = new Set(words as string[]);

export function isValidWord(word: string): boolean {
  if (word.length < 2) return false;
  return WORD_SET.has(word);
}

export function dictionarySize(): number {
  return WORD_SET.size;
}
