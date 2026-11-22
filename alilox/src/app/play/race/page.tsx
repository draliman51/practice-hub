import AppShell from '@/components/AppShell';
import { requireActive } from '@/lib/guard';
import RaceClient from './client';
export const dynamic = 'force-dynamic';
export default async function Race() { const profile = await requireActive(); return <AppShell profile={profile}><RaceClient profile={profile} /></AppShell>; }
