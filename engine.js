/* Room to Boom! — deterministic, zero-gravity moving physics. */
export const WORLD = Object.freeze({
  width: 520,
  height: 816,
  delivery: Object.freeze({ minX: 56, maxX: 464, minY: 43, maxY: 289 }),
  oldInterior: Object.freeze({ minX:56,maxX:464,minY:501,maxY:747 }),
  rooms: Object.freeze({
    old: Object.freeze({ minX:47,maxX:473,minY:492,maxY:756 }),
    new: Object.freeze({ minX:47,maxX:473,minY:34,maxY:298 }),
  }),
  doorway: Object.freeze({ minX:190,maxX:330,centerX:260 }),
  corridor: Object.freeze({ minY:307,maxY:483 }),
  separatorRows: Object.freeze([298,492]),
});

export const REFERENCE_FURNITURE = Object.freeze([
  { id: 'sofa', material: 'fabric', name: 'Sofa', kind: 'sofa', x: 279, y: 688, w: 128, h: 68, heavy: 2, frictionAir: 0.05, restitution: 0.4, color: '#77CDBA' },
  { id: 'bed', material: 'fabric', name: 'Bed', kind: 'bed', x: 181, y: 609, w: 148, h: 78, heavy: 2.6, frictionAir: 0.06, restitution: 0.2, color: '#FF8575' },
  { id: 'fridge', material: 'metal', name: 'Fridge', kind: 'fridge', x: 496, y: 616, w: 62, h: 92, heavy: 3.4, frictionAir: 0.02, restitution: 0.08, color: '#AED5E4' },
  { id: 'bookcase', material: 'wood', name: 'Bookcase', kind: 'bookcase', x: 413, y: 626, w: 56, h: 112, heavy: 1.8, frictionAir: 0.07, restitution: 0.15, color: '#C79873' },
  { id: 'table', material: 'wood', name: 'Table', kind: 'table', x: 265, y: 764, w: 100, h: 72, heavy: 1.3, frictionAir: 0.035, restitution: 0.3, color: '#D7AC80' },
  { id: 'chair', material: 'wood', name: 'Chair', kind: 'chair', x: 452, y: 800, w: 58, h: 60, heavy: 0.5, frictionAir: 0.025, restitution: 0.5, color: '#A995CA' },
  { id: 'boxA', material: 'cardboard', name: 'Box no. 1', kind: 'boxA', x: 629, y: 596, w: 52, h: 52, heavy: 0.9, frictionAir: 0.07, restitution: 0.15, color: '#FFD76B' },
  { id: 'boxB', material: 'cardboard', name: 'Box no. 2', kind: 'boxB', x: 513, y: 796, w: 52, h: 52, heavy: 0.9, frictionAir: 0.07, restitution: 0.15, color: '#E6B77C' },
  { id: 'lamp', material: 'metal', name: 'Floor lamp', kind: 'lamp', x: 555, y: 680, w: 44, h: 48, heavy: 0.4, frictionAir: 0.02, restitution: 0.65, color: '#F6D37E' },
  { id: 'plant', material: 'ceramic', name: 'Plant', kind: 'plant', x: 626, y: 652, w: 46, h: 48, heavy: 0.8, frictionAir: 0.05, restitution: 0.3, color: '#91B989' },
  // v7 materials are authored from existing upholstered/wood/appliance
  // analogues. PNG alpha bounds do not set mass, inertia or collision shapes.
  { id: 'armchair', material: 'fabric', name: 'Armchair', kind: 'armchair', x: 461, y: 726, w: 76, h: 76, heavy: 1.6, frictionAir: 0.05, restitution: 0.35, color: '#E5A08E' },
  { id: 'wardrobe', material: 'wood', name: 'Wardrobe', kind: 'wardrobe', x: 162, y: 709, w: 94, h: 110, heavy: 2.8, frictionAir: 0.065, restitution: 0.12, color: '#D8CFB7' },
  { id: 'dresser', material: 'wood', name: 'Dresser', kind: 'dresser', x: 369, y: 762, w: 96, h: 68, heavy: 2.2, frictionAir: 0.06, restitution: 0.15, color: '#C79873' },
  { id: 'tv_stand', material: 'wood', name: 'TV stand', kind: 'tv_stand', x: 157, y: 799, w: 84, h: 58, heavy: 1.5, frictionAir: 0.04, restitution: 0.2, color: '#C79873' },
  { id: 'desk', material: 'wood', name: 'Desk', kind: 'desk', x: 316, y: 606, w: 110, h: 72, heavy: 1.7, frictionAir: 0.04, restitution: 0.25, color: '#D7AC80' },
  { id: 'washing_machine', material: 'metal', name: 'Washing machine', kind: 'washing_machine', x: 565, y: 610, w: 64, h: 80, heavy: 3.8, frictionAir: 0.025, restitution: 0.08, color: '#D8D5C4' },
]);
const FURNITURE_SCALE=.85;
const PORTRAIT_LAYOUT=Object.freeze({
  // Three compact rows fit both the actual bodies and the complete alpha16
  // artwork inside the smaller room without changing furniture scale.
  wardrobe:[102.71328125000001,553.0774134790529],
  bed:[217.08098958333335,553.0774134790529],
  fridge:[309.33098958333335,553.0774134790529],
  bookcase:[372.6809895833333,553.0774134790529],
  chair:[434.3309895833333,553.1065535139163],
  sofa:[115.72738883495427,631.9596539162113],
  boxA:[195.4255673413295,637.1964285714287],
  boxB:[246.25621577091408,638.1757092198582],
  plant:[293.72404633818735,638.45],
  dresser:[357.87484228608895,637.4433287482807],
  washing_machine:[431.4427349009919,638.4851724137932],
  desk:[112.78163309784796,709.3725865209472],
  table:[213.90869069220412,709.3725865209472],
  lamp:[279.74204413008107,709.3976185311905],
  armchair:[336.4319175478026,709.3725865209472],
  tv_stand:[415.4171192483524,709.3725865209472],
});
export const FURNITURE=Object.freeze(REFERENCE_FURNITURE.map(spec=>Object.freeze({
  ...spec,x:PORTRAIT_LAYOUT[spec.id][0],y:PORTRAIT_LAYOUT[spec.id][1],
  w:(spec.id==='bookcase'?80:spec.w)*FURNITURE_SCALE,
  h:(spec.id==='bookcase'?78:spec.h)*FURNITURE_SCALE,
})));
export const TOTAL_FURNITURE = FURNITURE.length;

