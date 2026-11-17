import { generate, type GeneratorOptions } from './password';
import { generatePassphrase, type PassphraseOptions } from './passphrase';

export type BulkKind = 'password' | 'passphrase';

export type BulkRequest =
  | { kind: 'password'; count: number; options: GeneratorOptions }
  | { kind: 'passphrase'; count: number; options: PassphraseOptions };

export type BulkItem = {
  text: string;
  entropyBits: number;
};

export const BULK_MAX = 1000;
export const BULK_WARN = 500;

export function generateBulk(req: BulkRequest): BulkItem[] {
  const n = Math.max(1, Math.min(BULK_MAX, Math.floor(req.count)));
  const out: BulkItem[] = [];
  if (req.kind === 'password') {
    const pool = poolSize(req.options);
    const perItem = pool > 0 ? Math.log2(pool) : 0;
    for (let i = 0; i < n; i++) {
      const text = generate(req.options);
      out.push({ text, entropyBits: Math.round(text.length * perItem) });
    }
  } else {
    for (let i = 0; i < n; i++) {
      const p = generatePassphrase(req.options);
      out.push({ text: p.text, entropyBits: p.entropyBits });
    }
  }
  return out;
}

function poolSize(o: GeneratorOptions): number {
  let n = 0;
  if (o.lowercase) n += 26;
  if (o.uppercase) n += 26;
  if (o.digits) n += 10;
  if (o.symbols) n += 32;
  return n;
}
