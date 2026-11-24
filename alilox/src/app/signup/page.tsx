'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useT } from '@/lib/i18n';
import { toast } from '@/components/Toast';
export default function Signup() {
  const { t, lang, setLang } = useT(); const r = useRouter();
  const [role, setRole] = useState<'child' | 'parent'>('child'); const [f, setF] = useState({ username: '', display_name: '', password: '', email: '', parent_email: '', under13: true }); const [link, setLink] = useState(true); const [busy, setBusy] = useState(false);
  const set = (k: string, v: any) => setF((x) => ({ ...x, [k]: v }));
  const go = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true);
    const username = f.username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,16}$/.test(username)) { setBusy(false); return toast(lang === 'ar' ? 'اسم المستخدم: 3–16 حرفًا إنجليزيًا أو رقمًا أو _' : 'Username: 3–16 letters, numbers or _'); }
    const res = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...f, username, role, lang, link_parent: link }) }); const j = await res.json().catch(() => ({})); setBusy(false);
    if (!res.ok) return toast('😕 ' + (j.error || 'Error'));
    if (j.needsConfirm) { toast(lang === 'ar' ? 'تحقق من بريدك لتأكيد الحساب ✉️' : 'Check your email to confirm ✉️'); r.replace('/login'); return; }
    window.location.assign(role === 'child' ? (link ? '/pending' : '/play') : '/parent'); };
  return <main className="mx-auto max-w-sm px-5 py-8">
    <div className="text-center"><div className="text-6xl">🧱</div><h1 className="text-3xl">{t('signup')}</h1></div>
    <div className="mt-5 grid grid-cols-2 gap-2"><button className={`chip ${role === 'child' ? 'on' : ''}`} onClick={() => setRole('child')}>{t('iAmChild')}</button><button className={`chip ${role === 'parent' ? 'on' : ''}`} onClick={() => setRole('parent')}>{t('iAmParent')}</button></div>
    <form onSubmit={go} className="card mt-4 space-y-3">
      <input className="input" placeholder={t('username')} value={f.username} onChange={(e) => set('username', e.target.value)} autoCapitalize="none" required />
      <input className="input" placeholder={t('displayName')} value={f.display_name} onChange={(e) => set('display_name', e.target.value)} maxLength={24} />
      {role === 'parent' && <input className="input" type="email" placeholder={t('email')} value={f.email} onChange={(e) => set('email', e.target.value)} required />}
      {role === 'child' && <>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className={`rounded-2xl border-2 p-3 text-start text-sm ${link ? 'border-sun bg-sun/10' : 'border-white/10 bg-white/5'}`} onClick={() => setLink(true)}><div className="text-2xl">👨‍👩‍👧</div><b>{lang === 'ar' ? 'اربطه بحساب وليّ أمري' : 'Link to my parent'}</b><div className="muted text-xs mt-1">{lang === 'ar' ? 'يُفعَّل بعد موافقة وليّ الأمر من لوحته' : 'Activates after your parent approves it'}</div></button>
          <button type="button" className={`rounded-2xl border-2 p-3 text-start text-sm ${!link ? 'border-sun bg-sun/10' : 'border-white/10 bg-white/5'}`} onClick={() => setLink(false)}><div className="text-2xl">⚡</div><b>{lang === 'ar' ? 'أنشئ حسابي مباشرة' : 'Create my account now'}</b><div className="muted text-xs mt-1">{lang === 'ar' ? 'يبدأ اللعب فورًا، ويمكن لوليّ الأمر ربطه لاحقًا' : 'Play right away; a parent can link it later'}</div></button>
        </div>
        <input className="input" type="email" placeholder={link ? t('parentEmail') : (lang === 'ar' ? 'بريد إلكتروني يُربط بالحساب (إلزامي)' : 'Email linked to the account (required)')} value={f.parent_email} onChange={(e) => set('parent_email', e.target.value)} required />
      </>}
      <input className="input" type="password" placeholder={t('password')} value={f.password} onChange={(e) => set('password', e.target.value)} minLength={6} required />
      {role === 'child' && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.under13} onChange={(e) => set('under13', e.target.checked)} /> {t('under13')}</label>}
      {role === 'child' && <p className="text-xs muted">{link ? (lang === 'ar' ? 'سيُفعَّل الحساب بعد موافقة وليّ الأمر من لوحته (يسجّل الدخول بهذا البريد). تسجّل دخولك باسم المستخدم.' : 'The account activates after your parent (who signs in with this email) approves it. You log in with your username.') : (lang === 'ar' ? 'يجب ربط الحساب ببريد إلكتروني (لوليّ الأمر أو لك). تسجّل دخولك باسم المستخدم، ويمكن لوليّ أمرك ربط حسابك من لوحته لاحقًا.' : 'An email must be linked to the account (yours or a parent’s). You log in with your username; a parent can link your account later.')}</p>}
      <button className="btn-sun w-full" disabled={busy}>{t('continue')} →</button>
    </form>
    <p className="mt-4 text-center text-sm muted"><Link className="text-sun font-bold" href="/login">{t('login')}</Link> · <button className="underline" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>{lang === 'ar' ? 'English' : 'عربي'}</button></p>
  </main>;
}
