import { requireRole, getBranding, getUnreadCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/DashboardShell';
import Link from 'next/link';
import { Users, Layers, GraduationCap, FileCheck, ArrowRight, Clock } from 'lucide-react';
import { StatCard, PageHeader } from '@/components/shared';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'لوحة المسجّل' };

export default async function RegistrarDashboardPage() {
  const user     = await requireRole(['registrar']);
  const branding = await getBranding();
  const unread   = await getUnreadCount(user.id);
  const supabase = createClient();

  const [
    { count: totalStudents },
    { count: activeEnrollments },
    { count: pendingRequests },
    { data: recentStudents },
  ] = await Promise.all([
    supabase.from('students').select('*', { count:'exact', head:true }),
    supabase.from('enrollments').select('*', { count:'exact', head:true }).eq('status','enrolled'),
    supabase.from('join_requests').select('*', { count:'exact', head:true }).eq('status','pending'),
    supabase.from('students')
      .select('id, student_number, status, gpa, profile:profiles(full_name, full_name_ar), program:programs(name_ar)')
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  return (
    <DashboardShell user={user} branding={branding} unreadCount={unread} pageTitle="لوحة المسجّل">
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title={`مرحباً ${user.full_name_ar ?? user.full_name}`}
          description="نظرة عامة على التسجيل الأكاديمي"
        />

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="إجمالي الطلاب"    value={totalStudents ?? 0}     icon={Users}       iconClass="text-blue-600"  href="/academic/students" />
          <StatCard title="تسجيلات نشطة"      value={activeEnrollments ?? 0} icon={Layers}      iconClass="text-green-600" href="/academic/sections" />
          <StatCard title="طلبات الانضمام"    value={pendingRequests ?? 0}   icon={Clock}       iconClass="text-amber-500" href="/admin/join-requests" />
          <StatCard title="الشهادات"           value="إصدار"                  icon={FileCheck}   iconClass="text-purple-600" href="/certificates" />
        </div>

        {/* Recent students */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-800">آخر الطلاب المسجّلين</h3>
            <Link href="/academic/students" className="text-xs text-primary-500 hover:underline flex items-center gap-1">
              عرض الكل <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {(recentStudents ?? []).map(s => (
              <Link key={s.id} href={`/academic/students/${s.id}`}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold shrink-0">
                  {(s.profile?.full_name ?? 'U')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {s.profile?.full_name_ar ?? s.profile?.full_name}
                  </p>
                  <p className="text-xs text-gray-400 font-mono">{s.student_number}</p>
                </div>
                <div className="text-end shrink-0">
                  <p className="text-xs font-bold text-gray-700">{s.gpa?.toFixed(2)}</p>
                  <p className="text-[10px] text-gray-400">{(s as any).program?.name_ar?.slice(0,20)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { href:'/academic/students/new', label:'إضافة طالب جديد',    icon:Users },
            { href:'/academic/sections',     label:'إدارة الشعب',         icon:Layers },
            { href:'/admin/join-requests',   label:'طلبات الانضمام',      icon:GraduationCap },
          ].map(l => (
            <Link key={l.href} href={l.href}
              className="card p-4 flex items-center gap-3 hover:shadow-elevated transition-shadow">
              <l.icon className="w-5 h-5 text-primary-500 shrink-0" />
              <span className="text-sm font-medium text-gray-700">{l.label}</span>
              <ArrowRight className="w-4 h-4 text-gray-300 ms-auto" />
            </Link>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
