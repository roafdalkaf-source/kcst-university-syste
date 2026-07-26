import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDashboardUrl } from '@/lib/utils';
import type { UserRole } from '@/types';
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', data.user.id);
      const userRoles = (roles ?? []).map(r => r.role as UserRole);
      const dest = userRoles.length > 0 ? getDashboardUrl(userRoles) : '/join-request';
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }
  return NextResponse.redirect(`${origin}/auth/login?error=oauth`);
}
