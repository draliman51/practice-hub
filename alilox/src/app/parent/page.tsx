import AppShell from '@/components/AppShell';
import { requireActive } from '@/lib/guard';
import { supabaseServer } from '@/lib/supabase/server';
import ParentClient from './client';
export const dynamic = 'force-dynamic';
export default async function Parent() {
  const profile = await requireActive({ roles: ['parent', 'admin'] }); const sb = supabaseServer();
  const { data: kids } = await sb.from('profiles').select('*').eq('parent_id', profile.id).order('created_at');
  const ids = (kids || []).map((k: any) => k.id); const week = new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10);
  const [sessions, scores, fr] = await Promise.all([
    ids.length ? sb.from('play_sessions').select('*').in('user_id', ids).gte('day', week) : { data: [] },
    ids.length ? sb.from('scores').select('user_id,world,score,created_at').in('user_id', ids).gte('created_at', week + 'T00:00:00Z') : { data: [] },
    ids.length ? sb.from('friendships').select('*').eq('parent_ok', false).or(ids.map((i: string) => `requester.eq.${i},addressee.eq.${i}`).join(',')) : { data: [] },
  ]);
  const fids = Array.from(new Set(((fr as any).data || []).flatMap((f: any) => [f.requester, f.addressee]))); const { data: fps } = fids.length ? await sb.from('players').select('id,display_name,username').in('id', fids) : { data: [] };
  return <AppShell profile={profile}><ParentClient profile={profile} kids={(kids || []) as any} sessions={(sessions as any).data || []} scores={(scores as any).data || []} friendReqs={(fr as any).data || []} fplayers={fps || []} /></AppShell>;
}
