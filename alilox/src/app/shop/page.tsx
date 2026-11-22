import AppShell from '@/components/AppShell';
import { requireActive } from '@/lib/guard';
import { supabaseServer } from '@/lib/supabase/server';
import ShopClient from './client';
export const dynamic = 'force-dynamic';
export default async function Shop() { const profile = await requireActive(); const { data: items } = await supabaseServer().from('items').select('*').eq('active', true).order('sort'); return <AppShell profile={profile}><ShopClient profile={profile} items={(items || []) as any} /></AppShell>; }
