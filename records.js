import { TOTAL_FURNITURE } from './engine.js';

// Portrait geometry and energy-gated local shortcuts define a new stage; older best keys remain intact.
export const STAGE = 'studio-route16-v18';
export const BEST_KEY = `room-to-boom:best:${STAGE}`;
const MAX_SECONDS = 86400;
const CLIPBOARD_TIMEOUT_MS = 1500;
const NATIVE_SHARE_TIMEOUT_MS = 5000;
const pendingNativeShares = new WeakSet();

// Compare exactly what the two-decimal result UI shows.
export function normalizeSeconds(seconds) {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0 || seconds > MAX_SECONDS) return null;
  const rounded = Number(seconds.toFixed(2));
  return rounded > 0 ? rounded : null;
}

export function readBest(storage) {
  try {
    const record = JSON.parse(storage.getItem(BEST_KEY));
    if (!record || record.stage !== STAGE) return null;
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

async function shareBeforeDeadline(nav, payload, timeoutMs) {
  let timer;
  const delay=Number.isFinite(timeoutMs)?Math.max(0,timeoutMs):NATIVE_SHARE_TIMEOUT_MS;
  try {
    // Some embedded browsers expose share() without ever opening or settling
    // a sheet. A timeout offers the manual link; it must not also copy while
    // an unresolved native sheet could still complete.
    pendingNativeShares.add(nav);
    let native;
    try {native=nav.share(payload);} catch(error) {pendingNativeShares.delete(nav);throw error;}
    const shared=Promise.resolve(native).then(
      ()=>{pendingNativeShares.delete(nav);return true;},
      error=>{pendingNativeShares.delete(nav);throw error;},
    );
    return await Promise.race([
      shared,
      new Promise(resolve=>{timer=setTimeout(()=>resolve(false),delay);}),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export async function shareResult({ navigator: nav, url, seconds, clipboardTimeoutMs = CLIPBOARD_TIMEOUT_MS, nativeShareTimeoutMs = NATIVE_SHARE_TIMEOUT_MS }) {
  const result = normalizeSeconds(seconds);
  const challengeUrl = buildChallengeUrl(url, seconds);
  const text = `I moved all ${TOTAL_FURNITURE} pieces in ${result.toFixed(2)}s on Room to Boom! Can you beat me? 🏠💥`;
  const output = { url: challengeUrl, text };
  const payload = { title: 'Room to Boom!', text, url: challengeUrl };
  if (pendingNativeShares.has(nav)) return { ...output, status: 'manual' };
  if (typeof nav?.share === 'function') {
    try {
      if (typeof nav.canShare !== 'function' || nav.canShare(payload)) {
        const shared=await shareBeforeDeadline(nav,payload,nativeShareTimeoutMs);
        return { ...output, status: shared?'shared':'manual' };
      }
    } catch (error) {
      if (error?.name === 'AbortError') return { ...output, status: 'cancelled' };
    }
  }
  try {
    if (typeof nav?.clipboard?.writeText === 'function') {
      const copied=await copyBeforeDeadline(nav.clipboard,`${text}\n${challengeUrl}`,clipboardTimeoutMs);
      if(copied)return { ...output, status: 'copied' };
    }
  } catch {
    // The caller displays the selectable link when clipboard permission is denied or unanswered.
  }
  return { ...output, status: 'manual' };
}
