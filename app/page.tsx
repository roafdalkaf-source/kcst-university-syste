import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { getDashboardUrl } from '@/lib/utils';
export default async function RootPage() {
  const user = await getUser();
  if (!user) redirect('/auth/login');
  redirect(getDashboardUrl(user.roles));
}
