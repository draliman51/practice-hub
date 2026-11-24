/* Alilox mini-games inspired by popular Roblox experiences — rebuilt kid-safe, offline-friendly, AI friends included.
   makeMinigame(worldId, ctx) → { intro, move?(ctl), noJump?(), update(dt, ctl), action?(phase), fell?(), timeUp?(), result?(finished), score?(finished) } */
import * as THREE from 'three';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const T = (c, en, ar) => (c.lang === 'ar' ? ar : en);
const M = (col) => new THREE.MeshLambertMaterial({ color: col });

/** AI actor built from the CAST — shares the player's AABB physics. */
function mkActor(c, cast, x, z, opts = {}) {
  const ch = c.character({ name: cast.name, avatar: cast.avatar }); c.scene.add(ch);
  const B = { pos: V3(x, .6, z), vel: V3(), onGround: false, ground: null, boostT: 0 };
  ch.position.copy(B.pos);
  return { cast, ch, B, name: cast.name, speed: (opts.speed || 1) * c.SPEED0 * (cast.speed || 1), jumpCd: 0, stuck: 0, lineT: rnd(4, 10), tx: x, tz: z, wait: 0, cool: 0, tint: null, ...opts.extra };
}
/** Walk an actor toward (tx,tz) with physics, auto-jump at gaps/ledges. Returns moving flag. */
function drive(c, a, tx, tz, sp, dt, noJump) {
  const B = a.B; const dx = tx - B.pos.x, dz = tz - B.pos.z, d = Math.hypot(dx, dz);
  let vx = 0, vz = 0; if (d > .25) { vx = dx / d * sp; vz = dz / d * sp; }
  a.jumpCd = Math.max(0, a.jumpCd - dt);
  if (!noJump && B.onGround && a.jumpCd <= 0 && d > .5) { const nx = dx / d, nz = dz / d; if (!c.groundAhead(B, nx * 1.1, nz * 1.1)) { B.vel.y = c.JUMP; B.onGround = false; a.jumpCd = .5; } }
  const before = B.pos.clone(); c.moveBody(B, vx, vz, dt);
  if (d > .5 && B.onGround && before.distanceTo(B.pos) < sp * dt * .25) { a.stuck += dt; if (a.stuck > .35 && a.jumpCd <= 0 && !noJump) { B.vel.y = c.JUMP; B.onGround = false; a.jumpCd = .6; a.stuck = 0; } else if (a.stuck > .9) { a.tx = B.pos.x + rnd(-6, 6); a.tz = B.pos.z + rnd(-6, 6); a.stuck = 0; } } else a.stuck = 0;
  if (B.pos.y < -4) { B.pos.set(a.homeX ?? 0, 1, a.homeZ ?? 0); B.vel.set(0, 0, 0); }
  const moving = d > .25; a.ch.position.copy(B.pos); if (moving) a.ch.rotation.y = Math.atan2(vx, vz); c.animate(a.ch, moving && B.onGround, dt, false); if (!B.onGround && !a.ch.userData.emote) { a.ch.userData.armL.rotation.z = 2.8; a.ch.userData.armR.rotation.z = -2.8; } c.bubbleTick(a.ch, dt);
  return moving;
}
function idle(c, a, dt) { a.ch.position.copy(a.B.pos); c.animate(a.ch, false, dt, false); c.bubbleTick(a.ch, dt); }
function chatter(c, a, dt, lines) { a.lineT -= dt; if (a.lineT <= 0) { a.lineT = rnd(8, 16); c.bubbleOn(a.ch, lines ? pick(lines) : c.pickLine(a.cast, c.lang)); } }
function sphere(c, r, col, x, y, z, emissive) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 12), new THREE.MeshLambertMaterial({ color: col, emissive: emissive || 0 })); m.position.set(x, y, z); m.castShadow = true; c.scene.add(m); return m; }
function tag3d(c, text, col, x, y, z, big) { const s = c.label(text, col || '#fff', big); s.position.set(x, y, z); c.scene.add(s); return s; }
function facing(ch) { return { fx: Math.sin(ch.rotation.y), fz: Math.cos(ch.rotation.y) }; }
function tintHead(a, col) { const cone = new THREE.Mesh(new THREE.ConeGeometry(.5, 1, 10), M(col)); cone.position.y = 3.85; a.ch.add(cone); a.tint = cone; }
function untint(a) { if (a.tint) { a.ch.remove(a.tint); a.tint = null; } }
function burst(c, x, y, z, col, n = 14) { const g = new THREE.BufferGeometry(); const pos = new Float32Array(n * 3); const vel = []; for (let i = 0; i < n; i++) { pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; const a = Math.random() * 6.28; vel.push([Math.cos(a) * rnd(2, 5), rnd(3, 7), Math.sin(a) * rnd(2, 5)]); } g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const p = new THREE.Points(g, new THREE.PointsMaterial({ color: col, size: .4, transparent: true })); c.scene.add(p); return { p, vel, t: 0 }; }
function tickBursts(c, list, dt) { for (let i = list.length - 1; i >= 0; i--) { const f = list[i]; f.t += dt; const a = f.p.geometry.attributes.position; for (let k = 0; k < f.vel.length; k++) { f.vel[k][1] -= 12 * dt; a.setX(k, a.getX(k) + f.vel[k][0] * dt); a.setY(k, a.getY(k) + f.vel[k][1] * dt); a.setZ(k, a.getZ(k) + f.vel[k][2] * dt); } a.needsUpdate = true; f.p.material.opacity = Math.max(0, 1 - f.t); if (f.t > 1) { c.scene.remove(f.p); list.splice(i, 1); } } }

