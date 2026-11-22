'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AvatarPreview from '@/components/AvatarPreview';
import { Section, rpc } from '@/components/AppShell';
import { toast, confetti } from '@/components/Toast';
import { useT } from '@/lib/i18n';
import { WORLDS } from '@/game/catalog';
import { play } from '@/game/sfx';
import type { Profile, Quest, Season } from '@/lib/types';
import { XP_FOR_LEVEL } from '@/lib/types';
export default function HubClient({ profile, photoUrl, season, quests, qp, bestBy }: { profile: Profile; photoUrl: string | null; season: Season | null; quests: Quest[]; qp: any[]; bestBy: Record<string, number> }) {
  const { t, lang } = useT(); const r = useRouter(); const [pick, setPick] = useState<string | null>(null); const [gift, setGift] = useState(profile.last_gift === new Date().toISOString().slice(0, 10));
  const today = new Date().toISOString().slice(0, 10); const monday = (() => { const d = new Date(); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); return d.toISOString().slice(0, 10); })();
  const prog = (q: Quest) => qp.find((p) => p.quest_id === q.id && p.period_key === (q.period === 'daily' ? today : monday));
  const need = XP_FOR_LEVEL(profile.level + 1), have = XP_FOR_LEVEL(profile.level); const pct = Math.min(100, Math.round(((profile.xp - have) / Math.max(1, need - have)) * 100));
  const claimGift = async () => { const d = await rpc<any>('claim_daily_gift'); if (d) { confetti(); play('win'); toast(`🎁 +${d.coins} 🪙 · 🔥 ${d.streak}`); setGift(true); r.refresh(); } };
  const worldName = (id: string) => (t as any)(id);
  return <div>
    {season && <div className="card mb-4 flex items-center gap-3" style={{ background: `linear-gradient(135deg, ${season.theme.accent || '#60A5FA'}55, transparent)` }}><div className="text-4xl">{season.icon}</div><div><b>{lang === 'ar' ? season.name_ar : season.name_en}</b><div className="muted text-sm">{lang === 'ar' ? 'موسم خاص بعوالم وأجواء جديدة!' : 'Special season with new vibes in every world!'}</div></div></div>}
    <div className="card flex items-center gap-4">
      <AvatarPreview p={{ name: profile.display_name, avatar: profile.avatar, photoUrl }} />
      <div className="grow"><h1 className="text-2xl">{lang === 'ar' ? 'أهلًا' : 'Hi'} {profile.display_name}! 👋</h1>
        <div className="mt-1 text-sm">⭐ {t('level')} {profile.level} <span className="muted">· {profile.xp} XP</span></div>
        <div className="mt-1 h-3 w-full rounded-full bg-white/10"><div className="h-3 rounded-full bg-gradient-to-r from-mint to-sun" style={{ width: pct + '%' }} /></div>
        <div className="mt-2 flex flex-wrap gap-2"><span className="pill-sun">🪙 {profile.coins}</span>{profile.streak > 0 && <span className="pill">🔥 {profile.streak} {t('streak')}</span>}<span className="pill">🏅 {profile.badges.length}</span></div></div>
    </div>
    <button onClick={gift ? undefined : claimGift} className={`mt-3 w-full rounded-2xl p-3 text-start font-bold ${gift ? 'bg-white/10 text-white/60' : 'bg-gradient-to-r from-amber-500 to-pink-500 shadow-card animate-pulse'}`}>🎁 {t('dailyGift')} — {gift ? t('claimed') : `${t('claim')} 25+ 🪙`}</button>
    <Link href="/play/city" className="card mt-4 flex items-center gap-3 bg-gradient-to-r from-indigo-700 to-fuchsia-700"><div className="text-5xl">🏙️</div><div className="grow"><h2 className="text-xl">{t('city')}</h2><p className="text-sm text-white/80">{t('cityD')}</p></div><span className="btn-sun btn-sm">▶</span></Link>
    <Section title={'🌍 ' + t('worldsTitle')}>
      <div className="grid gap-3">{WORLDS.filter((w) => !w.hub && !(w as any).hidden).map((w) => <div key={w.id} className="card">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setPick(pick === w.id ? null : w.id)}><div className="text-4xl">{w.ic}</div><div className="grow"><b className="text-lg">{worldName(w.id)}</b> {profile.worlds_done.includes(w.id) && '✅'}<div className="muted text-sm">{(t as any)(w.id + 'D')}</div>{bestBy[w.id] != null && <div className="text-xs text-sun">Best: {bestBy[w.id]}</div>}</div><span className="text-2xl">{pick === w.id ? '▾' : '▸'}</span></div>
        {pick === w.id && <div className="mt-3 flex flex-wrap gap-2 pop">
          <Link className="btn-mint btn-sm" href={w.mini ? '/play/race' : `/play/${w.id}`}>🧍 {t('justMe')}</Link>
          {w.modes.includes('cpu') && <Link className="btn-mint btn-sm" href={`/play/${w.id}?mode=cpu`}>🤖 {t('vsRobot')}</Link>}
          {w.modes.includes('online') && <Link className="btn-candy btn-sm" href={`/rooms?world=${w.id}`}>🌐 {t('online')}</Link>}
        </div>}</div>)}</div>
    </Section>
    <Section title={'⭐ ' + t('quests')} action={<Link className="text-sun text-sm font-bold" href="/quests">→</Link>}>
      <div className="grid gap-2">{quests.slice(0, 3).map((q) => { const p = prog(q); const v = p?.progress || 0; return <div key={q.id} className="card flex items-center gap-3 py-3"><div className="text-2xl">{q.icon}</div><div className="grow"><b>{lang === 'ar' ? q.title_ar : q.title_en}</b><div className="h-2 mt-1 rounded-full bg-white/10"><div className="h-2 rounded-full bg-mint" style={{ width: Math.min(100, (v / q.target) * 100) + '%' }} /></div></div><span className="pill">{Math.min(v, q.target)}/{q.target}</span></div>; })}</div>
    </Section>
  </div>;
}
