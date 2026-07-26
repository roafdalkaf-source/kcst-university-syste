'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { DollarSign, AlertCircle, Clock, CreditCard, TrendingUp, ArrowRight } from 'lucide-react';
import { StatCard, PageHeader } from '@/components/shared';
import { fCurrency, fDateTime, cn } from '@/lib/utils';

const STATUS_BADGE: Record<string,string> = {
  pending:'badge-yellow', partial:'badge-yellow', paid:'badge-green',
  overdue:'badge-red', cancelled:'badge-gray', waived:'badge-gray',
};
const STATUS_AR: Record<string,string> = {
  pending:'معلق', partial:'جزئي', paid:'مدفوع', overdue:'متأخر', cancelled:'ملغي', waived:'معفو',
};
const METHOD_AR: Record<string,string> = {
  cash:'نقداً', bank_transfer:'تحويل', card:'بطاقة', mobile_money:'محفظة', waiver:'إعفاء',
};

interface Props {
  recentInvoices: any[];
  recentPayments: any[];
  pendingCount:   number;
  overdueCount:   number;
  todayRevenue:   number;
}

export function FinanceDashboardClient({ recentInvoices, recentPayments, pendingCount, overdueCount, todayRevenue }: Props) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="لوحة المالية" description="نظرة عامة على الحالة المالية" />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="إيرادات اليوم"   value={fCurrency(todayRevenue)} icon={TrendingUp}  iconClass="text-green-600" />
        <StatCard title="فواتير معلقة"    value={pendingCount}             icon={Clock}       iconClass="text-amber-500" href="/finance" />
        <StatCard title="فواتير متأخرة"   value={overdueCount}             icon={AlertCircle} iconClass="text-red-500"   href="/finance" />
        <StatCard title="إدارة الفواتير"  value="←"                        icon={CreditCard}  iconClass="text-blue-600" href="/finance" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent invoices */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-800">آخر الفواتير</h3>
            <Link href="/finance" className="text-xs text-primary-500 hover:underline flex items-center gap-1">
              عرض الكل <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {recentInvoices.length === 0 && <p className="text-sm text-gray-400 text-center py-4">لا توجد فواتير</p>}
            {recentInvoices.map(inv => (
              <div key={inv.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="min-w-0">
                  <p className="text-xs font-mono font-medium text-gray-700 truncate">{inv.invoice_no}</p>
                  <p className="text-[10px] text-gray-400 truncate">
                    {isRTL ? inv.student?.profile?.full_name_ar ?? inv.student?.profile?.full_name : inv.student?.profile?.full_name}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn('badge text-[10px]', STATUS_BADGE[inv.status])}>{STATUS_AR[inv.status]}</span>
                  <span className="text-sm font-bold text-gray-700">{fCurrency(inv.total_amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent payments */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-800">آخر المدفوعات</h3>
          </div>
          <div className="space-y-2">
            {recentPayments.length === 0 && <p className="text-sm text-gray-400 text-center py-4">لا توجد مدفوعات</p>}
            {recentPayments.map(pay => (
              <div key={pay.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50">
                <div className="min-w-0">
                  <p className="text-xs font-mono text-gray-600 truncate">{pay.invoice?.invoice_no}</p>
                  <p className="text-[10px] text-gray-400">
                    {METHOD_AR[pay.method]} • {fDateTime(pay.paid_at, isRTL ? 'ar' : 'en')}
                  </p>
                </div>
                <span className="text-sm font-bold text-green-600 shrink-0">{fCurrency(pay.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick action */}
      <Link href="/finance" className="card p-5 flex items-center gap-4 hover:shadow-elevated transition-shadow">
        <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
          <DollarSign className="w-6 h-6 text-primary-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">إدارة الفواتير والمدفوعات</p>
          <p className="text-xs text-gray-500">عرض جميع الفواتير وتسجيل الدفعات</p>
        </div>
        <ArrowRight className={cn('w-5 h-5 text-gray-300 ms-auto', isRTL && 'rotate-180')} />
      </Link>
    </div>
  );
}