/* ───────────────────────── 1+2. CRAZY SOCCER / BLAST SOCCER ───────────────────────── */
function soccer(c, blast) {
  const { S, scene } = c; S.started = true;
  const ball = sphere(c, .6, 0xffffff, 0, 1.1, 0); const bv = V3(); let kickCd = 0, score = [0, 0], goalT = 0, boxT = 8, box = null, item = null, itemT = 0, slowT = 0, magnetT = 0; const fx = [];
  const pent = new THREE.Mesh(new THREE.BoxGeometry(.5, .5, .5), M(0x111827)); ball.add(pent);
  const side = blast ? 1 : 2; const team = [], foes = [];
  const casts = c.CAST; const mk = (i, x, z, t) => { const a = mkActor(c, casts[i % casts.length], x, z, { speed: .92 + i * .03 }); a.homeX = x; a.homeZ = z; a.team = t; a.kick = 0; tintHead(a, t === 0 ? 0x3B82F6 : 0xEF4444); return a; };
  if (!blast) { team.push(mk(0, -8, 5, 0)); team.push(mk(3, -18, 0, 0)); } foes.push(mk(1, 8, -4, 1, )); if (!blast) foes.push(mk(2, 18, 0, 1)); // [1] = goalkeepers
  foes.forEach(f => f.speed *= .86);
  const GOAL = 22.4; const signs = [tag3d(c, '🥅', '#fff', -23, 5, 0, true), tag3d(c, '🥅', '#fff', 23, 5, 0, true)];
  const pads = blast ? [[-10, 8], [10, -8], [-10, -8], [10, 8], [0, 0]] : [];
  const boardTxt = () => c.hud('mg', `⚽ ${score[0]} : ${score[1]}` + (item ? ' · ' + item.ic : ''));
  boardTxt(); c.hud('coins', 0);
  const reset = () => { ball.position.set(0, 1.1, 0); bv.set(0, 0, 0); S.pos.set(-6, .6, 0); S.vel.set(0, 0, 0); [...team, ...foes].forEach(a => { a.B.pos.set(a.homeX, .6, a.homeZ); a.B.vel.set(0, 0, 0); }); };
  const kick = (px, pz, dx, dz, power, up) => { const d = Math.hypot(dx, dz) || 1; bv.set(dx / d * power, up, dz / d * power); c.sfx('tap'); };
  const goalFor = (t) => { score[t]++; goalT = 2; boardTxt(); c.sfx('win'); c.msg(t === 0 ? T(c, '⚽ GOAL! You scored!', '⚽ هدف! أحرزت هدفًا!') : T(c, '😮 They scored!', '😮 أحرزوا هدفًا!'), 1800); fx.push(burst(c, ball.position.x, 2, ball.position.z, t === 0 ? 0x4ADE80 : 0xEF4444, 30)); if (t === 0) { S.coins += 3; c.hud('coins', S.coins); c.emoteOn(c.getCh(), 'cheer'); } if (score[t] >= 3) { c.finish(t === 0); } };
  const ITEMS = [{ id: 'boost', ic: '🚀' }, { id: 'magnet', ic: '🧲' }, { id: 'banana', ic: '🍌' }];
  return {
    intro: blast ? T(c, '💥 Blast Soccer: tap BLAST near the ball! Red pads launch it. First to 3!', '💥 كرة الانفجار: اضغط BLAST قرب الكرة! الدوائر الحمراء تقذفها. أول من يسجل 3 يفوز!') : T(c, '⚽ Crazy Soccer 2v2: run into the ball to dribble, tap SHOOT to fire! Grab 🎁 boxes for items.', '⚽ كرة مجنونة 2 ضد 2: اركض نحو الكرة لتمريرها واضغط SHOOT للتسديد! التقط الصناديق 🎁 للقدرات.'),
    action() { const ch = c.getCh(); const { fx: dx, fz: dz } = facing(ch); const d = dist(S.pos, ball.position);
      if (blast) { if (d < 4.5) { const bx = ball.position.x - S.pos.x, bz = ball.position.z - S.pos.z, bd = Math.hypot(bx, bz) || 1; bv.set(bx / bd * 24 + dx * 6, 11, bz / bd * 24 + dz * 6); fx.push(burst(c, ball.position.x, 1.5, ball.position.z, 0xFF4D1F, 24)); c.sfx('win'); c.msg('💥 BLAST!', 500); c.emoteOn(ch, 'spin'); } return; }
      if (item && item.id === 'boost') { S.boostT = 5; item = null; boardTxt(); c.msg('🚀 Speed!', 800); return; }
      if (item && item.id === 'magnet') { magnetT = 4; item = null; boardTxt(); c.msg('🧲 Magnet ball!', 800); return; }
      if (item && item.id === 'banana') { slowT = 4; item = null; boardTxt(); c.msg('🍌 They slipped!', 800); return; }
      if (d < 2.4) { kick(S.pos.x, S.pos.z, dx, dz, 21, 5.5); magnetT = 0; c.emoteOn(ch, 'wave'); ch.userData.emoteT = 1.9; c.msg('💨 SHOOT!', 400); } },
    update(dt) {
      kickCd = Math.max(0, kickCd - dt); slowT = Math.max(0, slowT - dt); magnetT = Math.max(0, magnetT - dt); tickBursts(c, fx, dt);
      if (goalT > 0) { goalT -= dt; if (goalT <= 0) reset(); [...team, ...foes].forEach(a => idle(c, a, dt)); return; }
      // ball physics
      bv.y -= 22 * dt; ball.position.addScaledVector(bv, dt); if (ball.position.y < 1.1) { ball.position.y = 1.1; bv.y = Math.abs(bv.y) > 2 ? -bv.y * .45 : 0; bv.x *= (1 - 1.6 * dt); bv.z *= (1 - 1.6 * dt); }
      ball.rotation.x += bv.z * dt; ball.rotation.z -= bv.x * dt;
      if (Math.abs(ball.position.z) > 13.1) { ball.position.z = Math.sign(ball.position.z) * 13.1; bv.z *= -.7; }
      if (Math.abs(ball.position.x) > GOAL) { if (Math.abs(ball.position.z) < 3.5 && ball.position.y < 3.2) { goalFor(ball.position.x > 0 ? 0 : 1); return; } ball.position.x = Math.sign(ball.position.x) * GOAL; bv.x *= -.7; }
      pads.forEach(p => { if (Math.abs(ball.position.x - p[0]) < 1.3 && Math.abs(ball.position.z - p[1]) < 1.3 && ball.position.y < 1.3 && Math.hypot(bv.x, bv.z) > .5) { bv.y = 13; bv.x += rnd(-6, 6); bv.z += rnd(-6, 6); fx.push(burst(c, p[0], 1, p[1], 0xFF4D1F, 16)); c.sfx('ok'); } });
      // my dribble / magnet
      const ch = c.getCh(); const md = dist(S.pos, ball.position);
      if (magnetT > 0 && md < 3) { const { fx: dx, fz: dz } = facing(ch); ball.position.set(S.pos.x + dx * 1.2, 1.1, S.pos.z + dz * 1.2); bv.set(0, 0, 0); }
      else if (md < 1.35 && kickCd <= 0 && ball.position.y < 2.4) { const { fx: dx, fz: dz } = facing(ch); kick(S.pos.x, S.pos.z, dx, dz, 9, 1.5); kickCd = .45; }
      // AI
      const act = (a) => { const t = a.team; const goalX = t === 0 ? GOAL : -GOAL; const sp = a.speed * (t === 1 && slowT > 0 ? .4 : 1);
        a.cool = Math.max(0, a.cool - dt); let tx, tz; const gk = !blast && (a === foes[1] || a === team[1]);
        if (gk) { tx = t === 0 ? -19.5 : 19.5; tz = clamp(ball.position.z, -3, 3); if (dist(a.B.pos, ball.position) < 1.6 && a.cool <= 0) { kick(0, 0, t === 0 ? 1 : -1, rnd(-.5, .5), 16, 4); a.cool = 1; } }
        else { const behind = t === 0 ? -1.1 : 1.1; tx = ball.position.x + behind; tz = ball.position.z + (a === team[0] ? Math.sin(S.t) * 2 : 0); if (dist(a.B.pos, ball.position) < 1.4 && a.cool <= 0 && ball.position.y < 2.4) { const gx = goalX - a.B.pos.x, gz = rnd(t === 1 ? -4.5 : -2.5, t === 1 ? 4.5 : 2.5) - a.B.pos.z; kick(0, 0, gx, gz, dist(a.B.pos, { x: goalX, z: 0 }) < 12 ? (t === 1 ? 13 : 16) : 10, 3); a.cool = .8; magnetT = 0; } }
        drive(c, a, tx, tz, sp, dt, true); chatter(c, a, dt); };
      team.forEach(act); foes.forEach(act);
      // item boxes
      if (!blast) { boxT -= dt; if (boxT <= 0 && !box) { boxT = 14; const x = rnd(-14, 14), z = rnd(-9, 9); const m = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), new THREE.MeshLambertMaterial({ color: 0xFFD23F, emissive: 0x8a6a00 })); m.position.set(x, 1.1, z); scene.add(m); const lb = tag3d(c, '🎁', '#fff', x, 2.4, z); box = { m, lb, x, z }; }
        if (box) { box.m.rotation.y += dt * 2; if (dist(S.pos, box) < 1.4) { scene.remove(box.m); scene.remove(box.lb); box = null; item = pick(ITEMS); boardTxt(); c.sfx('ok'); c.msg(item.ic + ' ' + T(c, 'Item! Tap SHOOT to use it', 'قدرة! اضغط SHOOT لاستخدامها'), 1400); } } }
      signs.forEach(s => s.position.y = 5 + Math.sin(S.t * 2) * .2);
    },
    timeUp() { c.msg(score[0] > score[1] ? T(c, '🏆 You win!', '🏆 فزت!') : score[0] === score[1] ? T(c, '🤝 Draw!', '🤝 تعادل!') : T(c, '😅 They won this time', '😅 فازوا هذه المرة'), 2000); return score[0] >= score[1]; },
    result(fin) { return { coinsTotal: 12, goals: score[0], against: score[1], coins: S.coins + (fin ? 3 : 0) }; },
    score(fin) { return score[0] * 30 + (fin ? 50 : 0) + Math.floor(S.left || 0); },
  };
}

/* ───────────────────────── 3. MYSTERY FREEZE (MM2 made friendly) ───────────────────────── */
function mystery(c) {
  const { S } = c; S.started = true;
  const actors = c.CAST.map((cs, i) => { const a = Math.PI * 2 * i / c.CAST.length; const x = Math.cos(a) * 12, z = Math.sin(a) * 12; const ac = mkActor(c, cs, x, z, { speed: .85 }); ac.homeX = x; ac.homeZ = z; ac.frozen = 0; ac.ice = null; ac.tx = x; ac.tz = z; return ac; });
  let myIce = null; const freezer = pick(actors); freezer.speed *= 1.25; let guesses = 3, rescues = 0, myFrozen = 0, meFrozen = 0, frostT = 0, rescueT = 0; const fx = []; const trail = [];
  const iceOf = (pos) => { const m = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.4, 1.4), new THREE.MeshLambertMaterial({ color: 0x93C5FD, transparent: true, opacity: .55 })); m.position.set(pos.x, pos.y + 1.2, pos.z); c.scene.add(m); return m; };
  const freeze = (a) => { if (a.frozen > 0) return; a.frozen = 999; a.ice = iceOf(a.B.pos); c.sfx('bad'); if (dist(S.pos, a.B.pos) < 16) c.msg('🧊 ' + a.name + ' ' + T(c, 'got frozen! Touch to unfreeze', 'تجمّد! المسه لتذيبه'), 1500); frostT = 3; };
  const thaw = (a, byMe) => { if (a.frozen <= 0) return; a.frozen = 0; if (a.ice) { c.scene.remove(a.ice); a.ice = null; } fx.push(burst(c, a.B.pos.x, 1.5, a.B.pos.z, 0x93C5FD)); if (byMe) { rescues++; S.coins += 2; c.hud('coins', S.coins); c.sfx('ok'); c.msg(T(c, '🔥 Rescued', '🔥 أنقذت') + ' ' + a.name + ' +2 🪙', 1200); c.emoteOn(a.ch, 'cheer'); } hud(); };
  const hud = () => c.hud('mg', `🧊 ${actors.filter(a => a.frozen > 0).length} · 🔍 ${guesses}`);
  hud();
  return {
    intro: T(c, '🕵️ One friend secretly freezes others! Rescue frozen friends (touch them), find clues ❄️, then stand near the suspect and tap ACCUSE. Survive 90s!', '🕵️ أحد الأصدقاء يجمّد الآخرين سرًا! أنقذ المتجمدين (المسهم)، تتبّع آثار الثلج ❄️، ثم قف قرب المشتبه به واضغط ACCUSE. اصمد 90 ثانية!'),
    move(ctl) { if (meFrozen > 0) return { vx: 0, vz: 0 }; return null; },
    noJump() { return meFrozen > 0; },
    action() { if (meFrozen > 0) return; let near = null, nd = 3.2; actors.forEach(a => { const d = dist(S.pos, a.B.pos); if (d < nd) { nd = d; near = a; } }); if (!near) { c.msg(T(c, 'Stand next to a friend to accuse', 'قف بجانب صديق لتتهمه'), 1200); return; }
      if (near === freezer) { c.sfx('win'); c.msg('🎉 ' + T(c, 'It was', 'كان هو') + ' ' + near.name + '! ' + T(c, 'Case solved!', 'حُلّ اللغز!'), 2500); S.coins += 10; c.hud('coins', S.coins); c.emoteOn(c.getCh(), 'cheer'); tintHead(near, 0x1D4ED8); c.finish(true); }
      else { guesses--; hud(); c.sfx('bad'); c.msg('❌ ' + near.name + ' ' + T(c, 'is innocent! You got frozen 4s', 'بريء! تجمّدت 4 ثوانٍ'), 1500); c.emoteOn(near.ch, 'wave'); meFrozen = 4; myIce = iceOf(S.pos); if (guesses <= 0) { c.msg(T(c, 'No guesses left 😅', 'انتهت محاولاتك 😅'), 2000); c.finish(false); } } },
    update(dt) { tickBursts(c, fx, dt); frostT = Math.max(0, frostT - dt);
      if (meFrozen > 0) { meFrozen -= dt; if (meFrozen <= 0 && myIce) { c.scene.remove(myIce); myIce = null; } }
      if (frostT > 0 && Math.random() < dt * 6) { const s = sphere(c, .12, 0xBAE6FD, freezer.B.pos.x + rnd(-.6, .6), .6, freezer.B.pos.z + rnd(-.6, .6)); trail.push({ s, t: 4 }); }
      for (let i = trail.length - 1; i >= 0; i--) { trail[i].t -= dt; if (trail[i].t <= 0) { c.scene.remove(trail[i].s); trail.splice(i, 1); } }
      actors.forEach(a => { if (a.frozen > 0) { idle(c, a, dt); if (dist(S.pos, a.B.pos) < 1.6 && meFrozen <= 0) { rescueT += dt; if (rescueT > .8) { rescueT = 0; thaw(a, true); } } return; }
        a.wait -= dt; if (a === freezer) { let tgt = null, td = 9; actors.forEach(o => { if (o !== a && o.frozen <= 0) { const d = dist(a.B.pos, o.B.pos); const watched = dist(S.pos, o.B.pos) < 5; if (d < td && !watched) { td = d; tgt = o; } } }); if (!tgt && meFrozen <= 0 && dist(a.B.pos, S.pos) < 7 && Math.random() < .3) tgt = 'me';
          if (tgt === 'me') { drive(c, a, S.pos.x, S.pos.z, a.speed, dt); if (dist(a.B.pos, S.pos) < 1.3) { meFrozen = 6; myFrozen++; myIce = iceOf(S.pos); c.sfx('bad'); c.msg(T(c, '🧊 You got frozen! A friend will rescue you…', '🧊 تجمّدت! سينقذك صديق…'), 1500); frostT = 3; } return; }
          if (tgt) { drive(c, a, tgt.B.pos.x, tgt.B.pos.z, a.speed, dt); if (dist(a.B.pos, tgt.B.pos) < 1.3) freeze(tgt); return; } }
        else { const fz = actors.find(o => o.frozen > 0 && dist(a.B.pos, o.B.pos) < 14); if (fz) { drive(c, a, fz.B.pos.x, fz.B.pos.z, a.speed, dt); if (dist(a.B.pos, fz.B.pos) < 1.4) { a.cool += dt; if (a.cool > 1.2) { a.cool = 0; thaw(fz, false); } } return; }
          if (meFrozen > 0 && dist(a.B.pos, S.pos) < 18) { drive(c, a, S.pos.x, S.pos.z, a.speed, dt); if (dist(a.B.pos, S.pos) < 1.5) { meFrozen = 0; if (myIce) { c.scene.remove(myIce); myIce = null; } c.msg('🔥 ' + a.name + ' ' + T(c, 'rescued you!', 'أنقذك!'), 1200); c.sfx('ok'); } return; } }
        if (a.wait <= 0) { a.wait = rnd(2, 5); a.tx = rnd(-24, 24); a.tz = rnd(-24, 24); } drive(c, a, a.tx, a.tz, a.speed * .7, dt); chatter(c, a, dt); });
      if (actors.every(a => a.frozen > 0) && meFrozen > 0) { c.msg(T(c, 'Everyone is frozen! 🧊', 'الكل تجمّد! 🧊'), 2000); c.finish(false); } },
    timeUp() { c.msg(T(c, '⏰ You survived! The freezer was', '⏰ نجوت! المجمّد كان') + ' ' + freezer.name, 2500); return true; },
    result(fin) { return { coinsTotal: 14, rescues, coins: S.coins + (fin ? 2 : 0) }; },
    score(fin) { return rescues * 15 + Math.floor(S.t) + (fin ? 60 : 0) - myFrozen * 5; },
  };
}

