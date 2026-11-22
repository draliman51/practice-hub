'use client';
import { useEffect, useState } from 'react';
let listeners: ((m: string) => void)[] = [];
export function toast(m: string) { listeners.forEach((l) => l(m)); }
export default function Toaster() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { let t: any; const l = (m: string) => { setMsg(m); clearTimeout(t); t = setTimeout(() => setMsg(null), 2200); }; listeners.push(l); return () => { listeners = listeners.filter((x) => x !== l); }; }, []);
  return msg ? <div className="toast pop" role="status">{msg}</div> : null;
}
export function confetti() {
  if (typeof document === 'undefined') return;
  const c = document.createElement('canvas'); Object.assign(c.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '70' } as any); c.width = innerWidth; c.height = innerHeight; document.body.append(c);
  const g = c.getContext('2d')!; const P = Array.from({ length: 140 }, () => ({ x: Math.random() * c.width, y: -20 - Math.random() * 200, v: 2 + Math.random() * 4, s: 6 + Math.random() * 8, c: ['#FFD23F', '#FF5DA2', '#2EE6D6', '#A78BFA', '#4ADE80', '#FF8A3D'][Math.floor(Math.random() * 6)], r: Math.random() * 6 }));
  let f = 0; const loop = () => { g.clearRect(0, 0, c.width, c.height); P.forEach((p) => { p.y += p.v; p.x += Math.sin((f + p.r) / 10); g.fillStyle = p.c; g.fillRect(p.x, p.y, p.s, p.s * 0.6); }); if (++f < 150) requestAnimationFrame(loop); else c.remove(); }; loop();
}
