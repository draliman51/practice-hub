import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
export function supabaseServer() {
  const store = cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => store.getAll(), setAll: (list: { name: string; value: string; options?: any }[]) => { try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* server component */ } } },
  });
}
export async function currentProfile() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { sb, user: null, profile: null };
  const { data: profile, error } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (error) console.error('profile load error', error);
  return { sb, user, profile, profileError: error?.message || null };
}
