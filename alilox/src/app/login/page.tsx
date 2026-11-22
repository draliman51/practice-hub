'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useT } from '@/lib/i18n';
import { toast } from '@/components/Toast';
export default function Login() {
  const { t, lang, setLang } = useT(); const r = useRouter(); const sp = useSearchParams(); const [id, setId] = useState(''); const [pw, setPw] = useState(''); const [busy, setBusy] = useState(false);
  const go = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true);
    const email = id.includes('@') ? id.trim() : `${id.trim().toLowerCase()}@kids.alilox.app`;
    const { error } = await supabase().auth.signInWithPassword({ email, password: pw }); setBusy(false);
    if (error) return toast('😕 ' + (lang === 'ar' ? 'اسم المستخدم أو كلمة المرور غير صحيحة' : error.message));
    r.replace(sp.get('next') || '/play'); r.refresh(); };
  return <main className="mx-auto max-w-sm px-5 py-10">
    <div className="text-center"><div className="text-6xl">🧱</div><h1 className="text-3xl">{t('login')}</h1></div>
    <form onSubmit={go} className="card mt-6 space-y-3">
      <input className="input" placeholder={`${t('username')} / ${t('email')}`} value={id} onChange={(e) => setId(e.target.value)} autoCapitalize="none" required />
      <input className="input" type="password" placeholder={t('password')} value={pw} onChange={(e) => setPw(e.target.value)} required />
      <button className="btn-sun w-full" disabled={busy}>{t('login')} →</button>
    </form>
    <p className="mt-4 text-center text-sm muted">{lang === 'ar' ? 'ليس لديك حساب؟' : 'No account yet?'} <Link className="text-sun font-bold" href="/signup">{t('signup')}</Link> · <button className="underline" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>{lang === 'ar' ? 'English' : 'عربي'}</button></p>
  </main>;
}
