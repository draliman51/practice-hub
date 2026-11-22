import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
// Server-side login: sets the auth cookies on the response (more reliable than JS cookies on iOS Safari).
export async function POST(req: Request) {
  const { id, password } = await req.json().catch(() => ({}));
  const email = String(id || '').includes('@') ? String(id).trim() : `${String(id || '').trim().toLowerCase()}@kids.alilox.app`;
  const res = NextResponse.json({ ok: true });
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => [], setAll: (list: { name: string; value: string; options?: any }[]) => list.forEach(({ name, value, options }) => res.cookies.set(name, value, { ...options, path: '/', sameSite: 'lax', secure: true, httpOnly: false })) },
  });
  const { error } = await sb.auth.signInWithPassword({ email, password: String(password || '') });
  if (error) return NextResponse.json({ error: error.message }, { status: 401 });
  return res;
}
