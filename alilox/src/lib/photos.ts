import type { SupabaseClient } from '@supabase/supabase-js';
export async function signedPhoto(sb: SupabaseClient, path: string | null | undefined): Promise<string | null> {
  if (!path) return null; const { data } = await sb.storage.from('photos').createSignedUrl(path, 3600); return data?.signedUrl || null;
}
export async function currentSeason(sb: SupabaseClient) {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await sb.from('seasons').select('*').eq('active', true).lte('starts_at', today).gte('ends_at', today).limit(1); return data?.[0] || null;
}
