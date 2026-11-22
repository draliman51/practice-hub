import AppShell from '@/components/AppShell';
import { requireActive } from '@/lib/guard';
import { supabaseServer } from '@/lib/supabase/server';
import { signedPhoto } from '@/lib/photos';
import AvatarClient from './client';
export const dynamic = 'force-dynamic';
export default async function Avatar() { const profile = await requireActive(); const sb = supabaseServer(); const [photoUrl, items] = await Promise.all([signedPhoto(sb, profile.photo_path), sb.from('items').select('*').eq('active', true).order('sort').then((r) => r.data || [])]); return <AppShell profile={profile}><AvatarClient profile={profile} photoUrl={photoUrl} items={items as any} /></AppShell>; }
