import { redirect } from 'next/navigation';
import { currentProfile } from './supabase/server';
import type { Profile } from './types';
/** Server helper: ensures a signed-in, active profile; otherwise redirects. */
export async function requireActive(opts: { roles?: Profile['role'][] } = {}): Promise<Profile> {
  const { profile } = await currentProfile();
  if (!profile) redirect('/login');
  if (profile.status === 'pending' || profile.status === 'banned') redirect('/pending');
  if (opts.roles && !opts.roles.includes(profile.role)) redirect('/play');
  return profile as Profile;
}
