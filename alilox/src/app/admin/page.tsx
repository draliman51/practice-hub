import AppShell from '@/components/AppShell';
import { requireActive } from '@/lib/guard';
import { supabaseServer } from '@/lib/supabase/server';
import AdminClient from './client';
export const dynamic = 'force-dynamic';
export default async function Admin({ searchParams }: { searchParams: { q?: string } }) {
  const profile = await requireActive({ roles: ['admin'] }); const sb = supabaseServer();
  const [stats, tickets, users, worlds, seasons, items] = await Promise.all([
    sb.rpc('admin_stats').then((r) => r.data || {}),
    sb.from('tickets').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(50).then((r) => r.data || []),
    (searchParams.q ? sb.from('profiles').select('*').or(`username.ilike.%${searchParams.q}%,display_name.ilike.%${searchParams.q}%`) : sb.from('profiles').select('*').order('created_at', { ascending: false })).limit(40).then((r) => r.data || []),
    sb.from('worlds').select('id,name,code,owner,published,approved,plays').eq('published', true).eq('approved', false).limit(30).then((r) => r.data || []),
    sb.from('seasons').select('*').order('starts_at', { ascending: false }).then((r) => r.data || []),
    sb.from('items').select('*').order('sort').then((r) => r.data || []),
  ]);
  const tids = Array.from(new Set([...tickets.map((t: any) => t.user_id), ...tickets.map((t: any) => t.target_user), ...worlds.map((w: any) => w.owner)].filter(Boolean)));
  const { data: names } = tids.length ? await sb.from('profiles').select('id,username,display_name,photo_path').in('id', tids) : { data: [] };
  const photoUrls: Record<string, string> = {}; for (const n of names || []) { if (n.photo_path) { const { data } = await sb.storage.from('photos').createSignedUrl(n.photo_path, 600); if (data?.signedUrl) photoUrls[n.id] = data.signedUrl; } }
  return <AppShell profile={profile} wide><AdminClient stats={stats} tickets={tickets} users={users as any} worlds={worlds} seasons={seasons as any} items={items as any} names={names || []} photoUrls={photoUrls} q={searchParams.q || ''} /></AppShell>;
}