/* ───────────────────────── 4. EVADE ───────────────────────── */
function evade(c) {
  const { S } = c; S.started = true; const FACES = ['🤪', '😜', '🤡']; let revives = 0, downT = 0, elapsed = 0, spd = 4.6; const fx = [];
  const bots = [0, 1, 2].map(i => { const m = c.monster(); const a = i / 3 * 6.28; m.position.set(Math.cos(a) * 34, .5, Math.sin(a) * 34); m.children[0].material = M([0x0EA5E9, 0xF59E0B, 0x22C55E][i]); const lb = c.label(FACES[i] + ' BOT', '#fff'); lb.position.y = 3.2; m.add(lb); c.scene.add(m); return { m, tx: 0, tz: 0, wait: 0, sprint: 0, lineT: rnd(3, 8) }; });
  const friends = c.CAST.slice(0, 3).map((cs, i) => { const x = -6 + i * 6, z = -26; const a = mkActor(c, cs, x, z, { speed: .95 }); a.homeX = x; a.homeZ = z; a.down = false; a.tx = x; a.tz = z; return a; });
  let meDown = false; const hud = () => c.hud('mg', `🤖 ${spd.toFixed(1)} · 💪 ${revives}`); hud();
  const setDown = (a, v) => { a.down = v; a.ch.rotation.x = v ? -1.3 : 0; a.ch.position.y = a.B.pos.y + (v ? .6 : 0); if (v) { c.bubbleOn(a.ch, T(c, 'Help! 🙏', 'ساعدني! 🙏')); } };
  return {
    intro: T(c, '🏃 EVADE: silly bots chase everyone for 2 minutes! If a bot taps you, you fall — a friend revives you. Touch fallen friends to revive them (+2 🪙).', '🏃 EVADE: روبوتات مضحكة تطارد الجميع لدقيقتين! إذا لمسك روبوت تسقط — سيعيدك صديق. المس الأصدقاء الساقطين لتنقذهم (+2 🪙).'),
    move() { return meDown ? { vx: 0, vz: 0 } : null; }, noJump() { return meDown; },
    update(dt) { tickBursts(c, fx, dt); elapsed += dt; const nsp = 4.6 + Math.floor(elapsed / 20) * .4; if (nsp !== spd) { spd = nsp; hud(); c.msg(T(c, '⚡ Bots got faster!', '⚡ الروبوتات أصبحت أسرع!'), 1200); }
      const targets = [{ pos: S.pos, me: true, down: meDown }, ...friends.map(f => ({ pos: f.B.pos, f, down: f.down }))];
      bots.forEach(b => { let tgt = null, td = 24; targets.forEach(t => { if (t.down) return; const d = dist(b.m.position, t.pos); if (d < td) { td = d; tgt = t; } }); b.wait -= dt; b.sprint = Math.max(0, b.sprint - dt);
        if (tgt) { c.moveOnGround(b.m, tgt.pos.x, tgt.pos.z, spd * (b.sprint > 0 ? 1.4 : 1), dt); if (Math.random() < dt * .15) b.sprint = 1.5; if (td < 1.4 && tgt.pos.y < b.m.position.y + 2) { if (tgt.me) { meDown = true; downT = 0; c.sfx('bad'); c.msg(T(c, '😵 Down! Wait for a friend…', '😵 سقطت! انتظر صديقًا…'), 1500); c.emoteOn(c.getCh(), 'spin'); } else setDown(tgt.f, true); } }
        else { if (b.wait <= 0) { b.wait = rnd(2, 4); b.tx = rnd(-36, 36); b.tz = rnd(-36, 36); } c.moveOnGround(b.m, b.tx, b.tz, spd * .6, dt); }
        b.m.position.y = .5 + Math.abs(Math.sin(S.t * 10)) * .2; b.lineT -= dt; if (b.lineT <= 0) { b.lineT = rnd(6, 12); c.bubbleOn(b.m, pick(['Hehe! 🤪', 'Gotcha? 😜', 'Beep boop 🤖', 'Catch!'])); } c.bubbleTick(b.m, dt); });
      friends.forEach(f => { if (f.down) { idle(c, f, dt); f.ch.rotation.x = -1.3; f.ch.position.y = f.B.pos.y + .6; if (!meDown && dist(S.pos, f.B.pos) < 1.7) { f.cool += dt; if (f.cool > 1.2) { f.cool = 0; setDown(f, false); revives++; S.coins += 2; c.hud('coins', S.coins); hud(); c.sfx('ok'); c.msg('💪 ' + T(c, 'Revived', 'أنقذت') + ' ' + f.name + ' +2 🪙', 1200); fx.push(burst(c, f.B.pos.x, 1.5, f.B.pos.z, 0x4ADE80)); } } return; }
        let nb = null, nd = 11; bots.forEach(b => { const d = dist(f.B.pos, b.m.position); if (d < nd) { nd = d; nb = b; } });
        if (nb) { const ax = f.B.pos.x - nb.m.position.x, az = f.B.pos.z - nb.m.position.z, d = Math.hypot(ax, az) || 1; f.tx = clamp(f.B.pos.x + ax / d * 10, -36, 36); f.tz = clamp(f.B.pos.z + az / d * 10, -36, 36); drive(c, f, f.tx, f.tz, f.speed, dt); }
        else if (meDown && dist(f.B.pos, S.pos) < 30) { drive(c, f, S.pos.x, S.pos.z, f.speed, dt); if (dist(f.B.pos, S.pos) < 1.7) { f.cool += dt; if (f.cool > 1) { f.cool = 0; meDown = false; c.msg('💪 ' + f.name + ' ' + T(c, 'revived you!', 'أنقذك!'), 1200); c.sfx('ok'); } } }
        else { const dn = friends.find(o => o.down && !bots.some(b => dist(b.m.position, o.B.pos) < 7)); if (dn) { drive(c, f, dn.B.pos.x, dn.B.pos.z, f.speed, dt); if (dist(f.B.pos, dn.B.pos) < 1.6) { f.cool += dt; if (f.cool > 1.2) { f.cool = 0; setDown(dn, false); } } } else { f.wait -= dt; if (f.wait <= 0) { f.wait = rnd(2, 5); f.tx = rnd(-34, 34); f.tz = rnd(-34, 34); } drive(c, f, f.tx, f.tz, f.speed * .7, dt); chatter(c, f, dt); } } });
      if (meDown) { downT += dt; const chm = c.getCh(); chm.rotation.x = -1.3; if (friends.every(f => f.down)) { c.msg(T(c, 'Everyone got caught! 🤖', 'الكل وقع! 🤖'), 2000); c.finish(false); } } else c.getCh().rotation.x = 0; },
    timeUp() { c.msg(T(c, '🏆 You survived the bots!', '🏆 نجوت من الروبوتات!'), 2000); return true; },
    result(fin) { return { coinsTotal: 12 + c.coins.length, revives, coins: S.coins + (fin ? 4 : 0) }; },
    score(fin) { return Math.floor(S.t) + revives * 15 + (fin ? 50 : 0); },
  };
}

