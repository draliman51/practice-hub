'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useT } from '@/lib/i18n';
import { toast, confetti } from './Toast';
import { EMOTES, CHAT, WORLDS, CAMPAIGN } from '@/game/catalog';
import { play, setMuted } from '@/game/sfx';
import { voiceJoin, voiceMic, voiceDial, voiceLeave, voiceState } from '@/game/voice';
import type { Profile, Player, Season } from '@/lib/types';

export interface PlayerLite { id: string; name: string; avatar: any; photoUrl?: string | null }
interface Props { world: string; mode: 'solo' | 'cpu' | 'online'; me: Profile; myPhotoUrl?: string | null; room?: string; others?: PlayerLite[]; data?: any; season?: Season | null; event?: any; preview?: boolean; onExit?: () => void }
export interface Run { world: string; mode: string; score: number; coins: number; time: number; deaths: number; finished: boolean; beatRobot: boolean }

export default function GameCanvas({ world, mode, me, myPhotoUrl, room, others = [], data, season, event, preview, onExit }: Props) {
  const { t, lang } = useT(); const router = useRouter();
  const hostRef = useRef<HTMLDivElement>(null); const gameRef = useRef<any>(null); const chanRef = useRef<any>(null);
  const [loading, setLoading] = useState(true); const [result, setResult] = useState<null | { run: Run; reward?: any; rank?: number; n?: number }>(null);
  const [wheel, setWheel] = useState<null | 'emote' | 'chat'>(null); const [mic, setMic] = useState(voiceState()); const [standings, setStandings] = useState<{ id: string; name: string; score: number }[]>([]);
  const W = WORLDS.find((w) => w.id === world)!; const settings = (() => { try { return JSON.parse(localStorage.getItem('alilox_settings') || '{}'); } catch { return {}; } })();
  const names: Record<string, string> = { obby: t('obby'), tower: t('tower'), park: t('park'), arena: t('arena'), race: t('race'), house: t('house'), worlds: t('worlds'), shop: t('shop'), welcome: t('cityWelcome') };

  useEffect(() => {
    let dead = false; setMuted(settings.sound === false);
    (async () => {
      const eng = await import('@/game/engine'); if (dead || !hostRef.current) return;
      const host = hostRef.current, canvas = host.querySelector('canvas')!;
      const game = eng.createGame({ host, canvas, world, data, mode, seed: room ? [...room].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) : Date.now() % 100000, settings, lang, season: season?.theme, names, event: event && (event.world === world || event.world === 'all') ? event : null,
        me: { id: me.id, name: me.display_name, avatar: me.avatar, photoUrl: myPhotoUrl }, others,
        on: { sfx: play, net: (m: any) => chanRef.current?.send({ type: 'broadcast', event: 'g', payload: m }), portal: (id: string) => { if (preview) return; if (id === 'house') router.push('/house'); else if (id === 'worlds') router.push('/worlds'); else if (id === 'shop') router.push('/shop'); else router.push(`/play/${id}`); },
          finish: async (run: Run) => { if (preview) { setResult({ run }); return; }
            if (run.finished) confetti();
            const { data: reward } = await supabase().rpc('finish_run', { p_world: run.world, p_mode: run.mode, p_score: run.score, p_time: run.time, p_coins: run.coins, p_finished: run.finished, p_deaths: run.deaths });
            let rank: number | undefined, n: number | undefined;
            if (mode === 'online' && room) { await supabase().from('room_members').update({ finished_at: new Date().toISOString(), score: run.score }).eq('room_code', room).eq('user_id', me.id); chanRef.current?.send({ type: 'broadcast', event: 'g', payload: { t: 'finish', p: me.id, name: me.display_name, score: run.score } }); setStandings((s) => { const ns = [...s.filter((x) => x.id !== me.id), { id: me.id, name: me.display_name, score: run.score }]; rank = ns.findIndex((x) => x.id === me.id) + 1; n = others.length + 1; return ns; }); }
            setResult({ run, reward, rank, n }); } } });
      gameRef.current = game; (window as any).__alx = game; setLoading(false);
      if (mode === 'online' && room) {
        const ch = supabase().channel('room:' + room, { config: { broadcast: { self: false } } });
        ch.on('broadcast', { event: 'g' }, ({ payload: m }: any) => { if (m.t === 'finish') { setStandings((s) => s.some((x) => x.id === m.p) ? s : [...s, { id: m.p, name: m.name, score: m.score }]); game.msg(`🏁 ${m.name}`, 1500); } else if (m.t === 'leave') { game.removePlayer(m.p); } else game.handleNet(m); });
        ch.subscribe(); chanRef.current = ch;
        voiceJoin(room, me.id, (s: string) => { if (s === 'ready') voiceDial(others.map((o) => o.id)); }).catch(() => { });
      }
    })();
    return () => { dead = true; chanRef.current?.send({ type: 'broadcast', event: 'g', payload: { t: 'leave', p: me.id } }); chanRef.current?.unsubscribe(); chanRef.current = null; gameRef.current?.stop(); gameRef.current = null; if (mode === 'online') voiceLeave(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world, mode, room]);

  const toggleMic = async () => { try { const s = await voiceMic(others.map((o) => o.id)); setMic(s); toast(s === 'on' ? '🎤 ' + t('voice') : '🔇 ' + t('mute')); } catch (e: any) { toast(lang === 'ar' ? '🎤 الميكروفون غير متاح — اسمح به من إعدادات المتصفح' : '🎤 Microphone not available — allow it in the browser'); } };
  const tnames = { ...Object.fromEntries(CAMPAIGN.map((c) => [c.id, (lang === 'ar' ? c.ar : c.en)])), obby: t('obby'), tower: t('tower'), park: t('park'), arena: t('arena'), city: t('city'), skyrace: t('skyrace'), treasure: t('treasure'), tag: t('tag') } as Record<string, string>;
  const stars = result ? (() => { const r: any = result.run; const tot = r.coinsTotal || 0; if (r.finished && tot && r.coins >= tot) return 3; if (r.finished) return 2; if (tot && r.coins >= tot / 2) return 1; return 0; })() : 0;
  return (
    <div>
      <div id="alx" ref={hostRef}>
        <canvas />
        <div id="alx-hud"><span className="pill y">🪙 <b id="alx-coins">0</b></span><span className="pill">⏱ <b id="alx-time">{W.timed || 0}</b>s</span><span className="pill" id="alx-deaths" hidden>💀 <b>0</b></span>{mode === 'cpu' && <span className="pill" id="alx-robot">🏁 0/3</span>}{world === 'treasure' && <span className="pill" id="alx-chests">💰 0/8</span>}{((W as any).fight || (W as any).runner) && <span className="pill" id="alx-lives">❤️❤️❤️</span>}{mode === 'online' && <span className="pill">🌐 {others.length + 1}</span>}</div>
        <div id="alx-msg" />
        <div id="alx-joy" hidden><div className="knob" /></div>
        <div id="alx-top">{mode === 'online' && <button className="btn-ghost btn-sm" onClick={toggleMic}>{mic === 'on' ? '🎤' : mic === 'muted' ? '🔇' : '🎙️'}</button>}{world !== 'city' && <button className="btn-ghost btn-sm" onClick={() => gameRef.current?.end()}>⏹</button>}{(world === 'city' || preview) && <button className="btn-ghost btn-sm" onClick={() => (onExit ? onExit() : router.push('/play'))}>✕</button>}</div>
        <div id="alx-side">{(W as any).fight && <button style={{ background: '#FFD23F', fontSize: '1.6rem' }} onPointerDown={(e) => { e.preventDefault(); gameRef.current?.punch(); }}>👊</button>}<button onClick={() => setWheel(wheel === 'emote' ? null : 'emote')}>😀</button><button onClick={() => setWheel(wheel === 'chat' ? null : 'chat')}>💬</button></div>
        {wheel && <div id="alx-wheel">{wheel === 'emote' ? EMOTES.map((e) => <button key={e.id} onClick={() => { gameRef.current?.emote(e.id); setWheel(null); }}>{e.ic}<small>{lang === 'ar' ? e.ar : e.en}</small></button>) : CHAT.map((c) => <button key={c} onClick={() => { gameRef.current?.bubble(c); setWheel(null); }}>{c}</button>)}</div>}
        <button id="alx-jump">JUMP</button>
        {loading && <div id="alx-load">🧱 Loading your block world…</div>}
        {result && <div className="absolute inset-0 grid place-items-center bg-ink/70 p-4"><div className="card w-full max-w-sm text-center pop">
          <div className="text-5xl">{result.run.finished ? ((result.rank || (result.run as any).rank) === 1 ? '🥇' : (result.rank || (result.run as any).rank) === 2 ? '🥈' : (result.rank || (result.run as any).rank) === 3 ? '🥉' : '🏆') : (world === 'tag' ? '👹' : '🏁')}</div>
          <h2 className="text-2xl mt-1">{result.run.finished ? (result.rank ? `#${result.rank} / ${result.n}` : (result.run as any).rank ? `#${(result.run as any).rank} ${lang === 'ar' ? 'ضد الأصدقاء' : 'vs AI friends'}` : (lang === 'ar' ? 'أحسنت!' : 'Awesome!')) : (lang === 'ar' ? 'انتهت الجولة' : 'Run ended')}</h2>
          <div className="text-2xl text-sun tracking-widest">{'★'.repeat(stars)}{'☆'.repeat(3 - stars)}</div>
          <p className="muted mt-1">{tnames[world] || world} · 🪙 <b className="text-white">{result.run.coins}</b>{(result.run as any).coinsTotal ? ` / ${(result.run as any).coinsTotal}` : ''}{result.run.time ? ` · ⏱ ${result.run.time}s` : ''}{result.run.deaths ? ` · 💀 ${result.run.deaths}` : ''}</p>
          {result.reward && <p className="mt-2 text-sun font-bold">+{result.reward.coins} 🪙{result.reward.badges?.length ? ' · 🏅 ' + result.reward.badges.join(', ') : ''}{result.reward.quests?.length ? <><br />⭐ {lang === 'ar' ? 'مهمة مكتملة' : 'Quest complete'}: {result.reward.quests.map((q: any) => `${q.icon} +${q.coins}🪙`).join(' · ')}</> : null}{result.reward.level_up ? <><br />🎉 {lang === 'ar' ? 'مستوى جديد' : 'LEVEL UP'} → {result.reward.level}</> : null}</p>}
          {standings.length > 1 && <p className="mt-2 text-sm">{standings.map((s, i) => `${['🥇', '🥈', '🥉'][i] || '🏁'} ${s.name}`).join(' · ')}</p>}
          <div className="mt-4 flex justify-center gap-2">{(W as any).campaign && result.run.finished && (W as any).campaign < 10 && <button className="btn-candy" onClick={() => router.push(`/play/c${(W as any).campaign + 1}`)}>{lang === 'ar' ? 'المستوى التالي' : 'Next level'} ▶</button>}<button className="btn-sun" onClick={() => (onExit ? onExit() : router.push(mode === 'online' && room ? `/rooms/${room}` : (W as any).campaign ? '/play#adventure' : '/play'))}>{mode === 'online' ? t('rooms') : t('home')}</button>{mode !== 'online' && !preview && <button className="btn-mint" onClick={() => { setResult(null); router.refresh(); location.reload(); }}>🔁</button>}</div>
        </div></div>}
      </div>
      <p className="muted mt-2 text-center text-xs">📱 {lang === 'ar' ? 'يسار الشاشة: تحرّك · يمينها: الكاميرا · JUMP للقفز' : 'Left: move · Right: look · JUMP'} · ⌨️ WASD / Space · 1-4 {lang === 'ar' ? 'إيموت' : 'emotes'}</p>
    </div>
  );
}
