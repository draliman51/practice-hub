import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { currentProfile } from '@/lib/supabase/server';
// Diagnostic: who am I? (safe — returns only non-sensitive fields)
export async function GET() {
  const names = cookies().getAll().map((c) => c.name);
  try { const { user, profile } = await currentProfile(); return NextResponse.json({ signedIn: !!user, email: user?.email || null, username: profile?.username || null, role: profile?.role || null, status: profile?.status || null, cookies: names }); }
  catch (e: any) { return NextResponse.json({ signedIn: false, error: String(e?.message || e), cookies: names }); }
}
