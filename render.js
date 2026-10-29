import { WORLD } from './engine.js?v=0.20.0';
import { DEFAULT_VIEW, expandedCameraView, projection } from './camera.js?v=0.20.0';
import { assets as defaultAssets, ASSET_SPECS, FURNITURE_ASSET_IDS, furnitureVisualBounds, spritePlacement, WALL_RENDER } from './assets.js?v=0.18.0';

const WIDTH = WORLD.width;
const HEIGHT = WORLD.height;
const ROOMS = WORLD.rooms;
const CENTER_X = WIDTH / 2;

const C = {
  ink: '#4a3b35',
  softInk: '#8d8175',
  cream: '#fff8e9',
  floor: '#f5e5ca',
  plank: '#ddc7a8',
  mint: '#84cdb8',
  mintDark: '#579b88',
  coral: '#ef897c',
  yellow: '#f7cc69',
  plaster: '#f6e6c8',
  terra: '#b66c46',
};

function gradient(ctx, x, y, w, h, colors) {
  const paint = ctx.createLinearGradient?.(x, y, x + w, y + h);
  if (!paint || typeof paint.addColorStop !== 'function') return colors[0];
  colors.forEach((color, index) => paint.addColorStop(index / (colors.length - 1), color));
  return paint;
}

function rounded(ctx, x, y, w, h, r, fill, stroke, lineWidth = 2) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
}

function stroke(ctx, points, color, width = 2) {
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    if (i === 0) ctx.moveTo(points[i][0], points[i][1]);
    else ctx.lineTo(points[i][0], points[i][1]);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

function ellipse(ctx, x, y, rx, ry, fill, outline, width = 2) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (outline) { ctx.strokeStyle = outline; ctx.lineWidth = width; ctx.stroke(); }
}

function text(ctx, str, x, y, size, color = C.ink, weight = 700, align = 'center') {
  ctx.font = `${weight} ${size}px ui-rounded, 'Arial Rounded MT Bold', system-ui, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function referenceText(ctx, str, x, baseline, size, color, weight, spacing = 0) {
  ctx.save();
  ctx.font = `${weight} ${size}px Nunito, 'DejaVu Sans', sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.letterSpacing = `${spacing}px`;
  ctx.fillText(str, x, baseline);
  ctx.restore();
}

export class GameRenderer {
  constructor(canvas, world, { assets = defaultAssets } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.world = world;
    this.assets = assets;
    this.ready = assets?.ready || Promise.resolve(assets);
    this.ready.then(() => { this.scenery = null; }).catch(() => {});
    this.particles = [];
    this.impacts = [];
    this.wallBreaks = [];
    this.shake = null;
    this.effectTime = 0;
    this.wallDamageHints = new Map();
    this.completedWallBreaks = new Set();
    this.scenery = null;
    this.lastNow = 0;
    this.bounds = { left: 0, top: 0, width: WIDTH, height: HEIGHT };
    this.resize();
  }

