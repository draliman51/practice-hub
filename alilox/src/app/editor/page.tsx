import AppShell from '@/components/AppShell';
import { requireActive } from '@/lib/guard';
import { supabaseServer } from '@/lib/supabase/server';
import { signedPhoto } from '@/lib/photos';
import EditorClient from './client';
export const dynamic = 'force-dynamic';
export default async function Editor({ searchParams }: { searchParams: { id?: string } }) {
  const profile = await requireActive(); const sb = supabaseServer(); const photoUrl = await signedPhoto(sb, profile.photo_path);
  let world: any = null; if (searchParams.id) { const { data } = await sb.from('worlds').select('*').eq('id', searchParams.id).eq('owner', profile.id).single(); world = data; }
  const { data: mine } = await sb.from('worlds').select('id,name,code,published,approved,plays').eq('owner', profile.id).order('updated_at', { ascending: false });
  return <AppShell profile={profile} wide><EditorClient profile={profile} photoUrl={photoUrl} world={world} mine={mine || []} /></AppShell>;
}
