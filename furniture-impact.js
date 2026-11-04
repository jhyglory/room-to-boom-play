// Bounded surface wear and a small, temporary change to the painted sprite only.
// Surface positions are body-local, never image-frame pixels or world overlays.
// Nothing in this module
// changes Matter bodies, sprite registration, picking, aiming or delivery bounds.
// Call update with the renderer's active presentation delta in seconds.
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const finite = value => typeof value === 'number' && Number.isFinite(value);
const IDENTITY = Object.freeze({ active: false, angle: 0,
  normalLocal: Object.freeze({ x: 1, y: 0 }), compression: 0, stretch: 0,
  shear: 0, scaleNormal: 1, scaleTangent: 1 });

export const FURNITURE_DAMAGE_LIMITS = Object.freeze({ bodies: 16, marksPerBody: 5,
  chips: 36, chipsPerHit: 3, contactCooldown: .070, markMinSpeed: 5.8, chipLife: .38 });
export const FURNITURE_DAMAGE_COLORS = Object.freeze({
  dent: '#36556b', dentLight: '#eaf6f1', wood: '#71432d', woodLight: '#e9bd81',
  fabric: '#31594d', cardboard: '#986d3d', ceramic: '#6b6653',
});

function localVector(vector, angle) {
  const c = Math.cos(angle), s = Math.sin(angle);
  return { x: vector.x * c + vector.y * s, y: -vector.x * s + vector.y * c };
}

function contactLocal(body, info, normal) {
  const w = body.game?.w, h = body.game?.h;
  if (!(finite(w) && w > 0 && finite(h) && h > 0)) return null;
  const angle = finite(body.angle) ? body.angle : 0;
  let arm = info.contactArm || info.arm;
  if (!finite(arm?.x) || !finite(arm?.y)) arm = finite(info.point?.x) && finite(info.point?.y)
    && finite(body.position?.x) && finite(body.position?.y)
    ? { x: info.point.x - body.position.x, y: info.point.y - body.position.y } : null;
  const axis = localVector(normal, angle);
  let local = arm ? localVector(arm, angle) : { x: -axis.x * w / 2, y: -axis.y * h / 2 };
  const shape = body.game?.deformation;
  const determinant = shape && shape.a * shape.d - shape.b * shape.c;
  if (shape && [shape.a, shape.b, shape.c, shape.d].every(finite) && determinant > 1e-6) {
    // Contacts are measured on the already crumpled physical surface. Store
    // traces in its original coordinates so later deformation carries them.
    local = { x: (shape.d * local.x - shape.c * local.y) / determinant,
      y: (-shape.b * local.x + shape.a * local.y) / determinant };
    const nx = shape.a * axis.x + shape.b * axis.y;
    const ny = shape.c * axis.x + shape.d * axis.y;
    axis.x = nx; axis.y = ny;
  }
  // A support point is on the physical edge. Move only the painted trace a few
  // units onto the surface, avoiding transparent PNG margins and loose pixels.
  const inset = Math.min(7, Math.min(w, h) * .14);
  return { x: clamp(local.x, -w / 2 + inset, w / 2 - inset),
    y: clamp(local.y, -h / 2 + inset, h / 2 - inset),
    angle: Math.atan2(axis.y, axis.x), w, h };
}

