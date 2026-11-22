import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { requireActive } from '@/lib/guard';
import { supabaseServer } from '@/lib/supabase/server';
import WorldsClient from './client';
export const dynamic = 'force-dynamic';
export default async function Worlds() { const profile = await requireActive(); const sb = supabaseServer(); const { data } = await sb.from('worlds').select('id,name,code,plays,likes,owner,created_at').eq('published', true).eq('approved', true).order('plays', { ascending: false }).limit(60);
  const owners = Array.from(new Set((data || []).map((w: any) => w.owner))); const { data: ps } = owners.length ? await sb.from('players').select('id,display_name').in('id', owners) : { data: [] };
  return <AppShell profile={profile}><WorldsClient worlds={(data || []).map((w: any) => ({ ...w, by: (ps || []).find((p: any) => p.id === w.owner)?.display_name || '' }))} /></AppShell>; }
