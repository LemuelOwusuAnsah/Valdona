import { analyze, generate, type GeneratorOptions, type StrengthTier } from '../lib/password';
import { generatePassphrase } from '../lib/passphrase';
import { generateBulk, BULK_WARN } from '../lib/bulk';
import { record, list as listHistory, clear as clearHistory, remove as removeHistory, type HistoryEntry } from '../lib/history';

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

const modePasswordBtn = $<HTMLButtonElement>('modePassword');
const modePassphraseBtn = $<HTMLButtonElement>('modePassphrase');
const passwordControls = $<HTMLDivElement>('passwordControls');
const passphraseControls = $<HTMLDivElement>('passphraseControls');

const lengthEl = $<HTMLInputElement>('length');
const lengthValEl = $<HTMLElement>('lengthVal');
const optUpper = $<HTMLInputElement>('optUpper');
const optLower = $<HTMLInputElement>('optLower');
const optDigits = $<HTMLInputElement>('optDigits');
const optSymbols = $<HTMLInputElement>('optSymbols');
const optExclude = $<HTMLInputElement>('optExclude');

const wordCountEl = $<HTMLInputElement>('wordCount');
const wordCountValEl = $<HTMLElement>('wordCountVal');
const separatorEl = $<HTMLInputElement>('separator');
const optCapitalize = $<HTMLInputElement>('optCapitalize');
const optNumber = $<HTMLInputElement>('optNumber');

const bulkCountEl = $<HTMLInputElement>('bulkCount');
const bulkValEl = $<HTMLElement>('bulkVal');
const bulkWarnEl = $<HTMLParagraphElement>('bulkWarn');

const generateBtn = $<HTMLButtonElement>('generate');
const singleOutput = $<HTMLDivElement>('singleOutput');
const generatedEl = $<HTMLElement>('generated');
const copyBtn = $<HTMLButtonElement>('copy');
const bulkOutput = $<HTMLDivElement>('bulkOutput');
const bulkList = $<HTMLUListElement>('bulkList');
const exportTxtBtn = $<HTMLButtonElement>('exportTxt');
const clearOutputBtn = $<HTMLButtonElement>('clearOutput');
const historyList = $<HTMLUListElement>('historyList');
const clearHistoryBtn = $<HTMLButtonElement>('clearHistory');

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

type Mode = 'password' | 'passphrase';
let mode: Mode = 'password';
let lastBulk: { text: string; entropyBits: number }[] = [];

function updateAnalyzer(pwd: string): void {
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

function setMode(next: Mode): void {
  mode = next;
  modePasswordBtn.classList.toggle('active', next === 'password');
  modePassphraseBtn.classList.toggle('active', next === 'passphrase');
  modePasswordBtn.setAttribute('aria-selected', String(next === 'password'));
  modePassphraseBtn.setAttribute('aria-selected', String(next === 'passphrase'));
  passwordControls.style.display = next === 'password' ? '' : 'none';
  passphraseControls.style.display = next === 'passphrase' ? '' : 'none';
}

function readPasswordOptions(): GeneratorOptions {
  return {
    length: Number(lengthEl.value),
    uppercase: optUpper.checked,
    lowercase: optLower.checked,
    digits: optDigits.checked,
    symbols: optSymbols.checked,
    excludeAmbiguous: optExclude.checked,
  };
}

function readPassphraseOptions() {
  return {
    wordCount: Number(wordCountEl.value),
    separator: separatorEl.value || '-',
    capitalize: optCapitalize.checked,
    includeNumber: optNumber.checked,
  };
}

function showSingle(text: string): void {
  singleOutput.style.display = '';
  bulkOutput.style.display = 'none';
  generatedEl.textContent = text;
  copyBtn.disabled = false;
  exportTxtBtn.disabled = false;
  clearOutputBtn.disabled = false;
}

function showBulk(items: { text: string; entropyBits: number }[]): void {
  lastBulk = items;
  singleOutput.style.display = 'none';
  bulkOutput.style.display = '';
  bulkList.innerHTML = items
    .map((it) => `<li><span>${escapeHtml(it.text)}</span><button type="button" data-copy="${escapeAttr(it.text)}">copy</button></li>`)
    .join('');
  exportTxtBtn.disabled = items.length === 0;
  clearOutputBtn.disabled = items.length === 0;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);
}
function escapeAttr(s: string): string {
  return escapeHtml(s);
}