// v25 separates launch weight from inertia and material glide. Values for the
// original ten analogues were checked against Pull & Move on2026-11-03.
// Added furniture keeps its existing material analogues. v30 raises each
// material's single sliding drag and passive rebound by the requested20%.
// A low-drag appliance still carries momentum farther than a rough light box.
export const MOTION_TUNING = Object.freeze({ slidingDragScale:1.2, reboundScale:1.2,
  lampDamageScale:2, previousWallRestitution:.7 });
const WALL_RESTITUTION=MOTION_TUNING.previousWallRestitution*MOTION_TUNING.reboundScale;
// A stronger passive bounce returns more energy and leaves less for cracks.
// Compensate only the requested lamp so matched surviving normal impacts do
// twice v29's actual HP damage, while spending only their real kinetic loss.
const LAMP_DAMAGE_EFFICIENCY=MOTION_TUNING.lampDamageScale
  *(1-MOTION_TUNING.previousWallRestitution**2)/(1-WALL_RESTITUTION**2);
export const FLOOR_DAMPING = Object.freeze({ fabric:0,cardboard:0,wood:0,metal:0,ceramic:0 });
export const GLIDE_PROFILES = Object.freeze(Object.fromEntries(
  FURNITURE.map(spec=>[spec.id,Object.freeze({floorDamping:0,frictionAir:spec.frictionAir*MOTION_TUNING.slidingDragScale})]),
));
export const BOUNCE_PROFILES = Object.freeze(Object.fromEntries(
  FURNITURE.map(spec=>[spec.id,spec.restitution*MOTION_TUNING.reboundScale]),
));
export const WALL_BOUNCE_PROFILES = Object.freeze(Object.fromEntries(
  FURNITURE.map(spec=>[spec.id,WALL_RESTITUTION]),
));
export function contactRestitution(a,b) {
  if(a.game?.kind && b.isStatic) return WALL_BOUNCE_PROFILES[a.game.kind];
  if(b.game?.kind && a.isStatic) return WALL_BOUNCE_PROFILES[b.game.kind];
  // The reference uses Matter's maximum material mixing. The contact solver
  // below remains passive and respects the actual normal, masses and inertia.
  return Math.max(0,Math.min(1,Math.max(a.restitution||0,b.restitution||0)));
}
// Normal kinetic energy determines the actual work available. The lamp's
// explicit damage efficiency is independent from its rebound coefficient.
export const WALL_BREAK_PROFILES = Object.freeze(Object.fromEntries(
  FURNITURE.map(spec=>[spec.id,Object.freeze({resistanceScale:1,
    damageEfficiency:spec.id==='lamp'?LAMP_DAMAGE_EFFICIENCY:1})]),
));
const REFERENCE_SCALE = WORLD.width / 540;
export const REFERENCE_LAUNCH = Object.freeze({
  pullGain: .13, weightExponent: .45,
  launchCap: 24 * REFERENCE_SCALE,
  speedCap: 26 * REFERENCE_SCALE,
  minimumLaunch: 1.5 * REFERENCE_SCALE,
  maxPull: 24 / .13 * REFERENCE_SCALE,
});
const MASS_MULTIPLIER = 3;
export const PHYSICS = Object.freeze({
  stepMs: 1000 / 240,
  floorBaseMs: 1000 / 60,
  massMultiplier: MASS_MULTIPLIER,
  speedCap: REFERENCE_LAUNCH.speedCap,
  minimumLaunch: REFERENCE_LAUNCH.minimumLaunch,
  maxPull: 180,
  angularCap: .12,
  launchTorqueScale: .35,
  spinDamping: .02,
  wallSegmentLength: 76,
  // Strong real energy may open an intact panel; medium contacts crack and rebound.
  wallHealth: 4.5,
  weakWallHealth: 1.5,
  // Local plaster calibration in Matter mass * base-frame velocity squared.
  // These resistance values are authored here, not copied from the reference.
  // Retain v24 physical fracture work. v25 restores a direct normal-speed
  // onset so useful contacts visibly crack without pressure farming.
  wallEnergyPerHealth: 84,
  wallElasticEnergy: 72,
  wallEnergyTransfer: .65,
  // Preserve v29 global plaster resistance; only the lamp gains efficiency.
  wallDamageScale: 1/3,
  wallRestitution: WALL_RESTITUTION,
  wallIntactEnergyPerHealth: 240,
  wallIntactMinEnergy: 900,
  wallFriction: .02,
  contactReboundMinSpeed: .8,
  wallMinClosingSpeed: 3.2 * REFERENCE_SCALE,
  wallMinImpactEnergy: 90,
  wallMinNormalFraction: .35,
  wallMinExitSpeed: 2.5,
  wallRearmDistance: 12,
  wallHitCooldownMs: 90,
  // A bulky piece that has paid real fracture work keeps its remaining
  // momentum while its trailing edge clears that opening. This is passive
  // drag relief, never another impulse or a change to its ordinary material.
  breakthroughMinMass: 25,
  breakthroughDragScale: .25,
  breakthroughMaxMs: 700,
  breakthroughClearance: 2,
  deliveryContactEpsilon: .2,
});
const STEP = PHYSICS.stepMs;
const MAX_SPEED = PHYSICS.speedCap;
const MAX_PULL = PHYSICS.maxPull;

