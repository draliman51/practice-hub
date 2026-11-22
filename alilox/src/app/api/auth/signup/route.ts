import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const role = b.role === 'parent' ? 'parent' : 'child'; const username = String(b.username || '').trim().toLowerCase();
  if (!/^[a-z0-9_]{3,16}$/.test(username)) return NextResponse.json({ error: 'Username must be 3–16 letters, numbers or _' }, { status: 400 });
  if (String(b.password || '').length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  const email = role === 'parent' ? String(b.email || '').trim() : `${username}@kids.alilox.app`;
  const res = NextResponse.json({ ok: true, role });
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => [], setAll: (list: { name: string; value: string; options?: any }[]) => list.forEach(({ name, value, options }) => res.cookies.set(name, value, { ...options, path: '/', sameSite: 'lax', secure: true, httpOnly: false })) },
  });
  const { data, error } = await sb.auth.signUp({ email, password: String(b.password), options: { data: { role, username, display_name: String(b.display_name || username).slice(0, 24), parent_email: role === 'child' ? String(b.parent_email || '').trim() : null, under13: role === 'child' ? b.under13 !== false : false, lang: b.lang === 'en' ? 'en' : 'ar' } } });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data.session) return NextResponse.json({ ok: true, role, needsConfirm: true });
  return res;
}
