export type StrengthTier = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

export type PolicyCheck = {
  label: string;
  pass: boolean;
};

export type Analysis = {
  checks: PolicyCheck[];
  passedCount: number;
  totalCount: number;
  percent: number;
  entropyBits: number;
  tier: StrengthTier;
};

export type GeneratorOptions = {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  digits: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
};

export const COMMON_PASSWORDS: ReadonlySet<string> = new Set([
  'password', '123456', '12345678', 'qwerty', '123456789', '12345',
  '1234', '111111', '1234567', 'dragon', '123123', 'baseball', 'abc123',
  'football', 'monkey', 'letmein', '696969', 'shadow', 'master', '666666',
  'qwertyuiop', '123321', 'mustang', '1234567890', 'michael', '654321',
  'superman', '1qaz2wsx', '7777777', '121212', '000000', 'qazwsx', '123qwe',
  'killer', 'trustno1', 'jordan', 'jennifer', 'zxcvbnm', 'asdfgh', 'hunter',
  'buster', 'soccer', 'harley', 'batman', 'andrew', 'tigger', 'sunshine',
  'iloveyou', 'charlie', 'robert', 'thomas', 'hockey', 'ranger', 'daniel',
  'starwars', 'klaster', '112233', 'george', 'computer', 'michelle', 'jessica',
  'pepper', '1111', 'zxcvbn', '555555', '11111111', '131313', 'freedom',
  '777777', 'pass', 'maggie', '159753', 'aaaaaa', 'ginger', 'princess',
  'joshua', 'cheese', 'amanda', 'summer', 'love', 'ashley', 'nicole',
  'chelsea', 'biteme', 'matthew', 'access', 'yankees', '987654321', 'dallas',
  'austin', 'thunder', 'taylor', 'matrix', 'welcome',
]);

const POLICY: ReadonlyArray<{ label: string; test: (p: string) => boolean }> = [
  { label: 'At least 12 characters', test: (p) => p.length >= 12 },
  { label: 'Contains uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'Contains lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'Contains a number', test: (p) => /\d/.test(p) },
  { label: 'Contains a symbol', test: (p) => /[^A-Za-z0-9]/.test(p) },
  { label: 'Not a common password', test: (p) => !COMMON_PASSWORDS.has(p.toLowerCase()) },
  { label: 'No 3+ repeated characters', test: (p) => !/(.)\1{2,}/.test(p) },
];

function poolSize(pwd: string): number {
  let pool = 0;
  if (/[a-z]/.test(pwd)) pool += 26;
  if (/[A-Z]/.test(pwd)) pool += 26;
  if (/\d/.test(pwd)) pool += 10;
  if (/[^A-Za-z0-9]/.test(pwd)) pool += 32;
  return pool;
}

function tierFor(pwd: string, percent: number): StrengthTier {
  if (!pwd.length) return 'empty';
  if (percent < 30) return 'weak';
  if (percent < 60) return 'fair';
  if (percent < 85) return 'good';
  return 'strong';
}

export function analyze(password: string): Analysis {
  const checks = POLICY.map((rule) => ({
    label: rule.label,
    pass: password.length > 0 && rule.test(password),
  }));
  const passedCount = checks.filter((c) => c.pass).length;
  const totalCount = checks.length;
  const percent = password.length ? (passedCount / totalCount) * 100 : 0;

  const pool = poolSize(password);
  const entropyBits = password.length
    ? Math.round(password.length * Math.log2(pool || 1))
    : 0;

  return {
    checks,
    passedCount,
    totalCount,
    percent,
    entropyBits,
    tier: tierFor(password, percent),
  };
}

const CHARSETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{}',
} as const;

const AMBIGUOUS = /[Il1O0o]/g;

function buildPool(opts: GeneratorOptions): string {
  let pool = '';
  if (opts.uppercase) pool += CHARSETS.uppercase;
  if (opts.lowercase) pool += CHARSETS.lowercase;
  if (opts.digits) pool += CHARSETS.digits;
  if (opts.symbols) pool += CHARSETS.symbols;
  if (opts.excludeAmbiguous) pool = pool.replace(AMBIGUOUS, '');
  return pool;
}

function randomIndex(max: number): number {
  const buf = new Uint32Array(1);
  const limit = Math.floor(0xffffffff / max) * max;
  for (;;) {
    crypto.getRandomValues(buf);
    const value = buf[0];
    if (value !== undefined && value < limit) return value % max;
  }
}

export function generate(opts: GeneratorOptions): string {
  const pool = buildPool(opts);
  if (!pool) return '';
  const length = Math.max(1, Math.min(256, Math.floor(opts.length)));
  let out = '';
  for (let i = 0; i < length; i++) {
    out += pool[randomIndex(pool.length)];
  }
  return out;
}
