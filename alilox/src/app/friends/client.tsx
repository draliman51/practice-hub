'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { rpc } from '@/components/AppShell';
import { toast } from '@/components/Toast';
import { useT } from '@/lib/i18n';
import { supabase } from '@/lib/supabase/client';
import type { Profile, Player } from '@/lib/types';
export default function FriendsClient({ profile, friendships, players, leaderboard }: { profile: Profile; friendships: any[]; players: Player[]; leaderboard: any[] }) {
  const { t, lang } = useT(); const r = useRouter(); const [code, setCode] = useState('');
  const P = (id: string) => players.find((p) => p.id === id);
  const accepted = friendships.filter((f) => f.status === 'accepted'); const incoming = friendships.filter((f) => f.status === 'pending' && f.addressee === profile.id); const outgoing = friendships.filter((f) => f.status === 'pending' && f.requester === profile.id);
  const add = async () => { const d = await rpc<any>('friend_request', { p_code: code.trim() }); if (d) { toast(`✅ ${lang === 'ar' ? 'أُرسل الطلب إلى' : 'Request sent to'} ${d.to}`); setCode(''); r.refresh(); } };
  const respond = async (id: string, ok: boolean) => { await rpc('friend_respond', { p_id: id, p_accept: ok }); r.refresh(); };
  const remove = async (id: string) => { await supabase().from('friendships').delete().eq('id', id); r.refresh(); };
  const Card = ({ p, right }: { p?: Player; right?: React.ReactNode }) => <div className="card flex items-center gap-3 py-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-sun text-2xl">{p?.avatar?.face && p.avatar.face !== 'photo' ? p.avatar.face : '🙂'}</div><div className="grow"><b>{p?.display_name || '…'}</b><div className="muted text-xs">⭐ {t('level')} {p?.level} · {p?.last_seen ? new Date(p.last_seen).toLocaleDateString() : ''}</div></div>{right}</div>;
  return <div><h1 className="text-3xl">🤝 {t('friends')}</h1>
    <div className="card mt-3 flex items-center gap-3"><div><div className="muted text-xs">{t('friendCode')}</div><div className="font-display text-3xl tracking-[.2em] text-sun">{profile.friend_code}</div></div><button className="btn-ghost btn-sm ms-auto" onClick={() => { navigator.clipboard?.writeText(profile.friend_code); toast('📋'); }}>📋</button></div>
    <div className="card mt-3"><b>{t('addFriend')}</b><div className="mt-2 flex gap-2"><input className="input uppercase tracking-widest" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} placeholder="A1B2C3" /><button className="btn-candy" onClick={add}>➕</button></div><p className="muted mt-2 text-xs">{lang === 'ar' ? 'للأطفال تحت 13: يجب أن يعتمد وليّ الأمر الصداقة قبل اللعب معًا ومشاهدة الصور.' : 'Under 13: a parent must approve the friendship before you can play together and see photos.'}</p></div>
    {incoming.length > 0 && <><h2 className="mt-5 mb-2 text-xl">📨 {t('requests')}</h2><div className="grid gap-2">{incoming.map((f) => <Card key={f.id} p={P(f.requester)} right={<div className="flex gap-1"><button className="btn-mint btn-sm" onClick={() => respond(f.id, true)}>{t('accept')}</button><button className="btn-ghost btn-sm" onClick={() => respond(f.id, false)}>✕</button></div>} />)}</div></>}
    <h2 className="mt-5 mb-2 text-xl">👥 {t('friends')} ({accepted.length})</h2>
    <div className="grid gap-2">{accepted.length === 0 && <p className="muted">{t('noFriends')}</p>}{accepted.map((f) => <Card key={f.id} p={P(f.requester === profile.id ? f.addressee : f.requester)} right={<div className="flex items-center gap-2">{!f.parent_ok && <span className="pill text-xs">⏳ {t('waitingParent')}</span>}{f.parent_ok && <a className="btn-ghost btn-sm" href={`/house?u=${f.requester === profile.id ? f.addressee : f.requester}`}>🏠</a>}<button className="btn-ghost btn-sm" onClick={() => remove(f.id)}>✕</button></div>} />)}
      {outgoing.map((f) => <Card key={f.id} p={P(f.addressee)} right={<span className="pill text-xs">⏳</span>} />)}</div>
    <h2 className="mt-5 mb-2 text-xl">🏆 {lang === 'ar' ? 'أفضل اللاعبين' : 'Top players'}</h2><div className="grid gap-1">{leaderboard.map((p, i) => <div key={p.id} className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2"><span className="w-7">{['🥇', '🥈', '🥉'][i] || i + 1}</span><span className="text-xl">{p.avatar?.face && p.avatar.face !== 'photo' ? p.avatar.face : '🙂'}</span><b className="grow">{p.display_name}</b><span className="muted text-sm">⭐ {t('level')} {p.level}</span></div>)}</div>
  </div>;
}
