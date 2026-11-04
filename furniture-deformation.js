// v37 authored crumpling calibration. These are local game values, not rules or
// measurements attributed to Pull & Move. Canvas and Matter use this same map:
// x' = a*x + c*y; y' = b*x + d*y, around the original body-local centre.
const finite = value => typeof value === 'number' && Number.isFinite(value);
const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));

export const CRUMPLE_LIMITS = Object.freeze({
  minimumSpeed: 5.8, minimumEnergy: 160, minimumNormalFraction: .5,
  fullSpeed: 15, bodyCooldownMs: 120,
});
export const CRUMPLE_PROFILES = Object.freeze({
  metal: Object.freeze({ maxCompression: .12, compressionPerHit: .035 }),
  fabric: Object.freeze({ maxCompression: .15, compressionPerHit: .045 }),
  wood: Object.freeze({ maxCompression: .10, compressionPerHit: .032 }),
  cardboard: Object.freeze({ maxCompression: .18, compressionPerHit: .052 }),
  ceramic: Object.freeze({ maxCompression: .10, compressionPerHit: .030 }),
});

export function createFurnitureDeformation(material) {
  return Object.freeze({ a: 1, b: 0, c: 0, d: 1, level: 0, hits: 0,
    strainXX: 0, strainXY: 0, strainYY: 0, material,
    maxCompression: (CRUMPLE_PROFILES[material] || CRUMPLE_PROFILES.wood).maxCompression });
}

export function deformFurniturePoint(point, deformation) {
  const { a, b, c, d } = deformation;
  return { x: a * point.x + c * point.y, y: b * point.x + d * point.y };
}

// The input is a real pre-solve normal contact, never a pointer/pull estimate.
// A positive symmetric strain compresses without introducing expansion or
// artificial elastic energy. Oblique blows make off-axis shear/lean, while the
// two principal compressions stay bounded independently under repeated hits.
export function nextFurnitureDeformation(current, material, normalLocal, contact) {
  const speed = contact?.speed, energy = contact?.energy;
  if (!current || !finite(speed) || !finite(energy)
    || speed < CRUMPLE_LIMITS.minimumSpeed || energy < CRUMPLE_LIMITS.minimumEnergy
    || !finite(normalLocal?.x) || !finite(normalLocal?.y)) return null;
  const length = Math.hypot(normalLocal.x, normalLocal.y);
  if (length < 1e-9) return null;
  const velocity = contact.relativeContactVelocity;
  const totalSpeed = finite(velocity?.x) && finite(velocity?.y)
    ? Math.hypot(velocity.x, velocity.y) : speed;
  if (speed / Math.max(speed, totalSpeed) < CRUMPLE_LIMITS.minimumNormalFraction) return null;
  const profile = CRUMPLE_PROFILES[material] || CRUMPLE_PROFILES.wood;
  const nx = normalLocal.x / length, ny = normalLocal.y / length;
  const strength = .5 + .5 * clamp((speed - CRUMPLE_LIMITS.minimumSpeed)
    / (CRUMPLE_LIMITS.fullSpeed - CRUMPLE_LIMITS.minimumSpeed), 0, 1);
  const amount = profile.compressionPerHit * strength;
  let xx = current.strainXX + amount * (.2 + .8 * nx * nx);
  let xy = current.strainXY + amount * .8 * nx * ny;
  let yy = current.strainYY + amount * (.2 + .8 * ny * ny);
  const centre = (xx + yy) / 2, radius = Math.hypot((xx - yy) / 2, xy);
  const major = clamp(centre + radius, 0, profile.maxCompression);
  const minor = clamp(centre - radius, 0, profile.maxCompression);
  const theta = .5 * Math.atan2(2 * xy, xx - yy), cosine = Math.cos(theta), sine = Math.sin(theta);
  xx = major * cosine * cosine + minor * sine * sine;
  yy = major * sine * sine + minor * cosine * cosine;
  xy = (major - minor) * cosine * sine;
  if (Math.max(Math.abs(xx - current.strainXX), Math.abs(xy - current.strainXY),
    Math.abs(yy - current.strainYY)) < 1e-12) return null;
  return Object.freeze({ a: 1 - xx, b: -xy, c: -xy, d: 1 - yy,
    strainXX: xx, strainXY: xy, strainYY: yy, level: major,
    hits: Math.min(64, current.hits + 1), material, maxCompression: profile.maxCompression });
}
