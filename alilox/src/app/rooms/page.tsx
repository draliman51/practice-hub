import AppShell from '@/components/AppShell';
import { requireActive } from '@/lib/guard';
import RoomsClient from './client';
export const dynamic = 'force-dynamic';
export default async function Rooms({ searchParams }: { searchParams: { world?: string } }) { const profile = await requireActive(); return <AppShell profile={profile}><RoomsClient profile={profile} world={searchParams.world || 'obby'} /></AppShell>; }