/* ───────────────────────── 5. FISHING (Fisch) ───────────────────────── */
function fisch(c) {
  const { S, scene } = c; S.started = true; let state = 'idle', bob = null, line = null, wait = 0, biteT = 0, prog = 0, fish = null, caught = [], ambientT = 0; const fx = [];
  const FISH = [{ n: 'Sunny Fish', an: 'سمكة شمسية', ic: '🐟', v: 2, w: 50, decay: 10 }, { n: 'Coral Beauty', an: 'جمال المرجان', ic: '🐠', v: 4, w: 28, decay: 16 }, { n: 'Puffy', an: 'المنتفخة', ic: '🐡', v: 7, w: 14, decay: 22 }, { n: 'Golden Whale', an: 'الحوت الذهبي', ic: '🐳', v: 15, w: 5, decay: 30 }, { n: 'Rainbow Shark', an: 'القرش القزحي', ic: '🦈', v: 12, w: 3, decay: 28 }];
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(.04, .06, 3.2, 6), M(0x92400E)); rod.position.set(.95, 2.4, .9); rod.rotation.x = -.9; c.getCh().add(rod);
  const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff }); const bar = () => '🎣 ' + '█'.repeat(Math.round(prog / 10)) + '░'.repeat(10 - Math.round(prog / 10));
  const hud = () => c.hud('mg', state === 'reel' ? bar() : `🐟 ${caught.length}`); hud();
  const endCast = () => { if (bob) scene.remove(bob); if (line) scene.remove(line); bob = line = null; state = 'idle'; hud(); };
  const rodTip = () => { const ch = c.getCh(); const { fx, fz } = facing(ch); return V3(S.pos.x + fx * 1.2, S.pos.y + 2.6, S.pos.z + fz * 1.2); };
  return {
    intro: T(c, '🎣 Walk to the end of the dock and tap CAST. When you see ❗ tap again fast, then TAP TAP TAP to reel the fish in!', '🎣 امشِ إلى آخر الرصيف واضغط CAST. عندما ترى ❗ اضغط بسرعة، ثم اضغط اضغط اضغط لسحب السمكة!'),
    move() { return state === 'reel' || state === 'wait' || state === 'bite' ? { vx: 0, vz: 0 } : null; },
    action() { const ch = c.getCh();
      if (state === 'idle') { if (S.pos.z < 6) { c.msg(T(c, 'Go further onto the dock 🪵', 'اقترب أكثر من حافة الرصيف 🪵'), 1000); return; } const { fx, fz } = facing(ch); const far = rnd(5, 11); bob = sphere(c, .3, 0xEF4444, S.pos.x + fx * far, 2, S.pos.z + Math.abs(fz) * far + 1); bob.userData = { vy: 4, far }; const g = new THREE.BufferGeometry().setFromPoints([rodTip(), bob.position]); line = new THREE.Line(g, lineMat); scene.add(line); state = 'fly'; c.sfx('tap'); c.emoteOn(ch, 'wave'); ch.userData.emoteT = 1.9; return; }
      if (state === 'wait') { c.msg(T(c, 'Wait for the ❗', 'انتظر الإشارة ❗'), 700); return; }
      if (state === 'bite') { state = 'reel'; prog = 20; c.sfx('ok'); c.msg(T(c, 'TAP TAP TAP! 🎣', 'اضغط اضغط اضغط! 🎣'), 1000); hud(); return; }
      if (state === 'reel') { prog = Math.min(100, prog + 11); hud(); if (prog >= 100) { caught.push(fish); S.coins += fish.v; c.hud('coins', S.coins); c.sfx('win'); c.msg(`${fish.ic} ${T(c, 'Caught a', 'اصطدت')} ${T(c, fish.n, fish.an)}! +${fish.v} 🪙`, 1800); fx.push(burst(c, bob.position.x, 1, bob.position.z, 0x38BDF8, 20)); c.emoteOn(ch, 'cheer'); endCast(); } } },
    update(dt) { tickBursts(c, fx, dt); ambientT -= dt; if (ambientT <= 0) { ambientT = rnd(1, 3); const s = sphere(c, .25, 0x60A5FA, rnd(-16, 16), .3, rnd(8, 30)); setTimeout(() => scene.remove(s), 700); }
      if (bob) { if (state === 'fly') { bob.userData.vy -= 12 * dt; bob.position.y += bob.userData.vy * dt; if (bob.position.y <= -.2) { bob.position.y = -.2; state = 'wait'; wait = rnd(1.5, 4); c.msg(T(c, 'Waiting… 🌊', 'ننتظر… 🌊'), 1000); } }
        else if (state === 'wait') { bob.position.y = -.2 + Math.sin(S.t * 3) * .05; wait -= dt; if (wait <= 0) { state = 'bite'; biteT = 1.3; const far = bob.userData.far; const pool = FISH.map(f => ({ f, w: f.w * (far > 8 && f.v > 3 ? 1.8 : 1) })); let r = Math.random() * pool.reduce((a, b) => a + b.w, 0); fish = pool.find(p => (r -= p.w) <= 0)?.f || FISH[0]; c.sfx('ok'); c.msg('❗❗ ' + T(c, 'TAP NOW!', 'اضغط الآن!'), 1200); } }
        else if (state === 'bite') { bob.position.y = -.6 + Math.abs(Math.sin(S.t * 14)) * .5; biteT -= dt; if (biteT <= 0) { c.msg(T(c, 'It got away… 🐟💨', 'هربت… 🐟💨'), 1200); c.sfx('bad'); endCast(); } }
        else if (state === 'reel') { prog -= fish.decay * dt; bob.position.x += Math.sin(S.t * 8) * dt * 2; hud(); if (prog <= 0) { c.msg(T(c, 'The line snapped! 😅', 'انقطع الخيط! 😅'), 1200); c.sfx('bad'); endCast(); } }
        if (line) line.geometry.setFromPoints([rodTip(), bob.position]); } },
    timeUp() { c.msg(`🎣 ${caught.length} ${T(c, 'fish caught!', 'سمكة اصطدتها!')}`, 2000); return caught.length > 0; },
    result(fin) { return { coinsTotal: 20, fish: caught.length, coins: S.coins }; },
    score(fin) { return caught.reduce((a, f) => a + f.v * 4, 0) + (fin ? 20 : 0); },
  };
}

/* ───────────────────────── 6. FRUIT POWERS (Blox Fruits) ───────────────────────── */
function fruits(c) {
  const { S, scene } = c; S.started = true; let power = null, cd = 0, dashT = 0; const fx = [];
  const F = [{ id: 'fire', ic: '🔥', col: 0xF97316, x: -5, en: 'Flame Fruit', ar: 'فاكهة اللهب' }, { id: 'ice', ic: '❄️', col: 0x60A5FA, x: 0, en: 'Ice Fruit', ar: 'فاكهة الجليد' }, { id: 'light', ic: '⚡', col: 0xFDE047, x: 5, en: 'Light Fruit', ar: 'فاكهة الضوء' }];
  const stands = F.map(f => { const s = sphere(c, .7, f.col, f.x, 1.6, 0, f.col & 0x444444); const lb = tag3d(c, f.ic + ' ' + T(c, f.en, f.ar), '#141A3B', f.x, 3.2, 0, true); return { f, s, lb }; });
  const hud = () => c.hud('mg', power ? `${power.ic} ${cd > 0 ? Math.ceil(cd) + 's' : 'READY'}` : T(c, 'pick a fruit', 'اختر فاكهة')); hud();
  return {
    intro: T(c, '🍎 Walk onto a fruit to gain its power, then cross the bridges and defeat the monsters! 👊 punch · ✨ POWER button (cooldown). Boss on the red island!', '🍎 قف على فاكهة لتحصل على قوتها، ثم اعبر الجسور واهزم الوحوش! 👊 لكمة · ✨ زر القوة (له وقت انتظار). الزعيم في الجزيرة الحمراء!'),
    action() { if (!power) { c.msg(T(c, 'Pick a fruit first! 🍎', 'اختر فاكهة أولًا! 🍎'), 900); return; } if (cd > 0) return; const ch = c.getCh(); const { fx: dx, fz: dz } = facing(ch); cd = power.id === 'light' ? 2 : 3.5; hud(); c.sfx('win');
      if (power.id === 'fire') { for (let i = 0; i < 4; i++) fx.push(burst(c, S.pos.x + dx * (1 + i * 1.3), 1.5, S.pos.z + dz * (1 + i * 1.3), 0xF97316, 10)); c.monsters.forEach(mo => { const mx = mo.m.position.x - S.pos.x, mz = mo.m.position.z - S.pos.z, d = Math.hypot(mx, mz); if (d < 6 && (mx * dx + mz * dz) / Math.max(.1, d) > .3) c.hitMonster(mo, 2, mx / d * 7, mz / d * 7); }); c.msg('🔥 ' + T(c, 'Flame burst!', 'انفجار اللهب!'), 700); }
      if (power.id === 'ice') { c.monsters.forEach(mo => { const d = dist(mo.m.position, S.pos); if (d < 7 && mo.hp > 0) { mo.frozen = 3.5; c.hitMonster(mo, 1, 0, 0); fx.push(burst(c, mo.m.position.x, 1.5, mo.m.position.z, 0x93C5FD, 12)); } }); c.msg('❄️ ' + T(c, 'Everything froze!', 'تجمّد كل شيء!'), 700); }
      if (power.id === 'light') { dashT = .28; c.msg('⚡ ' + T(c, 'Light dash!', 'اندفاع الضوء!'), 500); c.emoteOn(ch, 'spin'); } c.emoteOn(ch, power.id === 'light' ? 'spin' : 'wave'); },
    move(ctl) { if (dashT > 0) { const { fx: dx, fz: dz } = facing(c.getCh()); c.monsters.forEach(mo => { if (mo.hp > 0 && dist(mo.m.position, S.pos) < 1.8) c.hitMonster(mo, 1, dx * 10, dz * 10); }); return { vx: dx * 26, vz: dz * 26 }; } return null; },
    update(dt) { tickBursts(c, fx, dt); dashT = Math.max(0, dashT - dt); if (cd > 0) { const p = cd; cd = Math.max(0, cd - dt); if (Math.ceil(p) !== Math.ceil(cd)) hud(); }
      stands.forEach(st => { st.s.rotation.y += dt; st.s.position.y = 1.6 + Math.sin(S.t * 2 + st.f.x) * .2; if (!power && dist(S.pos, st.s.position) < 1.3) { power = st.f; S.speedMul = power.id === 'light' ? 1.18 : 1; stands.forEach(o => { scene.remove(o.s); scene.remove(o.lb); }); c.sfx('win'); c.msg(`${power.ic} ${T(c, 'You ate the', 'أكلت')} ${T(c, power.en, power.ar)}! ${T(c, 'Use the POWER button ✨', 'استخدم زر القوة ✨')}`, 2200); hud(); c.emoteOn(c.getCh(), 'cheer'); } }); },
    result(fin) { return { coinsTotal: c.coins.length + c.monsters.length * 2, power: power && power.id }; },
  };
}

