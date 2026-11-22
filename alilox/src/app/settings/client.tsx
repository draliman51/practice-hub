'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useT } from '@/lib/i18n';
import { toast } from '@/components/Toast';
import { setMuted } from '@/game/sfx';
import type { Profile } from '@/lib/types';
const DEF = { sens: 8, invert: false, shadows: true, sound: true };
export default function SettingsClient({ profile }: { profile: Profile }) {
  const { t, lang, setLang } = useT(); const r = useRouter(); const [s, setS] = useState(DEF); const [name, setName] = useState(profile.display_name); const [tk, setTk] = useState({ subject: '', body: '' });
  useEffect(() => { try { setS({ ...DEF, ...JSON.parse(localStorage.getItem('alilox_settings') || '{}') }); } catch { } }, []);
  const upd = (k: string, v: any) => { const n = { ...s, [k]: v }; setS(n); localStorage.setItem('alilox_settings', JSON.stringify(n)); if (k === 'sound') setMuted(!v); };
  const Row = ({ k, l, d }: { k: keyof typeof DEF; l: string; d?: string }) => <div className="card mb-2 flex items-center gap-3 py-3"><div className="grow"><b>{l}</b>{d && <div className="muted text-xs">{d}</div>}</div><button className={`btn-sm ${(s as any)[k] ? 'btn-mint' : 'btn-ghost'}`} onClick={() => upd(k, !(s as any)[k])}>{(s as any)[k] ? 'ON' : 'OFF'}</button></div>;
  const saveName = async () => { const { error } = await supabase().from('profiles').update({ display_name: name.slice(0, 24), lang }).eq('id', profile.id); if (error) return toast('😕 ' + error.message); toast(t('saved')); r.refresh(); };
  const ticket = async () => { if (!tk.subject) return; const { error } = await supabase().from('tickets').insert({ user_id: profile.id, kind: 'support', subject: tk.subject.slice(0, 120), body: tk.body.slice(0, 2000) }); if (error) return toast('😕 ' + error.message); setTk({ subject: '', body: '' }); toast(t('sent')); };
  return <div><h1 className="text-3xl">⚙️ {t('settings')}</h1>
    <div className="card mt-3 mb-2 flex items-center gap-3 py-3"><b className="grow">🌐 {t('language')}</b><button className={`chip ${lang === 'ar' ? 'on' : ''}`} onClick={() => setLang('ar')}>العربية</button><button className={`chip ${lang === 'en' ? 'on' : ''}`} onClick={() => setLang('en')}>English</button></div>
    <div className="card mb-2 flex items-center gap-3 py-3"><div className="grow"><b>{t('sensitivity')}</b></div><input type="range" min={2} max={16} value={s.sens} onChange={(e) => upd('sens', +e.target.value)} className="accent-sun" /></div>
    <Row k="invert" l={t('invert')} /><Row k="shadows" l={t('shadows')} d={lang === 'ar' ? 'أطفئها على الأجهزة البطيئة' : 'Turn off on slow devices'} /><Row k="sound" l={t('sound')} />
    <h2 className="mt-5 mb-2 text-xl">👤 {t('account')}</h2><div className="card"><div className="muted text-xs">{t('username')}: <b className="text-white">{profile.username}</b> · {t('friendCode')}: <b className="text-sun">{profile.friend_code}</b></div><div className="mt-2 flex gap-2"><input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={24} placeholder={t('displayName')} /><button className="btn-mint" onClick={saveName}>{t('save')}</button></div><p className="muted mt-2 text-xs">{t('deleteHint')}</p></div>
    <h2 className="mt-5 mb-2 text-xl">🛟 {t('support')}</h2><div className="card space-y-2"><input className="input" placeholder={t('subject')} value={tk.subject} onChange={(e) => setTk({ ...tk, subject: e.target.value })} /><textarea className="input" rows={3} placeholder={t('message')} value={tk.body} onChange={(e) => setTk({ ...tk, body: e.target.value })} /><button className="btn-candy" onClick={ticket}>{t('sendTicket')}</button></div>
  </div>;
}
