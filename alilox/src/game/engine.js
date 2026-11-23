/* Alilox 3D engine (Three.js) — characters, pets, worlds, physics, controls, online avatars.
   createGame(opts) → { stop(), handleNet(msg), emote(id), bubble(text), S }                        */
import * as THREE from 'three';
import { SKIN, COLORS, HAIRC, EMOTES, WORLDS } from './catalog';
import { level } from './levels';

const SRGB = THREE.SRGBColorSpace;
function faceTexture(emoji, bg) { const c = document.createElement('canvas'); c.width = c.height = 160; const g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, 160, 160); g.font = '112px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(emoji, 80, 88); const t = new THREE.CanvasTexture(c); t.colorSpace = SRGB; return t; }
function label(text, color, big) { const c = document.createElement('canvas'); c.width = 512; c.height = 96; const g = c.getContext('2d'); g.font = 'bold 54px Fredoka, Nunito, Cairo, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; const w = Math.min(500, g.measureText(text).width + 44); g.fillStyle = big ? 'rgba(255,255,255,.95)' : 'rgba(0,0,0,.45)'; g.beginPath(); g.roundRect(256 - w / 2, 10, w, 76, 24); g.fill(); g.fillStyle = color || '#fff'; g.fillText(text, 256, 50); const t = new THREE.CanvasTexture(c); t.colorSpace = SRGB; const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false })); s.scale.set(big ? 4.2 : 3.4, big ? .8 : .64, 1); return s; }
const M = (c) => new THREE.MeshLambertMaterial({ color: c });

/** Build a blocky character. p={name, avatar, photoUrl}  opts={robot} */
export function character(p, opts = {}) {
  const prof = p.avatar || {}; const grp = new THREE.Group(); const robot = !!opts.robot;
  const skin = robot ? 0xB0B8C4 : SKIN[prof.skin] ?? SKIN[0], shirt = robot ? 0x6B7280 : COLORS[prof.shirt] ?? COLORS[2], pants = robot ? 0x4B5563 : COLORS[prof.pants] ?? COLORS[2], hairc = robot ? 0x374151 : HAIRC[prof.hairc] ?? HAIRC[0];
  let faceTex; if (!robot && prof.face === 'photo' && p.photoUrl) { faceTex = new THREE.TextureLoader().load(p.photoUrl); faceTex.colorSpace = SRGB; } else faceTex = faceTexture(robot ? '🤖' : (prof.face && prof.face !== 'photo' ? prof.face : '😀'), '#' + skin.toString(16).padStart(6, '0'));
  const head = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.05, 1.05), [M(skin), M(skin), M(skin), M(skin), new THREE.MeshLambertMaterial({ map: faceTex }), M(skin)]); head.position.y = 2.65; grp.add(head);
  const H = prof.hair || 'short', hm = M(hairc); const addH = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), hm); m.position.set(x, y, z); grp.add(m); return m; };
  if (robot || H !== 'none') addH(1.12, .3, 1.12, 0, 3.1, 0);
  if (H === 'long') { addH(.22, 1.2, 1.0, -.62, 2.45, -.1); addH(.22, 1.2, 1.0, .62, 2.45, -.1); addH(1.12, 1.2, .22, 0, 2.45, -.6); }
  if (H === 'pony') { addH(.34, 1, .34, 0, 2.3, -.75); const b = new THREE.Mesh(new THREE.BoxGeometry(.5, .25, .3), M(0xFF5DA2)); b.position.set(0, 2.95, -.65); grp.add(b); }
  if (H === 'spiky') { [-.3, 0, .3].forEach((x, i) => { const c = new THREE.Mesh(new THREE.ConeGeometry(.17, .55, 6), hm); c.position.set(x, 3.45, i === 1 ? -.15 : .15); c.rotation.z = -x * .8; grp.add(c); }); }
  if (H === 'bun') { const s = new THREE.Mesh(new THREE.SphereGeometry(.3, 12, 10), hm); s.position.set(0, 3.4, -.3); grp.add(s); }
  const torso = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.2, .65), M(shirt)); torso.position.y = 1.5; grp.add(torso);
  const limb = (w, h, d, c, x, y) => { const piv = new THREE.Group(); piv.position.set(x, y, 0); const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(c)); m.position.y = -h / 2; piv.add(m); grp.add(piv); return piv; };
  const armL = limb(.42, 1.15, .42, shirt, -.85, 2.05), armR = limb(.42, 1.15, .42, shirt, .85, 2.05), legL = limb(.52, .95, .52, pants, -.32, .95), legR = limb(.52, .95, .52, pants, .32, .95);
  const hat = robot ? 'none' : prof.hat, G_ = 0xFFD23F;
  if (hat === 'cap') { const c = new THREE.Mesh(new THREE.CylinderGeometry(.6, .62, .3, 16), M(0xEF4444)); c.position.y = 3.35; grp.add(c); const b = new THREE.Mesh(new THREE.BoxGeometry(.7, .08, .55), M(0xB91C1C)); b.position.set(0, 3.22, .65); grp.add(b); }
  if (hat === 'crown') { const c = new THREE.Mesh(new THREE.CylinderGeometry(.52, .56, .4, 8), M(G_)); c.position.y = 3.42; grp.add(c); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const k = new THREE.Mesh(new THREE.ConeGeometry(.12, .3, 4), M(G_)); k.position.set(Math.cos(a) * .5, 3.75, Math.sin(a) * .5); grp.add(k); } const j = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 8), M(0xEF4444)); j.position.set(0, 3.45, .55); grp.add(j); }
  if (hat === 'party') { const c = new THREE.Mesh(new THREE.ConeGeometry(.45, 1, 12), M(0xA78BFA)); c.position.y = 3.7; grp.add(c); const b = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 8), M(G_)); b.position.y = 4.22; grp.add(b); }
  if (hat === 'headphones') { const band = new THREE.Mesh(new THREE.TorusGeometry(.66, .07, 8, 24, Math.PI), M(0x111827)); band.position.y = 2.7; grp.add(band);[-.66, .66].forEach(x => { const e = new THREE.Mesh(new THREE.CylinderGeometry(.27, .27, .16, 16), M(0xFF5DA2)); e.rotation.z = Math.PI / 2; e.position.set(x, 2.65, 0); grp.add(e); }); }
  if (hat === 'bunny') { [-.3, .3].forEach(x => { const e = new THREE.Mesh(new THREE.BoxGeometry(.24, .9, .12), M(0xF1F5F9)); e.position.set(x, 3.65, 0); e.rotation.z = -x * .4; grp.add(e); const i = new THREE.Mesh(new THREE.BoxGeometry(.12, .6, .05), M(0xFF5DA2)); i.position.set(x, 3.65, .05); i.rotation.z = -x * .4; grp.add(i); }); }
  if (hat === 'flower') { const s = new THREE.Mesh(new THREE.SphereGeometry(.14, 8, 8), M(G_)); s.position.set(.45, 3.2, .35); grp.add(s); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const pt = new THREE.Mesh(new THREE.SphereGeometry(.11, 8, 8), M(0xFF5DA2)); pt.position.set(.45 + Math.cos(a) * .2, 3.2 + Math.sin(a) * .2, .38); grp.add(pt); } }
  if (hat === 'halo') { const h = new THREE.Mesh(new THREE.TorusGeometry(.5, .06, 8, 24), new THREE.MeshLambertMaterial({ color: G_, emissive: 0xC98A00 })); h.rotation.x = Math.PI / 2; h.position.y = 3.6; grp.add(h); }
  if (hat === 'wizard') { const c = new THREE.Mesh(new THREE.ConeGeometry(.6, 1.3, 12), M(0x6D28D9)); c.position.y = 3.85; grp.add(c); const b = new THREE.Mesh(new THREE.CylinderGeometry(.9, .9, .08, 16), M(0x6D28D9)); b.position.y = 3.22; grp.add(b); }
  const back = robot ? 'none' : prof.back; const flames = [];
  if (back === 'cape') { const c = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.55, .08), M(0xEF4444)); c.position.set(0, 1.45, -.42); grp.add(c); }
  if (back === 'wings') { [-1, 1].forEach(s => { const w = new THREE.Mesh(new THREE.BoxGeometry(1.1, .8, .08), M(0xF8FAFC)); w.position.set(s * .9, 2, -.45); w.rotation.z = s * .5; grp.add(w); const w2 = new THREE.Mesh(new THREE.BoxGeometry(.7, .5, .08), M(0xF8FAFC)); w2.position.set(s * 1.3, 1.4, -.45); w2.rotation.z = s * .9; grp.add(w2); }); }
  if (back === 'jetpack') { [-.3, .3].forEach(x => { const t = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, 1, 12), M(0x9CA3AF)); t.position.set(x, 1.5, -.55); grp.add(t); const f = new THREE.Mesh(new THREE.ConeGeometry(.18, .5, 8), new THREE.MeshBasicMaterial({ color: 0xFF8A3D })); f.rotation.x = Math.PI; f.position.set(x, .8, -.55); grp.add(f); flames.push(f); }); }
  grp.traverse(o => { if (o.isMesh) o.castShadow = true; });
  const lb = label(robot ? 'Robot' : (p.name || ''), robot ? '#E5E7EB' : '#FFD23F'); lb.position.y = 3.95 + (hat === 'wizard' || hat === 'party' ? .6 : 0); grp.add(lb);
  grp.scale.setScalar(.62); grp.userData = { armL, armR, legL, legR, phase: 0, emote: null, emoteT: 0, flames, labelY: lb.position.y, label: lb }; return grp;
}
export function pet(kind) {
  const g = new THREE.Group(); const col = { duck: 0xFFD23F, cat: 0xF59E0B, dog: 0xA16207, dragon: 0x22C55E, robot: 0x9CA3AF }[kind] || 0xffffff;
  const body = new THREE.Mesh(new THREE.BoxGeometry(.7, .55, .9), M(col)); body.position.y = .5; g.add(body); const head = new THREE.Mesh(new THREE.BoxGeometry(.55, .5, .5), M(col)); head.position.set(0, .95, .45); g.add(head);
  [-.15, .15].forEach(x => { const e = new THREE.Mesh(new THREE.BoxGeometry(.08, .1, .05), M(0x111827)); e.position.set(x, 1, .72); g.add(e); });
  if (kind === 'duck') { const b = new THREE.Mesh(new THREE.BoxGeometry(.3, .1, .25), M(0xFF8A3D)); b.position.set(0, .88, .8); g.add(b); }
  if (kind === 'cat' || kind === 'dog') { [-.18, .18].forEach(x => { const e = new THREE.Mesh(kind === 'cat' ? new THREE.ConeGeometry(.1, .25, 4) : new THREE.BoxGeometry(.14, .3, .08), M(col)); e.position.set(x, kind === 'cat' ? 1.3 : 1.05, .45); if (kind === 'dog') e.rotation.z = x * 2; g.add(e); }); const t = new THREE.Mesh(new THREE.BoxGeometry(.1, .1, .5), M(col)); t.position.set(0, .6, -.65); g.add(t); }
  if (kind === 'dragon') { [-1, 1].forEach(s => { const w = new THREE.Mesh(new THREE.BoxGeometry(.6, .4, .06), M(0x16A34A)); w.position.set(s * .6, .85, 0); w.rotation.z = s * .6; g.add(w); }); const h = new THREE.Mesh(new THREE.ConeGeometry(.08, .25, 4), M(0xFFD23F)); h.position.set(0, 1.3, .45); g.add(h); }
  if (kind === 'robot') { const a = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .3), M(0x111827)); a.position.set(0, 1.3, .45); g.add(a); const l = new THREE.Mesh(new THREE.SphereGeometry(.08, 8, 8), new THREE.MeshBasicMaterial({ color: 0xFF5DA2 })); l.position.set(0, 1.47, .45); g.add(l); }
  [[-.25, .3], [.25, .3], [-.25, -.3], [.25, -.3]].forEach(a => { const l = new THREE.Mesh(new THREE.BoxGeometry(.18, .3, .18), M(col)); l.position.set(a[0], .15, a[1]); g.add(l); });
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); g.scale.setScalar(.6); return g;
}
export function animate(ch, moving, dt, wave) {
  const u = ch.userData; u.phase += dt * (moving ? 9 : 0); const a = moving ? Math.sin(u.phase) * .8 : 0;
  if (u.emote) { u.emoteT += dt; const t = u.emoteT, e = u.emote; if (t > 2.2) { u.emote = null; ch.rotation.y = u.baseRot ?? ch.rotation.y; ch.position.y = u.baseY ?? ch.position.y; }
    else if (e === 'wave') { u.armR.rotation.z = -2.6 - Math.sin(t * 12) * .5; u.armL.rotation.z = 0; u.armL.rotation.x = u.armR.rotation.x = 0; u.legL.rotation.x = u.legR.rotation.x = 0; return; }
    else if (e === 'dance') { const s = Math.sin(t * 10); u.armL.rotation.z = 1.2 + s; u.armR.rotation.z = -1.2 + s; u.armL.rotation.x = u.armR.rotation.x = 0; u.legL.rotation.x = s * .5; u.legR.rotation.x = -s * .5; ch.rotation.y = (u.baseRot || 0) + s * .35; return; }
    else if (e === 'spin') { ch.rotation.y += dt * 12; u.armL.rotation.z = 1.5; u.armR.rotation.z = -1.5; return; }
    else if (e === 'cheer') { u.armL.rotation.z = 2.9; u.armR.rotation.z = -2.9; u.armL.rotation.x = u.armR.rotation.x = 0; ch.position.y = (u.baseY || 0) + Math.abs(Math.sin(t * 7)) * .5; u.legL.rotation.x = u.legR.rotation.x = 0; return; } }
  if (wave) { const w = Math.sin(performance.now() / 180) * .5; u.armL.rotation.z = 2.6 + w; u.armR.rotation.z = -2.6 - w; u.armL.rotation.x = u.armR.rotation.x = 0; }
  else { u.armL.rotation.x = a; u.armR.rotation.x = -a; u.armL.rotation.z = u.armR.rotation.z = 0; }
  u.legL.rotation.x = -a; u.legR.rotation.x = a; u.flames.forEach(f => { f.scale.y = .6 + Math.random() * .8; });
}
export function emoteOn(ch, id) { const u = ch.userData; u.emote = id; u.emoteT = 0; u.baseRot = ch.rotation.y; u.baseY = ch.position.y; }
export function bubbleOn(ch, text) { const u = ch.userData; if (u.bubble) ch.remove(u.bubble); const b = label(text, '#141A3B', true); b.position.y = u.labelY + .95; ch.add(b); u.bubble = b; u.bubbleT = 2.6; }
function bubbleTick(ch, dt) { const u = ch.userData; if (u.bubble) { u.bubbleT -= dt; if (u.bubbleT <= 0) { ch.remove(u.bubble); u.bubble = null; } } }
function mulberry(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/** Avatar preview (spinning character + pet) on a canvas. Returns {rebuild(p), stop()} */
export function preview(canvas, p) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.outputColorSpace = SRGB;
  const scene = new THREE.Scene(); const cam = new THREE.PerspectiveCamera(35, 1, .1, 50); cam.position.set(0, 1.6, 5.4); cam.lookAt(0, 1.1, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8899ff, .9)); const d = new THREE.DirectionalLight(0xffffff, .7); d.position.set(2, 4, 3); scene.add(d);
  let ch = null, pt = null, rot = 0, drag = null, alive = true;
  const V = { rebuild(np) { p = np || p; if (ch) scene.remove(ch); if (pt) scene.remove(pt); ch = character(p); ch.rotation.y = rot; scene.add(ch); pt = null; const k = p.avatar && p.avatar.pet; if (k && k !== 'none') { pt = pet(k); pt.position.set(1.1, 0, .4); pt.rotation.y = -.4; scene.add(pt); } }, stop() { alive = false; try { renderer.dispose(); } catch { } } };
  V.rebuild(p);
  const resize = () => { const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX }; canvas.setPointerCapture?.(e.pointerId); }); canvas.addEventListener('pointermove', e => { if (drag) { rot += (e.clientX - drag.x) * .02; drag.x = e.clientX; } }); canvas.addEventListener('pointerup', () => drag = null); canvas.addEventListener('pointercancel', () => drag = null);
  let last = performance.now(); const loop = (now) => { if (!alive || !canvas.isConnected) { try { renderer.dispose(); } catch { } return; } const dt = Math.min(.05, (now - last) / 1000); last = now; if (!drag) rot += dt * .5; if (ch) { ch.rotation.y = rot; animate(ch, false, dt, Math.sin(now / 900) > .6); } if (pt) pt.position.y = Math.abs(Math.sin(now / 300)) * .15; resize(); renderer.render(scene, cam); requestAnimationFrame(loop); }; requestAnimationFrame(loop);
  return V;
}

