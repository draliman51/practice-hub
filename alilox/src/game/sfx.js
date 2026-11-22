let AC = null; let muted = false;
export function setMuted(m) { muted = m; }
function beep(f = 600, d = .08, type = 'sine', v = .15) { if (muted) return; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.value = f; g.gain.value = v; o.connect(g); g.connect(AC.destination); o.start(); g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + d); o.stop(AC.currentTime + d); } catch { } }
export const sfx = {
  tap: () => beep(500, .05, 'square', .06), ok: () => { beep(660, .08); setTimeout(() => beep(880, .1), 70); }, bad: () => beep(180, .2, 'sawtooth', .1),
  win: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, .15, 'triangle', .14), i * 110)), coin: () => beep(1200, .06, 'square', .05),
};
export const play = (n) => sfx[n] && sfx[n]();
