import { NextResponse } from 'next/server';
import { currentProfile } from '@/lib/supabase/server';
import { supabaseAdmin, childEmail } from '@/lib/supabase/admin';
// Parent (or admin) creates a child account directly: username + password; account is active and linked immediately.
export async function POST(req: Request) {
  const { profile } = await currentProfile();
  if (!profile || (profile.role !== 'parent' && profile.role !== 'admin')) return NextResponse.json({ error: 'Parents only' }, { status: 403 });
  const b = await req.json().catch(() => ({})); const username = String(b.username || '').trim().toLowerCase(); const password = String(b.password || ''); const display_name = String(b.display_name || username).slice(0, 24); const under13 = b.under13 !== false;
  if (!/^[a-z0-9_]{3,16}$/.test(username)) return NextResponse.json({ error: 'Username must be 3–16 letters/numbers/_' }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  const admin = supabaseAdmin();
  const { data: created, error } = await admin.auth.admin.createUser({ email: childEmail(username), password, email_confirm: true, user_metadata: { role: 'child', username, display_name, under13, lang: profile.lang } });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await admin.from('profiles').update({ parent_id: profile.id, status: 'active', under13 }).eq('id', created.user.id);
  await admin.from('audit_log').insert({ actor: profile.id, action: 'create_child', target: created.user.id });
  return NextResponse.json({ ok: true, id: created.user.id, username });
}
