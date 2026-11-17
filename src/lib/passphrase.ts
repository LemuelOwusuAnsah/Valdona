import { WORDS } from './wordlist';

export type PassphraseOptions = {
  wordCount: number;
  separator: string;
  capitalize: boolean;
  includeNumber: boolean;
};

export type Passphrase = {
  text: string;
  entropyBits: number;
  wordCount: number;
};

const WORD_COUNT_POOL = WORDS.length;

function randomIndex(max: number): number {
  const buf = new Uint32Array(1);
  const limit = Math.floor(0xffffffff / max) * max;
  for (;;) {
    crypto.getRandomValues(buf);
    const value = buf[0];
    if (value !== undefined && value < limit) return value % max;
  }
}

function pickWord(): string {
  const w = WORDS[randomIndex(WORD_COUNT_POOL)];
  if (!w) throw new Error('empty wordlist');
  return w;
}

function capitalizeWord(w: string): string {
  return w.charAt(0).toUpperCase() + w.slice(1);
}

export function generatePassphrase(opts: PassphraseOptions): Passphrase {
  const count = Math.max(2, Math.min(20, Math.floor(opts.wordCount)));
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    const w = pickWord();
    parts.push(opts.capitalize ? capitalizeWord(w) : w);
  }

  let text = parts.join(opts.separator || '-');

  if (opts.includeNumber) {
    const pos = randomIndex(text.length + 1);
    const digit = String(randomIndex(10));
    text = text.slice(0, pos) + digit + text.slice(pos);
  }

  const entropyBits = Math.round(count * Math.log2(WORD_COUNT_POOL));

  return { text, entropyBits, wordCount: count };
}
