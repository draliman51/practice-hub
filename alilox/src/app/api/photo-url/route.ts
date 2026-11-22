import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
// Returns a short-lived signed URL for a photo path the viewer is allowed to see (storage RLS decides).
export async function GET(req: Request) {
  const path = new URL(req.url).searchParams.get('path'); if (!path) return NextResponse.json({ url: null });
  const sb = supabaseServer(); const { data } = await sb.storage.from('photos').createSignedUrl(path, 600);
  return NextResponse.json({ url: data?.signedUrl || null });
}
