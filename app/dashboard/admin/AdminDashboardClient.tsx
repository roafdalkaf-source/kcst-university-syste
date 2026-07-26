'use client';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { Users, GraduationCap, Building2, Layers, DollarSign, TrendingUp, AlertCircle, UserCheck, BookOpen, BarChart3 } from 'lucide-react';
import { AreaChart, Area, PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard, PageHeader } from '@/components/shared';
import { fCurrency, gpaColor, cn } from '@/lib/utils';
import type { UserWithRoles } from '@/types';

const TT = { background:'#fff', border:'1px solid #E5E7EB', borderRadius:10, fontSize:12 };
const enrollmentTrend=[{m:'سبت',n:380},{m:'أكت',n:520},{m:'نوف',n:680},{m:'ديس',n:740},{m:'يان',n:890},{m:'فبر',n:1020}];
const gradeDist=[{g:'A+/A',n:280,fill:'#16A34A'},{g:'B+/B',n:420,fill:'#0284C7'},{g:'C+/C',n:360,fill:'#D97706'},{g:'D+/D',n:180,fill:'#F97316'},{g:'F',n:95,fill:'#DC2626'}];

interface Props { stats:any; user:UserWithRoles; }
export function AdminDashboardClient({ stats, user }: Props) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language==='ar';
  const name = isRTL?(user.full_name_ar??user.full_name):user.full_name;
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={`مرحباً، ${name} 👋`} description="إليك نظرة عامة على أداء الكلية اليوم"/>
      {stats.pendingRequests>0 && (
        <Link href="/admin/join-requests" className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0"/>
          <p className="text-sm text-amber-800 font-medium">{stats.pendingRequests} طلب انضمام ينتظر مراجعتك</p>
          <span className="ms-auto text-xs text-amber-600 font-semibold">مراجعة ←</span>
        </Link>
      )}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="إجمالي الطلاب" value={stats.totalStudents.toLocaleString('ar-SA')} icon={GraduationCap} description={`${stats.activeStudents} نشط`} iconClass="text-blue-600" trend={{pct:12}} href="/academic/students"/>
        <StatCard title="الكليات النشطة" value={stats.totalFaculties} icon={Building2} iconClass="text-purple-600" href="/admin/structure"/>
        <StatCard title="الشعب المفتوحة" value={stats.openSections} icon={Layers} iconClass="text-green-600" href="/academic/sections"/>
        <StatCard title="فواتير معلقة" value={stats.pendingInvoices} icon={AlertCircle} iconClass="text-red-500" href="/finance"/>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard title="الإيرادات المحصّلة" value={fCurrency(stats.totalRevenue)} icon={DollarSign} iconClass="text-green-600" href="/finance"/>
        <StatCard title="متوسط المعدل" value={stats.avgGpa.toFixed(2)} icon={TrendingUp} iconClass={gpaColor(stats.avgGpa)}/>
        <StatCard title="مقرراتي (LMS)" value="→" icon={BookOpen} iconClass="text-primary-600" href="/lms/my-courses"/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4">تطور أعداد الطلاب</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={enrollmentTrend} margin={{top:0,right:0,left:-20,bottom:0}}>
              <defs><linearGradient id="grad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1E3A5F" stopOpacity={0.15}/><stop offset="95%" stopColor="#1E3A5F" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6"/>
              <XAxis dataKey="m" tick={{fontSize:11,fill:'#9CA3AF'}}/>
              <YAxis tick={{fontSize:11,fill:'#9CA3AF'}}/>
              <Tooltip contentStyle={TT}/>
              <Area type="monotone" dataKey="n" name="الطلاب" stroke="#1E3A5F" fill="url(#grad)" strokeWidth={2} dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4">توزيع الدرجات</h3>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart><Pie data={gradeDist} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="n" paddingAngle={2}>
              {gradeDist.map((e,i)=><Cell key={i} fill={e.fill}/>)}
            </Pie><Tooltip contentStyle={{...TT,fontSize:11}}/></PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1 mt-2">
            {gradeDist.map(g=>(
              <div key={g.g} className="flex items-center gap-1 text-[10px] text-gray-500">
                <span className="w-2 h-2 rounded-full shrink-0" style={{background:g.fill}}/>{g.g}: <strong className="text-gray-700">{g.n}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="card p-5">
        <h3 className="text-sm font-bold text-gray-800 mb-3">روابط سريعة</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[{label:'إدارة الطلاب',href:'/academic/students',icon:Users},{label:'الهيكل الأكاديمي',href:'/admin/structure',icon:Building2},{label:'طلبات الانضمام',href:'/admin/join-requests',icon:UserCheck},{label:'التقارير',href:'/admin/reports',icon:BarChart3}].map(l=>(
            <Link key={l.href} href={l.href} className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-sm text-gray-700 font-medium">
              <l.icon className="w-4 h-4 text-primary-500"/>{l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
