import AppShell from '@/components/AppShell';
import { requireActive } from '@/lib/guard';
import { supabaseServer } from '@/lib/supabase/server';
import HouseClient from './client';
export const dynamic = 'force-dynamic';
export default async function House({ searchParams }: { searchParams: { u?: string } }) {
  const profile = await requireActive(); const sb = supabaseServer();
  const { data: items } = await sb.from('items').select('*').in('kind', ['furniture', 'wall', 'floor']).eq('active', true).order('sort');
  let visit: any = null; if (searchParams.u) { const { data } = await sb.from('profiles').select('id,display_name,house').eq('id', searchParams.u).single(); visit = data; }
  return <AppShell profile={profile}><HouseClient profile={profile} items={(items || []) as any} visit={visit} /></AppShell>;
}