/* ───────────────────────── 7. DRESS TO IMPRESS ───────────────────────── */
function dress(c) {
  const { S, scene } = c; S.started = true; const base = JSON.parse(JSON.stringify(c.me.avatar || {})); const av = { ...base }; let phase = 'shop', shopT = 45, walkT = 0, stars = 0, rank = 1, results = null; const fx = [];
  const THEMES = [{ id: 'royal', ic: '👑', en: 'Royal Ball', ar: 'الحفل الملكي' }, { id: 'party', ic: '🎉', en: 'Birthday Party', ar: 'حفلة عيد ميلاد' }, { id: 'space', ic: '🚀', en: 'Space Explorer', ar: 'مستكشف الفضاء' }, { id: 'sports', ic: '⚽', en: 'Sports Day', ar: 'يوم الرياضة' }, { id: 'magic', ic: '✨', en: 'Magic School', ar: 'مدرسة السحر' }, { id: 'garden', ic: '🌸', en: 'Garden Picnic', ar: 'نزهة الحديقة' }, { id: 'hero', ic: '🦸', en: 'Super Hero', ar: 'البطل الخارق' }];
  const theme = pick(THEMES);
  const ITEMS = [{ k: 'hat', v: 'crown', ic: '👑', tags: ['royal'] }, { k: 'hat', v: 'party', ic: '🎉', tags: ['party'] }, { k: 'hat', v: 'cap', ic: '🧢', tags: ['sports'] }, { k: 'hat', v: 'wizard', ic: '🧙', tags: ['magic'] }, { k: 'hat', v: 'halo', ic: '😇', tags: ['magic', 'hero'] }, { k: 'hat', v: 'bunny', ic: '🐰', tags: ['garden', 'party'] }, { k: 'hat', v: 'flower', ic: '🌸', tags: ['garden'] }, { k: 'hat', v: 'headphones', ic: '🎧', tags: ['party', 'space'] },
    { k: 'back', v: 'cape', ic: '🦸', tags: ['hero', 'royal'] }, { k: 'back', v: 'wings', ic: '🪽', tags: ['magic', 'garden'] }, { k: 'back', v: 'jetpack', ic: '🚀', tags: ['space', 'hero'] }, { k: 'back', v: 'none', ic: '🎒', tags: ['sports'] },
    { k: 'shirt', v: 4, ic: '👕', tags: ['party', 'sports'] }, { k: 'shirt', v: 10, ic: '🤍', tags: ['royal', 'space'] }, { k: 'pants', v: 9, ic: '👖', tags: ['space', 'hero'] }, { k: 'pants', v: 6, ic: '🩳', tags: ['garden', 'sports'] }];
  const spots = [[-20, -14], [-14, -14], [-8, -14], [8, -14], [14, -14], [20, -14], [-20, -6], [-14, -6], [-8, -6], [8, -6], [14, -6], [20, -6], [-20, 2], [20, 2], [-20, 10], [20, 10]];
  const stands = ITEMS.map((it, i) => { const [x, z] = spots[i]; const lb = tag3d(c, it.ic, '#fff', x, 2.4, z, true); lb.scale.set(2, 2, 1); it.x = x; it.z = z; it.lb = lb; it.cd = 0; return it; });
  const rivals = c.CAST.slice(0, 3).map((cs, i) => { const a = mkActor(c, cs, -6 + i * 6, -18, {}); a.homeX = a.B.pos.x; a.homeZ = a.B.pos.z; a.outfit = { ...cs.avatar }; a.stars = 0; return a; });
  const judges = c.CAST.slice(3, 5).map((cs, i) => { const a = mkActor(c, cs, i ? 5 : -5, 20, {}); a.ch.rotation.y = Math.PI; return a; });
  const worn = new Set(); const hud = () => c.hud('mg', `${theme.ic} ${T(c, theme.en, theme.ar)} · ⏳ ${Math.ceil(shopT)}`); hud(); c.hud('time', '');
  tag3d(c, theme.ic + ' ' + T(c, 'Theme: ', 'الموضوع: ') + T(c, theme.en, theme.ar), '#141A3B', 0, 7, -14, true).scale.set(10, 1.9, 1);
  const myStars = () => { let s = 0; ['hat', 'back', 'shirt', 'pants'].forEach(k => { const it = ITEMS.find(i => i.k === k && String(i.v) === String(av[k])); if (it && it.tags.includes(theme.id)) s++; }); return Math.min(5, s + 1); };
  return {
    intro: `${theme.ic} ${T(c, 'Theme:', 'الموضوع:')} ${T(c, theme.en, theme.ar)}! ${T(c, 'Walk onto the stands to try outfits (45s), then strut the runway and the judges vote ⭐', 'امشِ فوق المنصات لتجرّب الأزياء (45 ثانية)، ثم تمشَّ على الممشى ليصوّت الحكام ⭐')}`,
    move() { return phase === 'walk' ? { vx: 0, vz: 0 } : null; }, noJump() { return phase !== 'shop'; },
    update(dt) { tickBursts(c, fx, dt); judges.forEach(j => idle(c, j, dt));
      if (phase === 'shop') { shopT -= dt; if (Math.ceil(shopT + dt) !== Math.ceil(shopT)) hud();
        stands.forEach(it => { it.cd = Math.max(0, it.cd - dt); it.lb.position.y = 2.4 + Math.sin(S.t * 2 + it.x) * .15; if (it.cd <= 0 && dist(S.pos, it) < 1.5) { it.cd = 2; av[it.k] = it.v; c.setChar(c.character({ name: c.me.name, avatar: av, photoUrl: c.me.photoUrl })); c.sfx('ok'); c.msg(it.ic + ' ' + T(c, 'Trying it on!', 'جرّبته!'), 800); fx.push(burst(c, S.pos.x, 1.5, S.pos.z, 0xF472B6, 10)); } });
        rivals.forEach(r => { r.wait -= dt; if (r.wait <= 0) { r.wait = rnd(3, 6); const it = pick(stands); r.tx = it.x; r.tz = it.z; if (Math.random() < .6) r.outfit[it.k] = it.v; } drive(c, r, r.tx, r.tz, r.speed * .7, dt, true); chatter(c, r, dt, ['So cute! 💖', 'Love this hat!', 'Runway time soon!', 'يا سلام! 😍']); });
        if (shopT <= 0) { phase = 'walk'; walkT = 0; stars = myStars(); rivals.forEach(r => { r.stars = 1 + Math.floor(Math.random() * 4); }); const all = [{ n: c.me.name, s: stars, me: true }, ...rivals.map(r => ({ n: r.name, s: r.stars }))].sort((a, b) => b.s - a.s); rank = all.findIndex(a => a.me) + 1; results = all; S.pos.set(0, .9, -4); S.vel.set(0, 0, 0); S.yaw = 0; c.msg(T(c, '✨ Runway time! Strike a pose!', '✨ وقت الممشى! اتخذ وضعية!'), 2000); c.sfx('win'); rivals.forEach((r, i) => { r.B.pos.set(-12 + i * 12, .6, -10); }); } return; }
      if (phase === 'walk') { walkT += dt; const ch = c.getCh(); if (walkT < 4) { S.pos.z = Math.min(16, S.pos.z + dt * 4.5); ch.position.copy(S.pos); c.animate(ch, true, dt, false); } else if (walkT < 7) { if (!ch.userData.emote) c.emoteOn(ch, pick(['dance', 'spin', 'cheer'])); if (walkT > 5 && walkT < 5.1) { judges.forEach(j => c.bubbleOn(j.ch, '⭐'.repeat(stars))); fx.push(burst(c, 0, 3, 18, 0xFFD23F, 30)); c.msg(T(c, 'Judges:', 'الحكام:') + ' ' + '⭐'.repeat(stars), 2500); } }
        else if (walkT < 12) { rivals.forEach((r, i) => drive(c, r, -12 + i * 12 - (walkT - 7) * 3, 14, r.speed, dt, true)); }
        else { S.coins += stars * 2 + (rank === 1 ? 4 : 0); c.hud('coins', S.coins); c.msg(`🏅 #${rank} · ${'⭐'.repeat(stars)}`, 2500); c.finish(true); } rivals.forEach(r => walkT < 7 && idle(c, r, dt)); } },
    result(fin) { return { coinsTotal: 14, rank, stars, coins: S.coins }; },
    score(fin) { return stars * 20 + (rank === 1 ? 40 : rank === 2 ? 20 : 10); },
  };
}

