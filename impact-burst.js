// Presentation only. Positions and velocities here never enter the physics
// world: update() advances an explicit active-play clock supplied by the caller.
export const IMPACT_BURST_LIMITS = Object.freeze({
  particles: 96,
  bursts: 10,
  contacts: 64,
  duplicateMs: 80,
  maxLife: .52,
  minReferenceSpeed: .8,
});

export const IMPACT_BURST_PALETTE = Object.freeze({
  plaster: '#fff2d8',
  dustHighlight: '#fff9e9',
  dust: '#e9d2af',
  dustRim: '#8d664f',
  terracotta: '#be724e',
  terracottaLight: '#db9469',
  ink: '#17364a',
});

const TAU = Math.PI * 2;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;

function unit(vector, fallback) {
  const x = finite(vector?.x), y = finite(vector?.y);
  const length = Math.hypot(x, y);
  return length > .00001 ? { x: x / length, y: y / length } : { ...fallback };
}

function hash(value) {
  let seed = 2166136261;
  for (const char of String(value)) {
    seed ^= char.charCodeAt(0);
    seed = Math.imul(seed, 16777619);
  }
  return seed >>> 0;
}

function randomFrom(seed) {
  return () => {
    seed += 0x6D2B79F5;
    let value = seed;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function keyFor(info) {
  if (info.sourceId != null) return String(info.sourceId);
  if (info.bodyId != null || info.wallId != null)
    return `${info.bodyId ?? 'piece'}:${info.wallId ?? 'wall'}`;
  return `point:${Math.round(info.x / 4)}:${Math.round(info.y / 4)}`;
}

function tierFor(info, speed) {
  if (info.broken) return 'fracture';
  return info.firstCrack || finite(info.damage) > 0 || info.damaged || speed >= 4.8 ? 'impact' : 'contact';
}

function circle(ctx, x, y, radius) {
  ctx.beginPath(); ctx.arc(x, y, radius, 0, TAU);
}

export class ImpactBursts {
  constructor() { this.clear(); }

  clear() {
    this.bursts = [];
    this.elapsedMs = 0;
    this.contacts = new Map();
    this.stats = { spawned: 0, upgraded: 0, deduped: 0, quiet: 0, evicted: 0, peakParticles: 0 };
  }

  add(info = {}) {
    if (!Number.isFinite(info.x) || !Number.isFinite(info.y)) return null;
    const speed = Math.max(0, finite(info.referenceSpeed, Math.hypot(finite(info.velocity?.x), finite(info.velocity?.y))));
    if (speed < IMPACT_BURST_LIMITS.minReferenceSpeed && !info.broken && !info.firstCrack && !(info.damage > 0)) {
      this.stats.quiet++;
      return null;
    }
    const sourceId = keyFor(info), tier = tierFor(info, speed);
    const last = this.contacts.get(sourceId);
    const stamp = Number.isFinite(info.eventTime) ? info.eventTime : null;
    const sameEvent = stamp != null && last?.eventTime === stamp;
    if (last && (sameEvent || this.elapsedMs - last.at < IMPACT_BURST_LIMITS.duplicateMs)) {
      const existing = this.bursts.includes(last.burst) ? last.burst : null;
      // onWallHit and onBreak describe one paid physical collision. Upgrade
      // that existing cloud in place instead of spawning a second explosion.
      if (existing && tier === 'fracture' && existing.tier !== 'fracture') {
        this._populate(existing, { ...info, referenceSpeed: speed }, 'fracture');
        this.stats.upgraded++;
        this._bound(existing);
        return existing;
      }
      this.stats.deduped++;
      return null;
    }

    const burst = { x: info.x, y: info.y, sourceId, generation: this.stats.spawned,
      eventTime: stamp, age: 0 };
    this._populate(burst, { ...info, referenceSpeed: speed }, tier);
    this.bursts.push(burst);
    this.contacts.delete(sourceId);
    this.contacts.set(sourceId, { at: this.elapsedMs, eventTime: stamp, burst });
    while (this.contacts.size > IMPACT_BURST_LIMITS.contacts) this.contacts.delete(this.contacts.keys().next().value);
    this.stats.spawned++;
    this._bound(burst);
    return burst;
  }

  _populate(burst, info, tier) {
    const random = randomFrom(hash(`${burst.sourceId}:${burst.x.toFixed(3)}:${burst.y.toFixed(3)}:${burst.generation}:${tier}`));
    const k = clamp(finite(info.intensity, (info.referenceSpeed - .8) / 9), 0, 1);
    const normal = unit(info.normal, { x: 0, y: 1 });
    const incident = unit(info.velocity, { x: -normal.x, y: -normal.y });
    const fractured = tier === 'fracture', effective = tier === 'impact';
    const dustCount = fractured ? 16 + Math.round(k * 4) : effective ? 9 + Math.round(k * 5) : 3;
    const chipCount = fractured ? 5 + Math.round(k * 2) : effective ? 2 : 0;
    const duration = fractured ? .52 : effective ? .34 : .13;
    const baseSpeed = fractured ? 390 + k * 180 : effective ? 190 + k * 130 : 68 + k * 24;
    const direction = fractured
      ? { x: incident.x * .28 + normal.x * .10, y: incident.y * .28 + normal.y * .10 }
      : { x: normal.x * .30, y: normal.y * .30 };

    Object.assign(burst, { tier, normal, velocity: incident, intensity: k,
      maxLife: duration, life: Math.max(0, duration - burst.age), particles: [] });
    for (let i = 0; i < dustCount + chipCount; i++) {
      const chip = i >= dustCount;
      // Radial coverage is stratified, with a small physically meaningful bias:
      // surviving walls kick dust back; fractured plaster follows the incoming
      // furniture as well as scattering to either side of the actual contact.
      const index = chip ? i - dustCount : i;
      const count = chip ? chipCount : dustCount;
      const angle = index / count * TAU + (random() - .5) * .40;
      const ray = unit({ x: Math.cos(angle) + direction.x, y: Math.sin(angle) + direction.y }, normal);
      const initialSpeed = baseSpeed * (.62 + random() * .48) * (chip ? .79 : 1);
      const maxLife = duration * (chip ? .84 + random() * .16 : .72 + random() * .26);
      const large = !chip && (i % 4 === 0);
      const radius = chip ? 2.8 + random() * (fractured ? 5.2 : 2.6)
        : large ? (fractured ? 13 + random() * 4 : 5 + random() * 3) : 1.8 + random() * (fractured ? 3.8 : 2.0);
      const vertices = chip ? Array.from({ length: 5 }, (_, corner) => {
        const theta = corner / 5 * TAU;
        const reach = .70 + random() * .40;
        return { x: Math.cos(theta) * reach, y: Math.sin(theta) * reach };
      }) : null;
      burst.particles.push({ kind: chip ? 'chip' : large ? 'dust-large' : 'dust',
        x: burst.x, y: burst.y, vx0: ray.x * initialSpeed, vy0: ray.y * initialSpeed,
        initialSpeed, speed: initialSpeed, radialDistance: 0,
        drag: chip ? 6.8 : fractured ? 8.2 : effective ? 9.5 : 12,
        radius, maxLife, life: Math.max(0, maxLife - burst.age),
        angle0: random() * TAU, angle: 0, spin: (random() - .5) * (chip ? 20 : 2),
        vertices, color: chip ? IMPACT_BURST_PALETTE.terracotta
          : i % 3 === 0 ? IMPACT_BURST_PALETTE.dust : IMPACT_BURST_PALETTE.plaster });
    }
    this._position(burst);
  }

  _bound(protectedBurst) {
    let count = this.bursts.reduce((total, burst) => total + burst.particles.length, 0);
    while (count > IMPACT_BURST_LIMITS.particles || this.bursts.length > IMPACT_BURST_LIMITS.bursts) {
      const index = this.bursts.findIndex(burst => burst !== protectedBurst);
      if (index < 0) break;
      count -= this.bursts[index].particles.length;
      this.bursts.splice(index, 1);
      this.stats.evicted++;
    }
    this.stats.peakParticles = Math.max(this.stats.peakParticles, count);
  }

  _position(burst) {
    burst.life = Math.max(0, burst.maxLife - burst.age);
    for (const particle of burst.particles) {
      const age = Math.min(burst.age, particle.maxLife);
      const decay = Math.exp(-particle.drag * age);
      const distance = (1 - decay) / particle.drag;
      particle.x = burst.x + particle.vx0 * distance;
      particle.y = burst.y + particle.vy0 * distance;
      particle.speed = particle.initialSpeed * decay;
      particle.radialDistance = particle.initialSpeed * distance;
      particle.angle = particle.angle0 + particle.spin * (1 - Math.exp(-5 * age)) / 5;
      particle.life = Math.max(0, particle.maxLife - burst.age);
    }
  }

  update(dt) {
    if (!Number.isFinite(dt) || dt <= 0) return;
    this.elapsedMs += dt * 1000;
    for (const burst of this.bursts) {
      burst.age += dt;
      this._position(burst);
    }
    this.bursts = this.bursts.filter(burst => burst.life > 0);
  }

  draw(ctx, { reducedMotion = false, cssScale = 1, layer = 'all' } = {}) {
    const scale = Math.max(.1, finite(cssScale, 1));
    ctx.save();
    ctx.lineJoin = 'round';
    for (const burst of this.bursts) {
      if (reducedMotion) {
        if (layer === 'chips') continue;
        // The accessible alternative stays at the real contact: no particles
        // travel, no expanding ring, and no oscillating or stretched image.
        const radius = clamp((burst.tier === 'fracture' ? 12 : burst.tier === 'impact' ? 8 : 4) * scale, 3, 12) / scale;
        ctx.globalAlpha = Math.max(0, burst.life / burst.maxLife) * .8;
        circle(ctx, burst.x, burst.y, radius);
        ctx.fillStyle = IMPACT_BURST_PALETTE.plaster; ctx.fill();
        ctx.strokeStyle = IMPACT_BURST_PALETTE.ink; ctx.lineWidth = .9 / scale; ctx.stroke();
        if (burst.tier !== 'contact') {
          ctx.beginPath();
          for (let i = 0; i < 4; i++) {
            const angle = i / 4 * TAU + Math.atan2(burst.normal.y, burst.normal.x);
            ctx.moveTo(burst.x + Math.cos(angle) * radius * .45, burst.y + Math.sin(angle) * radius * .45);
            ctx.lineTo(burst.x + Math.cos(angle) * radius * .80, burst.y + Math.sin(angle) * radius * .80);
          }
          ctx.strokeStyle = IMPACT_BURST_PALETTE.terracotta; ctx.stroke();
        }
        continue;
      }
      // Round dust goes behind the few opaque, irregular, terracotta-core chips.
      for (const particle of burst.particles) {
        if (layer === 'dust' && particle.kind === 'chip' || layer === 'chips' && particle.kind !== 'chip') continue;
        if (particle.life <= 0) continue;
        const progress = 1 - particle.life / particle.maxLife;
        const fade = Math.pow(1 - progress, .75);
        const reveal = Math.min(1, .55 + burst.age / .015);
        if (particle.kind === 'chip') {
          ctx.save(); ctx.translate(particle.x, particle.y); ctx.rotate(particle.angle);
          ctx.globalAlpha = fade * reveal * .96;
          ctx.beginPath();
          particle.vertices.forEach((point, index) => {
            const x = point.x * particle.radius, y = point.y * particle.radius;
            if (index) ctx.lineTo(x, y); else ctx.moveTo(x, y);
          });
          ctx.closePath(); ctx.fillStyle = particle.color; ctx.fill();
          ctx.strokeStyle = IMPACT_BURST_PALETTE.ink; ctx.lineWidth = .7 / scale; ctx.stroke();
          ctx.beginPath();
          particle.vertices.forEach((point, index) => {
            const x = point.x * particle.radius * .84 - .35, y = point.y * particle.radius * .67 - particle.radius * .22;
            if (index) ctx.lineTo(x, y); else ctx.moveTo(x, y);
          });
          ctx.closePath(); ctx.fillStyle = IMPACT_BURST_PALETTE.plaster; ctx.fill();
          ctx.restore();
        } else {
          const radius = particle.radius * (.72 + progress * .48);
          const plasterCloud = burst.tier === 'fracture' && particle.kind === 'dust-large';
          ctx.globalAlpha = fade * reveal * .13;
          circle(ctx, particle.x + radius * .24, particle.y + radius * .36, radius * 1.06);
          ctx.fillStyle = IMPACT_BURST_PALETTE.ink; ctx.fill();
          ctx.globalAlpha = fade * reveal * (plasterCloud ? .78 : particle.kind === 'dust-large' ? .53 : .73);
          circle(ctx, particle.x, particle.y, radius);
          ctx.fillStyle = particle.color; ctx.fill();
          if (plasterCloud) {
            // A substantial filled plaster puff rather than a transparent
            // bubble: its broad core stays behind the furniture and the rim
            // remains quieter than the cream fill on mint and wood floors.
            ctx.globalAlpha = fade * reveal * .25;
            ctx.strokeStyle = IMPACT_BURST_PALETTE.dustRim; ctx.lineWidth = .45 / scale; ctx.stroke();
            ctx.globalAlpha = fade * reveal * .23;
            circle(ctx, particle.x - radius * .12, particle.y - radius * .18, radius * .72);
            ctx.fillStyle = IMPACT_BURST_PALETTE.dustHighlight; ctx.fill();
          } else {
            ctx.strokeStyle = IMPACT_BURST_PALETTE.dustRim; ctx.lineWidth = .65 / scale; ctx.stroke();
          }
        }
      }
    }
    ctx.restore();
  }

  snapshot() {
    return { elapsedMs: this.elapsedMs, count: this.bursts.length,
      particleCount: this.bursts.reduce((total, burst) => total + burst.particles.length, 0),
      stats: { ...this.stats }, bursts: this.bursts.map(burst => ({
        x: burst.x, y: burst.y, sourceId: burst.sourceId, tier: burst.tier,
        age: burst.age, life: burst.life, maxLife: burst.maxLife,
        normal: { ...burst.normal }, velocity: { ...burst.velocity },
        particles: burst.particles.map(particle => ({
          kind: particle.kind, x: particle.x, y: particle.y, radius: particle.radius,
          speed: particle.speed, initialSpeed: particle.initialSpeed, radialDistance: particle.radialDistance,
          angle: particle.angle, spin: particle.spin, life: particle.life, maxLife: particle.maxLife,
        })),
      })) };
  }
}
