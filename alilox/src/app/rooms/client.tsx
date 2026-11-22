'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useT } from '@/lib/i18n';
import { toast } from '@/components/Toast';
import { WORLDS } from '@/game/catalog';
import type { Profile } from '@/lib/types';
export default function RoomsClient({ profile, world: w0 }: { profile: Profile; world: string }) {
  const { t, lang } = useT(); const r = useRouter(); const [world, setWorld] = useState(w0); const [code, setCode] = useState(''); const [max, setMax] = useState(6); const [busy, setBusy] = useState(false);
  const create = async () => { setBusy(true); const c = String(Math.floor(1000 + Math.random() * 9000)); const { error } = await supabase().from('rooms').insert({ code: c, host: profile.id, world, max_players: max }); if (error) { setBusy(false); return toast('😕 ' + error.message); }
    await supabase().from('room_members').insert({ room_code: c, user_id: profile.id }); r.push('/rooms/' + c); };
  const join = async () => { const c = code.replace(/\D/g, ''); if (c.length !== 4) return toast(t('roomCode')); setBusy(true);
    const { data: room } = await supabase().from('rooms').select('*').eq('code', c).single(); if (!room) { setBusy(false); return toast(lang === 'ar' ? 'لا توجد غرفة بهذا الرمز 🤔' : 'No room with that code 🤔'); }
    const { error } = await supabase().from('room_members').upsert({ room_code: c, user_id: profile.id }); setBusy(false); if (error) return toast('😕 ' + (error.message.includes('full') ? (lang === 'ar' ? 'الغرفة ممتلئة' : 'Room is full') : error.message)); r.push('/rooms/' + c); };
  return <div><h1 className="text-3xl">🌐 {t('rooms')}</h1><p className="muted">{lang === 'ar' ? 'كل لاعب على جهازه. أنشئ غرفة وشارك الرمز، أو انضم برمز صديقك. حتى 6 لاعبين، مع شات صوتي.' : 'Everyone on their own device. Create a room and share the code, or join with a friend’s code. Up to 6 players, with voice chat.'}</p>
    <div className="card mt-4"><h2 className="text-xl">🏠 {t('createRoom')}</h2>
      <div className="mt-2 flex flex-wrap gap-2">{WORLDS.filter((w) => w.modes.includes('online') && !w.mini && !(w as any).hidden).map((w) => <button key={w.id} className={`chip ${world === w.id ? 'on' : ''}`} onClick={() => setWorld(w.id)}>{w.ic} {(t as any)(w.id)}</button>)}</div>
      <div className="mt-3 flex items-center gap-2 text-sm">{t('players')}: {[2, 3, 4, 5, 6].map((n) => <button key={n} className={`chip ${max === n ? 'on' : ''}`} onClick={() => setMax(n)}>{n}</button>)}</div>
      <button className="btn-mint mt-3" disabled={busy} onClick={create}>{t('createRoom')}</button></div>
    <div className="card mt-4"><h2 className="text-xl">🔑 {t('joinRoom')}</h2><div className="mt-2 flex gap-2"><input className="input text-center text-2xl tracking-[.3em] font-display" inputMode="numeric" maxLength={4} placeholder="1234" value={code} onChange={(e) => setCode(e.target.value)} /><button className="btn-candy" disabled={busy} onClick={join}>{t('joinRoom')}</button></div></div>
  </div>;
}
