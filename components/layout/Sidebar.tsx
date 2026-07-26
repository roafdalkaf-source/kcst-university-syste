'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { LayoutDashboard, Users, BookOpen, Building2, Calendar, GraduationCap, ClipboardList, BarChart3, Bell, Settings, LogOut, Shield, DollarSign, Award, AlertTriangle, ChevronDown, ChevronRight, Layers, Search, UserCheck, ScrollText, Video, Megaphone } from 'lucide-react';
import { cn, getInitials, getDashboardUrl } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { UserWithRoles, UserRole } from '@/types';

export function Sidebar({ user, unreadCount=0, branding }: { user:UserWithRoles; unreadCount?:number; branding?:any }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language==='ar';
  const [open, setOpen] = useState<string[]>([]);
  const toggle = (l:string) => setOpen(p=>p.includes(l)?p.filter(x=>x!==l):[...p,l]);
  const active = (href?:string) => href ? pathname===href||(href!=='/'&&pathname.startsWith(href+'/')) : false;

  const handleLogout = async () => {
    const sb = createClient();
    await sb.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  const isAdmin  = user.roles.some(r=>['platform_admin','university_admin'].includes(r));
  const isProf   = user.roles.some(r=>['professor','teaching_assistant'].includes(r));
  const isStudent = user.roles.includes('student');
  const isReg   = user.roles.includes('registrar');
  const isFin   = user.roles.includes('finance_officer');

  const displayName = isRTL ? (branding?.name_ar ?? 'كلية كوش') : (branding?.name_en ?? 'KCST');

  return (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-white select-none">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-sidebar-border shrink-0">
        <div className="w-9 h-9 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0">
          <GraduationCap className="w-5 h-5 text-accent-400"/>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-white leading-tight line-clamp-2">{displayName}</p>
          <p className="text-[9px] text-white/40 mt-0.5 uppercase tracking-widest">UMS Portal</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {/* Dashboard */}
        {isAdmin  && <Link href="/dashboard/admin"     className={cn('nav-item',active('/dashboard/admin')    &&'nav-item-active')}><LayoutDashboard className="w-4 h-4 shrink-0"/><span className="text-xs">الرئيسية</span></Link>}
        {isProf   && <Link href="/dashboard/professor" className={cn('nav-item',active('/dashboard/professor')&&'nav-item-active')}><LayoutDashboard className="w-4 h-4 shrink-0"/><span className="text-xs">الرئيسية</span></Link>}
        {isFin    && <Link href="/dashboard/finance"   className={cn('nav-item',active('/dashboard/finance')  &&'nav-item-active')}><LayoutDashboard className="w-4 h-4 shrink-0"/><span className="text-xs">الرئيسية</span></Link>}
        {isReg    && <Link href="/dashboard/registrar" className={cn('nav-item',active('/dashboard/registrar')&&'nav-item-active')}><LayoutDashboard className="w-4 h-4 shrink-0"/><span className="text-xs">الرئيسية</span></Link>}
        {isStudent && <Link href="/dashboard/student"  className={cn('nav-item',active('/dashboard/student')  &&'nav-item-active')}><LayoutDashboard className="w-4 h-4 shrink-0"/><span className="text-xs">الرئيسية</span></Link>}

        {/* LMS */}
        <Link href="/lms/my-courses" className={cn('nav-item',active('/lms')&&'nav-item-active')}>
          <Video className="w-4 h-4 shrink-0"/><span className="text-xs">{isStudent?'مقرراتي':'مقرراتي'}</span>
        </Link>

        {/* Academic group */}
        {(isAdmin||isReg) && (
          <div>
            <button onClick={()=>toggle('acad')} className="nav-item w-full">
              <BookOpen className="w-4 h-4 shrink-0"/>
              <span className="flex-1 text-start text-xs font-medium">الشؤون الأكاديمية</span>
              {open.includes('acad')?<ChevronDown className="w-3.5 h-3.5 opacity-50"/>:<ChevronRight className="w-3.5 h-3.5 opacity-50"/>}
            </button>
            {open.includes('acad') && (
              <div className="mt-0.5 ms-3 ps-3 border-s border-sidebar-border space-y-0.5">
                <Link href="/academic/calendar"         className={cn('nav-item text-xs py-1.5',active('/academic/calendar')&&'nav-item-active')}><Calendar className="w-3.5 h-3.5 shrink-0"/>التقويم</Link>
                <Link href="/academic/students"         className={cn('nav-item text-xs py-1.5',active('/academic/students')&&'nav-item-active')}><Users className="w-3.5 h-3.5 shrink-0"/>الطلاب</Link>
                <Link href="/academic/sections"         className={cn('nav-item text-xs py-1.5',active('/academic/sections')&&'nav-item-active')}><Layers className="w-3.5 h-3.5 shrink-0"/>الشعب</Link>
              </div>
            )}
          </div>
        )}

        {/* Student pages */}
        {isStudent && <>
          <Link href="/student/grades"      className={cn('nav-item',active('/student/grades')      &&'nav-item-active')}><ClipboardList className="w-4 h-4 shrink-0"/><span className="text-xs">درجاتي</span></Link>
          <Link href="/student/schedule"    className={cn('nav-item',active('/student/schedule')    &&'nav-item-active')}><Calendar className="w-4 h-4 shrink-0"/><span className="text-xs">جدولي</span></Link>
          <Link href="/student/attendance"  className={cn('nav-item',active('/student/attendance')  &&'nav-item-active')}><UserCheck className="w-4 h-4 shrink-0"/><span className="text-xs">حضوري</span></Link>
          <Link href="/student/finance"     className={cn('nav-item',active('/student/finance')     &&'nav-item-active')}><DollarSign className="w-4 h-4 shrink-0"/><span className="text-xs">حسابي</span></Link>
          <Link href="/student/certificates"className={cn('nav-item',active('/student/certificates')&&'nav-item-active')}><Award className="w-4 h-4 shrink-0"/><span className="text-xs">شهاداتي</span></Link>
        </>}

        {/* Finance */}
        {(isAdmin||isFin) && <Link href="/finance" className={cn('nav-item',active('/finance')&&'nav-item-active')}><DollarSign className="w-4 h-4 shrink-0"/><span className="text-xs">المالية</span></Link>}

        {/* Behavior */}
        {(isAdmin||isReg) && <Link href="/behavior" className={cn('nav-item',active('/behavior')&&'nav-item-active')}><AlertTriangle className="w-4 h-4 shrink-0"/><span className="text-xs">السلوك</span></Link>}

        {/* Notifications */}
        <Link href="/notifications" className={cn('nav-item',active('/notifications')&&'nav-item-active')}>
          <Bell className="w-4 h-4 shrink-0"/>
          <span className="flex-1 text-xs">الإشعارات</span>
          {unreadCount>0 && <span className="min-w-[18px] h-[18px] rounded-full bg-accent text-primary-700 text-[10px] font-bold flex items-center justify-center px-1">{unreadCount>99?'99+':unreadCount}</span>}
        </Link>

        {/* Admin group */}
        {isAdmin && (
          <div>
            <button onClick={()=>toggle('admin')} className="nav-item w-full">
              <Shield className="w-4 h-4 shrink-0"/>
              <span className="flex-1 text-start text-xs font-medium">الإدارة</span>
              {open.includes('admin')?<ChevronDown className="w-3.5 h-3.5 opacity-50"/>:<ChevronRight className="w-3.5 h-3.5 opacity-50"/>}
            </button>
            {open.includes('admin') && (
              <div className="mt-0.5 ms-3 ps-3 border-s border-sidebar-border space-y-0.5">
                <Link href="/admin/structure"    className={cn('nav-item text-xs py-1.5',active('/admin/structure')   &&'nav-item-active')}><Building2 className="w-3.5 h-3.5 shrink-0"/>الهيكل الأكاديمي</Link>
                <Link href="/admin/users"        className={cn('nav-item text-xs py-1.5',active('/admin/users')       &&'nav-item-active')}><Users className="w-3.5 h-3.5 shrink-0"/>المستخدمون</Link>
                <Link href="/admin/join-requests"className={cn('nav-item text-xs py-1.5',active('/admin/join-requests')&&'nav-item-active')}><UserCheck className="w-3.5 h-3.5 shrink-0"/>طلبات الانضمام</Link>
                <Link href="/admin/reports"      className={cn('nav-item text-xs py-1.5',active('/admin/reports')     &&'nav-item-active')}><BarChart3 className="w-3.5 h-3.5 shrink-0"/>التقارير</Link>
                <Link href="/admin/audit"        className={cn('nav-item text-xs py-1.5',active('/admin/audit')       &&'nav-item-active')}><ScrollText className="w-3.5 h-3.5 shrink-0"/>سجل التدقيق</Link>
                <Link href="/admin/branding"     className={cn('nav-item text-xs py-1.5',active('/admin/branding')    &&'nav-item-active')}><Settings className="w-3.5 h-3.5 shrink-0"/>الهوية البصرية</Link>
                <Link href="/admin/broadcast"    className={cn('nav-item text-xs py-1.5',active('/admin/broadcast')   &&'nav-item-active')}><Megaphone className="w-3.5 h-3.5 shrink-0"/>الإشعارات الجماعية</Link>
                <Link href="/admin/search"       className={cn('nav-item text-xs py-1.5',active('/admin/search')      &&'nav-item-active')}><Search className="w-3.5 h-3.5 shrink-0"/>البحث الشامل</Link>
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="border-t border-sidebar-border p-3 shrink-0">
        <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-sidebar-hover transition-colors">
          <div className="w-8 h-8 rounded-full bg-accent/25 flex items-center justify-center text-xs font-bold text-accent-400 shrink-0">
            {getInitials(user.full_name||'U')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{isRTL?(user.full_name_ar??user.full_name):user.full_name}</p>
            <p className="text-[10px] text-white/40 truncate">{user.email}</p>
          </div>
          <button onClick={handleLogout} className="p-1.5 rounded hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors">
            <LogOut className="w-3.5 h-3.5"/>
          </button>
        </div>
      </div>
    </aside>
  );
}
// Note: Import link added to admin section in StructureClient nav
// Access via /admin/import directly
