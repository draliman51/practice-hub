'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useT } from '@/lib/i18n';
import type { Profile } from '@/lib/types';
import { supabase } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { toast } from './Toast';

export default function AppShell({ profile, children, wide }: { profile: Profile; children: React.ReactNode; wide?: boolean }) {
  const { t, lang, setLang } = useT(); const path = usePathname(); const router = useRouter();
  const [gate, setGate] = useState<null | { allowed: boolean; from: number; to: number; used: number; limit: number }>(null);
  // play-time accounting for children (1 min ticks while any app page is open)
  useEffect(() => { if (profile.role !== 'child') return; let alive = true;
    const tick = async (m: number) => { const { data } = await supabase().rpc('tick_play', { p_minutes: m }); if (alive && data) setGate(data as any); };
    tick(0); const iv = setInterval(() => { if (document.visibilityState === 'visible') tick(1); }, 60000); return () => { alive = false; clearInterval(iv); }; }, [profile.role]);
  const nav = [
    ['/play', '🏙️', t('home')], ['/rooms', '👥', t('rooms')], ['/avatar', '🧍', t('avatar')], ['/shop', '🛍️', t('shop')], ['/friends', '🤝', t('friends')],
  ] as const;
  const more = ([['/quests', '⭐', t('quests')], ['/house', '🏠', t('house')], ['/editor', '🧱', t('editor')], ['/worlds', '🌍', t('worlds')], ['/settings', '⚙️', t('settings')]] as [string, string, string][])
    .concat(profile.role !== 'child' ? [['/parent', '👨‍👩‍👧', t('parentDash')]] : []).concat(profile.role === 'admin' ? [['/admin', '🛡️', t('admin')]] : []);
  const blocked = profile.role === 'child' && gate && !gate.allowed;
  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#1b1140]/80 backdrop-blur">
        <div className={`mx-auto flex items-center gap-3 px-4 py-2 ${wide ? 'max-w-6xl' : 'max-w-3xl'}`}>
          <Link href="/play" className="font-display text-2xl font-bold"><span className="text-sun">Ali</span><span className="text-mint">lox</span> 🧱</Link>
          <div className="grow" />
          <span className="pill-sun">🪙 {profile.coins}</span><span className="pill">⭐ {t('level')} {profile.level}</span>
          <button className="btn-ghost btn-sm" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>{lang === 'ar' ? 'EN' : 'ع'}</button>
          {(profile.role === 'parent' || profile.role === 'admin') && <Link className="btn-ghost btn-sm" href="/parent" title={t('parent')}>👨‍👩‍👧</Link>}
          {profile.role === 'admin' && <Link className="btn-ghost btn-sm" href="/admin" title={t('admin')}>🛡️</Link>}
          <button className="btn-ghost btn-sm" onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.assign('/'); }}>{t('logout')}</button>
        </div>
      </header>
      <main className={`mx-auto px-4 py-4 ${wide ? 'max-w-6xl' : 'max-w-3xl'}`}>
        {profile.status === 'frozen' && <div className="card mb-4 border-candy bg-candy/20">⏸️ {t('frozen')}</div>}
        {blocked ? <div className="card text-center py-10"><div className="text-6xl">⏰</div><h2 className="text-2xl mt-2">{gate!.used >= gate!.limit ? t('timeUp') : t('outsideHours', { h: gate!.from })}</h2><p className="muted mt-2">{gate!.used}/{gate!.limit} min</p></div> : children}
      </main>
      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-[#120b2e]/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-3xl justify-around px-2 py-1">
          {nav.map(([h, ic, l]) => <Link key={h} href={h} className={`flex flex-col items-center rounded-xl px-2 py-1 text-[11px] font-bold ${path.startsWith(h) ? 'text-sun' : 'text-white/70'}`}><span className="text-2xl">{ic}</span>{l}</Link>)}
          <details className="relative"><summary className="flex cursor-pointer list-none flex-col items-center px-2 py-1 text-[11px] font-bold text-white/70"><span className="text-2xl">➕</span>…</summary>
            <div className="absolute bottom-14 end-0 w-44 rounded-2xl border border-white/10 bg-[#2a1b5e] p-2 shadow-card">{more.map(([h, ic, l]) => <Link key={h} href={h} className="flex items-center gap-2 rounded-xl px-3 py-2 font-bold hover:bg-white/10">{ic} {l}</Link>)}</div></details>
        </div>
      </nav>
    </div>
  );
}
export function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return <section className="mb-5"><div className="mb-2 flex items-center"><h2 className="text-xl grow">{title}</h2>{action}</div>{children}</section>;
}
export async function rpc<T = any>(fn: string, args: Record<string, any> = {}): Promise<T | null> {
  const { data, error } = await supabase().rpc(fn, args); if (error) { toast('😕 ' + error.message); return null; } return (data ?? true) as T;
}
