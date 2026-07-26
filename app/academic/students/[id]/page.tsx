import { requireRole, getBranding, getUnreadCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { StudentProfileClient } from './StudentProfileClient';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'ملف الطالب' };

export default async function StudentProfilePage({ params }: { params: { id: string } }) {
  const user     = await requireRole(['platform_admin','university_admin','registrar','dean','department_head']);
  const branding = await getBranding();
  const unread   = await getUnreadCount(user.id);
  const supabase = createClient();

  const { data: student } = await supabase
    .from('students')
    .select(`
      *,
      profile:profiles(*),
      program:programs(*, department:departments(*, faculty:faculties(*)))
    `)
    .eq('id', params.id)
    .single();

  if (!student) notFound();

  const [
    { data: enrollments },
    { data: invoices },
    { data: behaviors },
    { data: certificates },
  ] = await Promise.all([
    supabase.from('enrollments')
      .select(`
        id, status, enrolled_at,
        section:sections(code, course:courses(name_ar, name_en, code, credits), semester:semesters(name_ar, name_en)),
        grade:grade_entries(total, letter, is_published)
      `)
      .eq('student_id', params.id)
      .order('enrolled_at', { ascending: false }),
    supabase.from('invoices')
      .select('*')
      .eq('student_id', params.id)
      .order('created_at', { ascending: false }),
    supabase.from('behavior_records')
      .select('*')
      .eq('student_id', params.id)
      .order('incident_date', { ascending: false }),
    supabase.from('certificates')
      .select('*')
      .eq('student_id', params.id)
      .order('issued_date', { ascending: false }),
  ]);

  return (
    <DashboardShell user={user} branding={branding} unreadCount={unread} pageTitle="ملف الطالب">
      <StudentProfileClient
        student={student}
        enrollments={enrollments ?? []}
        invoices={invoices ?? []}
        behaviors={behaviors ?? []}
        certificates={certificates ?? []}
        adminId={user.id}
      />
    </DashboardShell>
  );
}