/* ───────────────────────── 8. DUELS ───────────────────────── */
function duels(c) {
  const { S } = c; S.started = true; let myHp = 6, foeHp = 5, wins = 0, losses = 0, round = 1, pause = 0, punchT = 0, myKb = null, foeCd = 2.5; const fx = [];
  const foe = mkActor(c, pick(c.CAST), 5, 0, { speed: .9 }); foe.homeX = 5; foe.homeZ = 0; foe.B.pos.set(5, .6, 0); tintHead(foe, 0xEF4444);
  const hud = () => c.hud('mg', `❤️${myHp} vs ❤️${foeHp} · ${wins}-${losses}`); hud();
  const resetRound = () => { myHp = 6; foeHp = 5; S.pos.set(-5, .6, 0); S.vel.set(0, 0, 0); S.yaw = Math.PI / 2; foe.B.pos.set(5, .6, 0); foe.B.vel.set(0, 0, 0); myKb = null; hud(); c.msg(`🥊 ${T(c, 'Round', 'الجولة')} ${round}!`, 1500); };
  const endRound = (won) => { if (won) wins++; else losses++; pause = 2.2; round++; hud(); c.sfx(won ? 'win' : 'bad'); c.msg(won ? T(c, '🏆 You won the round!', '🏆 فزت بالجولة!') : T(c, '😅 Round lost', '😅 خسرت الجولة'), 2000); if (wins === 2 || losses === 2) { c.finish(wins === 2); } };
  return {
    intro: T(c, '🥊 Duel: best of 3! Tap PUNCH when close, dodge with jumps, and don’t fall off the arena!', '🥊 مبارزة: الأفضل من 3! اضغط PUNCH عندما تقترب، تفادَ بالقفز، ولا تسقط من الحلبة!'),
    move(ctl) { if (pause > 0) return { vx: 0, vz: 0 }; if (myKb) return { vx: myKb.x, vz: myKb.z }; return null; },
    action() { if (punchT > 0 || pause > 0) return; punchT = .5; const ch = c.getCh(); c.emoteOn(ch, 'wave'); ch.userData.emoteT = 1.9; c.sfx('tap'); const { fx: dx, fz: dz } = facing(ch); const mx = foe.B.pos.x - S.pos.x, mz = foe.B.pos.z - S.pos.z, d = Math.hypot(mx, mz);
      if (d < 2.9 && (mx * dx + mz * dz) / Math.max(.1, d) > -.1) { foeHp--; foe.kb = { x: mx / d * 8, z: mz / d * 8, t: .3 }; fx.push(burst(c, foe.B.pos.x, 2, foe.B.pos.z, 0xFFD23F, 10)); c.sfx('ok'); hud(); c.msg('👊 ' + T(c, 'Hit!', 'إصابة!'), 400); if (foeHp <= 0) endRound(true); } },
    fell() { if (pause > 0) return; S.pos.set(-5, 3, 0); S.vel.set(0, 0, 0); endRound(false); },
    update(dt) { tickBursts(c, fx, dt); punchT = Math.max(0, punchT - dt); if (myKb) { myKb.t -= dt; if (myKb.t <= 0) myKb = null; }
      if (pause > 0) { pause -= dt; idle(c, foe, dt); if (pause <= 0 && !S.done) resetRound(); return; }
      if (foe.kb) { c.moveBody(foe.B, foe.kb.x, foe.kb.z, dt); foe.kb.t -= dt; if (foe.kb.t <= 0) foe.kb = null; foe.ch.position.copy(foe.B.pos); }
      else { foe.cool -= dt; const d = dist(foe.B.pos, S.pos); if (foe.cool <= 0) { foe.cool = rnd(.6, 1.4); foe.mode = Math.random() < .25 ? 'circle' : 'chase'; }
        let tx = S.pos.x, tz = S.pos.z; if (foe.mode === 'circle') { const a = Math.atan2(foe.B.pos.z - S.pos.z, foe.B.pos.x - S.pos.x) + dt * 2; tx = S.pos.x + Math.cos(a) * 3; tz = S.pos.z + Math.sin(a) * 3; }
        drive(c, foe, tx, tz, d > 1.6 || foe.mode === 'circle' ? foe.speed : 0, dt, true); foe.ch.rotation.y = Math.atan2(S.pos.x - foe.B.pos.x, S.pos.z - foe.B.pos.z);
        foeCd -= dt; if (foeCd <= 0 && d < 2.1 && Math.abs(S.pos.y - foe.B.pos.y) < 1.2 && S.onGround) { foeCd = rnd(2, 2.8); foe.mode = 'circle'; foe.cool = 1.2; c.emoteOn(foe.ch, 'wave'); foe.ch.userData.emoteT = 1.9; myHp--; const mx = S.pos.x - foe.B.pos.x, mz = S.pos.z - foe.B.pos.z, md = Math.hypot(mx, mz) || 1; myKb = { x: mx / md * 8, z: mz / md * 8, t: .3 }; fx.push(burst(c, S.pos.x, 2, S.pos.z, 0xEF4444, 10)); c.sfx('bad'); hud(); c.msg('💥 ' + T(c, 'Ouch!', 'آخ!'), 400); if (myHp <= 0) endRound(false); } }
      if (foe.B.pos.y < -3) { foe.B.pos.set(5, 3, 0); foe.B.vel.set(0, 0, 0); endRound(true); } chatter(c, foe, dt, ['Come on! 🥊', 'Nice move!', 'Haha! 😄', 'يلا! 🥊']); },
    timeUp() { return wins > losses; },
    result(fin) { return { coinsTotal: 12, wins, losses, coins: S.coins + wins * 4 + (fin ? 4 : 0) }; },
    score(fin) { return wins * 40 + (fin ? 40 : 0) - losses * 5; },
  };
}

/* ───────────────────────── 9. RIVALS (water balloon battle 2v2) ───────────────────────── */
function rivals(c) {
  const { S, scene } = c; S.started = true; let myCd = 0, mySoak = 0, meOut = 0, score = [0, 0]; const shots = [], fx = [];
  const mk = (cs, x, z, team) => { const a = mkActor(c, cs, x, z, { speed: .9 }); a.homeX = x; a.homeZ = z; a.team = team; a.soak = 0; a.out = 0; a.cd = rnd(1, 2); tintHead(a, team === 0 ? 0x3B82F6 : 0xEF4444); return a; };
  const mates = [mk(c.CAST[0], -18, 6, 0)], foes = [mk(c.CAST[1], 18, -6, 1), mk(c.CAST[2], 18, 6, 1)];
  const hud = () => c.hud('mg', `💧 ${score[0]} : ${score[1]} · 🫧${mySoak}/3`); hud();
  const shoot = (from, dx, dz, team, byMe) => { const d = Math.hypot(dx, dz) || 1; const m = sphere(c, .35, team === 0 ? 0x38BDF8 : 0xF87171, from.x + dx / d * .8, from.y + 1.6, from.z + dz / d * .8); shots.push({ m, v: V3(dx / d * 17, 2.5, dz / d * 17), t: 0, team, byMe }); c.sfx('tap'); };
  const soak = (who, team) => { if (who === 'me') { mySoak++; fx.push(burst(c, S.pos.x, 1.8, S.pos.z, 0x38BDF8, 16)); c.sfx('bad'); c.msg('💦 ' + T(c, 'Splash! You got wet', 'طرطشة! تبللت'), 700); if (mySoak >= 3) { mySoak = 0; meOut = 4; score[1]++; c.msg(T(c, '🫧 Soaked! Dry off 4s…', '🫧 تبللت تمامًا! تجفّف 4 ثوانٍ…'), 1500); } }
    else { who.soak++; fx.push(burst(c, who.B.pos.x, 1.8, who.B.pos.z, team === 0 ? 0x38BDF8 : 0xF87171, 16)); if (who.soak >= 3) { who.soak = 0; who.out = 4; score[1 - who.team]++; c.bubbleOn(who.ch, '🫧'); if (who.team === 1) { c.sfx('win'); c.msg('🎯 ' + who.name + ' ' + T(c, 'is soaked! +1', 'تبلل! +1'), 1000); S.coins += 2; c.hud('coins', S.coins); } } } hud(); if (score[0] >= 5 || score[1] >= 5) c.finish(score[0] > score[1]); };
  return {
    intro: T(c, '💧 Rivals 2v2 water battle! Tap SPLASH to throw water balloons. 3 hits = soaked. First team to 5 wins. Hide behind crates!', '💧 معركة ماء 2 ضد 2! اضغط SPLASH لرمي بالونات الماء. 3 إصابات = مبلّل. أول فريق يصل إلى 5 يفوز. اختبئ خلف الصناديق!'),
    move() { return meOut > 0 ? { vx: 0, vz: 0 } : null; },
    action() { if (myCd > 0 || meOut > 0) return; myCd = .7; const ch = c.getCh(); const { fx: dx, fz: dz } = facing(ch); shoot(S.pos, dx, dz, 0, true); c.emoteOn(ch, 'wave'); ch.userData.emoteT = 1.9; },
    update(dt) { tickBursts(c, fx, dt); myCd = Math.max(0, myCd - dt); meOut = Math.max(0, meOut - dt);
      for (let i = shots.length - 1; i >= 0; i--) { const s = shots[i]; s.t += dt; s.v.y -= 9 * dt; s.m.position.addScaledVector(s.v, dt); let hit = false;
        if (s.team === 1 && meOut <= 0 && dist(s.m.position, S.pos) < 1.1 && Math.abs(s.m.position.y - S.pos.y - 1) < 1.6) { soak('me', 1); hit = true; }
        [...mates, ...foes].forEach(a => { if (!hit && a.team !== s.team && a.out <= 0 && dist(s.m.position, a.B.pos) < 1.1 && Math.abs(s.m.position.y - a.B.pos.y - 1) < 1.6) { soak(a, s.team); hit = true; } });
        if (!hit && c.solids.some(p => p.kind === 'plat' && c.overlap(p, s.m.position.x, s.m.position.y - .3, s.m.position.z))) hit = true;
        if (hit || s.t > 2 || s.m.position.y < .6) { if (!hit) fx.push(burst(c, s.m.position.x, .8, s.m.position.z, 0x93C5FD, 6)); scene.remove(s.m); shots.splice(i, 1); } }
      [...mates, ...foes].forEach(a => { a.out = Math.max(0, a.out - dt); a.cd -= dt; if (a.out > 0) { idle(c, a, dt); return; } const enemies = a.team === 0 ? foes.filter(f => f.out <= 0).map(f => f.B.pos) : [S.pos, ...mates.filter(m => m.out <= 0).map(m => m.B.pos)].filter((_, i) => !(a.team === 1 && i === 0 && meOut > 0));
        let tgt = null, td = 99; enemies.forEach(p => { const d = dist(a.B.pos, p); if (d < td) { td = d; tgt = p; } });
        if (tgt) { const dx = tgt.x - a.B.pos.x, dz = tgt.z - a.B.pos.z; const want = 8; a.wait -= dt; if (a.wait <= 0) { a.wait = rnd(1, 2.5); a.side = Math.random() < .5 ? 1 : -1; } const sx = -dz / (td || 1) * a.side, sz = dx / (td || 1) * a.side; const tx = td > want ? tgt.x : a.B.pos.x + sx * 4 - dx / td * 2, tz = td > want ? tgt.z : a.B.pos.z + sz * 4 - dz / td * 2; drive(c, a, clamp(tx, -23, 23), clamp(tz, -15, 15), a.speed, dt, true); a.ch.rotation.y = Math.atan2(dx, dz);
          if (a.cd <= 0 && td < 14) { a.cd = a.team === 1 ? rnd(2, 3) : rnd(1.2, 2); const n = a.team === 1 ? 4 : 2; shoot(a.B.pos, dx + rnd(-n, n), dz + rnd(-n, n), a.team, false); } }
        else idle(c, a, dt); chatter(c, a, dt, ['Splash! 💦', 'Take cover!', 'Got you! 😄', 'هاها! 💦']); }); },
    timeUp() { return score[0] >= score[1]; },
    result(fin) { return { coinsTotal: 14, soaks: score[0], coins: S.coins + (fin ? 4 : 0) }; },
    score(fin) { return score[0] * 20 + (fin ? 50 : 0) + Math.floor(S.left || 0); },
  };
}

