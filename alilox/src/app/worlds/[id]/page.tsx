import AppShell from '@/components/AppShell';
import GameCanvas from '@/components/GameCanvas';
import { requireActive } from '@/lib/guard';
import { supabaseServer } from '@/lib/supabase/server';
import { signedPhoto } from '@/lib/photos';
import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
export default async function PlayCustom({ params }: { params: { id: string } }) {
  const profile = await requireActive(); const sb = supabaseServer(); const { data: w } = await sb.from('worlds').select('*').eq('id', params.id).single(); if (!w) redirect('/worlds');
  const photoUrl = await signedPhoto(sb, profile.photo_path); if (w.owner !== profile.id) await sb.rpc('world_played', { p_id: w.id });
  return <AppShell profile={profile} wide><h1 className="mb-2 text-2xl">🧱 {w.name} <span className="muted text-sm">{w.code}</span></h1><GameCanvas world="custom" mode="solo" me={profile} myPhotoUrl={photoUrl} data={w.data} /></AppShell>;
}