/**
 * createGame({host, canvas, world, data, me:{id,name,avatar,photoUrl}, others:[{id,name,avatar,photoUrl}], mode:'solo'|'cpu'|'online', seed, settings:{sens,invert,shadows,sound}, season,
 *   on:{finish(run), msg(text), hud(obj), portal(id), net(msg), sfx(name)}})
 */
export function createGame(o) {
  const { host, canvas } = o; const W = WORLDS.find(w => w.id === o.world) || {}; const LV = level(o.world, o.data); const SET = Object.assign({ sens: 8, invert: false, shadows: true }, o.settings || {}); const on = o.on || {};
  const sfx = (n) => on.sfx && on.sfx(n); const msg = (t, ms) => { const m = host.querySelector('#alx-msg'); if (!m) return; m.textContent = t; m.classList.add('show'); S.msgT = (ms || 1500) / 1000; };
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.outputColorSpace = SRGB; renderer.shadowMap.enabled = !!SET.shadows; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const skyC = new THREE.Color(o.season?.sky || (o.world === 'tower' ? 0x9ad7ff : o.world === 'city' ? 0x8ED6FF : 0x7EC8FF));
  const scene = new THREE.Scene(); scene.background = skyC; scene.fog = new THREE.Fog(skyC, 60, 160);
  const camera = new THREE.PerspectiveCamera(60, 1, .1, 300);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9ad0ff, .9)); const sun = new THREE.DirectionalLight(0xffffff, 1.4); sun.castShadow = !!SET.shadows; sun.shadow.mapSize.set(1024, 1024); const sc = sun.shadow.camera; sc.left = sc.bottom = -30; sc.right = sc.top = 30; sc.far = 120; scene.add(sun); scene.add(sun.target);
  const isPark = o.world === 'park' || o.world === 'city';
  const lava = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshBasicMaterial({ color: isPark ? 0x2563EB : 0xFF4D1F })); lava.rotation.x = -Math.PI / 2; lava.position.y = -6; scene.add(lava);
  const lava2 = new THREE.Mesh(new THREE.PlaneGeometry(600, 600, 60, 60), new THREE.MeshBasicMaterial({ color: isPark ? 0x93C5FD : 0xFFB020, wireframe: true, transparent: true, opacity: .3 })); lava2.rotation.x = -Math.PI / 2; lava2.position.y = -5.9; scene.add(lava2);
  for (let i = 0; i < 14; i++) { const c = new THREE.Group(); const m = new THREE.MeshLambertMaterial({ color: 0xffffff }); for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(3 + Math.random() * 3, 1.2, 2 + Math.random() * 2), m); b.position.set(k * 2.2 - 2, Math.random() * .6, Math.random() * 1.5); c.add(b); } c.position.set((Math.random() - .5) * 140, (o.world === 'tower' ? 8 : 18) + Math.random() * 25, Math.random() * 160 - 40); scene.add(c); }
  // party event (fireworks, balloons, banner)
  const party = []; let partyT = 0; if (o.event) { const bl = []; for (let i = 0; i < 24; i++) { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.SphereGeometry(.7, 12, 10), M([0xFF5DA2, 0xFFD23F, 0x2EE6D6, 0xA78BFA, 0x4ADE80][i % 5])); b.position.y = .8; const st = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, 2.2), M(0xffffff)); st.position.y = -.5; g.add(b, st); g.position.set((Math.random() - .5) * 60, 2 + Math.random() * 10, (Math.random() - .5) * 60); g.userData.v = .6 + Math.random(); scene.add(g); bl.push(g); } party.push(...bl);
    const banner = label('🎉 ' + (o.event.title || 'PARTY'), '#141A3B', true); banner.scale.set(14, 2.6, 1); banner.position.set(0, 12, 0); scene.add(banner); }
  const sparks = []; function firework() { const x = (Math.random() - .5) * 50 + S.pos.x, z = (Math.random() - .5) * 50 + S.pos.z, y = 14 + Math.random() * 8; const col = [0xFF5DA2, 0xFFD23F, 0x2EE6D6, 0xA78BFA, 0x4ADE80, 0xffffff][Math.floor(Math.random() * 6)]; const n = 60; const g = new THREE.BufferGeometry(); const pos = new Float32Array(n * 3); const vel = []; for (let i = 0; i < n; i++) { pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1), sp = 4 + Math.random() * 5; vel.push([Math.sin(ph) * Math.cos(th) * sp, Math.cos(ph) * sp, Math.sin(ph) * Math.sin(th) * sp]); } g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: col, size: .5, transparent: true })); scene.add(pts); sparks.push({ pts, vel, t: 0 }); sfx('ok'); }
  // snow (season)
  let snow = null; if (o.season?.snow) { const g = new THREE.BufferGeometry(); const n = 600; const pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - .5) * 120; pos[i * 3 + 1] = Math.random() * 40; pos[i * 3 + 2] = (Math.random() - .5) * 120; } g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); snow = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: .35 })); scene.add(snow); }
  // decor
  LV.decor.forEach(d => { const g = new THREE.Group();
    if (d.kind === 'tree') { const tr = new THREE.Mesh(new THREE.BoxGeometry(.6, 2, .6), M(0x92400E)); tr.position.y = 1.5; const lf = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 2.2), M([0x16A34A, 0x22C55E, 0x4ADE80][Math.floor(Math.random() * 3)])); lf.position.y = 3.3; g.add(tr, lf); g.position.set(d.x, .5, d.z); }
    if (d.kind === 'house') { const b = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 6), M(d.c)); b.position.y = 2.5; const r = new THREE.Mesh(new THREE.ConeGeometry(4.6, 2.6, 4), M(0x7C2D12)); r.position.y = 5.8; r.rotation.y = Math.PI / 4; const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2, .2), M(0x1F2B5B)); door.position.set(0, 1.5, 3.05); const win = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1, .2), M(0xBAE6FD)); win.position.set(1.9, 3, 3.05); g.add(b, r, door, win); g.position.set(d.x, .5, d.z); }
    if (d.kind === 'sign') { const s = label(d.text, '#FFD23F'); s.scale.set(7, 1.3, 1); s.position.set(d.x, d.y, d.z); g.add(s); }
    g.traverse(x => { if (x.isMesh) x.castShadow = true; }); scene.add(g); });
  // platforms
  const plats = LV.P.map(p => { const mesh = new THREE.Mesh(new THREE.BoxGeometry(p.w, p.h, p.d), new THREE.MeshLambertMaterial({ color: p.c })); mesh.position.set(p.x, p.y, p.z); mesh.receiveShadow = true; mesh.castShadow = p.kind !== 'deco' && p.kind !== 'start'; scene.add(mesh);
    const q = { ...p, mesh, bx: p.x, bz: p.z, cx: p.x, cz: p.z, dx: 0, dz: 0, hit: false, gone: false };
    if (p.kind === 'check') { const f = new THREE.Mesh(new THREE.BoxGeometry(.15, 2.2, .15), M(0xffffff)); f.position.set(p.x + p.w / 2 - .5, p.y + 1.5, p.z + p.d / 2 - .5); scene.add(f); const fl = new THREE.Mesh(new THREE.BoxGeometry(.1, .6, 1), M(0x4ADE80)); fl.position.set(p.x + p.w / 2 - .5, p.y + 2.3, p.z + p.d / 2 - 1); scene.add(fl); q.flag = fl; }
    if (p.kind === 'finish') { const ring = new THREE.Mesh(new THREE.TorusGeometry(2.4, .35, 16, 40), new THREE.MeshLambertMaterial({ color: 0xFFD23F, emissive: 0xC98A00 })); ring.position.set(p.x, p.y + 3.2, p.z + 1); scene.add(ring); const disc = new THREE.Mesh(new THREE.CircleGeometry(2.1, 40), new THREE.MeshBasicMaterial({ color: 0xA78BFA, transparent: true, opacity: .55, side: THREE.DoubleSide })); disc.position.copy(ring.position); scene.add(disc); q.ring = ring; q.disc = disc; }
    return q; });
  const solids = plats.filter(p => p.kind !== 'deco'); const fin = plats.find(p => p.kind === 'finish');
  // portals (city)
  const portals = LV.portals.map(pt => { const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2, .3, 12, 32), new THREE.MeshLambertMaterial({ color: 0xFFD23F, emissive: 0x8a6a00 })); ring.position.set(pt.x, 3.4, pt.z); scene.add(ring); const disc = new THREE.Mesh(new THREE.CircleGeometry(1.9, 32), new THREE.MeshBasicMaterial({ color: 0x2EE6D6, transparent: true, opacity: .5, side: THREE.DoubleSide })); disc.position.copy(ring.position); scene.add(disc); const lb = label(pt.ic + ' ' + (o.names?.[pt.id] || pt.id), '#141A3B', true); lb.position.set(pt.x, 6.2, pt.z); scene.add(lb); return { ...pt, ring, disc }; });
  const coinGeo = new THREE.CylinderGeometry(.45, .45, .12, 20), coinMat = new THREE.MeshLambertMaterial({ color: 0xFFD23F, emissive: 0x8a6a00 });
  const coins = LV.coins.map(c => { const m = new THREE.Mesh(coinGeo, coinMat); m.rotation.x = Math.PI / 2; m.position.set(c.x, c.y, c.z); m.castShadow = true; scene.add(m); return { m, x: c.x, y: c.y, z: c.z, got: false }; });
  // me + others
  const ch = character(o.me); scene.add(ch); let myPet = null; if (o.me.avatar?.pet && o.me.avatar.pet !== 'none') { myPet = pet(o.me.avatar.pet); scene.add(myPet); }
  const remote = new Map(); const addRemote = (p) => { if (remote.has(p.id) || p.id === o.me.id) return; const c = character(p); c.position.set(LV.spawn.x, LV.spawn.y, LV.spawn.z); scene.add(c); let pt = null; if (p.avatar?.pet && p.avatar.pet !== 'none') { pt = pet(p.avatar.pet); scene.add(pt); } remote.set(p.id, { ch: c, pet: pt, tx: LV.spawn.x, ty: LV.spawn.y, tz: LV.spawn.z, r: 0, m: false, air: false }); };
  (o.others || []).forEach(addRemote);
  let robot = null, robotPath = null, robotLen = 0; if (o.mode === 'cpu' && W.robotTime) { robot = character({ name: 'Robot' }, { robot: true }); robot.traverse(x => { if (x.isMesh && x.material && !x.material.map) { x.material = x.material.clone(); x.material.transparent = true; x.material.opacity = .8; } }); scene.add(robot); robotPath = solids.filter(p => p.kind !== 'wall').map(p => new THREE.Vector3(p.x, p.y + p.h / 2, p.z)); for (let i = 1; i < robotPath.length; i++) robotLen += robotPath[i].distanceTo(robotPath[i - 1]); }
  // arena schedule (deterministic from seed)
  const rnd = mulberry(o.seed || 1); const tiles = solids.filter(p => p.kind === 'tile'); let arenaT = 0, nextDrop = 3, dropping = [];
  // state
  const SP = LV.spawn; const S = { pos: new THREE.Vector3(SP.x, SP.y, SP.z), vel: new THREE.Vector3(), yaw: SP.yaw || 0, pitch: .42, dist: 7.5, onGround: false, ground: null, coyote: 0, jumpBuf: 0, coins: 0, deaths: 0, t: 0, started: o.world === 'arena', done: false, cp: new THREE.Vector3(SP.x, SP.y, SP.z), msgT: 0, robotDone: false, idle: 0, left: W.timed || 0, alive: true, portalT: 0 };
  const HW = .33, HT = 1.85, GRAV = 30, JUMP = 11.5, SPEED = 6.2, SENS = SET.sens * .001 * (SET.invert ? -1 : 1);
  const keys = {}; const inp = { jx: 0, jy: 0, jump: false }; let joy = null, look = null; const ptrs = new Map(); let pinch = null;
  const onKey = e => { if (e.repeat) return; const k = e.key.toLowerCase(); if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault(); keys[k] = e.type === 'keydown'; if (e.type === 'keydown') { if (k === ' ') inp.jump = true; if ('1234'.includes(k) && k) api.emote(EMOTES[+k - 1].id); } };
  const onWheel = e => { e.preventDefault(); S.dist = Math.max(3.5, Math.min(14, S.dist + e.deltaY * .01)); };
  window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKey); host.addEventListener('wheel', onWheel, { passive: false });
  const joyEl = host.querySelector('#alx-joy'), knob = joyEl.querySelector('.knob');
  const isUI = t => t.closest && t.closest('#alx-jump,#alx-top,#alx-side,#alx-wheel');
  const pd = e => { if (isUI(e.target)) return; const r = host.getBoundingClientRect(); const x = e.clientX - r.left, y = e.clientY - r.top; host.setPointerCapture?.(e.pointerId); ptrs.set(e.pointerId, { x, y });
    if (e.pointerType !== 'mouse' && x < r.width / 2 && !joy) { joy = { id: e.pointerId, ox: x, oy: y }; joyEl.hidden = false; joyEl.style.left = (x - 55) + 'px'; joyEl.style.top = (y - 55) + 'px'; knob.style.transform = 'translate(0,0)'; }
    else if (!look) look = { id: e.pointerId, lx: x, ly: y };
    const others = [...ptrs.keys()].filter(id => !joy || id !== joy.id); if (others.length === 2) { const a = ptrs.get(others[0]), b = ptrs.get(others[1]); pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: S.dist }; } };
  const pm = e => { const r = host.getBoundingClientRect(); const x = e.clientX - r.left, y = e.clientY - r.top; if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x, y });
    if (pinch) { const others = [...ptrs.keys()].filter(id => !joy || id !== joy.id); if (others.length === 2) { const a = ptrs.get(others[0]), b = ptrs.get(others[1]); const d = Math.hypot(a.x - b.x, a.y - b.y); S.dist = Math.max(3.5, Math.min(14, pinch.dist * pinch.d / Math.max(10, d))); } if (look) { look.lx = x; look.ly = y; } return; }
    if (joy && e.pointerId === joy.id) { let dx = x - joy.ox, dy = y - joy.oy; const d = Math.hypot(dx, dy); if (d > 45) { dx = dx / d * 45; dy = dy / d * 45; } inp.jx = dx / 45; inp.jy = dy / 45; knob.style.transform = `translate(${dx}px,${dy}px)`; }
    else if (look && e.pointerId === look.id) { S.yaw -= (x - look.lx) * SENS; S.pitch = Math.max(-0.35, Math.min(1.25, S.pitch + (y - look.ly) * SENS * (SET.invert ? -1 : 1))); look.lx = x; look.ly = y; } };
  const pu = e => { ptrs.delete(e.pointerId); if (joy && e.pointerId === joy.id) { joy = null; inp.jx = inp.jy = 0; joyEl.hidden = true; } if (look && e.pointerId === look.id) look = null; if (ptrs.size < 2) pinch = null; };
  host.addEventListener('pointerdown', pd); host.addEventListener('pointermove', pm); host.addEventListener('pointerup', pu); host.addEventListener('pointercancel', pu);
  const jb = host.querySelector('#alx-jump'); const jd = e => { e.preventDefault(); inp.jump = true; }; jb.addEventListener('pointerdown', jd); jb.addEventListener('contextmenu', e => e.preventDefault());
  const hud = (k, v) => { const el = host.querySelector('#alx-' + k); if (el) el.textContent = v; };
  function respawn() { if (o.world === 'arena') { S.alive = false; finish(false); return; } S.pos.copy(S.cp); S.vel.set(0, 0, 0); S.deaths++; const d = host.querySelector('#alx-deaths'); if (d) { d.hidden = false; d.querySelector('b').textContent = S.deaths; } sfx('bad'); msg(isPark ? 'Splash! 🌊' : 'Oops! Back to the checkpoint 🔁', 1400); }
  const overlap = (p, px, py, pz) => !p.gone && px + HW > p.cx - p.w / 2 && px - HW < p.cx + p.w / 2 && py < p.y + p.h / 2 && py + HT > p.y - p.h / 2 && pz + HW > p.cz - p.d / 2 && pz - HW < p.cz + p.d / 2;
  let netTick = 0, lastPortal = null;
  function finish(finished) { if (S.done) return; S.done = true; const run = { world: o.world, mode: o.mode, score: 0, coins: S.coins, time: Math.floor(S.t), deaths: S.deaths, finished, beatRobot: o.mode === 'cpu' && finished && !S.robotDone };
    let sc = S.coins * 10 - S.deaths * 5; if (o.world === 'arena') sc = Math.floor(S.t) * 2 + (finished ? 30 : 0); else if (finished) sc += W.timed ? (50 + Math.floor(S.left) * 2) : (50 + Math.max(0, (o.world === 'tower' ? 200 : 150) - Math.floor(S.t))); if (run.beatRobot) sc += 30; run.score = Math.max(0, sc);
    if (finished) sfx('win'); on.finish && on.finish(run); }
  function step(dt) {
    const now = S.t; solids.forEach(p => { if (!p.mv) return; const off = Math.sin(now * p.mv.speed) * p.mv.range; const nx = p.mv.axis === 'x' ? p.bx + off : p.bx, nz = p.mv.axis === 'z' ? p.bz + off : p.bz; p.dx = nx - p.cx; p.dz = nz - p.cz; p.cx = nx; p.cz = nz; p.mesh.position.set(nx, p.y, nz); });
    if (S.ground && S.ground.mv && S.onGround) { S.pos.x += S.ground.dx; S.pos.z += S.ground.dz; }
    let mx = inp.jx, mz = -inp.jy; if (keys['w'] || keys['arrowup']) mz += 1; if (keys['s'] || keys['arrowdown']) mz -= 1; if (keys['a'] || keys['arrowleft']) mx -= 1; if (keys['d'] || keys['arrowright']) mx += 1; if (keys['q']) S.yaw += dt * 2.2; if (keys['e']) S.yaw -= dt * 2.2; if (keys['r']) S.pitch = Math.min(1.25, S.pitch + dt * 1.5); if (keys['f']) S.pitch = Math.max(-0.35, S.pitch - dt * 1.5);
    const len = Math.hypot(mx, mz); if (len > 1) { mx /= len; mz /= len; }
    const fx = Math.sin(S.yaw), fz = Math.cos(S.yaw), rx = -Math.cos(S.yaw), rz = Math.sin(S.yaw);
    const vx = (fx * mz + rx * mx) * SPEED, vz = (fz * mz + rz * mx) * SPEED; const moving = len > .05;
    if (moving && !S.started) S.started = true;
    if (inp.jump) { S.jumpBuf = .15; inp.jump = false; }
    S.coyote = S.onGround ? .1 : Math.max(0, S.coyote - dt); S.jumpBuf = Math.max(0, S.jumpBuf - dt);
    if (S.jumpBuf > 0 && S.coyote > 0) { S.vel.y = JUMP; S.onGround = false; S.coyote = 0; S.jumpBuf = 0; S.ground = null; sfx('tap'); S.started = true; ch.userData.emote = null; }
    S.vel.y -= GRAV * dt; if (S.vel.y < -40) S.vel.y = -40;
    S.pos.x += vx * dt; solids.forEach(p => { if (overlap(p, S.pos.x, S.pos.y, S.pos.z)) S.pos.x = vx > 0 || (vx === 0 && S.pos.x < p.cx) ? p.cx - p.w / 2 - HW - .001 : p.cx + p.w / 2 + HW + .001; });
    S.pos.z += vz * dt; solids.forEach(p => { if (overlap(p, S.pos.x, S.pos.y, S.pos.z)) S.pos.z = vz > 0 || (vz === 0 && S.pos.z < p.cz) ? p.cz - p.d / 2 - HW - .001 : p.cz + p.d / 2 + HW + .001; });
    S.pos.y += S.vel.y * dt; S.onGround = false; solids.forEach(p => { if (overlap(p, S.pos.x, S.pos.y, S.pos.z)) { if (S.vel.y <= 0 && S.pos.y > p.y - p.h / 2) { S.pos.y = p.y + p.h / 2; S.vel.y = 0; S.onGround = true; S.ground = p; } else if (S.vel.y > 0) { S.pos.y = p.y - p.h / 2 - HT - .001; S.vel.y = 0; } } });
    if (S.onGround && S.ground) { const p = S.ground; if (p.kind === 'check' && !p.hit) { p.hit = true; S.cp.set(p.x, p.y + p.h / 2, p.z); p.flag.material.color.set(0xFFD23F); sfx('ok'); msg('Checkpoint! 🚩', 1200); } if (p.kind === 'finish' && !S.done) { finish(true); return; } }
    if (S.pos.y < -4) respawn();
    coins.forEach(c => { if (c.got) return; c.m.rotation.z += dt * 3; if (Math.abs(c.x - S.pos.x) < 1 && Math.abs(c.z - S.pos.z) < 1 && S.pos.y + HT > c.y - .6 && S.pos.y < c.y + .6) { c.got = true; c.m.visible = false; S.coins++; hud('coins', S.coins); sfx('ok'); if (o.world === 'park' && S.coins === coins.length) finish(true); } });
    // portals
    S.portalT = Math.max(0, S.portalT - dt); portals.forEach(pt => { pt.ring.rotation.y += dt; if (S.portalT <= 0 && Math.hypot(pt.x - S.pos.x, pt.z - S.pos.z) < 2.2 && S.onGround) { S.portalT = 3; on.portal && on.portal(pt.id); } });
    // arena tiles
    if (o.world === 'arena' && !S.done) { arenaT += dt; if (arenaT >= nextDrop) { nextDrop += Math.max(.8, 2.6 - arenaT * .03); const alive = tiles.filter(t => !t.gone && !t.flash); const n = Math.min(alive.length - 2, 2 + Math.floor(arenaT / 10)); for (let i = 0; i < n; i++) { const t = alive.splice(Math.floor(rnd() * alive.length), 1)[0]; if (t) { t.flash = 1.1; t.mesh.material = t.mesh.material.clone(); } } }
      tiles.forEach(t => { if (t.flash != null && !t.gone) { t.flash -= dt; t.mesh.material.color.setHex(Math.floor(t.flash * 8) % 2 ? 0xffffff : 0xEF4444); if (t.flash <= 0) { t.gone = true; t.mesh.visible = false; } } });
      if (tiles.every(t => t.gone) && S.alive) finish(true); hud('time', Math.floor(S.t)); }
    // character
    ch.position.copy(S.pos); if (moving) { ch.rotation.y = Math.atan2(vx, vz); S.idle = 0; ch.userData.emote = null; } else { S.idle += dt; if (S.idle > 1.2 && S.onGround && !ch.userData.emote) { const target = S.yaw + Math.PI; let diff = ((target - ch.rotation.y + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; ch.rotation.y += diff * Math.min(1, dt * 4); } }
    animate(ch, moving && S.onGround, dt, false); if (!S.onGround && !ch.userData.emote) { ch.userData.armL.rotation.z = 2.8; ch.userData.armR.rotation.z = -2.8; } bubbleTick(ch, dt);
    if (myPet) { const tx = S.pos.x - fx * 1.4 + rx * 1.1, tz = S.pos.z - fz * 1.4 + rz * 1.1; myPet.position.x += (tx - myPet.position.x) * Math.min(1, dt * 4); myPet.position.z += (tz - myPet.position.z) * Math.min(1, dt * 4); myPet.position.y += (S.pos.y - myPet.position.y) * Math.min(1, dt * 6); myPet.position.y += moving ? Math.abs(Math.sin(now * 12)) * .25 : 0; const d = Math.hypot(S.pos.x - myPet.position.x, S.pos.z - myPet.position.z); if (d > .3) myPet.rotation.y = Math.atan2(S.pos.x - myPet.position.x, S.pos.z - myPet.position.z); }
    if (o.mode === 'online') { netTick += dt; if (netTick > .08) { netTick = 0; on.net && on.net({ t: 's', p: o.me.id, x: +S.pos.x.toFixed(2), y: +S.pos.y.toFixed(2), z: +S.pos.z.toFixed(2), r: +ch.rotation.y.toFixed(2), m: moving && S.onGround ? 1 : 0, a: S.onGround ? 0 : 1 }); } }
    remote.forEach(R => { const k = Math.min(1, dt * 10); R.ch.position.x += (R.tx - R.ch.position.x) * k; R.ch.position.y += (R.ty - R.ch.position.y) * k; R.ch.position.z += (R.tz - R.ch.position.z) * k; let diff = ((R.r - R.ch.rotation.y + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; if (R.ch.userData.emote !== 'spin') R.ch.rotation.y += diff * k; animate(R.ch, R.m, dt, false); if (R.air && !R.ch.userData.emote) { R.ch.userData.armL.rotation.z = 2.8; R.ch.userData.armR.rotation.z = -2.8; } bubbleTick(R.ch, dt);
      if (R.pet) { R.pet.position.x += (R.ch.position.x - 1.2 - R.pet.position.x) * Math.min(1, dt * 4); R.pet.position.z += (R.ch.position.z - 1 - R.pet.position.z) * Math.min(1, dt * 4); R.pet.position.y += (R.ch.position.y - R.pet.position.y) * Math.min(1, dt * 6); } });
    if (S.started && !S.done) { S.t += dt; if (W.timed) { S.left = Math.max(0, W.timed - S.t); hud('time', Math.ceil(S.left)); if (S.left <= 0) { finish(false); return; } } else if (o.world !== 'arena') hud('time', Math.floor(S.t)); }
    if (robot) { const frac = Math.min(1, S.t / W.robotTime); let dist = frac * robotLen, i = 1; while (i < robotPath.length - 1 && dist > robotPath[i].distanceTo(robotPath[i - 1])) { dist -= robotPath[i].distanceTo(robotPath[i - 1]); i++; } const a = robotPath[i - 1], b = robotPath[i], segL = a.distanceTo(b), u = segL ? Math.min(1, dist / segL) : 1; robot.position.lerpVectors(a, b, u); robot.position.x += 1.3; robot.position.y += Math.sin(u * Math.PI) * 1.2; robot.rotation.y = Math.atan2(b.x - a.x, b.z - a.z); animate(robot, frac < 1, dt, frac >= 1); hud('robot', '🤖 ' + Math.round(frac * 100) + '%'); if (frac >= 1 && !S.robotDone) { S.robotDone = true; msg('🤖 Robot reached the portal first!', 2000); } }
    if (fin && fin.ring) { fin.ring.rotation.y += dt; fin.disc.rotation.z -= dt * .6; }
    if (o.event) { partyT += dt; party.forEach(g => { g.position.y += g.userData.v * dt; g.position.x += Math.sin(partyT + g.position.z) * dt * .3; if (g.position.y > 24) g.position.y = 1; }); if (Math.random() < dt * .8) firework();
      for (let i = sparks.length - 1; i >= 0; i--) { const f = sparks[i]; f.t += dt; const a = f.pts.geometry.attributes.position; for (let k = 0; k < f.vel.length; k++) { f.vel[k][1] -= 6 * dt; a.setX(k, a.getX(k) + f.vel[k][0] * dt); a.setY(k, a.getY(k) + f.vel[k][1] * dt); a.setZ(k, a.getZ(k) + f.vel[k][2] * dt); } a.needsUpdate = true; f.pts.material.opacity = Math.max(0, 1 - f.t / 1.8); if (f.t > 1.8) { scene.remove(f.pts); sparks.splice(i, 1); } } }
    if (snow) { const a = snow.geometry.attributes.position; for (let i = 0; i < a.count; i++) { let y = a.getY(i) - dt * 3; if (y < -2) y = 40; a.setY(i, y); } a.needsUpdate = true; snow.position.x = S.pos.x; snow.position.z = S.pos.z; }
    const cp = Math.cos(S.pitch), spch = Math.sin(S.pitch); const cx = S.pos.x - fx * S.dist * cp, cz = S.pos.z - fz * S.dist * cp; camera.position.lerp(new THREE.Vector3(cx, Math.max(S.pos.y + .4, S.pos.y + 1.6 + S.dist * spch), cz), Math.min(1, dt * 8)); camera.lookAt(S.pos.x, S.pos.y + 1.6, S.pos.z);
    sun.position.set(S.pos.x + 20, S.pos.y + 40, S.pos.z - 10); sun.target.position.set(S.pos.x, S.pos.y, S.pos.z);
    if (S.msgT > 0) { S.msgT -= dt; if (S.msgT <= 0) { const m = host.querySelector('#alx-msg'); if (m) m.classList.remove('show'); } }
  }
  const resize = () => { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }; resize(); window.addEventListener('resize', resize);
  let last = performance.now(), raf = 0, alive = true;
  const loop = now => { if (!alive || !canvas.isConnected) { api.stop(); return; } let dt = Math.min(.05, (now - last) / 1000); last = now; const n = Math.ceil(dt / .0167); for (let i = 0; i < n && !S.done; i++) step(dt / n); if (S.done) { remote.forEach(R => animate(R.ch, R.m, dt, false)); } renderer.render(scene, camera); raf = requestAnimationFrame(loop); };
  camera.position.set(SP.x - Math.sin(S.yaw) * 8, 5, SP.z - Math.cos(S.yaw) * 8); ch.rotation.y = S.yaw; raf = requestAnimationFrame(loop);
  const api = { S,
    stop() { if (!alive) return; alive = false; cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey); window.removeEventListener('resize', resize); host.removeEventListener('wheel', onWheel); try { renderer.dispose(); } catch { } },
    emote(id) { emoteOn(ch, id); on.net && on.net({ t: 'emote', p: o.me.id, id }); },
    bubble(text) { bubbleOn(ch, text); on.net && on.net({ t: 'chat', p: o.me.id, text }); },
    end() { finish(false); },
    addPlayer(p) { addRemote(p); },
    removePlayer(id) { const R = remote.get(id); if (R) { scene.remove(R.ch); if (R.pet) scene.remove(R.pet); remote.delete(id); } },
    handleNet(m) { const R = remote.get(m.p); if (m.t === 's' && R) { R.tx = m.x; R.ty = m.y; R.tz = m.z; R.r = m.r; R.m = !!m.m; R.air = !!m.a; } else if (m.t === 'emote' && R) emoteOn(R.ch, m.id); else if (m.t === 'chat' && R) bubbleOn(R.ch, m.text); },
    msg };
  msg(o.world === 'park' ? 'Grab all the coins! 🪙' : o.world === 'tower' ? 'Climb to the top! 🗼' : o.world === 'arena' ? 'Keep moving! The floor is falling 🟥' : o.world === 'city' ? (o.names?.welcome || 'Welcome!') : 'Run to the portal! 🌀', 2000);
  return api;
}
