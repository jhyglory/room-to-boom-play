// Gesture-unlocked material percussion and staccato wall POPs for v18.1.
// Fabric, wood, metal, cardboard and ceramic differ in resonance and decay;
// small deterministic pitch cycles keep repeated hits tactile without raising
// the master mix. No recorded audio or background music is used.
export const AUDIO_LEVELS = Object.freeze({
  masterGain: .45,
  maxVoices: 24,
  // Calibrated against v10 offline output: the new short material envelopes
  // need this local mix compensation to retain comparable audible energy.
  cueGain: Object.freeze({ collision: 3, launch: 3, delivery: 3 }),
  peakGuard: Object.freeze({ knee: .72, ceiling: .9, curveSize: 4097 }),
});

const MATERIAL_BY_KIND = Object.freeze({
  sofa:'fabric',bed:'fabric',armchair:'fabric',fridge:'metal',washing_machine:'metal',lamp:'metal',
  table:'wood',chair:'wood',bookcase:'wood',wardrobe:'wood',dresser:'wood',tv_stand:'wood',desk:'wood',
  boxA:'cardboard',boxB:'cardboard',plant:'ceramic',
});
const WEIGHT_BY_KIND = Object.freeze({sofa:2,bed:2.6,armchair:1.6,fridge:3.4,washing_machine:3.8,lamp:.4,
  table:1.3,chair:.5,bookcase:1.8,wardrobe:2.8,dresser:2.2,tv_stand:1.5,desk:1.7,boxA:.9,boxB:.9,plant:.8});
const PITCH_CYCLE = Object.freeze([1,.945,1.04,.975,1.02]);
const MATERIAL_ALIASES = Object.freeze({cloth:'fabric',textile:'fabric',paper:'cardboard',box:'cardboard',
  stone:'ceramic',pottery:'ceramic',glass:'ceramic',wall:'plaster'});
const MATERIALS = new Set(['fabric','wood','metal','cardboard','ceramic','plaster']);
const clamp = (value,min,max) => Math.max(min,Math.min(max,value));

export function soundMaterial(material, kind) {
  const value = MATERIAL_ALIASES[material] || material;
  return MATERIALS.has(value) ? value : MATERIAL_BY_KIND[kind] || 'wood';
}

function peakGuardCurve() {
  const { knee, ceiling, curveSize } = AUDIO_LEVELS.peakGuard;
  const curve = new Float32Array(curveSize);
  for (let i = 0; i < curve.length; i++) {
    const input = i * 2 / (curve.length - 1) - 1;
    const magnitude = Math.abs(input);
    curve[i] = magnitude <= knee ? input : Math.sign(input) *
      (knee + (ceiling - knee) * (1 - Math.exp(-(magnitude - knee) / (ceiling - knee))));
  }
  return curve;
}

export class GameAudio {
  constructor({ muted = false, AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext, onStateChange = null, activationTimeoutMs = 1500 } = {}) {
    this.muted = Boolean(muted);
    this.AudioContext = AudioContext;
    this.context = null;
    this.master = null;
    this.peakGuard = null;
    this.output = null;
    this.paused = false;
    this.onStateChange = onStateChange;
    this.activationTimeoutMs = activationTimeoutMs;
    this.lastError = null;
    this.activation = null;
    this.activationVersion = 0;
    this.suspension = null;
    this.intentVersion = 0;
    this.gestureVersion = 0;
    this.voices = new Set();
    this.contacts = [];
    this.variants = new Map();
    this.collapses = [];
    this.wallCadence = new Map();
    this.noiseBuffer = null;
  }

  get status() {
    if (this.muted) return 'muted';
    if (!this.AudioContext) return 'unsupported';
    if (this.paused) return 'paused';
    if (this.activation) return 'unlocking';
    if (this.lastError) return 'blocked';
    return this.context?.state === 'running' ? 'ready' : 'locked';
  }

  notifyState() {
    try { this.onStateChange?.(this.status); } catch {}
  }

