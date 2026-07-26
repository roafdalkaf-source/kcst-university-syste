import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { UserRole, UserWithRoles } from '@/types';
import { getDashboardUrl } from '@/lib/utils';

export async function getUser(): Promise<UserWithRoles | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const [{ data: profile }, { data: rolesData }, { data: settings }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('user_roles').select('role').eq('user_id', user.id),
    supabase.from('app_settings').select('value').eq('key', 'branding').single(),
  ]);
  if (!profile) return null;
  return {
    ...profile,
    roles:   (rolesData ?? []).map((r: any) => r.role as UserRole),
    branding: settings?.value ?? null,
  };
}

export async function requireAuth(): Promise<UserWithRoles> {
  const user = await getUser();
  if (!user) redirect('/auth/login');
  return user;
}

export async function requireRole(allowed: UserRole[]): Promise<UserWithRoles> {
  const user = await requireAuth();
  const has  = user.roles.some(r => allowed.includes(r));
  if (!has) redirect('/403');
  return user;
}

export async function getBranding() {
  const supabase = createClient();
  const { data } = await supabase.from('app_settings').select('value').eq('key','branding').single();
  return {
    name_ar:       data?.value?.name_ar       ?? 'كلية كوش للعلوم والتكنولوجيا',
    name_en:       data?.value?.name_en       ?? 'Kush College for Science and Technology',
    logo_url:      data?.value?.logo_url      ?? null,
    primary_color: data?.value?.primary_color ?? '#1E3A5F',
    accent_color:  data?.value?.accent_color  ?? '#C9A84C',
  };
}

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = createClient();
  const { count } = await supabase.from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId).eq('is_read', false);
  return count ?? 0;
}

export function hasRole(user: UserWithRoles, roles: UserRole[]): boolean {
  return user.roles.some(r => roles.includes(r));
}