/* ───────────────────────── 10. STEAL AN EGG ───────────────────────── */
function eggs(c) {
  const { S, scene } = c; S.started = true; let carrying = null, eggsHome = 0, pets = [], incomeT = 0; const fx = [];
  const BIO = [{ id: 'meadow', x: -20, z: -20, col: 0xFDE047, pet: 'duck', sp: 3.2, v: 1, ic: '🐥' }, { id: 'forest', x: 20, z: -20, col: 0xF97316, pet: 'cat', sp: 3.9, v: 1, ic: '🐱' }, { id: 'ice', x: -20, z: 20, col: 0x93C5FD, pet: 'dog', sp: 4.6, v: 2, ic: '🐶' }, { id: 'volcano', x: 20, z: 20, col: 0xEF4444, pet: 'dragon', sp: 5.4, v: 3, ic: '🐲' }];
  const eggList = []; BIO.forEach(b => { [[-8, -8], [8, 8], [8, -8]].forEach(off => { const x = b.x + off[0], z = b.z + off[1]; const m = sphere(c, .55, b.col, x, 1.1, z); m.scale.y = 1.35; const lb = tag3d(c, '🥚', '#fff', x, 2.4, z); eggList.push({ b, m, lb, x, z, taken: false, respawn: 0 }); }); });
  const guards = BIO.map((b, i) => { const m = c.monster(); m.position.set(b.x, .5, b.z + 8); m.children[0].material = M(b.col); m.scale.setScalar(.9 + i * .08); scene.add(m); return { m, b, tx: b.x, tz: b.z, wait: 0, lineT: rnd(4, 8) }; });
  const held = sphere(c, .5, 0xffffff, 0, 0, 0); held.visible = false; c.getCh().add(held); held.position.set(0, 4.6, 0); held.scale.set(1.6, 2.1, 1.6);
  const hud = () => c.hud('mg', `🥚 ${eggsHome} · 🐣 ${pets.length}` + (carrying ? ' · ' + carrying.b.ic + '🥚' : '')); hud();
  const dropEgg = (reason) => { if (!carrying) return; carrying.taken = false; carrying.m.visible = true; carrying.lb.visible = true; carrying = null; held.visible = false; S.speedMul = 1; hud(); c.sfx('bad'); c.msg(reason, 1400); };
  return {
    intro: T(c, '🥚 Grab an egg from a biome and run home before the Guardian catches you! Eggs hatch into pets that earn coins. Volcano eggs are worth the most!', '🥚 التقط بيضة من منطقة واركض إلى البيت قبل أن يمسكك الحارس! تفقس البيضات حيوانات تجلب العملات. بيض البركان الأغلى!'),
    update(dt) { tickBursts(c, fx, dt);
      eggList.forEach(e => { if (e.taken) { if (e.respawn > 0) { e.respawn -= dt; if (e.respawn <= 0) { e.taken = false; e.m.visible = true; e.lb.visible = true; } } return; } e.m.rotation.y += dt; if (!carrying && dist(S.pos, e) < 1.3) { e.taken = true; e.m.visible = false; e.lb.visible = false; carrying = e; held.visible = true; held.material.color.setHex(e.b.col); S.speedMul = .92; c.sfx('ok'); c.msg(e.b.ic + '🥚 ' + T(c, 'Got it! RUN HOME! 🏡', 'أخذتها! اركض إلى البيت! 🏡'), 1200); hud(); } });
      guards.forEach(g => { const inBiome = Math.abs(S.pos.x - g.b.x) < 16 && Math.abs(S.pos.z - g.b.z) < 16; const sp = g.b.sp * (carrying ? 1.1 : .9);
        if (inBiome && dist(g.m.position, S.pos) < 14) { c.moveOnGround(g.m, S.pos.x, S.pos.z, sp, dt); if (dist(g.m.position, S.pos) < 1.3 && S.pos.y < 2.5) { if (carrying && carrying.b === g.b) { const e = carrying; dropEgg(T(c, '😱 The Guardian got you! Egg returned', '😱 أمسكك الحارس! عادت البيضة')); e.respawn = 6; e.taken = true; e.m.visible = false; e.lb.visible = false; } else if (carrying) dropEgg(T(c, '😱 Caught! You dropped the egg', '😱 أُمسكت! سقطت البيضة')); else { S.pos.set(0, .6, -6); S.vel.set(0, 0, 0); c.sfx('bad'); c.msg(T(c, '😅 Caught! Back home', '😅 أُمسكت! عدت للبيت'), 1000); } } }
        else { g.wait -= dt; if (g.wait <= 0) { g.wait = rnd(2, 4); g.tx = g.b.x + rnd(-12, 12); g.tz = g.b.z + rnd(-12, 12); } c.moveOnGround(g.m, g.tx, g.tz, sp * .5, dt); }
        g.m.position.y = .5 + Math.abs(Math.sin(S.t * 8)) * .15; g.lineT -= dt; if (g.lineT <= 0) { g.lineT = rnd(6, 12); c.bubbleOn(g.m, pick(['My eggs! 😤', 'Stay away!', 'Grr! 🥚', 'بيضي! 😤'])); } c.bubbleTick(g.m, dt); });
      if (carrying && Math.abs(S.pos.x) < 6 && Math.abs(S.pos.z) < 6) { const e = carrying; eggsHome++; S.coins += e.b.v * 3; c.hud('coins', S.coins); const n = pets.length; const px = -4 + (n % 5) * 2, pz = -4 + Math.floor(n / 5) * 2.5; const m = sphere(c, .5, e.b.col, px, 1, pz); m.scale.y = 1.35; pets.push({ b: e.b, m, hatch: 8, pet: null, x: px, z: pz, lb: tag3d(c, '⏳', '#fff', px, 2.3, pz) }); carrying = null; held.visible = false; S.speedMul = 1; e.respawn = 12; c.sfx('win'); c.msg(`🏡 ${T(c, 'Egg placed! +', 'وضعت البيضة! +')}${e.b.v * 3} 🪙 · ${T(c, 'hatching…', 'تفقس…')}`, 1400); fx.push(burst(c, px, 1.5, pz, e.b.col, 14)); hud(); }
      incomeT += dt; pets.forEach(p => { if (!p.pet) { p.hatch -= dt; p.m.rotation.z = Math.sin(S.t * 12) * (p.hatch < 2 ? .25 : .05); if (p.hatch <= 0) { scene.remove(p.m); p.pet = c.pet(p.b.pet); p.pet.position.set(p.x, .5, p.z); scene.add(p.pet); p.lb.material.map = c.label(p.b.ic, '#fff').material.map; c.sfx('win'); c.msg(p.b.ic + ' ' + T(c, 'Hatched! It earns coins now', 'فقست! تجلب عملات الآن'), 1200); fx.push(burst(c, p.x, 1.5, p.z, 0xFFD23F, 14)); hud(); } } else { p.pet.position.y = .5 + Math.abs(Math.sin(S.t * 6 + p.x)) * .15; p.pet.rotation.y += dt * .5; } });
      if (incomeT >= 6) { incomeT = 0; const inc = pets.reduce((a, p) => a + (p.pet ? p.b.v : 0), 0); if (inc > 0) { S.coins += inc; c.hud('coins', S.coins); c.msg(`🐾 +${inc} 🪙`, 800); c.sfx('ok'); } } },
    timeUp() { c.msg(`🥚 ${eggsHome} ${T(c, 'eggs · 🐣', 'بيضة · 🐣')} ${pets.filter(p => p.pet).length}`, 2000); return eggsHome >= 2; },
    result(fin) { return { coinsTotal: 30, eggs: eggsHome, coins: S.coins }; },
    score(fin) { return eggsHome * 25 + S.coins * 2 + (fin ? 30 : 0); },
  };
}

/* ───────────────────────── 11. THROW FOOD FOR ANIMALS ───────────────────────── */
function feed(c) {
  const { S, scene } = c; S.started = true; let charging = false, meter = 0, dir = 1, penned = []; const foods = [], fx = [];
  const KINDS = [{ k: 'duck', ic: '🦆', v: 2, r: [10, 18] }, { k: 'cat', ic: '🐱', v: 3, r: [16, 24] }, { k: 'dog', ic: '🐶', v: 4, r: [22, 30] }, { k: 'dragon', ic: '🐲', v: 8, r: [30, 38] }];
  const animals = []; KINDS.forEach(k => { for (let i = 0; i < 4; i++) { const a = Math.random() * 6.28, r = rnd(k.r[0], k.r[1]); const m = c.pet(k.k); m.scale.setScalar(.9); m.position.set(Math.cos(a) * r, .5, Math.sin(a) * r); scene.add(m); const lb = c.label(k.ic, '#fff'); lb.position.y = 2.2; m.add(lb); animals.push({ k, m, tx: m.position.x, tz: m.position.z, wait: rnd(1, 3), state: 'wild', food: null, eatT: 0 }); } });
  const hud = () => c.hud('mg', charging ? '🎯 ' + '█'.repeat(Math.round(meter / 2)) + '░'.repeat(10 - Math.round(meter / 2)) + ` ${Math.round(meter)}` : `🐾 ${penned.length}/8`); hud();
  const throwFood = () => { const ch = c.getCh(); const { fx: dx, fz: dz } = facing(ch); const m = sphere(c, .3, 0xA16207, S.pos.x + dx, S.pos.y + 1.8, S.pos.z + dz); const sp = 5 + meter * 1.15; foods.push({ m, v: V3(dx * sp, 7 + meter * .25, dz * sp), landed: false, t: 0 }); c.sfx('tap'); c.emoteOn(ch, 'wave'); ch.userData.emoteT = 1.9; };
  return {
    intro: T(c, '🍖 HOLD the THROW button to charge (0–20), release to throw food far! Animals come eat, then follow you to your pen 🏡. Far animals are worth more!', '🍖 اضغط مطوّلًا على زر الرمي للشحن (0–20) ثم اتركه لترمي الطعام بعيدًا! تأتي الحيوانات لتأكل ثم تتبعك إلى حظيرتك 🏡. الحيوانات البعيدة أغلى!'),
    action(phase) { if (phase === 'down') { charging = true; meter = 0; dir = 1; hud(); } else if (phase === 'up' && charging) { charging = false; throwFood(); hud(); } },
    update(dt) { tickBursts(c, fx, dt); if (charging) { meter += dir * dt * 14; if (meter >= 20) { meter = 20; dir = -1; } if (meter <= 0) { meter = 0; dir = 1; } hud(); }
      for (let i = foods.length - 1; i >= 0; i--) { const f = foods[i]; f.t += dt; if (!f.landed) { f.v.y -= 14 * dt; f.m.position.addScaledVector(f.v, dt); if (f.m.position.y <= .8) { f.m.position.y = .8; f.landed = true; fx.push(burst(c, f.m.position.x, 1, f.m.position.z, 0xA16207, 6)); let best = null, bd = 7; animals.forEach(a => { if (a.state !== 'wild') return; const d = dist(a.m.position, f.m.position); if (d < bd) { bd = d; best = a; } }); if (best) { best.state = 'eat'; best.food = f; c.bubbleOn(best.m, pick(['Yum! 😋', 'Food! 🍖', 'Mine!'])); } else { c.msg(T(c, 'No animal nearby… throw closer to one 🐾', 'لا حيوان قريب… ارمِ أقرب إلى أحدها 🐾'), 1200); } } }
        if (f.t > 12 && f.landed && !animals.some(a => a.food === f)) { scene.remove(f.m); foods.splice(i, 1); } }
      animals.forEach(a => { a.wait -= dt; let moving = false;
        if (a.state === 'wild') { if (a.wait <= 0) { a.wait = rnd(2, 5); const ang = Math.random() * 6.28, r = rnd(a.k.r[0], a.k.r[1]); a.tx = Math.cos(ang) * r; a.tz = Math.sin(ang) * r; } moving = c.moveOnGround(a.m, a.tx, a.tz, 2.2, dt); }
        else if (a.state === 'eat') { const f = a.food; moving = c.moveOnGround(a.m, f.m.position.x, f.m.position.z, 5, dt); if (dist(a.m.position, f.m.position) < .9) { a.eatT += dt; a.m.rotation.x = Math.sin(S.t * 14) * .2; if (a.eatT > 1.5) { a.m.rotation.x = 0; scene.remove(f.m); foods.splice(foods.indexOf(f), 1); a.food = null; a.state = 'follow'; c.bubbleOn(a.m, '💖'); c.sfx('ok'); c.msg(a.k.ic + ' ' + T(c, 'is following you! Walk to the pen 🏡', 'يتبعك! امشِ إلى الحظيرة 🏡'), 1400); } } }
        else if (a.state === 'follow') { const idx = animals.filter(o => o.state === 'follow').indexOf(a); const { fx, fz } = facing(c.getCh()); moving = c.moveOnGround(a.m, S.pos.x - fx * (2 + idx * 1.2), S.pos.z - fz * (2 + idx * 1.2), 6, dt); if (Math.abs(S.pos.x) < 6 && Math.abs(S.pos.z) < 6 && penned.length < 8) { a.state = 'pen'; penned.push(a); a.m.position.set(rnd(-4, 4), .5, rnd(-4, 4)); S.coins += a.k.v; c.hud('coins', S.coins); hud(); c.sfx('win'); c.msg(`🏡 ${a.k.ic} +${a.k.v} 🪙`, 1200); fx.push(burst(c, a.m.position.x, 1.5, a.m.position.z, 0xFFD23F, 12)); a.tx = rnd(-5, 5); a.tz = rnd(-5, 5); } }
        else if (a.state === 'pen') { if (a.wait <= 0) { a.wait = rnd(2, 4); a.tx = rnd(-5, 5); a.tz = rnd(-5, 5); } moving = c.moveOnGround(a.m, a.tx, a.tz, 1.6, dt); }
        a.m.position.y = .5 + (moving ? Math.abs(Math.sin(S.t * 10 + a.tx)) * .2 : 0); c.bubbleTick(a.m, dt); }); },
    timeUp() { c.msg(`🐾 ${penned.length} ${T(c, 'animals in your pen!', 'حيوانات في حظيرتك!')}`, 2000); return penned.length >= 3; },
    result(fin) { return { coinsTotal: 24, animals: penned.length, coins: S.coins }; },
    score(fin) { return penned.reduce((a, p) => a + p.k.v * 5, 0) + (fin ? 30 : 0); },
  };
}

