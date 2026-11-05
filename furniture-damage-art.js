// Supplied damage-v1 PNGs are preserved byte-for-byte. These registrations
// describe painted structural folds, not another accumulated physics shrink.
// The invariant left foot stays in the original canonical ground frame; the
// renderer applies the existing physical deformation matrix exactly once.
// No alpha bounding box, shadow or bent upper corner becomes a new collider.

export const FURNITURE_DAMAGE_THRESHOLDS = Object.freeze({ medium: .20, heavy: .60 });

const freezePoint = point => Object.freeze({ x: point[0], y: point[1] });
const REGISTRATION = Object.freeze({
  fridge: Object.freeze({
    folder: 'fridge_blue', normalFootAnchor: freezePoint([448.5, 1029]),
    medium: Object.freeze({
      footAnchor: freezePoint([447.5, 1029]),
      opaqueBounds: Object.freeze([374, 204, 865, 1029]),
      alphaBounds: Object.freeze([373, 203, 866, 1031]),
      sha256: 'e2490161c7028caf310571846582506bc37d769645b909e8fb2fb840964b16d7',
    }),
    heavy: Object.freeze({
      footAnchor: freezePoint([442, 1030]),
      opaqueBounds: Object.freeze([318, 195, 870, 1030]),
      alphaBounds: Object.freeze([316, 194, 872, 1032]),
      sha256: '943b595025c6193f219723574adae7b33bc22cbb189f2a3e7fad90ef06eff249',
    }),
  }),
  bookcase: Object.freeze({
    folder: 'bookcase_oak', normalFootAnchor: freezePoint([363.5, 1003]),
    medium: Object.freeze({
      footAnchor: freezePoint([348, 1005]),
      opaqueBounds: Object.freeze([278, 271, 1029, 1005]),
      alphaBounds: Object.freeze([277, 269, 1031, 1006]),
      sha256: '7beb6723e5df49c8a8fafd45be83fb0b1965e9eb0d2c07187a177f5f3b066a73',
    }),
    heavy: Object.freeze({
      footAnchor: freezePoint([344.5, 1010]),
      opaqueBounds: Object.freeze([257, 273, 998, 1010]),
      alphaBounds: Object.freeze([256, 272, 999, 1012]),
      sha256: '433fe3847589894af6b803fbdfba48f47e758889738c782214cc9cfb1286d2a0',
    }),
  }),
  sofa: Object.freeze({
    folder: 'sofa_mint', normalFootAnchor: freezePoint([189.5, 974]),
    medium: Object.freeze({
      footAnchor: freezePoint([189.5, 976]),
      opaqueBounds: Object.freeze([77, 271, 1178, 976]),
      alphaBounds: Object.freeze([75, 269, 1180, 978]),
      sha256: 'a7b0bb38e50ba1482260db97b45aea2531cc4ca73f739a224125e39773571fca',
    }),
    heavy: Object.freeze({
      footAnchor: freezePoint([188.5, 979]),
      opaqueBounds: Object.freeze([74, 267, 1185, 997]),
      alphaBounds: Object.freeze([73, 266, 1187, 998]),
      sha256: '0bd4bf947ab6a06c25405720c8aed3529ca17e9d8e8dfbf2cd4dcf28bc6beb2d',
    }),
  }),
});

export const FURNITURE_DAMAGE_ART_REGISTRATION = REGISTRATION;

// Called after the common portrait scale has already been applied to the
// normal specifications. Keep its uniform scale and physical body reference.
// A source-foot translation rebases the painted frame without resizing it.
export function createFurnitureDamageArtSpecs(normalSpecs = {}) {
  const specs = {};
  for (const [kind, registration] of Object.entries(REGISTRATION)) {
    const normal = normalSpecs[kind];
    if (!normal?.pivot || !Number.isFinite(normal.scale) || normal.scale <= 0) continue;
    for (const stage of ['medium', 'heavy']) {
      const source = registration[stage];
      const delta = Object.freeze({
        x: source.footAnchor.x - registration.normalFootAnchor.x,
        y: source.footAnchor.y - registration.normalFootAnchor.y,
      });
      specs[`${kind}_damage_${stage}`] = Object.freeze({
        ...normal,
        filename: `assets/damage-v1/${registration.folder}/damage_${stage}.png`,
        sourcePath: `assets/${registration.folder}/damage_${stage}.png`,
        sha256: source.sha256,
        pivot: Object.freeze({ x: normal.pivot.x + delta.x, y: normal.pivot.y + delta.y }),
        scale: normal.scale,
        body: Object.freeze({ ...normal.body }),
        opaqueBounds: source.opaqueBounds,
        alphaBounds: source.alphaBounds,
        registration: 'authored-damage-left-foot-uniform',
        registrationNote: 'Unchanged uniform canonical scale and invariant left-foot anchor; painted structural folds remain visible. No stage-dependent physics scale is added. Existing physical deformation is applied once by the renderer.',
        normalAssetId: kind,
        damageStage: stage,
        damageRegistration: Object.freeze({
          normalFootAnchor: registration.normalFootAnchor,
          footAnchor: source.footAnchor,
          pivotDelta: delta,
          anchorBasis: 'Opaque left-foot midpoint and foot-bottom baseline, measured separately from the shadow and bent opposite-side silhouette.',
        }),
      });
    }
  }
  return Object.freeze(specs);
}

// The existing real-contact deformation is the single state source. A stage
// is a view of accumulated principal compression, not a hit counter or HP.
export function furnitureDamageArt(bodyOrGame) {
  const game = bodyOrGame?.game || bodyOrGame;
  const kind = typeof game?.kind === 'string' ? game.kind
    : typeof game?.id === 'string' ? game.id : null;
  const shape = game?.deformation;
  let progress = 0;
  if (Object.hasOwn(REGISTRATION, kind) && Number.isFinite(shape?.level)
    && shape.level >= 0 && Number.isFinite(shape?.maxCompression) && shape.maxCompression > 0)
    progress = Math.min(1, Math.max(0, shape.level / shape.maxCompression));
  const stage = progress + 1e-12 >= FURNITURE_DAMAGE_THRESHOLDS.heavy ? 'heavy'
    : progress + 1e-12 >= FURNITURE_DAMAGE_THRESHOLDS.medium ? 'medium' : 'normal';
  return { stage, assetId: stage === 'normal' ? kind : `${kind}_damage_${stage}`, progress };
}
