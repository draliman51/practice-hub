import { notFound } from 'next/navigation';
import DevClient from './client';
// Local-only playground (no database): enabled with NEXT_PUBLIC_DEV_DEMO=1
export default function Dev({ searchParams }: { searchParams: { world?: string; mode?: string } }) { if (process.env.NEXT_PUBLIC_DEV_DEMO !== '1') notFound(); return <DevClient world={searchParams.world || 'city'} mode={(searchParams.mode as any) || 'solo'} />; }
