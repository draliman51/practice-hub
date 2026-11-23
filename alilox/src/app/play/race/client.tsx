'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/lib/i18n';
import { rpc } from '@/components/AppShell';
import { toast, confetti } from '@/components/Toast';
import { play } from '@/game/sfx';
import type { Profile } from '@/lib/types';
const PETS: Record<string, string> = { duck: '🦆', cat: '🐱', dog: '🐶', dragon: '🐉', robot: '🤖', none: '🐣' };
export default function RaceClient({ profile }: { profile: Profile }) {
  const { t, lang } = useT(); const r = useRouter();
  const [state, setState] = useState<'ready' | 'go' | 'done'>('ready'); const [pos, setPos] = useState([0, 0, 0, 0]); const [place, setPlace] = useState(0); const [taps, setTaps] = useState(0);
  const t0 = useRef(0); const raf = useRef(0); const me = useRef(0); const bots = useRef([0, 0, 0]); const speeds = useRef([0, 0, 0]);
  const start = () => { setState('go'); me.current = 0; bots.current = [0, 0, 0]; speeds.current = [.62 + Math.random() * .25, .62 + Math.random() * .25, .62 + Math.random() * .25]; t0.current = performance.now(); setTaps(0); loop(); };
  const loop = () => { const dt = (performance.now() - t0.current) / 1000; bots.current = bots.current.map((b, i) => Math.min(100, speeds.current[i] * 100 * dt / 7 + Math.sin(dt * 3 + i) * 2)); me.current = Math.max(0, me.current - .05); setPos([me.current, ...bots.current]);
    if (me.current >= 100 || bots.current.some((b) => b >= 100)) { const p = 1 + bots.current.filter((b) => b >= me.current).length; setPlace(p); setState('done'); if (p === 1) { confetti(); play('win'); } rpc('finish_run', { p_world: 'race', p_mode: 'solo', p_score: p === 1 ? 3 : p === 2 ? 2 : 1, p_time: Math.round(dt), p_coins: p === 1 ? 10 : p === 2 ? 5 : 2, p_finished: p === 1, p_deaths: 0 }).then((d: any) => d && toast(`+${d.coins} 🪙`)); return; }
    raf.current = requestAnimationFrame(loop); };
  const tap = () => { if (state !== 'go') return; me.current = Math.min(100, me.current + 2.2); setTaps((x) => x + 1); play('tap'); };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  const lanes = [{ n: profile.display_name, ic: PETS[profile.avatar.pet] || '🐣', me: true }, { n: 'Bot Bolt', ic: '🐢' }, { n: 'Bot Zoom', ic: '🐇' }, { n: 'Bot Dash', ic: '🐢' }];
  return <div><h1 className="text-3xl">🐾 {t('race')}</h1><p className="muted">{t('raceD')}</p>
    <div className="card mt-3 space-y-3 select-none" onPointerDown={tap}>
      {lanes.map((l, i) => <div key={i} className="relative h-10 rounded-full bg-white/10"><div className="absolute inset-y-0 end-2 grid place-items-center">🏁</div><div className="absolute top-0 h-10 text-3xl transition-[left] duration-100" style={{ left: `calc(${pos[i]}% - ${pos[i] * .4}px)` }}>{l.ic}</div><div className="absolute -top-1 start-2 text-[10px] font-bold text-white/70">{l.n}</div></div>)}
    </div>
    {state === 'ready' && <button className="btn-sun w-full mt-4 text-xl" onClick={start}>{lang === 'ar' ? '🚦 انطلق!' : '🚦 Go!'}</button>}
    {state === 'go' && <button className="btn-candy w-full mt-4 text-2xl py-6" onPointerDown={tap}>👆 {lang === 'ar' ? 'انقر انقر انقر!' : 'TAP TAP TAP!'} ({taps})</button>}
    {state === 'done' && <div className="card mt-4 text-center pop"><div className="text-5xl">{['🥇', '🥈', '🥉', '🏁'][place - 1]}</div><h2 className="text-2xl">{place === 1 ? (lang === 'ar' ? 'فزت!' : 'You win!') : `#${place}`}</h2><div className="mt-3 flex justify-center gap-2"><button className="btn-mint" onClick={start}>🔁</button><button className="btn-ghost" onClick={() => r.push('/play')}>{t('home')}</button></div></div>}
  </div>;
}