export class MovingWorld {
  constructor({ onDeliver, onBreak, onImpact, onWallHit } = {}) {
    const M = globalThis.Matter;
    if (!M) throw new Error('The local physics engine could not be loaded. Reload to try again.');
    this.M = M;
    this.onDeliver = onDeliver;
    this.onBreak = onBreak;
    this.onImpact = onImpact;
    this.onWallHit = onWallHit;
    this.pointer = { x: 0, y: 0 };
    this.reset();
  }

  reset() {
    const { Engine, Events, Bodies, Composite } = this.M;
    if (this.engine) {
      Events.off(this.engine);
      Composite.clear(this.engine.world, false);
      Engine.clear(this.engine);
    }
    this.engine = Engine.create({ enableSleeping: false, positionIterations: 10, velocityIterations: 8, constraintIterations: 6 });
    this.engine.gravity.x = 0;
    this.engine.gravity.y = 0;
    this.engine.gravity.scale = 0;
    this.elapsedMs = 0;
    this.brokenCount = 0;
    this.grabbed = null;
    this.aimOrigin = null;
    this.anchor = null;
    this._moved = 0;
    this._queuedBreaks = [];
    this._lastImpact = new Map();
    this._wallStrikes = new Map();
    this._breakthrough = new Map();
    this.walls = [];
    this.bodies = FURNITURE.map((spec) => {
      const reference=REFERENCE_FURNITURE.find(item=>item.id===spec.id);
      const referenceBody=Bodies.rectangle(0,0,reference.w,reference.h,{
        chamfer:{radius:5},density:.001*reference.heavy*PHYSICS.massMultiplier,
      });
      const body = Bodies.rectangle(spec.x, spec.y, spec.w, spec.h, {
        label: spec.id,
        chamfer: { radius: 5*FURNITURE_SCALE },
        density: .001 * spec.heavy * PHYSICS.massMultiplier,
        friction: .15,
        frictionStatic: .18,
        frictionAir: GLIDE_PROFILES[spec.id].frictionAir ?? spec.frictionAir,
        restitution: BOUNCE_PROFILES[spec.id],
        slop: .015,
      });
      // Keep each v17 collision mass. Inertia is recomputed for the actual
      // uniformly smaller outline (and the corrected bookcase footprint).
      this.M.Body.setMass(body,referenceBody.mass);
      body.game = { ...spec, frictionAir: body.frictionAir, restitution: body.restitution, mass: body.mass, massMultiplier: PHYSICS.massMultiplier,
        minimumLaunchSpeed: PHYSICS.minimumLaunch,
        maxLaunchSpeed: Math.min(PHYSICS.speedCap, REFERENCE_LAUNCH.launchCap / spec.heavy ** REFERENCE_LAUNCH.weightExponent),
        maxLaunchEnergy: .5 * body.mass * Math.min(PHYSICS.speedCap, REFERENCE_LAUNCH.launchCap / spec.heavy ** REFERENCE_LAUNCH.weightExponent) ** 2,
        floorDamping: GLIDE_PROFILES[spec.id].floorDamping ?? FLOOR_DAMPING[spec.material], delivered: false, settled: 0,
        deliveryState: 'outside', deliveryProtrusion: 0, impact: 0 };
      return body;
    });

    const wall = (group, x, y, w, h, weak = false, hidden = false) => {
      const horizontal = w >= h;
      const count = hidden ? 1 : Math.ceil(Math.max(w, h) / PHYSICS.wallSegmentLength);
      for (let index = 0; index < count; index++) {
        const width = horizontal ? w / count : w;
        const height = horizontal ? h : h / count;
        const cx = horizontal ? x - w / 2 + width * (index + .5) : x;
        const cy = horizontal ? y : y - h / 2 + height * (index + .5);
        const id = hidden ? group : `${group}:${index}`;
        const health = hidden ? Infinity : weak ? PHYSICS.weakWallHealth : PHYSICS.wallHealth;
        const body = Bodies.rectangle(cx, cy, width, height, {
          isStatic: true, friction: PHYSICS.wallFriction, restitution: PHYSICS.wallRestitution, label: id, slop: .01,
        });
        // Matter's static-body factory resets these requested options to0/1.
        // Restore the authored rigid-wall surface explicitly after construction.
        body.restitution = PHYSICS.wallRestitution;
        body.friction = PHYSICS.wallFriction;
        body.game = { id, group, x: cx, y: cy, w: width, h: height,
          weak, hidden, destructible: !hidden, health, maxHealth: health,
          cracked: false, broken: false, impact: 0, damageProgress: 0,
          lastHitEnergy: 0, lastHitDamage: 0 };
        this.walls.push(body);
      }
    };
    // The only indestructible walls are invisible perimeter guard rails.
    wall('world-left',8,408,16,816,false,true);
    wall('world-right',512,408,16,816,false,true);
    wall('world-top',260,8,520,16,false,true);
    wall('world-bottom',260,808,520,16,false,true);
    wall('old-top',260,756,444,18);
    // Each room has its own frame. Its side walls extend9units into the
    // horizontal end caps; the road between the two rooms has no side wall.
    wall('old-left',47,624,18,282);
    wall('old-right',473,624,18,282);
    // A single wall depth borders each room entrance, with aligned140-unit
    // doors. Each weak run has two independent panels. No wall crosses the
    // middle of the road, and no third layer remains between these frames.
    wall('old-bottom-left',64,492,52,18);
    wall('old-weak',140,492,100,18,true);
    wall('old-bottom-right',406,492,152,18);
    wall('new-top-left',64,298,52,18);
    wall('new-weak',140,298,100,18,true);
    wall('new-top-right',406,298,152,18);
    wall('new-left',47,166,18,282);
    wall('new-right',473,166,18,282);
    wall('new-bottom',260,34,444,18);
    Composite.add(this.engine.world, [...this.walls, ...this.bodies]);
    Events.on(this.engine, 'collisionStart', (event) => this._collisions(event));
  }