function refreshHistory(): void {
  const entries = listHistory();
  if (entries.length === 0) {
    historyList.innerHTML = '<li class="empty">No items yet.</li>';
    return;
  }
  historyList.innerHTML = entries
    .map((e) => `<li><span>${escapeHtml(e.text)}</span><button type="button" data-remove="${e.id}">×</button></li>`)
    .join('');
}

function exportTxt(): void {
  const lines = lastBulk.length > 0
    ? lastBulk.map((i) => i.text)
    : [generatedEl.textContent ?? ''].filter((s) => s && s !== '\u2014');
  if (lines.length === 0) return;
  const blob = new Blob([lines.join('\n') + '\n'], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'valdona.txt';
  a.click();
  URL.revokeObjectURL(url);
}

toggleBtn.addEventListener('click', () => {
  const hidden = passwordEl.type === 'password';
  passwordEl.type = hidden ? 'text' : 'password';
  eyeOpen.style.display = hidden ? 'none' : '';
  eyeClosed.style.display = hidden ? '' : 'none';
});

passwordEl.addEventListener('input', () => updateAnalyzer(passwordEl.value));
lengthEl.addEventListener('input', () => { lengthValEl.textContent = lengthEl.value; });
wordCountEl.addEventListener('input', () => { wordCountValEl.textContent = wordCountEl.value; });
bulkCountEl.addEventListener('input', () => {
  bulkValEl.textContent = bulkCountEl.value;
  bulkWarnEl.style.display = Number(bulkCountEl.value) >= BULK_WARN ? '' : 'none';
});

modePasswordBtn.addEventListener('click', () => setMode('password'));
modePassphraseBtn.addEventListener('click', () => setMode('passphrase'));

generateBtn.addEventListener('click', () => {
  const count = Number(bulkCountEl.value);
  if (count <= 1) {
    if (mode === 'password') {
      const text = generate(readPasswordOptions());
      if (!text) { showSingle('pick at least one set'); return; }
      showSingle(text);
      record({ text, kind: 'password', entropyBits: 0 });
    } else {
      const p = generatePassphrase(readPassphraseOptions());
      showSingle(p.text);
      record({ text: p.text, kind: 'passphrase', entropyBits: p.entropyBits });
    }
    refreshHistory();
    return;
  }
  const items = mode === 'password'
    ? generateBulk({ kind: 'password', count, options: readPasswordOptions() })
    : generateBulk({ kind: 'passphrase', count, options: readPassphraseOptions() });
  if (items.length === 0) { showSingle('pick at least one set'); return; }
  showBulk(items);
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

bulkList.addEventListener('click', async (e) => {
  const target = e.target as HTMLElement;
  if (target.tagName !== 'BUTTON') return;
  const text = target.getAttribute('data-copy');
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    target.textContent = 'copied';
    setTimeout(() => { target.textContent = 'copy'; }, 1000);
  } catch { return; }
});

historyList.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.tagName !== 'BUTTON') return;
  const id = target.getAttribute('data-remove');
  if (!id) return;
  removeHistory(id);
  refreshHistory();
});

clearHistoryBtn.addEventListener('click', () => {
  clearHistory();
  refreshHistory();
});

exportTxtBtn.addEventListener('click', exportTxt);

clearOutputBtn.addEventListener('click', () => {
  generatedEl.textContent = '\u2014';
  lastBulk = [];
  bulkList.innerHTML = '';
  singleOutput.style.display = '';
  bulkOutput.style.display = 'none';
  exportTxtBtn.disabled = true;
  clearOutputBtn.disabled = true;
});

setMode('password');
updateAnalyzer('');
refreshHistory();