  unlock() {
    // Unlock is a browser operation, not permission to unpause gameplay.
    // Only resume() or an explicitly resumed gesture changes that intent.
    if (this.paused || !this.AudioContext) { this.notifyState(); return Promise.resolve(false); }
    if (this.activation) return this.activation;
    this.lastError = null;
    const attempt = ++this.activationVersion;
    const task = this.activate(attempt);
    let deadline;
    const timed = new Promise(resolve => {
      deadline = setTimeout(() => {
        if (attempt !== this.activationVersion) { resolve(false); return; }
        if (!this.paused && this.context?.state === 'running') { resolve(true); return; }
        const error = new Error('The browser did not finish enabling audio. Try another gesture.');
        error.name = 'AudioActivationTimeout';
        this.lastError = error;
        try { this.restoreOutput(); } catch {}
        resolve(false);
      }, this.activationTimeoutMs);
    });
    const operation = Promise.race([task, timed]).then(ready => {
      clearTimeout(deadline);
      if (this.activation === operation) this.activation = null;
      this.notifyState();
      return ready;
    });
    this.activation = operation;
    this.notifyState();
    return operation;
  }

  async activate(attempt) {
    let candidate = null;
    try {
      if (!this.context || this.context.state === 'closed') {
        this.stopVoices();
        this.context = this.master = this.peakGuard = this.output = null;
        candidate = new this.AudioContext();
        const master = candidate.createGain();
        master.gain.value = this.muted ? 0 : AUDIO_LEVELS.masterGain;
        const peakGuard = candidate.createWaveShaper();
        peakGuard.curve = peakGuardCurve();
        peakGuard.oversample = 'none';
        const output = candidate.createGain();
        output.gain.value = 0;
        master.connect(peakGuard);
        peakGuard.connect(output);
        output.connect(candidate.destination);
        this.context = candidate;
        this.master = master;
        this.peakGuard = peakGuard;
        this.output = output;
        const context = candidate;
        const changed = () => {
          if (this.context !== context) return;
          if (context.state !== 'running') this.stopVoices();
          try { this.restoreOutput(); } catch {}
          this.notifyState();
        };
        if (context.addEventListener) context.addEventListener('statechange', changed);
        else context.onstatechange = changed;
        candidate = null;
        this.contacts = [];
        this.variants = new Map();
        this.collapses = [];
        this.noiseBuffer = null;
      }
      // A pending suspend must finish before its subsequent user resume.
      // Graph creation and the first resume still begin inside the gesture.
      if (this.suspension) await this.suspension;
      if (this.paused) return false;
      if (this.context.state !== 'running') await this.context.resume();
      if (attempt !== this.activationVersion) return false;
      if (!this.paused && this.context.state !== 'running') {
        const error = new Error('The browser has not started audio. Try another gesture.');
        error.name = 'AudioNotRunning';
        this.lastError = error;
      }
      this.restoreOutput();
      return !this.paused && this.context.state === 'running';
    } catch (error) {
      try { await candidate?.close?.(); } catch {}
      if (attempt === this.activationVersion) {
        this.lastError = error;
        try { this.restoreOutput(); } catch {}
      }
      return false;
    }
  }

  async gesture(name = 'enable', { resume = false, intensity = 1 } = {}) {
    if (this.muted || !this.AudioContext || (this.paused && !resume)) { this.notifyState(); return false; }
    const cue = ++this.gestureVersion;
    const pending = resume ? this.resume() : this.unlock();
    const intent = this.intentVersion;
    const ready = await pending;
    // Delayed browser permission must never replay an old cue after mute,
    // pause, tab hiding, or a newer gesture that already replaced this one.
    if (!ready || cue !== this.gestureVersion || intent !== this.intentVersion || this.muted || this.paused) return false;
    return this.play(name, intensity);
  }

  cancelPending() {
    this.intentVersion++;
    this.gestureVersion++;
    this.stopVoices();
  }

  setMuted(muted) {
    const next = Boolean(muted);
    if (next !== this.muted) this.intentVersion++;
    this.muted = next;
    try {
      if (this.master) {
        const now = this.context.currentTime;
        this.master.gain.cancelScheduledValues(now);
        this.master.gain.setValueAtTime(this.muted ? 0 : AUDIO_LEVELS.masterGain, now);
      }
      this.restoreOutput();
    } catch {}
    if (this.muted) this.stopVoices();
    this.notifyState();
  }

