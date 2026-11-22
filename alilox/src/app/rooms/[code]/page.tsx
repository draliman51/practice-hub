import AppShell from '@/components/AppShell';
import { requireActive } from '@/lib/guard';
import { supabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import LobbyClient from './client';
export const dynamic = 'force-dynamic';
export default async function Lobby({ params }: { params: { code: string } }) {
  const profile = await requireActive(); const sb = supabaseServer();
  const { data: room } = await sb.from('rooms').select('*').eq('code', params.code).single(); if (!room) redirect('/rooms');
  return <AppShell profile={profile}><LobbyClient profile={profile} room={room} /></AppShell>;
}