  resize() {
    const b = this.canvas.getBoundingClientRect();
    const compact = window.matchMedia?.('(max-width: 739px)').matches === true;
    if (this.cameraBodies !== this.world.bodies || this.compact !== compact) {
      this.cameraBodies = this.world.bodies;
      this.view = compact ? { ...DEFAULT_VIEW } : { minX: 0, minY: 0, maxX: WIDTH, maxY: HEIGHT };
    }
    this.compact = compact;
    this.canvas.parentElement?.style?.setProperty?.('--world-view-ratio', String(compact
      ? (DEFAULT_VIEW.maxX - DEFAULT_VIEW.minX) / (DEFAULT_VIEW.maxY - DEFAULT_VIEW.minY) : WIDTH / HEIGHT));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(b.width * dpr));
    const h = Math.max(1, Math.round(b.height * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    Object.assign(this, projection(this.view, w, h));
    this.cssScale = this.scale * b.width / w;
    this.bounds = b;
  }

  screenTransform() {
    const b = this.canvas.getBoundingClientRect();
    return { left: b.left, top: b.top, width: b.width, height: b.height,
      pixelWidth: this.canvas.width, pixelHeight: this.canvas.height,
      scale: this.scale, offsetX: this.offsetX, offsetY: this.offsetY };
  }

  screenToWorld(clientX, clientY, transform = this.screenTransform()) {
    const px = (clientX - transform.left) * transform.pixelWidth / transform.width;
    const py = (clientY - transform.top) * transform.pixelHeight / transform.height;
    return { x: (px - transform.offsetX) / transform.scale, y: (py - transform.offsetY) / transform.scale };
  }

  updateCamera() {
    if (!this.compact) return;
    const reset = this.cameraBodies !== this.world.bodies;
    if (reset) { this.cameraBodies = this.world.bodies; this.view = { ...DEFAULT_VIEW }; }
    const next = expandedCameraView(this.view, this.world.bodies || []);
    if (!reset && next.minX === this.view.minX && next.maxX === this.view.maxX
      && next.minY === this.view.minY && next.maxY === this.view.maxY) return;
    this.view = next;
    Object.assign(this, projection(this.view, this.canvas.width, this.canvas.height));
    this.cssScale = this.scale * this.bounds.width / this.canvas.width;
  }

  getAsset(id) { return (this.assets || defaultAssets).get(id); }

  drawRegisteredSprite(ctx, id, { length = 152, scale = 1 } = {}) {
    const image = this.getAsset(id);
    const frame = spritePlacement(id, { length, scale });
    if (!image || !frame) return false;
    ctx.save();
    if (frame.rotation) ctx.rotate(frame.rotation);
    ctx.drawImage(image, frame.x, frame.y, frame.width, frame.height);
    ctx.restore();
    return true;
  }

  addBurst(x, y, color = C.yellow, count = 14) {
    if (typeof x === 'object') {
      const item = x.position || x;
      color = typeof y === 'string' ? y : color;
      x = item.x; y = item.y;
    }
    for (let i = 0; i < Math.min(count, 22); i++) {
      const angle = i / count * Math.PI * 2 + Math.random() * 0.4;
      const speed = 75 + Math.random() * 115;
      this.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 35,
        life: 0.55 + Math.random() * 0.25, maxLife: 0.8, size: 3 + Math.random() * 5,
        color: i % 4 === 0 ? '#fff9ed' : color, spin: Math.random() * 4, angle: Math.random() * 6 });
    }
    if (this.particles.length > 110) this.particles.splice(0, this.particles.length - 110);
  }

  addImpact(x, y, referenceSpeed = 6, info = {}) {
    if (typeof x === 'object') {
      const pos = x.position || x;
      referenceSpeed = typeof y === 'number' ? y : referenceSpeed;
      x = pos.x; y = pos.y;
    }
    if (!Number.isFinite(referenceSpeed) || referenceSpeed <= 3.2) return null;
    const k = Math.max(0, Math.min(1, (referenceSpeed - 3) / 6));
    const unit = WIDTH / 540;
    const normal = info.normal || { x: 0, y: -1 };
    const magnitude = Math.hypot(normal.x, normal.y) || 1;
    const direction = { x: normal.x / magnitude, y: normal.y / magnitude };
    const damaging = info.firstCrack || info.damage > 0 || info.damaged;
    const key = info.sourceId || (info.bodyId ? `${info.bodyId}:${info.wallId || 'contact'}` : null);
    const nearby = this.impacts.find(hit => hit.life > hit.maxLife - .07 &&
      (key ? hit.sourceId === key : !hit.sourceId && Math.hypot(hit.x - x, hit.y - y) < 22));
    // These are short contact cues, not a screen-covering explosion or a
    // trajectory simulation. Only a real fracture gets plaster fragments.
    const size = (info.broken ? 34 + 12 * k : damaging ? 17 + 18 * k : 8 + 13 * k) * unit;
    if (nearby) { nearby.size = Math.max(nearby.size, size); return nearby; }
    const life = info.broken ? .18 : damaging ? .16 : .12;
    const impact = { x, y, life, maxLife: life, size, rotation: Math.random() * Math.PI * 2,
      referenceSpeed, sourceId: key };
    this.impacts.push(impact);
    if (this.impacts.length > 14) this.impacts.shift();
    this.addWallPowder({ x, y, direction, intensity: k }, info.broken ? 5 + Math.round(5 * k)
      : damaging ? 3 + Math.round(5 * k) : 2 + Math.round(2 * k));
    if (k > .2 && (!this.shake || this.shake.life < .04 || k > this.shake.intensity)) {
      this.shake = { life: .08, maxLife: .08, amplitude: .6 + 2.1 * k, intensity: k,
        direction, seed: Math.random() * Math.PI * 2 };
    }
    return impact;
  }

  wallImpactInfo(wall, info) {
    const intensity = Number.isFinite(info.intensity) ? Math.max(.08, Math.min(1, info.intensity)) : 1;
    const point = info.point || wall.position;
    const x = Math.max(25, Math.min(WIDTH - 25, point.x));
    const y = Math.max(25, Math.min(HEIGHT - 25, point.y));
    const velocity = info.velocity || info.normal || { x: 0, y: -1 };
    const magnitude = Math.hypot(velocity.x, velocity.y) || 1;
    const referenceSpeed = Number.isFinite(info.referenceSpeed) ? info.referenceSpeed
      : Number.isFinite(info.speed) ? info.speed / (WIDTH / 540) : 3 + intensity * 6;
    return { x, y, intensity, referenceSpeed, direction: { x: velocity.x / magnitude, y: velocity.y / magnitude } };
  }

  addWallHit(wall, info = {}) {
    const hit = this.wallImpactInfo(wall, info);
    this.wallDamageHints ||= new Map();
    if (info.firstCrack || info.damage > 0 || info.damaged)
      this.wallDamageHints.set(wall.game?.id, { x: hit.x - wall.position.x, y: hit.y - wall.position.y });
    return this.addImpact(hit.x, hit.y, hit.referenceSpeed, { ...info,
      sourceId: `${info.bodyId || 'piece'}:${wall.game?.id || 'wall'}`, normal: info.normal || hit.direction });
  }

  addWallPowder(hit, count) {
    for (let i = 0; i < count; i++) {
      const angle = i / count * Math.PI * 2 + Math.random() * .3;
      const speed = 30 + Math.random() * 65;
      const life = .22 + Math.random() * .2;
      this.particles.push({ x: hit.x, y: hit.y, vx: Math.cos(angle) * speed + hit.direction.x * 25,
        vy: Math.sin(angle) * speed + hit.direction.y * 25, life, maxLife: life,
        size: 1 + Math.random() * 2.6, color: i % 3 ? '#e8d1ac' : '#be7953',
        spin: 0, angle: 0, powder: true });
    }
    if (this.particles.length > 140) this.particles.splice(0, this.particles.length - 140);
  }

  addWallBreak(wall, info = {}) {
    this.completedWallBreaks ||= new Set();
    const key = wall.game?.id || wall;
    if (this.completedWallBreaks.has(key)) return false;
    this.completedWallBreaks.add(key);
    const hit = this.wallImpactInfo(wall, info);
    this.addImpact(hit.x, hit.y, Math.max(3.21, hit.referenceSpeed), { ...info, broken: true,
      sourceId: `${info.bodyId || 'piece'}:${wall.game?.id || 'wall'}`, normal: info.normal || hit.direction });
    this.particles.push({ x: hit.x, y: hit.y, vx: hit.direction.x * 38, vy: hit.direction.y * 38,
      life: .44, maxLife: .44, size: 68 + hit.intensity * 22, angle: (Math.random() - .5) * .28,
      spin: (Math.random() - .5) * 1.1, sprite: 'wall_debris' });
    // The supplied debris is one authored cluster of substantial slabs. It
    // fades within half a second and never creates a Matter body or obstacle.
    const clusters = this.particles.filter(particle => particle.sprite === 'wall_debris');
    if (clusters.length > 8) this.particles.splice(this.particles.indexOf(clusters[0]), 1);
    this.addWallPowder(hit, 7 + Math.round(hit.intensity * 5));
    this.wallBreaks.push({ ...hit, life: .48, maxLife: .48, collapse: true });
    if (this.wallBreaks.length > 8) this.wallBreaks.shift();
    this.shake = { life: .1, maxLife: .1, amplitude: 3.2, intensity: hit.intensity,
      direction: hit.direction, seed: Math.random() * Math.PI * 2 };
    return true;
  }

  clearEffects() {
    this.particles = [];
    this.impacts = [];
    this.wallBreaks = [];
    this.shake = null;
    this.lastNow = 0;
    this.effectTime = 0;
    this.wallDamageHints?.clear();
    this.completedWallBreaks?.clear();
  }

  draw(now = performance.now(), { phase = 'ready', reducedMotion = false } = {}) {
    const ctx = this.ctx;
    const dt = phase === 'playing' && this.lastNow ? Math.max(0, Math.min((now - this.lastNow) / 1000, 0.05)) : 0;
    this.lastNow = now;
    this.effectTime = (this.effectTime || 0) + dt * 1000;
    if (reducedMotion) {
      this.particles = []; this.impacts = []; this.wallBreaks = []; this.shake = null;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#f2f0df';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    const shake = this.shake;
    const held = this.world.grabbed || this.world.dragged;
    this.updateCamera();
    // Tight mobile framing keeps intact plaster edges visible. Local impact
    // animation and audio remain; the world itself never moves for this effect.
    const amplitude = shake && !held ? Math.min(this.compact ? .75 : Infinity,
      (shake.amplitude ?? 4.5 * shake.intensity) * shake.life / shake.maxLife) : 0;
    const shakePhase = shake ? shake.seed + (shake.maxLife - shake.life) * 105 : 0;
    const recoil = shake?.direction || { x: 1, y: .65 };
    const pulse = Math.sin(shakePhase), cross = Math.cos(shakePhase * 1.2) * .2;
    ctx.setTransform(this.scale, 0, 0, this.scale,
      this.offsetX + (pulse * recoil.x - cross * recoil.y) * amplitude * this.scale,
      this.offsetY + (pulse * recoil.y + cross * recoil.x) * amplitude * this.scale);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    this.drawStaticScenery(ctx);
    this.drawRoute(ctx, reducedMotion ? 0 : this.effectTime);

    const grabbed = this.world.grabbed || this.world.dragged;
    for (const wall of this.world.walls || []) {
      if (!wall.game?.hidden) this.drawWall(ctx, wall);
    }
    this.drawWeakWallMarkers(ctx);
    this.drawRoomPlacards(ctx);

    const bodies = [...(this.world.bodies || [])];
    bodies.sort((a, b) => a.position.y - b.position.y);
    const remaining = bodies.filter(body => !body.game?.delivered);
    this.deliveryHintBody = grabbed || (remaining.length === 1 && Math.max(remaining[0].game.w, remaining[0].game.h) <= 75 ? remaining[0] : null);
    for (const body of bodies) if (body !== grabbed) this.drawFurniture(ctx, body, false, now);
    if (grabbed) {
      this.drawFurniture(ctx, grabbed, true, now);
      if (phase === 'playing') this.drawAim(ctx, grabbed);
    }
    this.drawEffects(ctx, dt, reducedMotion);
  }

  drawStaticScenery(ctx) {
    const version = (this.assets || defaultAssets).version;
    if (this.sceneryVersion !== version) { this.scenery = null; this.sceneryVersion = version; }
    if (!this.scenery && this.scenery !== false) {
      try {
        const canvas = typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(WIDTH * 2, HEIGHT * 2)
          : typeof document !== 'undefined' && typeof document.createElement === 'function' ? document.createElement('canvas') : null;
        if (canvas) {
          canvas.width = WIDTH * 2; canvas.height = HEIGHT * 2;
          const cached = canvas.getContext('2d');
          if (cached) {
            cached.scale(2, 2);
            this.drawGround(cached); this.drawStageRooms(cached); this.drawSurroundings(cached);
            this.scenery = canvas;
          }
        }
      } catch { this.scenery = false; }
      if (!this.scenery) this.scenery = false;
    }
    if (this.scenery) ctx.drawImage(this.scenery, 0, 0, WIDTH, HEIGHT);
    else {
      this.drawGround(ctx); this.drawStageRooms(ctx); this.drawSurroundings(ctx);
    }
  }

  drawGround(ctx) {
    ctx.fillStyle = '#faf4e7'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    const left = ROOMS.old.minX, right = ROOMS.old.maxX, width = right - left;
    rounded(ctx, left - 18, 20, width + 36, HEIGHT - 45, 18, '#e9e8db', '#d5d5c3', 1);
    // A quiet, light corridor makes a missing wall segment legible immediately
    // after the brief dust clears, without a decorative rail in the passage.
    rounded(ctx, left - 9, ROOMS.new.maxY + 9, width + 18,
      ROOMS.old.minY - ROOMS.new.maxY - 18, 8, '#eee9d7', '#d6d0b9', 1);
  }

  drawStageRooms(ctx) {
    for (const [name, room] of Object.entries(ROOMS))
      this.drawRoom(ctx, room.minX, room.minY, room.maxX - room.minX, room.maxY - room.minY, name === 'new');
  }

  drawRoomPlacards(ctx) {
    rounded(ctx, CENTER_X - 79, ROOMS.new.minY + 13, 158, 29, 9, '#e5efdae8');
    referenceText(ctx, 'NEW HOME', CENTER_X, ROOMS.new.minY + 34, 18, '#5e805d', 900);
    referenceText(ctx, 'OLD HOME', CENTER_X, ROOMS.old.maxY + 36, 15, '#916e49', 800, 1.4);
  }

  drawWeakWallMarkers(ctx) {
    if (!(this.world.walls || []).some(wall => wall.game?.weak && !wall.game.broken && !wall.game.hidden)) return;
    // The hint stays beside the central door instead of covering its aiming
    // line; wall art itself carries the persistent intact/cracked/broken state.
    const x = (ROOMS.old.minX + WORLD.doorway.minX) / 2;
    rounded(ctx, x - 64, 450, 128, 23, 7, '#fff2dbd9', '#e1bf8a', 1);
    referenceText(ctx, 'WALLS = SHORTCUTS', x, 466, 10, '#a1764c', 900, .2);
  }

  drawRoom(ctx, x, y, w, h, isNew) {
    ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, 0); ctx.clip();
    const floor = this.getAsset(isNew ? 'floor_mint' : 'floor_wood');
    if (floor) {
      const spec = ASSET_SPECS[isNew ? 'floor_mint' : 'floor_wood'];
      const cover = Math.max(w / spec.width, h / spec.height) * 1.5;
      const fw = spec.width * cover, fh = spec.height * cover;
      ctx.drawImage(floor, x + (w - fw) / 2, y + (h - fh) / 2, fw, fh);
      ctx.save(); ctx.globalAlpha = .13;
      ctx.fillStyle = isNew ? '#e7f1dd' : '#fff1d9'; ctx.fillRect(x, y, w, h); ctx.restore();
    }
    else rounded(ctx, x, y, w, h, 0, isNew ? '#dce8d5' : '#edddc4');
    if (isNew) {
      const area = WORLD.delivery;
      rounded(ctx, area.minX, area.minY, area.maxX - area.minX, area.maxY - area.minY, 0, '#e2f4d805');
      // This line marks the actual whole-body destination boundary. It has no
      // inset rounded corners that would imply a second delivery rule.
      ctx.setLineDash([8, 8]);
      rounded(ctx, area.minX, area.minY, area.maxX - area.minX, area.maxY - area.minY, 0, null, '#89a986', 1.4);
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  drawRoute(ctx, now) {
    ctx.save();
    ctx.setLineDash([6, 7]);
    const x = WORLD.doorway.centerX;
    stroke(ctx, [[x, 480], [x, 442]], '#84a18a', 2.5);
    ctx.setLineDash([]);
    stroke(ctx, [[x - 8, 452], [x, 442], [x + 8, 452]], '#84a18a', 2.5);
    ctx.restore();
  }

  drawSurroundings(ctx) {
    // The frame has no extra furniture-shaped decorations: every visible
    // movable-looking prop in the rooms is a real physics body.
  }

  getWallPanel(wall, walls = this.world.walls) {
    if (this.wallPanelSource !== walls) {
      this.wallPanelSource = walls;
      this.wallPanelMap = new Map();
      const axes = new Map();
      for (const item of walls || []) {
        const g = item.game;
        if (!g || g.hidden || !g.w || !g.h) continue;
        const horizontal = g.w >= g.h;
        const cross = horizontal ? item.position.y : item.position.x;
        const key = `${horizontal ? 'h' : 'v'}:${cross.toFixed(4)}`;
        if (!axes.has(key)) axes.set(key, []);
        axes.get(key).push(item);
      }
      const register = (members, horizontal) => {
        const first = members[0], last = members.at(-1);
        const min = horizontal ? first.position.x - first.game.w / 2 : first.position.y - first.game.h / 2;
        const max = horizontal ? last.position.x + last.game.w / 2 : last.position.y + last.game.h / 2;
        const panel = { x: horizontal ? (min + max) / 2 : first.position.x,
          y: horizontal ? first.position.y : (min + max) / 2, length: max - min, horizontal, members,
          angle: horizontal ? 0 : first.position.x < WIDTH / 2 ? -Math.PI / 2 : Math.PI / 2 };
        for (const item of members) this.wallPanelMap.set(item, panel);
      };
      for (const members of axes.values()) {
        const horizontal = members[0].game.w >= members[0].game.h;
        members.sort((a, b) => horizontal ? a.position.x - b.position.x : a.position.y - b.position.y);
        let run = [], end = -Infinity;
        for (const item of members) {
          const center = horizontal ? item.position.x : item.position.y;
          const half = (horizontal ? item.game.w : item.game.h) / 2;
          if (run.length && center - half > end + .001) { register(run, horizontal); run = []; }
          run.push(item); end = center + half;
        }
        if (run.length) register(run, horizontal);
      }
    }
    const horizontal = wall.game.w >= wall.game.h;
    return this.wallPanelMap?.get(wall) || { x: wall.position.x, y: wall.position.y,
      length: Math.max(wall.game.w, wall.game.h), horizontal, members: [wall],
      angle: horizontal ? 0 : wall.position.x < WIDTH / 2 ? -Math.PI / 2 : Math.PI / 2 };
  }

  wallIntervals(panel) {
    return panel.members.map(wall => {
      const center = panel.horizontal ? wall.position.x - panel.x
        : (wall.position.y - panel.y) * (panel.angle < 0 ? -1 : 1);
      const half = (panel.horizontal ? wall.game.w : wall.game.h) / 2;
      return { wall, start: center - half, end: center + half };
    }).sort((a, b) => a.start - b.start);
  }

  drawWallStrip(ctx, state, length) {
    const image = this.getAsset(state), spec = ASSET_SPECS[state];
    if (!image || !spec?.opaqueBounds) return;
    const [left, top, right, bottom] = spec.opaqueBounds;
    const height = WALL_RENDER.opaqueHeight;
    const scale = height / (bottom - top);
    // Three source slices preserve the end profiles and height. Only the
    // straight centre stretches along a connected physical wall run.
    const cap = Math.min(170, (right - left) / 4, length / (2 * scale));
    const y = -height / 2 - top * scale, h = spec.height * scale;
    const pieces = [
      [0, left + cap, -length / 2 - left * scale, (left + cap) * scale],
      [left + cap, right - left - cap * 2, -length / 2 + cap * scale, Math.max(0, length - cap * scale * 2)],
      [right - cap, spec.width - right + cap, length / 2 - cap * scale, (spec.width - right + cap) * scale],
    ];
    for (const [sx, sw, x, w] of pieces) if (sw > 0 && w > 0)
      ctx.drawImage(image, sx, 0, sw, spec.height, x, y, w, h);
  }

  drawBrokenWallStubs(ctx, span, intervals) {
    const image = this.getAsset('wall_broken');
    if (!image) return;
    const { leftSourceRect, rightSourceRect, opaqueY, scale } = WALL_RENDER.broken;
    const y = -WALL_RENDER.opaqueHeight / 2 - opaqueY[0] * scale;
    const left = intervals.find(item => !item.wall.game.broken && Math.abs(item.end - span.start) < .001);
    const right = intervals.find(item => !item.wall.game.broken && Math.abs(item.start - span.end) < .001);
    for (const [side, source, neighbor] of [['left', leftSourceRect, left], ['right', rightSourceRect, right]]) {
      // A gap that joins an existing door has no physical jamb on that side.
      // Omit its stub instead of placing a non-colliding wall in the doorway.
      if (!neighbor) continue;
      const [sx, sy, sw, sh] = source;
      const w = sw * scale, h = sh * scale;
      const x = side === 'left' ? span.start - w : span.end;
      ctx.save(); ctx.beginPath();
      ctx.rect(neighbor.start, y, neighbor.end - neighbor.start, h); ctx.clip();
      ctx.drawImage(image, sx, sy, sw, sh, x, y, w, h);
      ctx.restore();
    }
  }

  drawWall(ctx, wall, { walls = this.world.walls } = {}) {
    const g = wall.game || {};
    if (g.hidden || g.boundary || !g.w || !g.h) return;
    const panel = this.getWallPanel(wall, walls), intervals = this.wallIntervals(panel);
    const own = intervals.find(item => item.wall === wall);
    ctx.save(); ctx.translate(panel.x, panel.y); ctx.rotate(panel.angle);
    if (g.broken) {
      const index = intervals.indexOf(own); let first = index, last = index;
      while (first > 0 && intervals[first - 1].wall.game.broken) first--;
      while (last < intervals.length - 1 && intervals[last + 1].wall.game.broken) last++;
      if (index === first) this.drawBrokenWallStubs(ctx, { start: intervals[first].start, end: intervals[last].end }, intervals);
    } else {
      const index = intervals.indexOf(own);
      // Remove the old straight rail beneath the fractured tips. Their atlas
      // pixels remain entirely on surviving collider footprints, never in the
      // removed gap or an adjacent doorway (including rotated vertical runs).
      const start = own.start + (intervals[index - 1]?.wall.game.broken ? 32 : 0);
      const end = own.end - (intervals[index + 1]?.wall.game.broken ? 32 : 0);
      if (end > start) {
        const state = g.health < g.maxHealth || g.cracked ? 'wall_cracked' : 'wall_intact';
        ctx.beginPath(); ctx.rect(start, -100, end - start, 200); ctx.clip();
        this.drawWallStrip(ctx, state, panel.length);
      }
    }
    ctx.restore();
  }

  drawCalibration(ctx = this.ctx, { showColliders = true } = {}) {
    ctx.save();
    if (ctx === this.ctx) ctx.setTransform(this.scale, 0, 0, this.scale, this.offsetX, this.offsetY);
    this.drawGround(ctx);
    this.drawStageRooms(ctx);
    text(ctx, 'REGISTERED WALL / FLOOR CALIBRATION', CENTER_X, 65, 14, '#49362e', 900);
    text(ctx, 'Red = collider · blue = cleared physical gap', CENTER_X, 90, 10, '#84735f', 700);
    for (const [row, mode] of ['intact', 'cracked', 'broken'].entries()) {
      const y = 174 + row * 125;
      const segment = (ROOMS.old.maxX - ROOMS.old.minX) / 8;
      const walls = Array.from({ length: 8 }, (_, index) => ({ position: { x: ROOMS.old.minX + (index + .5) * segment, y }, game: {
        id: `demo-${row}:${index}`, w: segment, h: 18, health: mode === 'cracked' ? 1 : 2, maxHealth: 2,
        broken: mode === 'broken' && (index === 3 || index === 4),
      } }));
      for (const wall of walls) this.drawWall(ctx, wall, { walls });
      if (showColliders) {
        for (const wall of walls) if (!wall.game.broken)
          rounded(ctx, wall.position.x - segment/2, y - 9, segment, 18, 0, null, '#d0634b', 1.2);
        if (mode === 'broken') rounded(ctx, CENTER_X - segment, y - 28, segment * 2, 56, 0, null, '#6298b6', 1.2);
      }
      text(ctx, mode.toUpperCase() + (mode === 'broken' ? ' · TWO INDEPENDENT END STUBS' : ' · CONNECTED STRIP / COMMON HEIGHT 34'),
        CENTER_X, y - 42, 9, '#49362e', 800);
    }
    for (const [x, angle] of [[ROOMS.old.minX + 30, -Math.PI / 2], [ROOMS.old.maxX - 30, Math.PI / 2]]) {
      const wall = { position: { x, y: 650 }, game: { id: `vertical-${x}`, w: 18, h: 152, health: 2, maxHealth: 2 } };
      this.drawWall(ctx, wall, { walls: [wall] });
      if (showColliders) rounded(ctx, x - 9, 574, 18, 152, 0, null, '#d0634b', 1.2);
    }
    for (const [id, x, y] of [['sofa', CENTER_X + 20, 700], ['fridge', CENTER_X - 95, 630]]) {
      const spec = ASSET_SPECS[id];
      ctx.save(); ctx.translate(x, y); this.drawRegisteredSprite(ctx, id);
      if (showColliders) rounded(ctx, -spec.body.width / 2, -spec.body.height / 2, spec.body.width, spec.body.height, 0, null, '#d0634b', 1.2);
      ctx.restore();
    }
    const debris = this.getAsset('wall_debris');
    if (debris) ctx.drawImage(debris, CENTER_X + 85, 705, 82, 82);
    text(ctx, 'Original PNGs · full furniture frames · uniform floor cover × 1.5', CENTER_X, 815, 9, '#84735f', 700);
    text(ctx, 'v18 shared portrait geometry · removed colliders open their full gap', CENTER_X, 840, 8, '#84735f', 700);
    text(ctx, 'Vertical walls rotate their source lighting; no decorative frame overlay.', CENTER_X, 865, 8, '#84735f', 700);
    ctx.restore();
  }

  drawFurnitureCalibration(ctx = this.ctx, {
    showColliders = true, showBounds = true, showPickTolerance = false, rotation = 0,
  } = {}) {
    ctx.save();
    if (ctx === this.ctx) ctx.setTransform(this.scale, 0, 0, this.scale, this.offsetX, this.offsetY);
    ctx.fillStyle = '#faf4e7'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    text(ctx, 'FURNITURE · ALL 16 ORIGINAL PNGs', CENTER_X, 33, 16, '#49362e', 900);
    text(ctx, 'Portrait world · uniform registration · original full frames', CENTER_X, 57, 9, '#84735f', 700);
    text(ctx, 'Red = collider · green = alpha ≥ 220 · blue = pick tolerance', CENTER_X, 77, 8.5, '#84735f', 700);
    for (const [index, id] of FURNITURE_ASSET_IDS.entries()) {
      const spec = ASSET_SPECS[id];
      const bounds = furnitureVisualBounds(id);
      const x = WIDTH / 4 * (index % 4 + .5), y = 150 + Math.floor(index / 4) * 200;
      const { width: w, height: h } = spec.body;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rotation);
      this.drawRegisteredSprite(ctx, id);
      if (showPickTolerance) {
        ctx.setLineDash([2, 4]);
        rounded(ctx, -w / 2 - 12, -h / 2 - 12, w + 24, h + 24, 0, null, '#6298b6', 1);
        ctx.setLineDash([]);
      }
      if (showBounds) {
        ctx.setLineDash([3, 3]);
        rounded(ctx, bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY,
          0, null, '#528565', 1);
        ctx.setLineDash([]);
      }
      if (showColliders) {
        rounded(ctx, -w / 2, -h / 2, w, h, 0, null, '#d0634b', 1.2);
        stroke(ctx, [[-4, 0], [4, 0]], '#d0634b', 1.2);
        stroke(ctx, [[0, -4], [0, 4]], '#d0634b', 1.2);
      }
      ctx.restore();
      text(ctx, id.replaceAll('_', ' ').toUpperCase(), x, y + 76, 11, '#49362e', 900);
      text(ctx, `BODY ${Number(w.toFixed(1))} × ${Number(h.toFixed(1))} · ART ${(bounds.maxX - bounds.minX).toFixed(1)} × ${(bounds.maxY - bounds.minY).toFixed(1)}`,
        x, y + 94, 8.5, '#84735f', 700);
      text(ctx, `PIVOT ${spec.pivot.x}, ${spec.pivot.y} · SCALE ${spec.scale.toFixed(5)}`,
        x, y + 108, 7.5, '#84735f', 700);
    }
    text(ctx, 'Overlays are diagnostics; collision and delivery rules stay authoritative.', CENTER_X, 887, 8, '#84735f', 700);
    text(ctx, 'Bookcase uses the near-square footprint of its supplied PNG.', CENTER_X, 906, 8.5, '#84735f', 700);
    ctx.restore();
  }

  drawAim(ctx, body) {
    const aim = this.world.aim;
    if (!aim) return;
    const { origin, pull, vector, power } = aim;
    const center = aim.center || body.position;
    const end = { x: origin.x + pull.x, y: origin.y + pull.y };
    // The band shows the pull; the arrow shows the opposite launch direction.
    stroke(ctx, [[origin.x, origin.y], [end.x, end.y]], '#3b6e56', 7);
    stroke(ctx, [[origin.x, origin.y], [end.x, end.y]], '#d4ffe4', 3.5);
    if (power > .02) {
      const fork = Math.min(body.game?.w || 50, body.game?.h || 50) * .3;
      for (const side of [-1, 1]) stroke(ctx,
        [[center.x - vector.y * fork * side, center.y + vector.x * fork * side], [end.x, end.y]], '#c2ffdfcf', 2.5);
    }
    ctx.save(); ctx.shadowColor = '#75ffd2'; ctx.shadowBlur = 11;
    ellipse(ctx, end.x, end.y, 11, 11, '#f2fff0', '#7aefbd', 3);
    ctx.restore();
    ellipse(ctx, end.x, end.y, 5, 5, '#386d51');
    if (power > .02) {
      // The short solid arrow only indicates direction. It deliberately makes
      // no promise about a future bounce, stopping point or wall breakthrough.
      const angle = body.angle || 0;
      const localX = vector.x * Math.cos(angle) + vector.y * Math.sin(angle);
      const localY = -vector.x * Math.sin(angle) + vector.y * Math.cos(angle);
      const exit = Math.min((body.game?.w || 50) / 2 / Math.max(.0001, Math.abs(localX)),
        (body.game?.h || 50) / 2 / Math.max(.0001, Math.abs(localY)));
      const start = exit + 7, length = start + 24 + power * 25;
      const tip = { x: center.x + vector.x * length, y: center.y + vector.y * length };
      const tail = { x: center.x + vector.x * start, y: center.y + vector.y * start };
      const back = { x: tip.x - vector.x * 11, y: tip.y - vector.y * 11 };
      const points = [[back.x - vector.y * 8, back.y + vector.x * 8], [tip.x, tip.y], [back.x + vector.y * 8, back.y - vector.x * 8]];
      ctx.save(); ctx.shadowColor = '#93ffcd'; ctx.shadowBlur = 13;
      stroke(ctx, [[tail.x, tail.y], [tip.x, tip.y]], '#4f9d78', 12);
      stroke(ctx, points, '#4f9d78', 12);
      stroke(ctx, [[tail.x, tail.y], [tip.x, tip.y]], '#b9ffda', 7);
      stroke(ctx, points, '#b9ffda', 7);
      ctx.restore();
    }
    const view = this.view || { minX: 0, minY: 0, maxX: WIDTH, maxY: HEIGHT };
    const meterX = Math.max(view.minX + 55, Math.min(view.maxX - 55, end.x));
    const offset = power > .02 ? (end.y >= center.y ? -30 : 30) : (body.game?.h || 50) / 2 + 22;
    const meterY = Math.max(view.minY + 26, Math.min(view.maxY - 38, end.y + offset));
    rounded(ctx, meterX - 37, meterY - 8, 74, 16, 6, '#34634d', '#e6ffe8', 1.5);
    rounded(ctx, meterX - 33, meterY - 4, Math.max(2, 66 * power), 8, 3,
      gradient(ctx, meterX - 33, meterY - 4, 0, 8, power > .8 ? ['#ecffc1', '#8fd594'] : ['#c0f5cd', '#76b88b']));
    text(ctx, power > .02 ? `RELEASE · ${Math.round(power * 100)}%` : 'PULL BACK',
      meterX, meterY + 21, 13, '#34634d', 900);
  }

  drawFurniture(ctx, body, selected, now) {
    const g = body.game;
    if (!g) return;
    const w = g.w, h = g.h;
    const nearHome = body.position.y <= WORLD.delivery.maxY + h / 2 + 18;
    const outsideEdge = !g.delivered && g.deliveryState === 'outside' && nearHome && g.deliveryProtrusion > 0;
    ctx.save(); ctx.translate(body.position.x, body.position.y); ctx.rotate(body.angle || 0);
    if (outsideEdge) rounded(ctx, -w / 2 - 4, -h / 2 - 4, w + 8, h + 8, 9, null, '#d4a143', 2.5);
    if (selected) {
      ctx.save(); ctx.shadowColor = '#71ffd4'; ctx.shadowBlur = 19;
      rounded(ctx, -w / 2 - 5, -h / 2 - 5, w + 10, h + 10, 12, '#d9fff52b', '#7bffd5', 4);
      rounded(ctx, -w / 2 - 3, -h / 2 - 3, w + 6, h + 6, 10, null, '#efffeb', 1.8);
      ctx.restore();
    }
    this.drawRegisteredSprite(ctx, g.kind);
    if (g.delivered) {
      ellipse(ctx, w / 2 - 3, -h / 2 + 2, 10, 10, '#e7f2d9', '#7aa17a', 1.8);
      stroke(ctx, [[w / 2 - 8, -h / 2 + 2], [w / 2 - 4, -h / 2 + 6], [w / 2 + 2, -h / 2 - 2]], '#639666', 2.5);
    } else if (g.settled > 0 || g.deliveryState === 'settling') {
      ellipse(ctx, w / 2 - 3, -h / 2, 11, 11, C.cream, '#bed4b0', 1.5);
      ctx.beginPath(); ctx.arc(w / 2 - 3, -h / 2, 11, -Math.PI / 2, -Math.PI / 2 + Math.min(1, g.settled / 500) * Math.PI * 2);
      ctx.strokeStyle = '#78a47f'; ctx.lineWidth = 4; ctx.stroke();
    }
    ctx.restore();
    if (!g.delivered && body === this.deliveryHintBody && (nearHome || !selected)) this.drawDeliveryHint(ctx, body);
  }

  drawDeliveryHint(ctx, body) {
    const g = body.game;
    if (!g.deliveryState || g.deliveryState === 'moved') return;
    let label = 'WHOLE PIECE IN MINT ↑';
    let color = '#a8772e';
    if (g.deliveryState === 'settling') {
      label = 'SETTLING · 0.5s'; color = '#5f8c69';
    } else if (g.deliveryState === 'aiming' && g.deliveryProtrusion === 0) {
      label = 'RELEASE TO SETTLE'; color = '#5f8c69';
    } else if (body.position.y <= WORLD.delivery.maxY && g.deliveryProtrusion > 0) {
      label = 'EDGE OUTSIDE';
    }
    const x = Math.max(104, Math.min(WIDTH - 104, body.position.x));
    const y = Math.max(58, Math.min(874, body.position.y - g.h / 2 - 22));
    rounded(ctx, x - 91, y - 13, 182, 26, 8, '#fff8e9f2', color, 1.5);
    text(ctx, label, x, y, 10, color, 800);
    if (g.deliveryState === 'settling') {
      const progress = Math.max(0, Math.min(1, g.settled / 500));
      rounded(ctx, x - 78, y + 8, 156 * progress, 3, 1.5, '#84b78b');
    }
  }

  drawEffects(ctx, dt, reduced) {
    if (reduced) { this.particles = []; this.impacts = []; this.wallBreaks = []; this.shake = null; return; }
    ctx.save();
    ctx.beginPath(); ctx.roundRect(24, 24, WIDTH - 48, HEIGHT - 48, 0); ctx.clip();
    for (const hit of this.wallBreaks) {
      hit.life -= dt;
      const progress = Math.max(0, 1 - hit.life / hit.maxLife);
      const fade = Math.max(0, 1 - progress);
      ctx.save();
      const radius = hit.collapse ? 17 + progress * (30 + hit.intensity * 15) : 8 + progress * 20;
      ctx.globalAlpha = fade * (hit.collapse ? .36 : .18);
      ellipse(ctx, hit.x, hit.y, radius, radius * .65, '#f5e1c3', '#d7b68d80', 1);
      if (progress < .14) {
        ctx.globalAlpha = (.14 - progress) * 1.5;
        ellipse(ctx, hit.x, hit.y, 18 + progress * 40, 14 + progress * 25, '#fff5dc');
      }
      ctx.globalAlpha = fade * .8;
      for (let i = -1; i <= 1; i++) {
        const side = i * 12;
        const x = hit.x - hit.direction.y * side;
        const y = hit.y + hit.direction.x * side;
        const reach = 13 + progress * (hit.collapse ? 33 : 17);
        stroke(ctx, [[x - hit.direction.x * (reach + 17), y - hit.direction.y * (reach + 17)],
          [x - hit.direction.x * reach, y - hit.direction.y * reach]], '#c59e65', 3 - progress * 2);
      }
      ctx.restore();
    }
    this.wallBreaks = this.wallBreaks.filter(hit => hit.life > 0);
    for (const p of this.particles) {
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.powder) {
        const damping = Math.pow(.9, dt * 60); p.vx *= damping; p.vy *= damping;
      } else { p.vy += (p.sprite ? 160 : 200) * dt; p.vx *= Math.pow(p.sprite ? .18 : .45, dt); }
      p.angle += p.spin * dt;
      // Fragments fade inside the board rather than accumulating as rubble.
      p.x = Math.max(27, Math.min(WIDTH - 27, p.x));
      p.y = Math.max(27, Math.min(HEIGHT - 27, p.y));
      ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, p.life / (p.sprite ? .12 : .25)));
      ctx.translate(p.x, p.y); ctx.rotate(p.angle);
      if (p.sprite) {
        const image = this.getAsset(p.sprite);
        if (image) ctx.drawImage(image, -p.size / 2, -p.size / 2, p.size, p.size);
      } else if (p.powder) {
        ctx.globalAlpha *= .6;
        ellipse(ctx, 0, 0, p.size, p.size * .7, p.color);
      } else rounded(ctx, -p.size / 2, -p.size / 2, p.size, p.size, 1.5, p.color);
      ctx.restore();
    }
    this.particles = this.particles.filter(p => p.life > 0);
    for (const p of this.impacts) {
      p.life -= dt;
      const progress = Math.max(0, 1 - p.life / p.maxLife);
      const radius = p.size * (.6 + progress * .6);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rotation);
      ctx.globalAlpha = Math.max(0, 1 - progress);
      ctx.beginPath();
      for (let i = 0; i < 16; i++) {
        const r = i % 2 ? radius * .42 : radius * (.8 + (i * 37 % 7) / 14);
        const angle = i / 16 * Math.PI * 2;
        const x = Math.cos(angle) * r, y = Math.sin(angle) * r;
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.closePath(); ctx.fillStyle = '#ffe14a'; ctx.fill();
      ctx.strokeStyle = '#4a3b35'; ctx.lineWidth = 3; ctx.stroke();
      ctx.scale(.5, .5); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.restore();
    }
    this.impacts = this.impacts.filter(p => p.life > 0);
    if (this.shake) {
      this.shake.life -= dt;
      if (this.shake.life <= 0) this.shake = null;
    }
    ctx.restore();
  }
}
