'use client';
import { useRouter } from 'next/navigation';
import { rpc } from '@/components/AppShell';
import { toast, confetti } from '@/components/Toast';
import { useT } from '@/lib/i18n';
import { play } from '@/game/sfx';
import type { Profile, Quest } from '@/lib/types';
const BADGES = [{ id: 'first', en: 'First portal', ar: 'أول بوابة', ic: '🌀' }, { id: 'robot', en: 'Robot beater', ar: 'هازم الروبوت', ic: '🤖' }, { id: 'nofall', en: 'No falls!', ar: 'بلا سقوط', ic: '🧗' }, { id: 'worlds', en: 'Explorer', ar: 'المستكشف', ic: '🗺️' }, { id: 'streak3', en: '3-day streak', ar: '3 أيام متتالية', ic: '🔥' }, { id: 'launch', en: 'Launch Party', ar: 'حفل الافتتاح', ic: '🎉' }, { id: 'hero', en: 'Adventure Hero', ar: 'بطل المغامرة', ic: '🏆' }];
export default function QuestsClient({ profile, quests, qp }: { profile: Profile; quests: Quest[]; qp: any[] }) {
  const { t, lang } = useT(); const r = useRouter();
  const today = new Date().toISOString().slice(0, 10); const monday = (() => { const d = new Date(); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); return d.toISOString().slice(0, 10); })();
  const row = (q: Quest) => { const p = qp.find((x) => x.quest_id === q.id && x.period_key === (q.period === 'daily' ? today : monday)); const v = Math.min(q.target, p?.progress || 0); const done = v >= q.target; const claimed = p?.claimed;
    return <div key={q.id} className="card flex items-center gap-3 py-3"><div className="text-3xl">{q.icon}</div><div className="grow"><b>{lang === 'ar' ? q.title_ar : q.title_en}</b><div className="muted text-xs">{t('reward')}: 🪙 {q.reward_coins}</div><div className="mt-1 h-2 rounded-full bg-white/10"><div className={`h-2 rounded-full ${done ? 'bg-sun' : 'bg-mint'}`} style={{ width: (v / q.target) * 100 + '%' }} /></div></div>
      {claimed ? <span className="pill">✓ {t('done')}</span> : done ? <button className="btn-sun btn-sm" onClick={async () => { const d = await rpc<any>('claim_quest', { p_quest: q.id }); if (d) { confetti(); play('win'); toast(`+${d.coins} 🪙`); r.refresh(); } }}>{t('claim')}</button> : <span className="pill">{v}/{q.target}</span>}</div>; };
  return <div><h1 className="text-3xl">⭐ {t('quests')}</h1>
    <h2 className="mt-4 mb-2 text-xl">📅 {t('daily')}</h2><div className="grid gap-2">{quests.filter((q) => q.period === 'daily').map(row)}</div>
    <h2 className="mt-5 mb-2 text-xl">🗓️ {t('weekly')}</h2><div className="grid gap-2">{quests.filter((q) => q.period === 'weekly').map(row)}</div>
    <h2 className="mt-5 mb-2 text-xl">🏅 {lang === 'ar' ? 'الشارات' : 'Badges'}</h2><div className="grid-auto">{BADGES.map((b) => { const has = profile.badges.includes(b.id); return <div key={b.id} className={`card text-center ${has ? '' : 'opacity-50'}`}><div className="text-3xl">{has ? b.ic : '🔒'}</div><b className="text-sm">{lang === 'ar' ? b.ar : b.en}</b></div>; })}</div>
  </div>;
}
