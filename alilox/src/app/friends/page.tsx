import AppShell from '@/components/AppShell';
import { requireActive } from '@/lib/guard';
import { supabaseServer } from '@/lib/supabase/server';
import FriendsClient from './client';
export const dynamic = 'force-dynamic';
export default async function Friends() {
  const profile = await requireActive(); const sb = supabaseServer();
  const { data: fs } = await sb.from('friendships').select('*').or(`requester.eq.${profile.id},addressee.eq.${profile.id}`);
  const ids = Array.from(new Set((fs || []).flatMap((f: any) => [f.requester, f.addressee]).filter((id: string) => id !== profile.id)));
  const { data: ps } = ids.length ? await sb.from('players').select('*').in('id', ids) : { data: [] };
  const { data: lb } = await sb.from('players').select('id,display_name,level,xp,avatar').order('xp', { ascending: false }).limit(10);
  return <AppShell profile={profile}><FriendsClient profile={profile} friendships={fs || []} players={(ps || []) as any} leaderboard={(lb || []) as any} /></AppShell>;
}
