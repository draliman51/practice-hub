'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useT } from '@/lib/i18n';
import { toast } from '@/components/Toast';
import { WORLDS } from '@/game/catalog';
import { voiceJoin, voiceMic, voiceDial, voiceLeave, voiceState } from '@/game/voice';
import type { Profile, Player } from '@/lib/types';
export default function LobbyClient({ profile, room: r0 }: { profile: Profile; room: any }) {
  const { t, lang } = useT(); const router = useRouter(); const [room, setRoom] = useState(r0); const [members, setMembers] = useState<Player[]>([]); const [mic, setMic] = useState(voiceState());
  const host = room.host === profile.id;
  const load = async () => { const { data: rm } = await supabase().from('rooms').select('*').eq('code', room.code).single(); if (!rm) { toast(lang === 'ar' ? 'أُغلقت الغرفة' : 'Room closed'); router.replace('/rooms'); return; } setRoom(rm);
    const { data: mem } = await supabase().from('room_members').select('user_id').eq('room_code', room.code); const ids = (mem || []).map((m: any) => m.user_id); const { data: ps } = await supabase().from('players').select('*').in('id', ids); setMembers((ps || []) as Player[]); voiceDial(ids);
    if (rm.status === 'playing') router.push(`/play/${rm.world}?room=${room.code}`); };
  useEffect(() => { load(); const ch = supabase().channel('lobby:' + room.code).on('postgres_changes', { event: '*', schema: 'public', table: 'room_members', filter: `room_code=eq.${room.code}` }, load).on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `code=eq.${room.code}` }, load).subscribe(); const iv = setInterval(load, 5000);
    voiceJoin(room.code, profile.id).catch(() => { }); return () => { ch.unsubscribe(); clearInterval(iv); }; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const start = async () => { if (members.length < 2) return toast(lang === 'ar' ? 'انتظر لاعبًا آخر على الأقل 🙂' : 'Wait for at least one more player 🙂'); await supabase().from('rooms').update({ status: 'playing' }).eq('code', room.code); router.push(`/play/${room.world}?room=${room.code}`); };
  const leave = async () => { voiceLeave(); if (host) await supabase().from('rooms').delete().eq('code', room.code); else await supabase().from('room_members').delete().eq('room_code', room.code).eq('user_id', profile.id); router.replace('/rooms'); };
  const setWorld = async (w: string) => { await supabase().from('rooms').update({ world: w }).eq('code', room.code); setRoom({ ...room, world: w }); };
  const toggleMic = async () => { try { setMic(await voiceMic(members.map((m) => m.id))); } catch { toast(lang === 'ar' ? '🎤 الميكروفون غير متاح' : '🎤 Microphone not available'); } };
  const W = WORLDS.find((w) => w.id === room.world)!;
  return <div>
    <div className="flex items-center gap-2"><button className="btn-ghost btn-sm" onClick={leave}>← {t('leave')}</button><h1 className="grow text-2xl">🌐 {t('roomCode')}: <span className="text-sun tracking-[.2em] font-display">{room.code}</span></h1><button className={`btn-sm ${mic === 'on' ? 'btn-mint' : 'btn-ghost'}`} onClick={toggleMic}>{mic === 'on' ? '🎤' : mic === 'muted' ? '🔇' : '🎙️'} {t('voice')}</button></div>
    <p className="muted mt-2 text-sm">{host ? (lang === 'ar' ? `شارك الرمز ${room.code} مع أصدقائك ثم اضغط ابدأ.` : `Share code ${room.code} with your friends, then press Start.`) : t('waitingHost')}</p>
    <div className="card mt-3"><h2 className="text-lg">👥 {t('players')} ({members.length}/{room.max_players})</h2>
      <div className="mt-2 grid gap-2">{members.map((m) => <div key={m.id} className="flex items-center gap-3 rounded-2xl bg-white/5 p-2"><div className="grid h-10 w-10 place-items-center rounded-xl bg-sun text-2xl">{m.avatar?.face && m.avatar.face !== 'photo' ? m.avatar.face : '🙂'}</div><b className="grow">{m.display_name} {m.id === room.host && <span className="pill text-xs">host</span>} {m.id === profile.id && <span className="muted text-xs">({lang === 'ar' ? 'أنت' : 'you'})</span>}</b><span className="muted text-sm">⭐ {m.level}</span></div>)}</div></div>
    {host ? <div className="card mt-3"><h2 className="text-lg">🌍 {t('worldsTitle')}</h2><div className="mt-2 flex flex-wrap gap-2">{WORLDS.filter((w) => w.modes.includes('online') && !w.mini && !(w as any).hidden).map((w) => <button key={w.id} className={`chip ${room.world === w.id ? 'on' : ''}`} onClick={() => setWorld(w.id)}>{w.ic} {(t as any)(w.id)}</button>)}</div><button className="btn-sun mt-4 w-full text-lg" onClick={start}>▶ {t('start')} · {W.ic} {(t as any)(W.id)}</button></div> : <div className="card mt-3">🌍 {W.ic} {(t as any)(W.id)}</div>}
    <p className="muted mt-3 text-xs">🎙️ {lang === 'ar' ? 'اضغط زر الصوت واسمح للميكروفون لتتحدثوا أثناء اللعب.' : 'Tap Voice and allow the microphone to talk while you play.'}</p>
  </div>;
}