  restoreOutput() {
    if (!this.output) return;
    const now = this.context.currentTime;
    const enabled = !this.muted && !this.paused && !this.lastError && this.context.state === 'running';
    this.output.gain.cancelScheduledValues(now);
    this.output.gain.setValueAtTime(enabled ? 1 : 0, now);
  }

  stopVoices() {
    for (const voice of this.voices) {
      try { voice.oscillator.stop(this.context.currentTime); } catch {}
      try { voice.oscillator.disconnect(); voice.gain.disconnect(); voice.filter?.disconnect(); } catch {}
    }
    this.voices.clear();
    this.contacts = [];
    this.collapses = [];
    this.wallCadence.clear();
  }

  reserveWallVoices(count) {
    // A fresh physical hit takes priority over an old scheduled flourish.
    // Keep the same strict voice bound instead of losing the whole new hit.
    const now = this.context.currentTime;
    const retiring = [...this.voices].sort((a,b) => {
      const af = a.start > now, bf = b.start > now;
      if (af !== bf) return af ? -1 : 1;
      return af ? b.start - a.start : a.end - b.end;
    });
    while (this.voices.size + count > AUDIO_LEVELS.maxVoices && retiring.length) {
      const voice = retiring.shift();
      try { voice.oscillator.stop(now); } catch {}
      try { voice.oscillator.disconnect(); voice.gain.disconnect(); voice.filter?.disconnect(); } catch {}
      this.voices.delete(voice);
    }
  }

  nextWallCadence(key, now) {
    for (const [id, hit] of this.wallCadence) if (now - hit.at > .4) this.wallCadence.delete(id);
    const previous = key == null ? null : this.wallCadence.get(key);
    const count = previous ? Math.min(3,previous.count + 1) : 1;
    if (key != null) this.wallCadence.set(key,{at:now,count});
    return count;
  }

  suspend() {
    this.paused = true;
    this.intentVersion++;
    try { this.restoreOutput(); } catch {}
    this.stopVoices();
    this.notifyState();
    if (this.suspension) return this.suspension;
    const activation = this.activation;
    const task = (async () => {
      try {
        // A browser can complete resume after this call. Drain it, then honor
        // the latest pause intent instead of reopening sound underneath it.
        if (activation) await activation;
        if (this.paused && this.context && !['closed', 'suspended'].includes(this.context.state)) await this.context.suspend();
        return true;
      } catch { return false; }
    })();
    const operation = task.then(result => {
      if (this.suspension === operation) this.suspension = null;
      try { this.restoreOutput(); } catch {}
      this.notifyState();
      return result;
    });
    this.suspension = operation;
    return operation;
  }

  resume() {
    if (this.paused) { this.paused = false; this.intentVersion++; }
    this.notifyState();
    return this.unlock();
  }

