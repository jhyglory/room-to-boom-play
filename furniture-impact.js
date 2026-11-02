// A small, temporary change to the painted sprite only. Nothing in this module
// changes Matter bodies, sprite registration, picking, aiming or delivery bounds.
// Call update with the renderer's active presentation delta in seconds.
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const finite = value => typeof value === 'number' && Number.isFinite(value);
const IDENTITY = Object.freeze({ active: false, angle: 0,
  normalLocal: Object.freeze({ x: 1, y: 0 }), compression: 0, stretch: 0,
  shear: 0, scaleNormal: 1, scaleTangent: 1 });

const PROFILES = Object.freeze({
  metal: Object.freeze({ duration: .120, compression: .058, stretch: .018, shear: .008 }),
  fabric: Object.freeze({ duration: .210, compression: .090, stretch: .036, shear: .016 }),
  wood: Object.freeze({ duration: .150, compression: .065, stretch: .023, shear: .010 }),
  cardboard: Object.freeze({ duration: .160, compression: .075, stretch: .028, shear: .012 }),
  ceramic: Object.freeze({ duration: .130, compression: .052, stretch: .018, shear: .006 }),
});
const KIND_PROFILES = Object.freeze({
  fridge: Object.freeze({ ...PROFILES.metal, duration: .120 }),
  washing_machine: Object.freeze({ ...PROFILES.metal, duration: .110, compression: .054 }),
  bed: Object.freeze({ ...PROFILES.fabric, duration: .180, compression: .072, stretch: .027, shear: .012 }),
  armchair: Object.freeze({ ...PROFILES.fabric, duration: .220 }),
});

function bodyKey(body) { return body?.game?.id ?? body?.id ?? body; }
function profileFor(body, info) {
  const kind = body?.game?.kind ?? body?.kind ?? info.kind;
  const material = body?.game?.material ?? body?.material ?? info.material;
  return KIND_PROFILES[kind] || PROFILES[material] || PROFILES.wood;
}

function impactStrength(info, normal) {
  // The caller supplies a real collision's speed/intensity, never a pull length.
  // A barely touching object gets no visible squash; collision energy/velocity
  // stay authoritative and are never altered to make a heavier prop look soft.
  let speed = finite(info.referenceSpeed) ? info.referenceSpeed
    : finite(info.speed) ? info.speed : null;
  if (speed === null && finite(info.velocity?.x) && finite(info.velocity?.y)) {
    speed = Math.abs(info.velocity.x * normal.x + info.velocity.y * normal.y);
  }
  const fromSpeed = speed === null ? null : clamp((speed - 1.8) / 8.2, 0, 1);
  const intensity = finite(info.intensity) ? clamp(info.intensity, 0, 1) : null;
  // A measured small speed cannot be promoted to a big reaction by an unrelated
  // energy/intensity field. Without a speed, the event's actual intensity works.
  const strength = fromSpeed === null ? intensity ?? 0 : fromSpeed;
  return strength > 0 ? Math.sqrt(strength) : 0;
}

export class FurnitureImpacts {
  constructor() {
    this.time = 0;
    this.entries = new Map();
  }

  add(body, info = {}) {
    if (!body || !info.normal || !finite(info.normal.x) || !finite(info.normal.y)) return null;
    const magnitude = Math.hypot(info.normal.x, info.normal.y);
    if (magnitude < 1e-6) return null;
    const normal = { x: info.normal.x / magnitude, y: info.normal.y / magnitude };
    const strength = impactStrength(info, normal);
    if (!strength) return null;
    const key = bodyKey(body);
    const previous = this.entries.get(key);
    const sourceId = info.sourceId ?? info.wallId ?? 'wall';
    const recent = previous?.recentHits || new Map();
    const duplicate = recent.get(sourceId);
    if (duplicate && this.time - duplicate.at < .070 - 1e-9) {
      // onWallHit followed by onBreak describes one event. Upgrade its bounded
      // reaction without restarting it or adding a second deformation.
      if (info.broken && !duplicate.broken && previous?.sourceId === sourceId) {
        duplicate.broken = true;
        previous.broken = true;
        previous.strength = Math.max(previous.strength, strength);
      }
      return null;
    }
    recent.set(sourceId, { at: this.time, broken: Boolean(info.broken) });
    // A body may touch several small wall panels in one impact, but this remains
    // one bounded sprite response instead of multiplying its scale per panel.
    while (recent.size > 8) recent.delete(recent.keys().next().value);
    const tangent = { x: -normal.y, y: normal.x };
    const velocity = info.velocity;
    const tangential = finite(velocity?.x) && finite(velocity?.y)
      ? velocity.x * tangent.x + velocity.y * tangent.y : 0;
    const normalSpeed = finite(velocity?.x) && finite(velocity?.y)
      ? Math.abs(velocity.x * normal.x + velocity.y * normal.y) : 0;
    const entry = { startedAt: this.time, normal, strength,
      shearSign: clamp(tangential / Math.max(1, normalSpeed), -1, 1),
      profile: profileFor(body, info), broken: Boolean(info.broken), sourceId, recentHits: recent };
    this.entries.delete(key);
    this.entries.set(key, entry);
    // There are sixteen pieces in the stage. Even accidental foreign IDs cannot
    // leave an unbounded particle-like history behind.
    while (this.entries.size > 16) this.entries.delete(this.entries.keys().next().value);
    return entry;
  }

  update(dt) {
    if (!finite(dt) || dt <= 0) return;
    this.time += dt;
    for (const [key, entry] of this.entries) {
      if (this.time - entry.startedAt >= entry.profile.duration) this.entries.delete(key);
    }
  }

  clear() { this.entries.clear(); this.time = 0; }

  transformFor(body, { reducedMotion = false, aiming = false } = {}) {
    if (reducedMotion || aiming) return IDENTITY;
    const entry = this.entries.get(bodyKey(body));
    if (!entry) return IDENTITY;
    const progress = clamp((this.time - entry.startedAt) / entry.profile.duration, 0, 1);
    if (progress >= 1) return IDENTITY;
    // The initial contact is immediately visible. A brief attack peaks within
    // 12–22ms, then eases smoothly to the registered, undeformed image.
    const attack = clamp(progress / .10, 0, 1);
    const envelope = (.55 + .45 * Math.sin(attack * Math.PI / 2)) * (1 - progress) ** 2;
    const amount = entry.strength * envelope;
    const angle = finite(body?.angle) ? body.angle : 0;
    const cosine = Math.cos(angle), sine = Math.sin(angle);
    const normalLocal = { x: entry.normal.x * cosine + entry.normal.y * sine,
      y: -entry.normal.x * sine + entry.normal.y * cosine };
    const compression = entry.profile.compression * amount;
    const stretch = entry.profile.stretch * amount;
    // A glancing collision has a tiny transient twist. Straight-on contacts do
    // not invent one, and the stored value never accumulates between hits.
    const shear = entry.profile.shear * entry.shearSign * amount || 0;
    return { active: true, angle: Math.atan2(normalLocal.y, normalLocal.x),
      normalLocal, compression, stretch, shear,
      scaleNormal: 1 - compression, scaleTangent: 1 + stretch };
  }
}