function measuredSpeed(info, normal) {
  if (finite(info.referenceSpeed)) return Math.max(0, info.referenceSpeed);
  if (finite(info.speed)) return Math.max(0, info.speed);
  if (finite(info.velocity?.x) && finite(info.velocity?.y))
    return Math.abs(info.velocity.x * normal.x + info.velocity.y * normal.y);
  return 0;
}

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
    this.damage = new Map();
    this.chips = [];
    this.contacts = new Map();
    this.serial = 0;
  }

  add(body, info = {}, { reducedMotion = false } = {}) {
    if (!body || !info.normal || !finite(info.normal.x) || !finite(info.normal.y)) return null;
    const magnitude = Math.hypot(info.normal.x, info.normal.y);
    if (magnitude < 1e-6) return null;
    const normal = { x: info.normal.x / magnitude, y: info.normal.y / magnitude };
    const strength = impactStrength(info, normal);
    if (!strength) return null;
    const key = bodyKey(body);
    const previous = this.entries.get(key);
    const sourceId = info.sourceId ?? info.wallId ?? 'wall';
    const recent = this.contacts.get(key) || new Map();
    const duplicate = recent.get(sourceId);
    if (duplicate && this.time - duplicate.at < FURNITURE_DAMAGE_LIMITS.contactCooldown - 1e-9) {
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
    this.contacts.delete(key); this.contacts.set(key, recent);
    // A body may touch several small wall panels in one impact, but this remains
    // one bounded sprite response instead of multiplying its scale per panel.
    while (recent.size > 8) recent.delete(recent.keys().next().value);
    while (this.contacts.size > FURNITURE_DAMAGE_LIMITS.bodies) this.contacts.delete(this.contacts.keys().next().value);
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
    this.addSurfaceMark(body, info, normal, strength, reducedMotion);
    // There are sixteen pieces in the stage. Even accidental foreign IDs cannot
    // leave an unbounded particle-like history behind.
    while (this.entries.size > 16) this.entries.delete(this.entries.keys().next().value);
    return entry;
  }

  addSurfaceMark(body, info, normal, strength, reducedMotion) {
    const speed = measuredSpeed(info, normal);
    if (speed < FURNITURE_DAMAGE_LIMITS.markMinSpeed) return null;
    const local = contactLocal(body, info, normal);
    if (!local) return null;
    const key = bodyKey(body), material = body.game?.material || info.material || 'wood';
    const type = material === 'metal' ? 'dent' : material === 'wood' ? 'scratch'
      : material === 'fabric' ? 'crease' : 'scuff';
    const marks = this.damage.get(key) || [];
    const nearby = marks.find(mark => Math.hypot(mark.x - local.x, mark.y - local.y) < 8);
    const severity = clamp((speed - FURNITURE_DAMAGE_LIMITS.markMinSpeed) / 6.2, .16, 1);
    let mark = nearby;
    if (mark) mark.severity = Math.max(mark.severity, severity);
    else {
      mark = { x: local.x, y: local.y, angle: local.angle, type, material, severity,
        variant: this.serial++ % 3, w: local.w, h: local.h };
      marks.push(mark);
      if (marks.length > FURNITURE_DAMAGE_LIMITS.marksPerBody) marks.shift();
    }
    this.damage.delete(key); this.damage.set(key, marks);
    while (this.damage.size > FURNITURE_DAMAGE_LIMITS.bodies) this.damage.delete(this.damage.keys().next().value);
    if (material === 'wood' && !reducedMotion) this.addWoodChips(body, mark, normal, strength);
    return mark;
  }

  addWoodChips(body, mark, normal, strength) {
    if (!finite(body.position?.x) || !finite(body.position?.y)) return;
    const angle = finite(body.angle) ? body.angle : 0, c = Math.cos(angle), s = Math.sin(angle);
    const shape = body.game?.deformation;
    const local = shape && [shape.a, shape.b, shape.c, shape.d].every(finite)
      ? { x: shape.a * mark.x + shape.c * mark.y, y: shape.b * mark.x + shape.d * mark.y }
      : mark;
    const x = body.position.x + local.x * c - local.y * s;
    const y = body.position.y + local.x * s + local.y * c;
    const tangent = { x: -normal.y, y: normal.x };
    for (let i = 0; i < FURNITURE_DAMAGE_LIMITS.chipsPerHit; i++) {
      const spread = (i - 1) * .85, speed = (28 + i * 13) * (.65 + strength * .35);
      this.chips.push({ x0: x, y0: y, x, y, age: 0, life: FURNITURE_DAMAGE_LIMITS.chipLife - i * .035,
        vx: (normal.x + tangent.x * spread) * speed,
        vy: (normal.y + tangent.y * spread) * speed - 18,
        size: 1.5 + i * .65, angle: mark.angle + i * 1.6, spin: (i - 1.25) * 7 });
    }
    if (this.chips.length > FURNITURE_DAMAGE_LIMITS.chips)
      this.chips.splice(0, this.chips.length - FURNITURE_DAMAGE_LIMITS.chips);
  }

  update(dt) {
    if (!finite(dt) || dt <= 0) return;
    this.time += dt;
    for (const [key, entry] of this.entries) {
      if (this.time - entry.startedAt >= entry.profile.duration) this.entries.delete(key);
    }
    for (const chip of this.chips) {
      chip.age += dt;
      const travel = (1 - Math.exp(-6 * chip.age)) / 6;
      chip.x = chip.x0 + chip.vx * travel;
      chip.y = chip.y0 + chip.vy * travel + 35 * chip.age * chip.age;
    }
    this.chips = this.chips.filter(chip => chip.age < chip.life);
  }

  clearMotion() { this.entries.clear(); this.chips = []; }

  clear() {
    this.clearMotion(); this.damage.clear(); this.contacts.clear(); this.time = 0; this.serial = 0;
  }

  marksFor(body) { return this.damage.get(bodyKey(body)) || []; }

  // Call after drawing the PNG, inside its body-local/deformation transform.
  // The small inset clip belongs to rendering only; it is never a new collider.
  drawMarks(ctx, body) {
    const marks = this.marksFor(body);
    if (!marks.length) return;
    const w = body.game?.w || 0, h = body.game?.h || 0;
    ctx.save(); ctx.beginPath(); ctx.rect(-w / 2 + 1, -h / 2 + 1, w - 2, h - 2); ctx.clip();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const mark of marks) {
      const size = 2.3 + 1.5 * mark.severity;
      ctx.save(); ctx.translate(mark.x, mark.y); ctx.rotate(mark.angle);
      if (mark.type === 'dent') {
        ctx.beginPath(); ctx.ellipse(0, 0, size * .55, size * 1.35, 0, -.9, Math.PI + .9);
        ctx.strokeStyle = FURNITURE_DAMAGE_COLORS.dent; ctx.globalAlpha = .55 + .2 * mark.severity;
        ctx.lineWidth = 1.1; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(1.4, 0, size * .6, size * 1.2, 0, -.8, Math.PI + .8);
        ctx.strokeStyle = FURNITURE_DAMAGE_COLORS.dentLight; ctx.globalAlpha = .7; ctx.lineWidth = .8; ctx.stroke();
      } else if (mark.type === 'scratch') {
        const length = 4.2 + mark.severity * 4;
        ctx.beginPath(); ctx.moveTo(-1, -length); ctx.lineTo(1.4, -length * .35);
        ctx.lineTo(-1.3, length * .14); ctx.lineTo(.8, length * .65);
        ctx.strokeStyle = FURNITURE_DAMAGE_COLORS.wood; ctx.globalAlpha = .74; ctx.lineWidth = 1.35; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(1, -length * .75); ctx.lineTo(3.4, -length * .2);
        ctx.strokeStyle = FURNITURE_DAMAGE_COLORS.woodLight; ctx.lineWidth = 1; ctx.stroke();
        if (mark.severity > .4) {
          ctx.beginPath(); ctx.moveTo(1.4, -length * .35); ctx.lineTo(-3.5, -length * .12);
          ctx.strokeStyle = FURNITURE_DAMAGE_COLORS.wood; ctx.lineWidth = .8; ctx.stroke();
        }
      } else {
        ctx.beginPath(); ctx.moveTo(0, -size * 1.5); ctx.quadraticCurveTo(-size, 0, .4, size * 1.4);
        ctx.strokeStyle = FURNITURE_DAMAGE_COLORS[mark.material] || FURNITURE_DAMAGE_COLORS.fabric;
        ctx.globalAlpha = mark.type === 'crease' ? .32 : .55; ctx.lineWidth = 1.1; ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  drawChips(ctx, { reducedMotion = false } = {}) {
    if (reducedMotion || !this.chips.length) return;
    ctx.save();
    for (const chip of this.chips) {
      ctx.save(); ctx.translate(chip.x, chip.y); ctx.rotate(chip.angle + chip.spin * chip.age);
      ctx.globalAlpha = clamp(1 - chip.age / chip.life, 0, 1);
      ctx.beginPath(); ctx.moveTo(-chip.size, -chip.size * .4); ctx.lineTo(chip.size, -chip.size * .7);
      ctx.lineTo(chip.size * .35, chip.size * .6); ctx.closePath();
      ctx.fillStyle = FURNITURE_DAMAGE_COLORS.woodLight; ctx.fill();
      ctx.strokeStyle = FURNITURE_DAMAGE_COLORS.wood; ctx.lineWidth = .5; ctx.stroke(); ctx.restore();
    }
    ctx.restore();
  }

  snapshot() {
    return { time: this.time, reactions: this.entries.size,
      damage: [...this.damage].map(([id, marks]) => ({ id, marks: marks.map(mark => ({ ...mark })) })),
      chips: this.chips.map(chip => ({ ...chip })) };
  }

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
    const frameAngle = (body.game?.material === 'fabric' ? .008 : .003)
      * amount * Math.sin(progress * Math.PI * 3.2);
    return { active: true, angle: Math.atan2(normalLocal.y, normalLocal.x),
      normalLocal, compression, stretch, shear,
      frameAngle, scaleNormal: 1 - compression, scaleTangent: 1 + stretch };
  }
}