  get moved() { return this._moved; }
  get dragged() { return this.grabbed; }

  // Renderer contract: pull is a bounded delta; vector is the opposite unit
  // direction. A zero-power aim has a zero vector and never launches.
  get aim() {
    if (!this.grabbed || !this.aimOrigin) return null;
    const dx = this.pointer.x - this.aimOrigin.x;
    const dy = this.pointer.y - this.aimOrigin.y;
    const distance = Math.hypot(dx, dy);
    const bounded = Math.min(MAX_PULL, distance);
    const speed = this.grabbed.game.maxLaunchSpeed * bounded / MAX_PULL;
    const power = speed < PHYSICS.minimumLaunch ? 0 : bounded / MAX_PULL;
    const scale = distance ? bounded / distance : 0;
    return {
      origin: { ...this.aimOrigin }, center: { ...this.grabbed.position },
      pull: { x: dx * scale, y: dy * scale },
      vector: power ? { x: -dx / distance || 0, y: -dy / distance || 0 } : { x: 0, y: 0 },
      power, maxPull: MAX_PULL,
    };
  }

  grab(x, y, { minTargetSize = 0, hitSlop = 12 } = {}) {
    const { Query, Vector, Body } = this.M;
    this.release();
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    this.pointer = { x, y };
    const exact = Query.point(this.bodies, this.pointer);
    // Screen-space touch targets are converted by the caller to world units.
    // Ordinary calls retain their historical 12-unit pick tolerance. These
    // virtual targets never resize a collider or extend the launch anchor.
    const minimum = Number.isFinite(minTargetSize) ? Math.max(0, minTargetSize) : 0;
    const slop = Number.isFinite(hitSlop) ? Math.max(0, hitSlop) : 12;
    const candidates = exact.length ? exact : this.bodies.filter((body) => {
      const p = Vector.rotate(Vector.sub(this.pointer, body.position), -body.angle);
      return Math.abs(p.x) <= Math.max(body.game.w / 2 + slop, minimum / 2)
        && Math.abs(p.y) <= Math.max(body.game.h / 2 + slop, minimum / 2);
    });
    if (!candidates.length) return null;
    const outlineDistance = body => {
      let nearest = Infinity;
      for (let i = 0; i < body.vertices.length; i++) {
        const a = body.vertices[i], b = body.vertices[(i + 1) % body.vertices.length];
        const dx = b.x - a.x, dy = b.y - a.y;
        const length = dx * dx + dy * dy;
        const t = length ? Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / length)) : 0;
        nearest = Math.min(nearest, (x - a.x - t * dx) ** 2 + (y - a.y - t * dy) ** 2);
      }
      return nearest;
    };
    // A real body hit always wins over a neighbor's expanded target. In gaps,
    // choose the closest physical outline, then center, then stable body order.
    const body = candidates.map((item, index) => ({ body: item, index,
      outline: exact.length ? 0 : outlineDistance(item),
      center: Vector.magnitudeSquared(Vector.sub(this.pointer, item.position)),
    })).sort((a, b) => {
      const edge = a.outline - b.outline, center = a.center - b.center;
      return Math.abs(edge) > 1e-9 ? edge : Math.abs(center) > 1e-9 ? center : a.index - b.index;
    })[0].body;
    this._breakthrough.delete(body);
    const local = Vector.rotate(Vector.sub(this.pointer, body.position), -body.angle);
    // Keep the grab anchor inside the physical body even for an expanded hit.
    local.x = Math.max(-body.game.w / 2 + 3, Math.min(body.game.w / 2 - 3, local.x));
    local.y = Math.max(-body.game.h / 2 + 3, Math.min(body.game.h / 2 - 3, local.y));
    this.anchor = local;
    this.aimOrigin = { x, y };
    this.grabbed = body;
    // Aiming holds only the selected body. No pointer movement modifies its
    // position, so a long pull can never drag it through a collision wall.
    Body.setStatic(body, true);
    this._clearBodyImpulses(body);
    Body.setVelocity(body, { x: 0, y: 0 });
    Body.setAngularVelocity(body, 0);
    body.game.settled = 0;
    body.game.deliveryState = body.game.delivered ? 'moved' : 'aiming';
    return body;
  }

  movePointer(x, y) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    // Captured pointers can move outside the board: edge furniture must be
    // aimable in every direction. The pull and launch speed remain bounded.
    this.pointer = { x, y };
  }

  launch() {
    const body = this.grabbed;
    const aim = this.aim;
    if (!body || !aim) return false;
    const anchor = this.anchor;
    this.release();
    if (!aim.power) return false;
    const energy = body.game.maxLaunchEnergy * aim.power * aim.power;
    // A single impulse at the actual grip shares spring energy between linear
    // and angular motion. Off-centre grabs cannot add free rotational energy.
    const arm = this.M.Vector.rotate(anchor, body.angle);
    // A controlled grip torque preserves angle play without spending most of a
    // small prop's launch on spin. Unlike the reference's random release spin,
    // the same grip and pull are deterministic. This is an authored adaptation.
    const lever = this.M.Vector.cross(arm, aim.vector) * PHYSICS.launchTorqueScale;
    const inverseEffectiveMass = body.inverseMass + lever * lever * body.inverseInertia;
    const impulse = Math.sqrt(2 * energy / inverseEffectiveMass);
    const speed = impulse * body.inverseMass;
    this.M.Body.setVelocity(body, { x: aim.vector.x * speed, y: aim.vector.y * speed });
    const spin = lever * impulse * body.inverseInertia;
    this.M.Body.setAngularVelocity(body, Math.max(-PHYSICS.angularCap, Math.min(PHYSICS.angularCap, spin)));
    return true;
  }

  // Cancellation deliberately differs from launch. Pause, lost capture,
  // pointercancel, reset and disposal all call this safe path.
  release() {
    if (this.grabbed) {
      this.M.Body.setStatic(this.grabbed, false);
      this._clearBodyImpulses(this.grabbed);
      this.M.Body.setVelocity(this.grabbed, { x: 0, y: 0 });
      this.M.Body.setAngularVelocity(this.grabbed, 0);
    }
    this.grabbed = null;
    this.aimOrigin = null;
    this.anchor = null;
  }

  _clearBodyImpulses(body) {
    // Matter warms cached position impulses even after a body becomes static.
    // A held selection must stay at the exact grab position, including when
    // grabbed during a rebound; stale impulses must not kick nearby furniture.
    body.positionImpulse.x=0;body.positionImpulse.y=0;
    if(body.constraintImpulse){body.constraintImpulse.x=0;body.constraintImpulse.y=0;body.constraintImpulse.angle=0;}
    for(const pair of this.engine.pairs.list){
      if(pair.bodyA!==body&&pair.bodyB!==body)continue;
      for(const cached of pair.contacts){cached.normalImpulse=0;cached.tangentImpulse=0;}
    }
  }

  step(dtMs = STEP) {
    if (!this.engine || !Number.isFinite(dtMs) || dtMs <= 0) return;
    // Four small updates per60Hz frame protect thin walls during the distinct
    // high-speed light launches. Large external calls remain
    // bounded; the application's accumulator supplies every active-time step.
    let remaining = Math.min(dtMs, 1000 / 60);
    while (remaining > .000001) {
      const dt = Math.min(remaining, STEP);
      this._step(dt);
      remaining -= dt;
    }
  }

  _step(dt) {
    const { Engine, Body, Vector, Composite } = this.M;
    this.elapsedMs += dt;
    this._rearmWallStrikes();
    const airOverrides=[];
    // Matter reads frictionAir inside its integrator. Restore the authored
    // value immediately afterwards, including when a callback throws: UI,
    // route planning and subsequent launches always see the real profile.
    for(const body of this.bodies)if(this._breakthroughActive(body)){
      airOverrides.push([body,body.frictionAir]);
      body.frictionAir*=PHYSICS.breakthroughDragScale;
    }
    try { Engine.update(this.engine, dt); }
    finally { for(const [body,air]of airOverrides)body.frictionAir=air; }
    for (const body of this.bodies) {
      const speed = Vector.magnitude(body.velocity);
      if (speed > MAX_SPEED) Body.setVelocity(body, Vector.mult(body.velocity, MAX_SPEED / speed));
      if (Math.abs(body.angularVelocity) > PHYSICS.angularCap) Body.setAngularVelocity(body, Math.sign(body.angularVelocity) * PHYSICS.angularCap);
      if (!body.isStatic) {
        const rotationRetention = Math.exp(-body.game.floorDamping * dt / PHYSICS.floorBaseMs);
        const dragScale=this._breakthroughActive(body)?PHYSICS.breakthroughDragScale:1;
        Body.setVelocity(body, Vector.mult(body.velocity,
          Math.exp(-body.game.floorDamping * dragScale * dt / PHYSICS.floorBaseMs)));
        Body.setAngularVelocity(body, body.angularVelocity * rotationRetention
          * Math.exp(-PHYSICS.spinDamping*dt/PHYSICS.floorBaseMs));
      }
      body.game.impact = Math.max(0, body.game.impact - dt / 220);
    }
    for (const wall of this.walls) wall.game.impact = Math.max(0, wall.game.impact - dt / 300);
    for (const body of this._queuedBreaks) Composite.remove(this.engine.world, body);
    this._queuedBreaks.length = 0;

    const area = WORLD.delivery;
    for (const body of this.bodies) {
      if (body.game.delivered) { body.game.deliveryState = 'moved'; continue; }
      // Matter's broad-phase bounds include a velocity sweep. Judge the real
      // rotated furniture outline against the exact visible room interior.
      let protrusion = 0;
      for (const vertex of body.vertices) {
        protrusion = Math.max(protrusion, area.minX - vertex.x, vertex.x - area.maxX,
          area.minY - vertex.y, vertex.y - area.maxY);
      }
      const inside = protrusion <= PHYSICS.deliveryContactEpsilon;
      const aiming = body === this.grabbed;
      const calm = !aiming && Vector.magnitude(body.velocity) < .75 && Math.abs(body.angularVelocity) < .035;
      body.game.deliveryProtrusion = protrusion;
      body.game.deliveryState = aiming ? 'aiming' : inside ? 'settling' : 'outside';
      body.game.settled = inside && calm ? body.game.settled + dt : 0;
      if (body.game.settled + .0001 >= 500) {
        body.game.delivered = true;
        body.game.deliveryState = 'moved';
        body.game.settled = 500;
        this._moved += 1;
        this.onDeliver?.(body);
      }
    }
  }

  _breakthroughActive(body) {
    const state=this._breakthrough.get(body);
    if(!state)return false;
    const {Body,Vector}=this.M;
    const trailing=Math.max(...body.vertices.map(vertex=>Vector.dot(vertex,state.normal)));
    if(body.isStatic||this.elapsedMs>=state.until
      ||Vector.dot(Body.getVelocity(body),state.normal)>=0
      ||trailing<=state.plane-PHYSICS.breakthroughClearance){
      this._breakthrough.delete(body);return false;
    }
    return true;
  }

  _startBreakthrough(body,wall,normal) {
    if(body.mass<PHYSICS.breakthroughMinMass)return;
    const existing=this._breakthrough.get(body);
    // Adjacent panels from the same solver event share one deadline. Later
    // independent paid fractures can open another passage, but never stack
    // multipliers or credit the same destroyed panel again.
    const sameStrike=existing&&existing.at===this.elapsedMs;
    this._breakthrough.set(body,{at:this.elapsedMs,
      until:sameStrike?existing.until:this.elapsedMs+PHYSICS.breakthroughMaxMs,
      normal:{...normal},
      plane:Math.min(...wall.vertices.map(vertex=>this.M.Vector.dot(vertex,normal))),
      wallId:wall.game.id});
  }

  _rearmWallStrikes() {
    // A new event or timer alone is not a new blow: the real furniture must
    // retreat clear of the panel. Use physical vertices, not swept bounds.
    for (const [key, strike] of this._wallStrikes) {
      const {body,wall} = strike;
      if (wall.game.broken) { this._wallStrikes.delete(key); continue; }
      if (strike.armed) continue;
      let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
      for (const vertex of body.vertices) {
        minX=Math.min(minX,vertex.x);maxX=Math.max(maxX,vertex.x);
        minY=Math.min(minY,vertex.y);maxY=Math.max(maxY,vertex.y);
      }
      const gap=Math.max(wall.bounds.min.x-maxX,minX-wall.bounds.max.x,
        wall.bounds.min.y-maxY,minY-wall.bounds.max.y);
      if (gap >= PHYSICS.wallRearmDistance) strike.retreated=true;
      if (strike.retreated && this.elapsedMs-strike.at>=PHYSICS.wallHitCooldownMs) strike.armed=true;
    }
  }

  _contactInfo(body, other, pair) {
    const {Body,Vector}=this.M;
    const normal=pair.bodyA===body ? {...pair.collision.normal} : Vector.neg(pair.collision.normal);
    const supports=pair.collision.supports;
    const count=pair.collision.supportCount || 0;
    const point={x:0,y:0};
    for(let i=0;i<count;i++){point.x+=supports[i].x/count;point.y+=supports[i].y/count;}
    if(!count){point.x=(body.position.x+other.position.x)/2;point.y=(body.position.y+other.position.y)/2;}
    if(other.isStatic){
      point.x=Math.max(other.bounds.min.x,Math.min(other.bounds.max.x,point.x));
      point.y=Math.max(other.bounds.min.y,Math.min(other.bounds.max.y,point.y));
    }
    const arm=Vector.sub(point,body.position),otherArm=Vector.sub(point,other.position);
    const velocity=Body.getVelocity(body),otherVelocity=Body.getVelocity(other);
    const angularVelocity=Body.getAngularVelocity(body),otherAngularVelocity=Body.getAngularVelocity(other);
    const relativeVelocity=Vector.sub(velocity,otherVelocity);
    const relativeContactVelocity={
      x:relativeVelocity.x-angularVelocity*arm.y+otherAngularVelocity*otherArm.y,
      y:relativeVelocity.y+angularVelocity*arm.x-otherAngularVelocity*otherArm.x,
    };
    const speed=-Vector.dot(relativeContactVelocity,normal);
    const lever=Vector.cross(arm,normal),otherLever=Vector.cross(otherArm,normal);
    const effectiveMass=1/(body.inverseMass+other.inverseMass
      +lever*lever*body.inverseInertia+otherLever*otherLever*other.inverseInertia);
    return {point,normal,arm,otherArm,velocity,otherVelocity,relativeVelocity,relativeContactVelocity,
      angularVelocity,otherAngularVelocity,speed,lever,otherLever,effectiveMass,
      energy:.5*effectiveMass*Math.max(0,speed)**2};
  }

  _wallContact(body, wall, pair) {
    if (body.isStatic || wall.game.broken) return null;
    return this._contactInfo(body,wall,pair);
  }

  _reboundContact(body,other,pair,contact,restitution) {
    if(contact.speed<PHYSICS.contactReboundMinSpeed)return 0;
    this._breakthrough.delete(body);this._breakthrough.delete(other);
    const {Body,Vector}=this.M;
    // One conservative normal impulse at the actual support-manifold centre.
    // Matter's per-corner flat-face solve otherwise collapses low restitution
    // to a shared sticking velocity. This is an authored response correction,
    // not a copied original-game algorithm or a velocity/energy multiplier.
    const impulse=(1+restitution)*contact.speed*contact.effectiveMass;
    const push=Vector.mult(contact.normal,impulse);
    if(!body.isStatic){
      Body.setVelocity(body,Vector.add(contact.velocity,Vector.mult(push,body.inverseMass)));
      Body.setAngularVelocity(body,contact.angularVelocity+contact.lever*impulse*body.inverseInertia);
    }
    if(!other.isStatic){
      Body.setVelocity(other,Vector.sub(contact.otherVelocity,Vector.mult(push,other.inverseMass)));
      Body.setAngularVelocity(other,contact.otherAngularVelocity-contact.otherLever*impulse*other.inverseInertia);
    }
    // The now-separating contact must not receive an old warm-start impulse.
    // Leave position constraints and Matter's tangential friction active.
    for(const cached of pair.contacts){cached.normalImpulse=0;cached.tangentImpulse=0;}
    return impulse;
  }

  _wallHit(body, wall, pair, energyLimit=Infinity) {
    const {Body,Vector}=this.M;
    const contact=this._wallContact(body,wall,pair);
    if(!contact||contact.speed<=.1)return null;
    const {point,normal,arm,velocity,angularVelocity,speed,lever,effectiveMass,energy}=contact;
    pair.restitution=contactRestitution(body,wall);
    const key=`${body.id}:${wall.id}`;
    let strike=this._wallStrikes.get(key);
    if(!strike){strike={body,wall,armed:true,retreated:false,at:-Infinity};this._wallStrikes.set(key,strike);}
    if(!strike.armed || this.elapsedMs-strike.at<PHYSICS.wallHitCooldownMs){
      this._reboundContact(body,wall,pair,contact,pair.restitution);
      return null;
    }
    strike.armed=false;strike.retreated=false;strike.at=this.elapsedMs;
    if(speed<.8)return null;
    const coupledEnergy=Math.min(energy,energyLimit);
    const reserve=.5*effectiveMass*PHYSICS.wallMinExitSpeed**2;
    const before=wall.game.health;
    const wasCracked=wall.game.cracked;
    const {resistanceScale,damageEfficiency}=WALL_BREAK_PROFILES[body.game.kind];
    const damageScale=PHYSICS.wallDamageScale*damageEfficiency;
    const workPerHealth=PHYSICS.wallEnergyPerHealth*resistanceScale/(PHYSICS.wallEnergyTransfer*damageScale);
    // The onset threshold has a per-kind characteristic-speed response, while
    // the absolute normal-speed and angle guards reject slow taps and skims.
    const minimumImpactEnergy=PHYSICS.wallMinImpactEnergy*resistanceScale**2/damageScale;
    const normalFraction=speed/(Vector.magnitude(contact.relativeContactVelocity)||1);
    const meaningful=speed>=PHYSICS.wallMinClosingSpeed && coupledEnergy>=minimumImpactEnergy
      && normalFraction>=PHYSICS.wallMinNormalFraction;
    const availableWork=meaningful ? Math.max(0,coupledEnergy-PHYSICS.wallElasticEnergy-reserve) : 0;
    const remainingWork=before*workPerHealth;
    const intactEnergy=Math.max(wall.game.maxHealth*PHYSICS.wallIntactEnergyPerHealth*resistanceScale,
      PHYSICS.wallIntactMinEnergy*wall.game.maxHealth/PHYSICS.wallHealth)/damageScale;
    const canFracture=meaningful && (wasCracked||coupledEnergy>=intactEnergy) && availableWork>=remainingWork;
    // A surviving panel can only receive crack work actually dissipated by the
    // passive rebound. Strong hits instead pay the whole remaining fracture
    // cost and pass through. Never credit the same energy to cracks and bounce.
    const dissipatedNormalEnergy=(1-pair.restitution*pair.restitution)*coupledEnergy;
    // Only actual lost normal energy is available for a surviving crack.
    // A different furniture material cannot mint extra plaster work.
    const plasterWorkBudget=(1-PHYSICS.wallRestitution**2)*coupledEnergy;
    // Strong enough real normal energy can nucleate a local opening on the
    // first impact. Medium contacts spend only passive rebound loss on cracks.
    const damageWork=canFracture ? remainingWork : Math.min(remainingWork,availableWork,dissipatedNormalEnergy,plasterWorkBudget);
    const damage=Math.min(before,damageWork/workPerHealth);
    wall.game.health=Math.max(0,before-damage);
    wall.game.lastHitEnergy=energy;wall.game.lastHitDamage=damage;
    wall.game.damageProgress=1-wall.game.health/wall.game.maxHealth;
    if(damage>0)wall.game.cracked=true;
    const intensity=Math.min(1,Math.sqrt(energy/(wall.game.maxHealth*PHYSICS.wallEnergyPerHealth)));
    wall.game.impact=intensity;
    const info={point,normal,velocity:{...velocity},angularVelocity,contactArm:arm,
      intensity,speed,energy,coupledEnergy,effectiveMass,damage,damageWork,remainingHealth:wall.game.health,
      resistanceScale,damageScale,damageEfficiency,workPerHealth,minimumImpactEnergy,intactEnergy,normalFraction,meaningful,
      firstCrack:!wasCracked&&damage>0,
      bodyId:body.game.id,material:body.game.material,heavy:body.game.heavy,kind:body.game.kind,
      broken:wall.game.health<=.000001,fractureWork:0,exitSpeed:0,restitution:pair.restitution};
    if(info.broken){
      wall.game.health=0;wall.game.damageProgress=1;wall.game.broken=true;info.remainingHealth=0;
      // Pay the remaining fracture work with an impulse at the actual contact.
      // The reserve above guarantees a small forward exit without adding energy.
      const fractureWork=PHYSICS.wallElasticEnergy+before*workPerHealth;
      const exitSpeed=Math.sqrt(Math.max(0,speed*speed-2*fractureWork/effectiveMass));
      const impulse=effectiveMass*(speed-exitSpeed);
      Body.setVelocity(body,Vector.add(velocity,Vector.mult(normal,impulse*body.inverseMass)));
      Body.setAngularVelocity(body,angularVelocity+lever*impulse*body.inverseInertia);
      info.fractureWork=fractureWork;info.exitSpeed=exitSpeed;
      this._startBreakthrough(body,wall,normal);
      this.brokenCount++;this._queuedBreaks.push(wall);
    }else{
      info.normalImpulse=this._reboundContact(body,wall,pair,contact,pair.restitution);
    }
    this.onWallHit?.(wall,info);
    if(info.broken)this.onBreak?.(wall,info);
    return info;
  }

  _collisions({ pairs }) {
    const {Vector,Body}=this.M;
    // Share one real kinetic-energy budget across simultaneous panel contacts;
    // a wide sofa cannot spend its full impact energy again on every segment.
    const contacts=new Map(),budgets=new Map();
    for(const pair of pairs){
      const a=pair.bodyA,b=pair.bodyB,body=a.game?.kind?a:b.game?.kind?b:null;
      if(!body)continue;
      const wall=body===a?b:a;
      if(!wall.game?.destructible)continue;
      const strike=this._wallStrikes.get(`${body.id}:${wall.id}`);
      if(strike&&(!strike.armed||this.elapsedMs-strike.at<PHYSICS.wallHitCooldownMs))continue;
      const contact=this._wallContact(body,wall,pair);
      if(!contact||contact.speed<=.1)continue;
      contacts.set(pair,contact);
      const budget=budgets.get(body)||{sum:0,total:.5*body.mass*Vector.magnitudeSquared(Body.getVelocity(body))
        +.5*body.inertia*Body.getAngularVelocity(body)**2};
      budget.sum+=contact.energy;budgets.set(body,budget);
    }
    for(const pair of pairs){
      const a=pair.bodyA,b=pair.bodyB;
      const moving=a.game?.kind?a:b.game?.kind?b:null;
      if(!moving)continue;
      const other=moving===a?b:a;
      // A held selection is a control state, not a new collision cue or kick.
      if(moving.isStatic||(other.game?.kind&&other.isStatic))continue;
      if(other.game?.destructible){
        const contact=contacts.get(pair),budget=budgets.get(moving);
        const limit=contact&&budget&&budget.sum>0?budget.total*contact.energy/budget.sum:0;
        const info=this._wallHit(moving,other,pair,limit);
        if(info&&info.speed>1){moving.game.impact=info.intensity;this.onImpact?.(moving,info.speed,other,info);}
        continue;
      }
      const contact=this._contactInfo(moving,other,pair);
      const speed=Math.max(0,contact.speed);
      const restitution=contactRestitution(moving,other);
      pair.restitution=restitution;
      const normalImpulse=this._reboundContact(moving,other,pair,contact,restitution);
      if(speed<=1)continue;
      moving.game.impact=Math.min(1,speed/8);
      if(other.game?.kind)other.game.impact=moving.game.impact;
      const key=`${Math.min(a.id,b.id)}:${Math.max(a.id,b.id)}`;
      if(this.elapsedMs-(this._lastImpact.get(key)??-Infinity)>90){
        this._lastImpact.set(key,this.elapsedMs);
        this.onImpact?.(moving,speed,other,{...contact,contactArm:contact.arm,otherContactArm:contact.otherArm,
          speed,restitution,normalImpulse});
      }
    }
    // Only collapsed contacts skip the solid solver, after fracture has already
    // removed energy. Surviving panels and all perimeter rails still collide.
    for(const pair of this.engine.pairs.list){
      if(pair.bodyA.game?.broken||pair.bodyB.game?.broken)pair.isSensor=true;
    }
  }

  dispose() {
    this.release();
    this.M.Events.off(this.engine);
    this.M.Composite.clear(this.engine.world, false);
    this.M.Engine.clear(this.engine);
    this.engine = null;
  }
}
