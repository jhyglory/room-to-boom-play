// v41 relaxes arrival and wall resistance; original ledgers and receipts remain intact.
export const STAGE = 'studio-easy-check16-v41';
export const BEST_KEY = `room-to-boom:best:${STAGE}`;
const MAX_SECONDS = 86400;
const CLIPBOARD_TIMEOUT_MS = 1500;

// Compare exactly what the two-decimal result UI shows.
export function normalizeSeconds(seconds) {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0 || seconds > MAX_SECONDS) return null;
  const rounded = Number(seconds.toFixed(2));
  return rounded > 0 ? rounded : null;
}

export function readBest(storage, stage = STAGE) {
  try {
    const record = JSON.parse(storage.getItem(`room-to-boom:best:${stage}`));
    if (!record || record.stage !== stage) return null;
    return normalizeSeconds(record.seconds);
  } catch {
    return null;
  }
}

export function saveBest(storage, seconds) {
  const previous = readBest(storage);
  const result = normalizeSeconds(seconds);
  if (result === null || (previous !== null && result >= previous)) {
    return { best: previous, isNewBest: false, persisted: previous !== null };
  }
  let persisted = false;
  try {
    storage.setItem(BEST_KEY, JSON.stringify({ stage: STAGE, seconds: result }));
    persisted = true;
  } catch {
    // An unavailable browser store must never interrupt a completed run.
  }
  return { best: result, isNewBest: true, persisted };
}

export function parseChallenge(url) {
  try {
    const params = new URL(url).searchParams;
    if (params.getAll('stage').length !== 1 || params.get('stage') !== STAGE || params.getAll('target').length !== 1) return null;
    const raw = params.get('target');
    if (!/^\d{1,5}(?:\.\d{1,2})?$/.test(raw)) return null;
    const seconds = normalizeSeconds(Number(raw));
    return seconds === null ? null : { seconds, stage: STAGE };
  } catch {
    return null;
  }
}

export function buildChallengeUrl(url, seconds) {
  const result = normalizeSeconds(seconds);
  if (result === null) throw new RangeError('Challenge time must be a positive finite number of seconds.');
  const challenge = new URL(url);
  // Share only the level and this run, never stale targets or private URL state.
  challenge.search = '';
  challenge.hash = '';
  challenge.searchParams.set('stage', STAGE);
  challenge.searchParams.set('target', result.toFixed(2));
  return challenge.href;
}

async function copyBeforeDeadline(clipboard, text, timeoutMs) {
  let timer;
  const delay=Number.isFinite(timeoutMs)?Math.max(0,timeoutMs):CLIPBOARD_TIMEOUT_MS;
  try {
    // A background tab or unanswered permission prompt can leave writeText
    // pending indefinitely. Keep the manual challenge link reachable instead.
    // Invoke writeText in the click's call stack to preserve user activation.
    const write=Promise.resolve(clipboard.writeText(text)).then(()=>true);
    return await Promise.race([
      write,
      new Promise(resolve=>{timer=setTimeout(()=>resolve(false),delay);}),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

// SHARE is intentionally a copy-link action on every device. Never open a
// native share sheet or add a message around the URL the player will paste.
export async function shareResult({ navigator: nav, url, seconds, clipboardTimeoutMs = CLIPBOARD_TIMEOUT_MS }) {
  const challengeUrl = buildChallengeUrl(url, seconds);
  try {
    if (typeof nav?.clipboard?.writeText === 'function') {
      const copied = await copyBeforeDeadline(nav.clipboard, challengeUrl, clipboardTimeoutMs);
      if (copied) return { url: challengeUrl, status: 'copied' };
    }
  } catch {
    // Keep a selectable URL available when copying is blocked or unavailable.
  }
  return { url: challengeUrl, status: 'manual' };
}
