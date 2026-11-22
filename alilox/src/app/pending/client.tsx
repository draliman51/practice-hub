'use client';
import { useT } from '@/lib/i18n';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
export default function PendingClient({ username, status }: { username: string; status: string }) {
  const { t, lang } = useT(); const r = useRouter();
  return <main className="mx-auto max-w-md px-5 py-12 text-center"><div className="text-6xl">{status === 'frozen' ? '⏸️' : '🕒'}</div>
    <h1 className="text-3xl mt-2">{status === 'frozen' ? t('frozen') : t('pendingTitle')}</h1>
    {status !== 'frozen' && <><p className="muted mt-3">{t('pendingText')}</p><div className="card mt-4 text-3xl font-display tracking-widest text-sun">{username}</div></>}
    <div className="mt-6 flex justify-center gap-2"><button className="btn-mint" onClick={() => r.refresh()}>{lang === 'ar' ? 'تحقق مجددًا' : 'Check again'}</button><button className="btn-ghost" onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.assign('/'); }}>{t('logout')}</button></div>
  </main>;
}
