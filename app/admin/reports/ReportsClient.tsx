'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { PageHeader, StatCard } from '@/components/shared';
import { fCurrency } from '@/lib/utils';
import { Users, TrendingUp, DollarSign, UserCheck } from 'lucide-react';
const TT={background:'#fff',border:'1px solid #E5E7EB',borderRadius:10,fontSize:12};
const GRADE_COLORS:Record<string,string>={'A+':'#16A34A','A':'#22C55E','B+':'#0284C7','B':'#38BDF8','C+':'#D97706','C':'#FBBF24','D+':'#F97316','D':'#FB923C','F':'#DC2626'};
interface Props { students:any[];gradeDist:{grade:string;count:number}[];gpaBuckets:{range:string;count:number}[];byLevel:{level:string;count:number}[];finance:{totalRevenue:number;totalPending:number};attendanceRate:number; }
export function ReportsClient({ students, gradeDist, gpaBuckets, byLevel, finance, attendanceRate }: Props) {
  const activeStudents=students.filter(s=>s.status==='active').length;
  const avgGpa=students.length?(students.reduce((s,st)=>s+(st.gpa??0),0)/students.length).toFixed(2):'0.00';
  const statusData=[{name:'نشط',value:students.filter(s=>s.status==='active').length,fill:'#16A34A'},{name:'موقوف',value:students.filter(s=>s.status==='suspended').length,fill:'#DC2626'},{name:'متخرج',value:students.filter(s=>s.status==='graduated').length,fill:'#0284C7'},{name:'منسحب',value:students.filter(s=>s.status==='withdrawn').length,fill:'#94A3B8'}].filter(d=>d.value>0);
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="التقارير والإحصائيات" breadcrumbs={[{label:'الإدارة'},{label:'التقارير'}]}/>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="إجمالي الطلاب" value={students.length} icon={Users} iconClass="text-blue-600"/>
        <StatCard title="متوسط المعدل" value={avgGpa} icon={TrendingUp} iconClass="text-green-600"/>
        <StatCard title="الإيرادات المحصّلة" value={fCurrency(finance.totalRevenue)} icon={DollarSign} iconClass="text-emerald-600"/>
        <StatCard title="نسبة الحضور" value={`${attendanceRate}%`} icon={UserCheck} iconClass={attendanceRate>=75?'text-green-600':'text-amber-500'}/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4">توزيع التقديرات</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={gradeDist} margin={{top:0,right:0,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6"/>
              <XAxis dataKey="grade" tick={{fontSize:11,fill:'#9CA3AF'}}/>
              <YAxis tick={{fontSize:11,fill:'#9CA3AF'}}/>
              <Tooltip contentStyle={TT}/>
              <Bar dataKey="count" radius={[4,4,0,0]}>{gradeDist.map((e,i)=><Cell key={i} fill={GRADE_COLORS[e.grade]??'#94A3B8'}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4">حالة الطلاب</h3>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart><Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={2}>{statusData.map((e,i)=><Cell key={i} fill={e.fill}/>)}</Pie><Tooltip contentStyle={{...TT,fontSize:11}}/></PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">{statusData.map(d=>(
            <div key={d.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{background:d.fill}}/><span className="text-gray-500">{d.name}</span></div>
              <span className="font-semibold text-gray-700">{d.value}</span>
            </div>
          ))}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4">الطلاب حسب المستوى</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byLevel} layout="vertical" margin={{top:0,right:0,left:10,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false}/>
              <XAxis type="number" tick={{fontSize:11,fill:'#9CA3AF'}}/>
              <YAxis type="category" dataKey="level" width={30} tick={{fontSize:11,fill:'#9CA3AF'}}/>
              <Tooltip contentStyle={TT}/>
              <Bar dataKey="count" fill="#1E3A5F" radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4">توزيع المعدل التراكمي</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={gpaBuckets} margin={{top:0,right:0,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6"/>
              <XAxis dataKey="range" tick={{fontSize:10,fill:'#9CA3AF'}}/>
              <YAxis tick={{fontSize:11,fill:'#9CA3AF'}}/>
              <Tooltip contentStyle={TT}/>
              <Bar dataKey="count" fill="#C9A84C" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card p-5">
        <h3 className="text-sm font-bold text-gray-800 mb-4">الملخص المالي</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-green-50 border border-green-200"><p className="text-2xl font-bold text-green-600">{fCurrency(finance.totalRevenue)}</p><p className="text-xs text-gray-500 mt-1">إجمالي الإيرادات المحصّلة</p></div>
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200"><p className="text-2xl font-bold text-amber-600">{fCurrency(finance.totalPending)}</p><p className="text-xs text-gray-500 mt-1">إجمالي الرصيد المعلق</p></div>
        </div>
      </div>
    </div>
  );
}