/* ───────────────────────── 12. HUSS VALLEY (momentum tag) ───────────────────────── */
function huss(c) {
  const { S } = c; S.started = true; const vel = V3(); let cross = 0, side = -1, dashT = 0, dashCd = 0, meChaser = false, tagged = 0, won = null; const fx = [];
  const runners = c.CAST.slice(0, 3).map((cs, i) => { const a = mkActor(c, cs, -30, -8 + i * 8, { speed: 1.05 }); a.homeX = -30; a.homeZ = a.B.pos.z; a.v = V3(); a.side = -1; a.cross = 0; a.chaser = false; a.done = false; a.jit = 0; return a; });
  const chaser = mkActor(c, c.CAST[3], 30, 0, { speed: 1.12 }); chaser.homeX = 30; chaser.homeZ = 0; chaser.v = V3(); chaser.chaser = true; tintHead(chaser, 0xEF4444); runners.push(chaser);
  const hud = () => c.hud('mg', meChaser ? `😈 ${T(c, 'CHASER', 'مطارد')} · 🏃 ${runners.filter(r => !r.chaser && !r.done).length}` : `🏁 ${cross}/3 · ⚡ ${dashCd > 0 ? Math.ceil(dashCd) : 'DASH'}`); hud();
  const momentum = (v, tx, tz, max, dt) => { const d = Math.hypot(tx, tz); if (d > .05) { v.x += tx / d * 18 * dt; v.z += tz / d * 18 * dt; } else { v.x *= Math.max(0, 1 - 4 * dt); v.z *= Math.max(0, 1 - 4 * dt); } const s = Math.hypot(v.x, v.z); if (s > max) { v.x *= max / s; v.z *= max / s; } };
  const tagRunner = (r, by) => { r.chaser = true; tintHead(r, 0xEF4444); tagged++; c.sfx('bad'); c.msg('😈 ' + r.name + ' ' + T(c, 'got tagged and is now a chaser!', 'تم لمسه وأصبح مطاردًا!'), 1500); hud(); if (runners.every(x => x.chaser || x.done) && meChaser) { won = true; c.finish(true); } };
  return {
    intro: T(c, '🏃 Huss Valley: cross the arena 3 times (green ↔ blue) without getting tagged! Movement slides — tap DASH to burst. If tagged, you become a chaser!', '🏃 وادي هَس: اعبر الحلبة 3 مرات (أخضر ↔ أزرق) دون أن يلمسك المطارد! الحركة تنزلق — اضغط DASH للاندفاع. إذا لُمست تصبح مطاردًا!'),
    move(ctl) { const max = (dashT > 0 ? 17 : 8.2) * (meChaser ? 1.05 : 1); momentum(vel, ctl.mx * ctl.rx + ctl.mz * ctl.fx, ctl.mx * ctl.rz + ctl.mz * ctl.fz, max, ctl.dt); if (dashT > 0) { const s = Math.hypot(vel.x, vel.z) || 1; const { fx: dx, fz: dz } = facing(c.getCh()); if (s < 2) { vel.x = dx * 17; vel.z = dz * 17; } else { vel.x *= 17 / s; vel.z *= 17 / s; } } return { vx: vel.x, vz: vel.z }; },
    action() { if (dashCd > 0) return; dashCd = 2.5; dashT = .3; c.sfx('ok'); c.msg('⚡ DASH', 400); fx.push(burst(c, S.pos.x, 1, S.pos.z, 0xFFD23F, 8)); hud(); },
    update(dt) { tickBursts(c, fx, dt); dashT = Math.max(0, dashT - dt); if (dashCd > 0) { const p = dashCd; dashCd = Math.max(0, dashCd - dt); if (Math.ceil(p) !== Math.ceil(dashCd)) hud(); }
      if (!meChaser) { if (side === -1 && S.pos.x > 26) { side = 1; cross++; } else if (side === 1 && S.pos.x < -26) { side = -1; cross++; } if (cross >= 3 && !S.done) { won = true; c.sfx('win'); c.msg(T(c, '🏆 3 crossings! You win!', '🏆 3 عبورات! فزت!'), 2000); c.finish(true); return; } hud(); }
      runners.forEach(r => { if (r.done) { idle(c, r, dt); return; } let tx = 0, tz = 0;
        if (r.chaser) { let tgt = null, td = 99; if (!meChaser && dist(r.B.pos, S.pos) < td) { td = dist(r.B.pos, S.pos); tgt = S.pos; } runners.forEach(o => { if (!o.chaser && !o.done) { const d = dist(r.B.pos, o.B.pos); if (d < td) { td = d; tgt = o.B.pos; } } }); if (tgt) { tx = tgt.x - r.B.pos.x; tz = tgt.z - r.B.pos.z; } }
        else { const goal = r.side === -1 ? 30 : -30; tx = goal - r.B.pos.x; r.jit += dt; tz = Math.sin(r.jit * 1.3 + r.homeZ) * 6 - r.B.pos.z; const threats = runners.filter(o => o.chaser && dist(o.B.pos, r.B.pos) < 7).map(o => o.B.pos); if (meChaser && dist(S.pos, r.B.pos) < 7) threats.push(S.pos); threats.forEach(p => { tx += (r.B.pos.x - p.x) * 2.5; tz += (r.B.pos.z - p.z) * 2.5; }); if (r.side === -1 && r.B.pos.x > 26) { r.side = 1; r.cross++; } else if (r.side === 1 && r.B.pos.x < -26) { r.side = -1; r.cross++; } if (r.cross >= 3) { r.done = true; c.emoteOn(r.ch, 'cheer'); c.msg('🏁 ' + r.name + ' ' + T(c, 'finished!', 'أنهى!'), 1200); if (meChaser && !S.done) { c.msg(T(c, '😅 A runner escaped!', '😅 هرب أحد العدّائين!'), 2000); c.finish(false); } } }
        momentum(r.v, tx, tz, r.speed * 1.25 * (r.chaser ? 1.08 : 1), dt); c.moveBody(r.B, r.v.x, r.v.z, dt); if (r.B.pos.y < -4) { r.B.pos.set(r.homeX, 1, r.homeZ); } r.ch.position.copy(r.B.pos); const sp = Math.hypot(r.v.x, r.v.z); if (sp > .4) r.ch.rotation.y = Math.atan2(r.v.x, r.v.z); c.animate(r.ch, sp > .4 && r.B.onGround, dt, false); c.bubbleTick(r.ch, dt); chatter(c, r, dt, r.chaser ? ['Gotcha! 😈', 'Run run run!', 'Here I come!'] : ['Faster! 🏃', 'Almost there!', 'Dodge!', 'يلا بسرعة!']);
        if (r.chaser && !meChaser && dist(r.B.pos, S.pos) < 1.3 && Math.abs(r.B.pos.y - S.pos.y) < 1.5) { meChaser = true; c.sfx('bad'); c.msg(T(c, '😈 Tagged! Now YOU chase — tag everyone before they finish!', '😈 لُمست! الآن أنت المطارد — المس الجميع قبل أن ينهوا!'), 2500); hud(); }
        if (meChaser && !r.chaser && dist(r.B.pos, S.pos) < 1.3) tagRunner(r); });
    },
    timeUp() { return cross >= 3 || won === true; },
    result(fin) { return { coinsTotal: 12, crossings: cross, tagged, coins: S.coins + cross * 2 + tagged * 2 + (fin ? 4 : 0) }; },
    score(fin) { return cross * 25 + tagged * 15 + (fin ? 40 : 0); },
  };
}

const GAMES = { soccer: (c) => soccer(c, false), blast: (c) => soccer(c, true), mystery, evade, fisch, fruits, dress, duels, rivals, eggs, feed, huss };
export function makeMinigame(id, c) { const f = GAMES[id]; return f ? f(c) : null; }
