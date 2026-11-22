'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useT } from '@/lib/i18n';
import { toast } from '@/components/Toast';
export default function WorldsClient({ worlds }: { worlds: any[] }) {
  const { t, lang } = useT(); const r = useRouter(); const [code, setCode] = useState('');
  const byCode = async () => { const { data } = await supabase().from('worlds').select('id').eq('code', code.trim().toUpperCase()).single(); if (!data) return toast(lang === 'ar' ? 'لا يوجد عالم بهذا الرمز' : 'No world with that code'); r.push('/worlds/' + data.id); };
  return <div><div className="flex items-center gap-2"><h1 className="grow text-3xl">🌍 {t('worlds')}</h1><Link className="btn-sun btn-sm" href="/editor">🧱 {t('editor')}</Link></div>
    <p className="muted text-sm">{lang === 'ar' ? 'عوالم صنعها الأطفال واعتمدها فريق Alilox.' : 'Worlds built by kids and approved by the Alilox team.'}</p>
    <div className="card mt-3 flex gap-2"><input className="input uppercase" placeholder={lang === 'ar' ? 'رمز العالم' : 'World code'} value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} /><button className="btn-mint" onClick={byCode}>▶</button></div>
    <div className="mt-3 grid gap-2">{worlds.length === 0 && <p className="muted">{lang === 'ar' ? 'لا عوالم منشورة بعد — كن أول من يبني!' : 'No published worlds yet — be the first to build!'}</p>}{worlds.map((w) => <Link key={w.id} href={`/worlds/${w.id}`} className="card flex items-center gap-3 py-3"><div className="text-3xl">🧱</div><div className="grow"><b>{w.name}</b><div className="muted text-xs">{lang === 'ar' ? 'بواسطة' : 'by'} {w.by} · ▶ {w.plays} · ❤️ {w.likes} · {w.code}</div></div><span className="btn-mint btn-sm">▶</span></Link>)}</div>
  </div>;
}