  tone(frequency, endFrequency, duration, volume, delay = 0, type = 'sine') {
    if (this.voices.size >= AUDIO_LEVELS.maxVoices) return;
    const context = this.context;
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const voice = { oscillator, gain, start, end: start + duration + .05 };
    this.voices.add(voice);
    oscillator.onended = () => {
      this.voices.delete(voice);
      try { oscillator.disconnect(); gain.disconnect(); } catch {}
    };
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), start + duration);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + .01);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(start);
    oscillator.stop(start + duration + .05);
  }

  noiseHit(duration, frequency, volume, q = 1, { delay = 0, toFrequency = null, filterType = 'bandpass', attack = 0 } = {}) {
    const context = this.context;
    if (this.voices.size >= AUDIO_LEVELS.maxVoices || !context.createBuffer || !context.createBufferSource || !context.createBiquadFilter) return false;
    // One two-second white-noise source is cached per AudioContext. The gain
    // envelope, not a baked fade or low-pass sweep, creates each short hit.
    if (!this.noiseBuffer) {
      this.noiseBuffer = context.createBuffer(1, Math.floor(context.sampleRate * 2), context.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const oscillator = context.createBufferSource();
    oscillator.buffer = this.noiseBuffer;
    if (oscillator.playbackRate) oscillator.playbackRate.value = 1;
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    const start = context.currentTime + delay;
    const voice = { oscillator, gain, filter, start, end: start + duration + .05 };
    this.voices.add(voice);
    oscillator.onended = () => {
      this.voices.delete(voice);
      try { oscillator.disconnect(); gain.disconnect(); filter.disconnect(); } catch {}
    };
    filter.type = filterType;
    filter.frequency.setValueAtTime(frequency, start);
    if (toFrequency) filter.frequency.exponentialRampToValueAtTime(toFrequency, start + duration);
    filter.Q.setValueAtTime(q, start);
    if (attack > 0) {
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.linearRampToValueAtTime(volume, start + attack);
    } else gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(filter); filter.connect(gain); gain.connect(this.master);
    oscillator.start(start, Math.random() * 1.5);
    oscillator.stop(start + duration + .05);
    return true;
  }

  materialContext({ material, kind, heavy } = {}) {
    const name = soundMaterial(material,kind);
    const relative = typeof heavy === 'boolean' ? (heavy ? 3.4 : .4)
      : Number.isFinite(heavy) && heavy > 0 ? heavy : WEIGHT_BY_KIND[kind] || 1.2;
    return { material:name, kind, weight:clamp(relative/3.4,0,1) };
  }

  nextVariant(material, kind = '') {
    const key = `${material}:${kind}`;
    let seed = 0;
    for (const letter of key) seed = (seed * 31 + letter.charCodeAt(0)) >>> 0;
    const count = this.variants.get(key) || 0;
    this.variants.set(key,count + 1);
    const index = (seed + count) % PITCH_CYCLE.length;
    return { pitch:PITCH_CYCLE[index], brightness:[1,.92,1.08,.97,1.04][index] };
  }

  materialHit(material, k, weight, variant, level = 1) {
    const p = variant.pitch * (1.16 - weight * .36), b = variant.brightness;
    const loud = (.55 + k * .45) * level * AUDIO_LEVELS.cueGain.collision;
    switch(material) {
      case 'fabric':
        this.tone(125*p,44*p,.10+weight*.055,.34*loud,0,'sine');
        this.noiseHit(.045+k*.035,320*b,.24*loud,.7);
        if(k>.55)this.tone(83*p,46*p,.075,.13*loud,.008,'triangle');
        break;
      case 'metal':
        this.tone(780*p,610*p,.10+k*.12,.20*loud,0,'sine');
        this.tone(1390*p,1280*p,.075+k*.08,.115*loud,.003,'sine');
        this.noiseHit(.028,2600*b,.14*loud,5);
        if(k>.55)this.tone(1140*p,520*p,.055,.10*loud,.012,'triangle');
        break;
      case 'cardboard':
        this.tone(240*p,92*p,.055+k*.025,.23*loud,0,'triangle');
        this.noiseHit(.04,1100*b,.29*loud,1.1);
        this.noiseHit(.025,2300*b,.13*loud,1.2,{delay:.012});
        if(k>.55)this.noiseHit(.035,1600*b,.15*loud,.9,{delay:.035});
        break;
      case 'ceramic':
        this.tone(1060*p,935*p,.12+k*.06,.17*loud,0,'sine');
        this.tone(2925*p,2860*p,.08,.065*loud,.005,'sine');
        this.noiseHit(.018,3200*b,.07*loud,7);
        break;
      case 'plaster':
        this.tone(145*p,60*p,.10+k*.035,.34*loud,0,'triangle');
        this.noiseHit(.06,580*b,.30*loud,.8);
        if(k>.55)this.noiseHit(.085,1600*b,.18*loud,1.2,{delay:.012});
        break;
      default:
        this.tone(210*p,112*p,.075+k*.035,.29*loud,0,'triangle');
        this.tone(420*p,320*p,.045,.11*loud,.003,'sine');
        this.noiseHit(.035,800*b,.18*loud,2.5);
        if(k>.55)this.tone(90*p,42*p,.11,.17*loud,.008,'sine');
    }
  }

  materialAccent(material, variant, level) {
    const p=variant.pitch;
    level *= AUDIO_LEVELS.cueGain.collision;
    if(material==='metal')this.tone(1600*p,1450*p,.08,.065*level,.006);
    else if(material==='ceramic')this.tone(2100*p,1800*p,.10,.05*level,.006);
    else if(material==='wood')this.tone(330*p,180*p,.045,.08*level,.004,'triangle');
    else this.noiseHit(.03,material==='fabric'?260:material==='plaster'?1200:1800,.12*level,1);
  }

  popTone(frequency, endFrequency, duration, volume, { delay = 0, bounce = false, type = 'sine', attack = .0012 } = {}) {
    if (this.voices.size >= AUDIO_LEVELS.maxVoices) return;
    const context = this.context, start = context.currentTime + delay;
    const oscillator = context.createOscillator(), gain = context.createGain();
    const voice = { oscillator, gain, start, end: start + duration + .02 };
    this.voices.add(voice);
    oscillator.onended = () => {
      this.voices.delete(voice);
      try { oscillator.disconnect(); gain.disconnect(); } catch {}
    };
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (bounce) {
      oscillator.frequency.exponentialRampToValueAtTime(endFrequency * 1.18, start + .010);
      oscillator.frequency.exponentialRampToValueAtTime(endFrequency * 1.55, start + .026);
    }
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.linearRampToValueAtTime(volume, start + attack);
    gain.gain.exponentialRampToValueAtTime(volume * .32, start + Math.min(.026,duration*.48));
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain); gain.connect(this.master);
    oscillator.start(start); oscillator.stop(start + duration + .02);
  }

  wallFlurry(k, weight, variant, { damaged=false, firstCrack=false, cadence=1 } = {}) {
    const beats = firstCrack || k >= .65 || (cadence >= 3 && k >= .3) ? 2
      : damaged || k >= .3 || (cadence >= 2 && k >= .15) ? 1 : 0;
    if (!beats || this.voices.size >= AUDIO_LEVELS.maxVoices) return;
    // One source, separate envelopes: audible ta-ta / pa-pa-PANG attacks,
    // rather than several near-simultaneous layers heard as one thud.
    const context=this.context, now=context.currentTime;
    const oscillator=context.createOscillator(),gain=context.createGain();
    const delays=beats===2?[.050,.112]:[.050];
    const end=now+delays.at(-1)+.052;
    const voice={oscillator,gain,start:now+delays[0],end,wallFlurry:true};
    this.voices.add(voice);
    oscillator.type='triangle';
    gain.gain.setValueAtTime(.0001,now);
    const p=variant.pitch*(1.16-weight*.30)*(1+(cadence-1)*.035);
    for(let i=0;i<delays.length;i++){
      const start=now+delays[i],duration=i===1?.038:.028;
      const level=(i===1?.20:.14)*(.55+k*.45)*AUDIO_LEVELS.cueGain.collision;
      oscillator.frequency.setValueAtTime((i===1?560:790)*p,start);
      oscillator.frequency.exponentialRampToValueAtTime((i===1?118:245)*p,start+duration);
      gain.gain.setValueAtTime(.0001,start);
      gain.gain.linearRampToValueAtTime(level,start+.0008);
      gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
    }
    oscillator.onended=()=>{this.voices.delete(voice);try{oscillator.disconnect();gain.disconnect();}catch{}};
    oscillator.connect(gain);gain.connect(this.master);
    oscillator.start(voice.start);oscillator.stop(end);
  }

  wallPop(k, weight, variant, material, { damaged=false, firstCrack=false, broken=false, cadence=1 } = {}) {
    const loud = (.46 + k * .54) * AUDIO_LEVELS.cueGain.collision;
    const p = variant.pitch * (1.15 - weight * .30);
    // The sharp falling pitch and small rebound carry the "POP". A compact
    // low body supports it; the bright pressure click ends before any hiss.
    this.popTone((465 + k * 175) * p, (90 + k * 24) * p, .066 + k * .022, .32 * loud, { bounce: true });
    this.popTone((112 + k * 22) * p, 49 * p, .048 + k * .020, .18 * loud);
    this.popTone((900 + k * 240) * p, 320 * p, .022 + k * .008, .085 * loud, { type:'triangle', attack:.0008 });
    this.noiseHit(.011 + k * .006, 1250 * variant.brightness, .21 * loud, .7,
      { filterType:'highpass', attack:.0008 });
    if(firstCrack)this.crackTail(k,variant);
    else if(damaged)this.popTone(1350*p,510*p,.024,.075*loud,{delay:.012,type:'triangle'});
    else this.materialAccent(material,variant,.14+k*.10);
    if(!broken)this.wallFlurry(k,weight,variant,{damaged,firstCrack,cadence});
  }

  reboundPop(k,weight,variant,material) {
    // Furniture keeps its material resonances. This small, faster pressure
    // pulse makes a high-bounce light piece crisp and a heavy piece lower.
    const p=variant.pitch*(1.32-weight*.53),mix=AUDIO_LEVELS.cueGain.collision;
    const soft=material==='fabric'?.68:1;
    this.popTone((440+k*125)*p,(116+k*12)*p,.040+weight*.023,
      (.075+k*.065)*soft*mix,{bounce:true});
    this.noiseHit(.009+k*.005,(2100-weight*800)*variant.brightness,
      (.045+k*.035)*soft*mix,1.4,{attack:.0008});
  }

  crackTail(k,variant) {
    const mix=AUDIO_LEVELS.cueGain.collision*(.75+k*.25),p=variant.pitch;
    this.popTone(1350*p,380*p,.028,.14*mix,{type:'triangle',attack:.0007});
    this.popTone(820*p,240*p,.031,.09*mix,{delay:.021,type:'triangle',attack:.0007});
    this.noiseHit(.018,2400*variant.brightness,.115*mix,1.6,{delay:.009,attack:.0006});
  }

  collapseTail(variant) {
    const mix = AUDIO_LEVELS.cueGain.collision;
    this.popTone(385*variant.pitch,91,.080,.21*mix,{bounce:true});
    this.popTone(620*variant.pitch,165,.032,.14*mix,{delay:.060,type:'triangle'});
    this.popTone(275*variant.pitch,78,.050,.23*mix,{delay:.126,bounce:true});
    this.noiseHit(.052,820*variant.brightness,.18*mix,1.2,
      {delay:.006,toFrequency:1850,attack:.0008});
    this.noiseHit(.023,2300*variant.brightness,.09*mix,1.1,
      {delay:.132,filterType:'highpass',attack:.0008});
  }

  collision(speed, metadata = {}) {
    const { broken=false, point=null, sourceId=null, bodyId=null, wall=false, otherMaterial, damaged=false, firstCrack=false } = metadata || {};
    if (this.muted || this.paused || this.context?.state !== 'running' || !Number.isFinite(speed) || speed < 0) return false;
    if (!wall && !broken && this.voices.size >= AUDIO_LEVELS.maxVoices) return false;
    const now=this.context.currentTime;
    const isWall = Boolean(wall || broken);
    const profile=this.materialContext(metadata || {});
    try {
      this.contacts=this.contacts.filter(hit=>now-hit.at<.055);
      const duplicate=this.contacts.some(hit=>{
        const age=now-hit.at;
        if(bodyId!=null&&hit.bodyId!=null&&bodyId!==hit.bodyId)return false;
        if(sourceId!=null&&hit.sourceId!=null&&sourceId===hit.sourceId)return age<(isWall ? .040 : .055);
        const nearby=!point||!hit.point||Math.hypot(point.x-hit.point.x,point.y-hit.point.y)<=(isWall&&hit.wall?110:36);
        // Adjacent wall segments describe one instant, but a genuinely new
        // ricochet a few frames later must not inherit a global 55ms mute.
        return nearby&&((isWall&&hit.wall&&age<.012)||((sourceId==null||hit.sourceId==null)&&age<.025));
      });
      this.collapses=this.collapses.filter(hit=>now-hit.at<.07);
      const duplicateCollapse=broken&&this.collapses.some(hit=>{
        if(bodyId!=null&&hit.bodyId!=null&&bodyId!==hit.bodyId)return false;
        const same=sourceId!=null&&hit.sourceId!=null&&sourceId===hit.sourceId;
        const nearby=!point||!hit.point||Math.hypot(point.x-hit.point.x,point.y-hit.point.y)<=110;
        return same||nearby;
      });
      const contact=speed>1.3&&!duplicate,collapse=broken&&!duplicateCollapse;
      if(isWall&&(contact||collapse))this.reserveWallVoices((contact?(firstCrack?8:6):0)+(collapse?5:0));
      const before=this.voices.size;
      if(contact){
        this.contacts.push({at:now,point:point?{...point}:null,sourceId,bodyId,wall:isWall});
        const k=clamp((speed-1.3)/8,0,1),variant=this.nextVariant(profile.material,profile.kind);
        if (isWall) {
          const cadence=this.nextWallCadence(bodyId??sourceId,now);
          const wallVariant={...variant,pitch:variant.pitch*(1+(cadence-1)*.035)};
          this.wallPop(k,profile.weight,wallVariant,profile.material,{damaged,firstCrack,broken,cadence});
        }
        else {
          this.materialHit(profile.material,k,profile.weight,variant);
          this.reboundPop(k,profile.weight,variant,profile.material);
          const other=otherMaterial?soundMaterial(otherMaterial):null;
          if(other&&other!==profile.material)this.materialAccent(other,variant,.55+k*.3);
        }
      }
      if(collapse){
          this.collapses.push({at:now,point:point?{...point}:null,sourceId,bodyId});
          this.collapseTail(this.nextVariant('plaster','collapse'));
      }
      return this.voices.size>before;
    }catch(error){return this.failPlayback(error);}
  }

  launch(speed, metadata = {}) {
    if (this.muted || this.paused || this.context?.state !== 'running' || !Number.isFinite(speed) || speed < 1.5) return false;
    if (this.voices.size >= AUDIO_LEVELS.maxVoices) return false;
    const v=Math.min(24,speed),before=this.voices.size,profile=this.materialContext(metadata || {});
    const variant=this.nextVariant(profile.material,`${profile.kind||''}:launch`),w=profile.weight;
    const mix = AUDIO_LEVELS.cueGain.launch;
    try {
      const frequency=(1800+v*35)*(1-w*.55)*variant.brightness;
      this.noiseHit(.07+w*.14,frequency,(.13+v/24*.15)*(.8+w*.2)*mix,.9,
        {toFrequency:frequency*(w > .55 ? .7 : 1.45)});
      const p=variant.pitch*(1.18-w*.4);
      this.tone((350+v*22)*p,(900+v*28)*(1-w*.25)*variant.pitch,.06+w*.08,(.065+v/24*.03)*mix,0,'triangle');
      if(w>.55)this.tone(145*p,85*p,.12+w*.05,.09*mix,.006,'triangle');
      if(profile.material==='metal')this.tone(660*p,880*p,.045,.045*mix,.018,'sine');
      else if(profile.material==='cardboard')this.noiseHit(.025,2100*variant.brightness,.065*mix,1,{delay:.018});
      return this.voices.size>before;
    }catch(error){return this.failPlayback(error);}
  }

  failPlayback(error) {
    this.lastError = error; this.stopVoices();
    try { this.restoreOutput(); } catch {}
    this.notifyState(); return false;
  }

  play(name, intensity = 1) {
    if (this.muted || this.paused || this.context?.state !== 'running') return false;
    const strength = Number.isFinite(intensity) ? Math.max(0.1, Math.min(1, intensity)) : 1;
    try {
      switch (name) {
        case 'enable':
          this.tone(520, 660, .075, .3);
          this.tone(784, 840, .11, .28, .06);
          break;
        case 'grab':
          this.tone(410, 550, 0.055, 0.27);
          break;
        case 'impact':
          return this.collision(3 + strength * 6);
        case 'wall-hit':
          return this.collision(3 + strength * 6, { wall: true });
        case 'break':
          return this.collision(3 + strength * 6, { wall: true, broken: true });
        case 'launch':
          return this.launch(strength * 24);
        case 'deliver': {
          const count=Number.isFinite(intensity)?clamp(intensity,0,16):1,up=2**(count/32);
          const mix = AUDIO_LEVELS.cueGain.delivery;
          this.tone(660*up,660*up,.075,.18*mix,0,'triangle');
          this.tone(990*up,990*up,.115,.15*mix,.045,'triangle');
          this.tone(1320*up,1320*up,.14,.085*mix,.095,'sine');
          if(count===16)this.tone(2640*up,2640*up,.12,.04*mix,.12,'sine');
          break;
        }
        case 'finish':
          [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
            this.tone(frequency, frequency, index === 3 ? 0.3 : 0.16, 0.4, index * 0.1);
          });
          break;
        default:
          return false;
      }
      return true;
    } catch (error) { return this.failPlayback(error); }
  }
}
