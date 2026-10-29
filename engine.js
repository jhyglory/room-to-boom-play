/* Room to Boom! — deterministic, zero-gravity moving physics. */
export const WORLD = Object.freeze({
  width: 760,
  height: 920,
  delivery: Object.freeze({ minX: 84, maxX: 676, minY: 43, maxY: 411 }),
});

export const FURNITURE = Object.freeze([
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
export const TOTAL_FURNITURE = FURNITURE.length;

// Base material floor drag in this zero-gravity world, per60Hz frame.
// There is no physical floor normal force; damping is exp(-rate*dt/baseFrame)
// for both translation and spin. v11 profiles below specialize broad feet and
// light gliders. These are authored gameplay rates, not SI friction values.
export const FLOOR_DAMPING = Object.freeze({
  fabric: .00875, cardboard: .01125, wood: .0055, metal: .003, ceramic: .0075,
});

// v11 pull energy is shared by every object, so its actual mass/inertia sets
// the launch response. Heavy appliances stop on broad feet; light lamps and
// chairs coast, while rough cardboard still dissipates more floor motion.
// These are authored top-down profiles, not measured SI coefficients.
export const GLIDE_PROFILES = Object.freeze({
  sofa: Object.freeze({ floorDamping: .012 }),
  bed: Object.freeze({ floorDamping: .020 }),
  fridge: Object.freeze({ floorDamping: .040 }),
  bookcase: Object.freeze({ floorDamping: .010 }),
  table: Object.freeze({ floorDamping: .0055 }),
  chair: Object.freeze({ floorDamping: .002 }),
  boxA: Object.freeze({ floorDamping: .01125, frictionAir: .025 }),
  boxB: Object.freeze({ floorDamping: .01125, frictionAir: .025 }),
  lamp: Object.freeze({ floorDamping: .001 }),
  plant: Object.freeze({ floorDamping: .0075 }),
  armchair: Object.freeze({ floorDamping: .010 }),
  wardrobe: Object.freeze({ floorDamping: .020 }),
  dresser: Object.freeze({ floorDamping: .014 }),
  tv_stand: Object.freeze({ floorDamping: .0055 }),
  desk: Object.freeze({ floorDamping: .009 }),
  washing_machine: Object.freeze({ floorDamping: .040 }),
});

// v16 makes contacts springier while retaining distinct upholstery, wood,
// cardboard and appliance responses. These are authored game coefficients;
// FURNITURE keeps the historical material baseline, not a claim of SI values.
export const BOUNCE_PROFILES = Object.freeze({
  sofa: .72, bed: .60, fridge: .70, bookcase: .66, table: .78,
  chair: .84, boxA: .75, boxB: .75, lamp: .86, plant: .80,
  armchair: .74, wardrobe: .62, dresser: .64, tv_stand: .72,
  desk: .76, washing_machine: .68,
});

// Springy contact faces couple to an existing plaster crack more effectively.
// This lowers the physical work needed for that kind of impact; it never adds
// kinetic energy or multiplies the work released by a surviving rebound.
export const WALL_BREAK_PROFILES = Object.freeze(Object.fromEntries(
  Object.entries(BOUNCE_PROFILES).map(([id,bounce]) => [id,Object.freeze({
    resistanceScale: 1 - .5 * Math.max(0,Math.min(1,(bounce-.60)/.26)),
  })]),
));

// Original-game constants are historical reference values. v11's spring-energy
// launch is authored here, retaining the bounded pull distance and material mass.
// https://www.zounoashi.com/games/hikkoshi/index.html (read 2026-10-28).
const REFERENCE_SCALE = WORLD.width / 540;
export const REFERENCE_LAUNCH = Object.freeze({
  pullGain: .13,
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
  speedCap: 60,
  maxLaunchEnergy: 3000,
  minimumLaunch: REFERENCE_LAUNCH.minimumLaunch / Math.sqrt(MASS_MULTIPLIER),
  maxPull: REFERENCE_LAUNCH.maxPull,
  angularCap: .3,
  wallSegmentLength: 76,
  // v16 lowers fracture work, but an intact panel must first crack and rebound.
  wallHealth: 4.5,
  weakWallHealth: 1.5,
  // Local plaster calibration in Matter mass * base-frame velocity squared.
  // These resistance values are authored here, not copied from the reference.
  wallEnergyPerHealth: 70,
  wallElasticEnergy: 60,
  wallEnergyTransfer: .65,
  wallRestitution: .97,
  wallFirstDamageFraction: .65,
  wallFriction: .02,
  contactReboundMinSpeed: .8,
  wallMinClosingSpeed: 2.5,
  wallMinImpactEnergy: 450,
  wallMinNormalFraction: .35,
  wallMinExitSpeed: 2.5,
  wallRearmDistance: 12,
  wallHitCooldownMs: 90,
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
    this.walls = [];
    this.bodies = FURNITURE.map((spec) => {
      const body = Bodies.rectangle(spec.x, spec.y, spec.w, spec.h, {
        label: spec.id,
        chamfer: { radius: 5 },
        density: .001 * spec.heavy * PHYSICS.massMultiplier,
        friction: .15,
        frictionStatic: .18,
        frictionAir: GLIDE_PROFILES[spec.id].frictionAir ?? spec.frictionAir,
        restitution: BOUNCE_PROFILES[spec.id],
        slop: .015,
      });
      body.game = { ...spec, frictionAir: body.frictionAir, restitution: body.restitution, mass: body.mass, massMultiplier: PHYSICS.massMultiplier,
        minimumLaunchSpeed: PHYSICS.minimumLaunch,
        maxLaunchSpeed: Math.sqrt(2 * PHYSICS.maxLaunchEnergy / body.mass),
        floorDamping: GLIDE_PROFILES[spec.id].floorDamping ?? FLOOR_DAMPING[spec.material], delivered: false, settled: 0,
        deliveryState: 'outside', deliveryProtrusion: 0, impact: 0 };
      return body;
    });

    const wall = (group, x, originalY, w, h, weak = false, hidden = false) => {
      // Mirror the existing stage: the old room starts below the new room.
      const y = WORLD.height - originalY;
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
    wall('world-left', 15, 460, 18, 920, false, true);
    wall('world-right', 745, 460, 18, 920, false, true);
    wall('world-top', 380, 15, 760, 18, false, true);
    wall('world-bottom', 380, 919, 760, 18, false, true);
    wall('old-top', 380, 60, 628, 18);
    wall('old-left', 75, 240, 18, 378);
    wall('old-right', 685, 240, 18, 378);
    wall('old-bottom-left', 108, 420, 84, 18);
    wall('old-weak', 226, 420, 152, 18, true);
    wall('old-bottom-right', 576, 420, 236, 18);
    wall('new-top-left', 184, 500, 236, 18);
    wall('new-weak', 534, 500, 152, 18, true);
    wall('new-top-right', 652, 500, 84, 18);
    wall('new-left', 75, 693, 18, 404);
    wall('new-right', 685, 693, 18, 404);
    wall('new-bottom', 380, 886, 628, 18);
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

  grab(x, y) {
    const { Query, Vector, Body } = this.M;
    this.release();
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    this.pointer = { x, y };
    const exact = Query.point(this.bodies, this.pointer);
    // Small props receive an additional 12 world units of picking tolerance.
    const candidates = exact.length ? exact : this.bodies.filter((body) => {
      const p = Vector.rotate(Vector.sub(this.pointer, body.position), -body.angle);
      return Math.abs(p.x) <= body.game.w / 2 + 12 && Math.abs(p.y) <= body.game.h / 2 + 12;
    });
    if (!candidates.length) return null;
    const body = candidates.slice().sort((a, b) => {
      const da = Vector.magnitudeSquared(Vector.sub(this.pointer, a.position));
      const db = Vector.magnitudeSquared(Vector.sub(this.pointer, b.position));
      return da - db;
    })[0];
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
    const energy = PHYSICS.maxLaunchEnergy * aim.power * aim.power;
    // A single impulse at the actual grip shares spring energy between linear
    // and angular motion. Off-centre grabs cannot add free rotational energy.
    const arm = this.M.Vector.rotate(anchor, body.angle);
    const lever = this.M.Vector.cross(arm, aim.vector);
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
    Engine.update(this.engine, dt);
    for (const body of this.bodies) {
      const speed = Vector.magnitude(body.velocity);
      if (speed > MAX_SPEED) Body.setVelocity(body, Vector.mult(body.velocity, MAX_SPEED / speed));
      if (Math.abs(body.angularVelocity) > PHYSICS.angularCap) Body.setAngularVelocity(body, Math.sign(body.angularVelocity) * PHYSICS.angularCap);
      if (!body.isStatic) {
        const retention = Math.exp(-body.game.floorDamping * dt / PHYSICS.floorBaseMs);
        Body.setVelocity(body, Vector.mult(body.velocity, retention));
        Body.setAngularVelocity(body, body.angularVelocity * retention);
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
    pair.restitution=Math.max(pair.restitution,PHYSICS.wallRestitution);
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
    const resistanceScale=WALL_BREAK_PROFILES[body.game.kind].resistanceScale;
    const workPerHealth=PHYSICS.wallEnergyPerHealth*resistanceScale/PHYSICS.wallEnergyTransfer;
    // The onset threshold has a per-kind characteristic-speed response, while
    // the absolute normal-speed and angle guards reject slow taps and skims.
    const minimumImpactEnergy=PHYSICS.wallMinImpactEnergy*resistanceScale**2;
    const normalFraction=speed/(Vector.magnitude(contact.relativeContactVelocity)||1);
    const meaningful=speed>=PHYSICS.wallMinClosingSpeed && coupledEnergy>=minimumImpactEnergy
      && normalFraction>=PHYSICS.wallMinNormalFraction;
    const availableWork=meaningful ? Math.max(0,coupledEnergy-PHYSICS.wallElasticEnergy-reserve) : 0;
    const remainingWork=before*workPerHealth;
    const canFracture=wasCracked && meaningful && availableWork>=remainingWork;
    // A surviving panel can only receive crack work actually dissipated by the
    // passive rebound. Strong hits instead pay the whole remaining fracture
    // cost and pass through. Never credit the same energy to cracks and bounce.
    const dissipatedNormalEnergy=(1-pair.restitution*pair.restitution)*coupledEnergy;
    // An intact panel retains a ligament after its first meaningful contact,
    // even at extreme energy. This is a material state, not a fixed hit count:
    // subsequent fresh blows still pay their measured remaining work, while
    // weak/grazing/resting contacts cannot advance the crack state.
    const firstDamageLimit=wasCracked ? Infinity : remainingWork*PHYSICS.wallFirstDamageFraction;
    const damageWork=canFracture ? remainingWork : Math.min(availableWork,dissipatedNormalEnergy,firstDamageLimit);
    const damage=Math.min(before,damageWork/workPerHealth);
    wall.game.health=Math.max(0,before-damage);
    wall.game.lastHitEnergy=energy;wall.game.lastHitDamage=damage;
    wall.game.damageProgress=1-wall.game.health/wall.game.maxHealth;
    if(damage>0)wall.game.cracked=true;
    const intensity=Math.min(1,Math.sqrt(energy/(wall.game.maxHealth*PHYSICS.wallEnergyPerHealth)));
    wall.game.impact=intensity;
    const info={point,normal,velocity:{...velocity},angularVelocity,contactArm:arm,
      intensity,speed,energy,coupledEnergy,effectiveMass,damage,damageWork,remainingHealth:wall.game.health,
      resistanceScale,workPerHealth,minimumImpactEnergy,normalFraction,meaningful,
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
      const restitution=Math.max(moving.restitution,other.restitution);
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
