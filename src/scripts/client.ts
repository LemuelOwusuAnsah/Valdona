import { analyze, generate, type StrengthTier } from '../lib/password';

function $<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error('missing #' + id);
  return el as T;
}

const passwordEl = $<HTMLInputElement>('password');
const toggleBtn = $<HTMLButtonElement>('toggleVisibility');
const eyeOpen = $<SVGElement>('eyeOpen');
const eyeClosed = $<SVGElement>('eyeClosed');
const fillEl = $<HTMLDivElement>('strengthFill');
const labelEl = $<HTMLParagraphElement>('strengthLabel');
const checksEl = $<HTMLUListElement>('checks');
const entropyEl = $<HTMLElement>('entropy');
const lengthEl = $<HTMLInputElement>('length');
const lengthValEl = $<HTMLElement>('lengthVal');
const generateBtn = $<HTMLButtonElement>('generate');
const generatedEl = $<HTMLElement>('generated');
const copyBtn = $<HTMLButtonElement>('copy');
const optUpper = $<HTMLInputElement>('optUpper');
const optLower = $<HTMLInputElement>('optLower');
const optDigits = $<HTMLInputElement>('optDigits');
const optSymbols = $<HTMLInputElement>('optSymbols');
const optExclude = $<HTMLInputElement>('optExclude');

const ICON_PASS = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
const ICON_FAIL = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
const COPY_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
const CHECK_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

const COLOR_FOR: Record<StrengthTier, string> = {
  empty: 'var(--fg-dim)',
  weak: 'var(--danger)',
  fair: 'var(--warning)',
  good: 'var(--fg-muted)',
  strong: 'var(--accent)',
};
const LABEL_FOR: Record<StrengthTier, string> = {
  empty: '\u2014',
  weak: 'Weak',
  fair: 'Fair',
  good: 'Good',
  strong: 'Strong',
};

function updateUI(pwd: string): void {
  const r = analyze(pwd);
  fillEl.style.width = r.percent + '%';
  fillEl.style.background = COLOR_FOR[r.tier];
  labelEl.textContent = LABEL_FOR[r.tier];
  labelEl.style.color = COLOR_FOR[r.tier];
  entropyEl.textContent = String(r.entropyBits);
  checksEl.innerHTML = r.checks
    .map((c) => `<li class="${c.pass ? 'pass' : 'fail'}">${c.pass ? ICON_PASS : ICON_FAIL}<span>${c.label}</span></li>`)
    .join('');
}

toggleBtn.addEventListener('click', () => {
  const hidden = passwordEl.type === 'password';
  passwordEl.type = hidden ? 'text' : 'password';
  eyeOpen.style.display = hidden ? 'none' : '';
  eyeClosed.style.display = hidden ? '' : 'none';
});

passwordEl.addEventListener('input', () => updateUI(passwordEl.value));
lengthEl.addEventListener('input', () => { lengthValEl.textContent = lengthEl.value; });

generateBtn.addEventListener('click', () => {
  const pwd = generate({
    length: Number(lengthEl.value),
    uppercase: optUpper.checked,
    lowercase: optLower.checked,
    digits: optDigits.checked,
    symbols: optSymbols.checked,
    excludeAmbiguous: optExclude.checked,
  });
  generatedEl.textContent = pwd || 'pick at least one set';
});

copyBtn.addEventListener('click', async () => {
  const text = generatedEl.textContent ?? '';
  if (!text || text === '\u2014') return;
  try {
    await navigator.clipboard.writeText(text);
    copyBtn.innerHTML = CHECK_ICON;
    setTimeout(() => { copyBtn.innerHTML = COPY_ICON; }, 1200);
  } catch { return; }
});

updateUI('');
