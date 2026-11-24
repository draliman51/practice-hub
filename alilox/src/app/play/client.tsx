'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AvatarPreview from '@/components/AvatarPreview';
import { Section, rpc } from '@/components/AppShell';
import { toast, confetti } from '@/components/Toast';
import { useT } from '@/lib/i18n';
import { WORLDS, CAMPAIGN } from '@/game/catalog';
import { play } from '@/game/sfx';
import type { Profile, Quest, Season, AliloxEvent } from '@/lib/types';
import { XP_FOR_LEVEL } from '@/lib/types';
export default function HubClient({ profile, photoUrl, season, quests, qp, bestBy, evNow, evNext }: { profile: Profile; photoUrl: string | null; season: Season | null; quests: Quest[]; qp: any[]; bestBy: Record<string, number>; evNow: AliloxEvent | null; evNext: AliloxEvent | null }) {
  const [popup, setPopup] = useState<AliloxEvent | null>(null); const [left, setLeft] = useState('');
  useEffect(() => { if (evNow) { try { const k = 'alilox_ev_' + evNow.id; if (!localStorage.getItem(k)) { setPopup(evNow); localStorage.setItem(k, '1'); } } catch { setPopup(evNow); } } }, [evNow]);
  useEffect(() => { if (!evNext) return; const f = () => { const ms = new Date(evNext.starts_at).getTime() - Date.now(); if (ms <= 0) { setLeft(''); window.location.reload(); return; } const h = Math.floor(ms / 36e5), m = Math.floor(ms % 36e5 / 6e4), s = Math.floor(ms % 6e4 / 1e3); setLeft(`${h > 0 ? h + 'h ' : ''}${m}m ${s}s`); }; f(); const iv = setInterval(f, 1000); return () => clearInterval(iv); }, [evNext]);
  const checkin = async (ev: AliloxEvent) => { const d = await rpc<any>('event_checkin', { p_event: ev.id }); setPopup(null); if (d && !d.already) { confetti(); play('win'); toast(`🎁 +${d.coins} 🪙${d.badge ? ' · 🏅' : ''}`); r.refresh(); } };
  const { t, lang } = useT(); const r = useRouter(); const [pick, setPick] = useState<string | null>(null); const [gift, setGift] = useState(profile.last_gift === new Date().toISOString().slice(0, 10));
  const today = new Date().toISOString().slice(0, 10); const monday = (() => { const d = new Date(); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); return d.toISOString().slice(0, 10); })();
  const prog = (q: Quest) => qp.find((p) => p.quest_id === q.id && p.period_key === (q.period === 'daily' ? today : monday));
  const need = XP_FOR_LEVEL(profile.level + 1), have = XP_FOR_LEVEL(profile.level); const pct = Math.min(100, Math.round(((profile.xp - have) / Math.max(1, need - have)) * 100));
  const claimGift = async () => { const d = await rpc<any>('claim_daily_gift'); if (d) { confetti(); play('win'); toast(`🎁 +${d.coins} 🪙 · 🔥 ${d.streak}`); setGift(true); r.refresh(); } };
  const worldName = (id: string) => (t as any)(id);
  return <div>
    {popup && <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5" onClick={() => setPopup(null)}><div className="card max-w-sm text-center pop bg-gradient-to-b from-indigo-800 to-fuchsia-800" onClick={(e) => e.stopPropagation()}><div className="text-6xl">{popup.icon}</div><h2 className="mt-2 text-2xl">{popup.title}</h2><p className="mt-3 text-lg leading-relaxed" dir="ltr">{popup.message}</p><button className="btn-sun mt-5 w-full" onClick={() => checkin(popup)}>🎁 {lang === 'ar' ? 'استلم هدية الحدث' : 'Claim event gift'} (+{popup.reward_coins} 🪙)</button></div></div>}
    {evNow && <Link href="/play/city" className="card mb-4 flex items-center gap-3 border-sun bg-gradient-to-r from-pink-600 to-amber-500 animate-pulse"><div className="text-4xl">{evNow.icon}</div><div className="grow"><b className="text-lg">{evNow.title} — {lang === 'ar' ? 'الحدث يجري الآن!' : 'LIVE now!'}</b><div className="text-sm text-white/90">{lang === 'ar' ? 'ادخل المدينة: ألعاب نارية وبالونات وهدايا 🎆' : 'Join the city: fireworks, balloons and gifts 🎆'}</div></div><span className="btn-sun btn-sm">▶</span></Link>}
    {!evNow && evNext && <div className="card mb-4 flex items-center gap-3 border-grape"><div className="text-4xl">{evNext.icon}</div><div className="grow"><b>{evNext.title}</b><div className="text-sm muted">{lang === 'ar' ? 'يبدأ' : 'Starts'} {new Date(evNext.starts_at).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-GB', { hour: '2-digit', minute: '2-digit', weekday: 'long' })} · ⏳ <span className="text-sun font-bold">{left}</span></div></div></div>}
    {season && <div className="card mb-4 flex items-center gap-3" style={{ background: `linear-gradient(135deg, ${season.theme.accent || '#60A5FA'}55, transparent)` }}><div className="text-4xl">{season.icon}</div><div><b>{lang === 'ar' ? season.name_ar : season.name_en}</b><div className="muted text-sm">{lang === 'ar' ? 'موسم خاص بعوالم وأجواء جديدة!' : 'Special season with new vibes in every world!'}</div></div></div>}
    <div className="card flex items-center gap-4">
      <AvatarPreview p={{ name: profile.display_name, avatar: profile.avatar, photoUrl }} />
      <div className="grow"><h1 className="text-2xl">{lang === 'ar' ? 'أهلًا' : 'Hi'} {profile.display_name}! 👋</h1>
        <div className="mt-1 text-sm">⭐ {t('level')} {profile.level} <span className="muted">· 🪙 {profile.xp} / {need}</span></div><div className="muted text-[11px]">{lang === 'ar' ? 'كل عملة تجمعها ترفع مستواك' : 'Every coin you collect raises your level'}</div>
        <div className="mt-1 h-3 w-full rounded-full bg-white/10"><div className="h-3 rounded-full bg-gradient-to-r from-mint to-sun" style={{ width: pct + '%' }} /></div>
        <div className="mt-2 flex flex-wrap gap-2"><span className="pill-sun">🪙 {profile.coins}</span>{profile.streak > 0 && <span className="pill">🔥 {profile.streak} {t('streak')}</span>}<span className="pill">🏅 {profile.badges.length}</span></div></div>
    </div>
    <button onClick={gift ? undefined : claimGift} className={`mt-3 w-full rounded-2xl p-3 text-start font-bold ${gift ? 'bg-white/10 text-white/60' : 'bg-gradient-to-r from-amber-500 to-pink-500 shadow-card animate-pulse'}`}>🎁 {t('dailyGift')} — {gift ? t('claimed') : `${t('claim')} 25+ 🪙`}</button>
    <Link href="/play/city" className="card mt-4 flex items-center gap-3 bg-gradient-to-r from-indigo-700 to-fuchsia-700"><div className="text-5xl">🏙️</div><div className="grow"><h2 className="text-xl">{t('city')}</h2><p className="text-sm text-white/80">{t('cityD')}</p></div><span className="btn-sun btn-sm">▶</span></Link>
    <Section title={'🗺️ ' + (lang === 'ar' ? 'المغامرة — 10 مستويات' : 'Adventure — 10 levels')}>
      <div id="adventure" className="grid gap-2">{CAMPAIGN.map((c, i) => { const W = WORLDS.find((w) => w.id === c.id) as any; const done = profile.worlds_done.includes(c.id); const unlocked = i === 0 || profile.worlds_done.includes(CAMPAIGN[i - 1].id) || profile.role !== 'child'; const stars = done ? 2 : 0;
        return <Link key={c.id} href={unlocked ? `/play/${c.id}` : '#'} className={`card flex items-center gap-3 py-3 ${unlocked ? '' : 'opacity-50 pointer-events-none'} ${done ? 'border-lime' : ''}`}><div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-2xl">{unlocked ? W?.ic : '🔒'}</div><div className="grow"><b>{i + 1}. {lang === 'ar' ? c.ar : c.en}</b> {done && '✅'}<div className="muted text-xs">{lang === 'ar' ? c.d_ar : c.d_en}</div></div><div className="text-sun text-sm">{done ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : unlocked ? '▶' : ''}</div></Link>; })}</div>
    </Section>
    <Section title={'🎮 ' + (t as any)('gamesTitle')}>
      <p className="muted -mt-2 mb-3 text-sm">{(t as any)('gamesSub')}</p>
      <div className="grid gap-2 sm:grid-cols-2">{WORLDS.filter((w: any) => w.cat === 'games').map((w) => <Link key={w.id} href={`/play/${w.id}`} className={`card flex items-center gap-3 py-3 ${profile.worlds_done.includes(w.id) ? 'border-lime' : ''}`}><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-2xl">{w.ic}</div><div className="grow"><b>{worldName(w.id)}</b> {profile.worlds_done.includes(w.id) && '✅'}<div className="muted text-xs">{(t as any)(w.id + 'D')}</div></div><span className="btn-sun btn-sm">▶</span></Link>)}</div>
    </Section>
    <Section title={'🌍 ' + t('worldsTitle')}>
      <div className="grid gap-3">{WORLDS.filter((w) => !w.hub && !(w as any).hidden && !(w as any).cat).map((w) => <div key={w.id} className="card">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setPick(pick === w.id ? null : w.id)}><div className="text-4xl">{w.ic}</div><div className="grow"><b className="text-lg">{worldName(w.id)}</b> {profile.worlds_done.includes(w.id) && '✅'}<div className="muted text-sm">{(t as any)(w.id + 'D')}</div></div><span className="text-2xl">{pick === w.id ? '▾' : '▸'}</span></div>
        {pick === w.id && <div className="mt-3 flex flex-wrap gap-2 pop">
          <Link className="btn-mint btn-sm" href={w.mini ? '/play/race' : `/play/${w.id}`}>🧍 {t('justMe')}</Link>
          {w.modes.includes('cpu') && <Link className="btn-mint btn-sm" href={`/play/${w.id}?mode=cpu`}>🤖 {t('vsAI')}</Link>}
          {w.modes.includes('online') && <Link className="btn-candy btn-sm" href={`/rooms?world=${w.id}`}>🌐 {t('online')}</Link>}
        </div>}</div>)}</div>
    </Section>
    <Section title={'⭐ ' + t('quests')} action={<Link className="text-sun text-sm font-bold" href="/quests">→</Link>}>
      <div className="grid gap-2">{quests.slice(0, 3).map((q) => { const p = prog(q); const v = p?.progress || 0; return <div key={q.id} className="card flex items-center gap-3 py-3"><div className="text-2xl">{q.icon}</div><div className="grow"><b>{lang === 'ar' ? q.title_ar : q.title_en}</b><div className="h-2 mt-1 rounded-full bg-white/10"><div className="h-2 rounded-full bg-mint" style={{ width: Math.min(100, (v / q.target) * 100) + '%' }} /></div></div><span className="pill">{Math.min(v, q.target)}/{q.target}</span></div>; })}</div>
    </Section>
  </div>;
}
