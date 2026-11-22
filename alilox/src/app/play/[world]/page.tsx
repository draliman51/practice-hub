import AppShell from '@/components/AppShell';
import GameCanvas from '@/components/GameCanvas';
import { requireActive } from '@/lib/guard';
import { supabaseServer } from '@/lib/supabase/server';
import { signedPhoto, currentSeason } from '@/lib/photos';
import { WORLDS } from '@/game/catalog';
import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
export default async function WorldPage({ params, searchParams }: { params: { world: string }; searchParams: { mode?: string; room?: string; w?: string } }) {
  const profile = await requireActive(); const sb = supabaseServer();
  const W = WORLDS.find((w) => w.id === params.world); if (!W || W.mini) redirect('/play');
  const mode = (searchParams.room ? 'online' : searchParams.mode === 'cpu' && W.modes.includes('cpu') ? 'cpu' : 'solo') as 'solo' | 'cpu' | 'online';
  const [photoUrl, season] = await Promise.all([signedPhoto(sb, profile.photo_path), currentSeason(sb)]);
  let others: any[] = [];
  if (mode === 'online' && searchParams.room) {
    const { data: mem } = await sb.from('room_members').select('user_id').eq('room_code', searchParams.room);
    const ids = (mem || []).map((m: any) => m.user_id).filter((id: string) => id !== profile.id);
    if (ids.length) { const { data: ps } = await sb.from('players').select('*').in('id', ids); others = await Promise.all((ps || []).map(async (p: any) => ({ id: p.id, name: p.display_name, avatar: p.avatar, photoUrl: await signedPhoto(sb, p.photo_path) }))); }
  }
  return <AppShell profile={profile} wide><GameCanvas world={W.id} mode={mode} me={profile} myPhotoUrl={photoUrl} room={searchParams.room} others={others} season={season} /></AppShell>;
}
