import { createClient } from '@supabase/supabase-js';
export function supabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
}
export const CHILD_EMAIL_DOMAIN = 'kids.alilox.app';
export const childEmail = (username: string) => `${username.toLowerCase()}@${CHILD_EMAIL_DOMAIN}`;
