import { currentProfile } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PendingClient from './client';
export default async function Pending() { const { profile } = await currentProfile(); if (!profile) redirect('/login'); if (profile.status === 'active') redirect('/play'); return <PendingClient username={profile.username} status={profile.status} />; }
