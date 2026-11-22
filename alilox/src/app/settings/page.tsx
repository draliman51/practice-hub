import AppShell from '@/components/AppShell';
import { requireActive } from '@/lib/guard';
import SettingsClient from './client';
export const dynamic = 'force-dynamic';
export default async function Settings() { const profile = await requireActive(); return <AppShell profile={profile}><SettingsClient profile={profile} /></AppShell>; }
