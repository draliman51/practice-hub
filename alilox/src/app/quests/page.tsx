import AppShell from '@/components/AppShell';
import { requireActive } from '@/lib/guard';
import { supabaseServer } from '@/lib/supabase/server';
import QuestsClient from './client';
export const dynamic = 'force-dynamic';
export default async function Quests() { const profile = await requireActive(); const sb = supabaseServer(); const [q, p] = await Promise.all([sb.from('quests').select('*').eq('active', true), sb.from('quest_progress').select('*').eq('user_id', profile.id)]); return <AppShell profile={profile}><QuestsClient profile={profile} quests={(q.data || []) as any} qp={p.data || []} /></AppShell>; }
