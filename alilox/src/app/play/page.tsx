import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { requireActive } from '@/lib/guard';
import { supabaseServer } from '@/lib/supabase/server';
import { signedPhoto, currentSeason, currentEvent, nextEvent } from '@/lib/photos';
import HubClient from './client';
export const dynamic = 'force-dynamic';
export default async function Play() {
  const profile = await requireActive(); const sb = supabaseServer();
  const [photoUrl, season, quests, qp, best, evNow, evNext] = await Promise.all([
    signedPhoto(sb, profile.photo_path), currentSeason(sb),
    sb.from('quests').select('*').eq('active', true).then((r) => r.data || []),
    sb.from('quest_progress').select('*').eq('user_id', profile.id).then((r) => r.data || []),
    sb.from('scores').select('world,score').eq('user_id', profile.id).order('score', { ascending: false }).limit(200).then((r) => r.data || []),
    currentEvent(sb), nextEvent(sb),
  ]);
  const bestBy: Record<string, number> = {}; best.forEach((s: any) => { bestBy[s.world] = Math.max(bestBy[s.world] || 0, s.score); });
  return <AppShell profile={profile}><HubClient profile={profile} photoUrl={photoUrl} season={season} quests={quests as any} qp={qp as any} bestBy={bestBy} evNow={evNow} evNext={evNext} /></AppShell>;
}
