'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, CheckCircle2, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { StatCard, PageHeader } from '@/components/shared';
import { fCurrency, fDate, cn } from '@/lib/utils';

const STATUS_BADGE: Record<string,string> = {
  pending:'badge-yellow', partial:'badge-yellow', paid:'badge-green',
  overdue:'badge-red', cancelled:'badge-gray', waived:'badge-gray',
};
const STATUS_AR: Record<string,string> = {
  pending:'معلق', partial:'جزئي', paid:'مدفوع', overdue:'متأخر', cancelled:'ملغي', waived:'معفو',
};
const METHOD_AR: Record<string,string> = {
  cash:'نقداً', bank_transfer:'تحويل بنكي', card:'بطاقة ائتمان', mobile_money:'محفظة', waiver:'إعفاء',
};

export function StudentFinanceClient({ invoices, totalBalance, totalPaid }: { invoices: any[]; totalBalance: number; totalPaid: number; }) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <PageHeader title="حسابي المالي" description="فواتيرك ومدفوعاتك" />

      <div className="grid grid-cols-2 gap-4">
        <StatCard title="الرصيد المستحق" value={fCurrency(totalBalance)} icon={Clock}
          iconClass={totalBalance > 0 ? 'text-red-500' : 'text-green-600'} />
        <StatCard title="إجمالي المدفوع" value={fCurrency(totalPaid)} icon={CheckCircle2}
          iconClass="text-green-600" />
      </div>

      {totalBalance === 0 && (
        <div className="card p-5 flex items-center gap-3 border-green-200 bg-green-50">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <p className="text-sm font-medium text-green-700">حسابك خالٍ من الديون 🎉</p>
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="card p-10 text-center">
          <DollarSign className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">لا توجد فواتير</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map(inv => (
            <div key={inv.id} className={cn('card overflow-hidden', inv.status === 'overdue' && 'border-red-200')}>
              {/* Header */}
              <button
                onClick={() => setExpanded(expanded === inv.id ? null : inv.id)}
                className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-start"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-gray-500">{inv.invoice_no}</span>
                    <span className={cn('badge text-[10px]', STATUS_BADGE[inv.status])}>{STATUS_AR[inv.status]}</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {isRTL ? inv.semester?.name_ar ?? '—' : inv.semester?.name_en ?? '—'}
                    {inv.due_date && ` • استحقاق: ${fDate(inv.due_date, isRTL ? 'ar' : 'en')}`}
                  </p>
                </div>
                <div className="text-end shrink-0">
                  <p className="text-sm font-bold text-gray-800">{fCurrency(inv.total_amount)}</p>
                  {inv.balance > 0 && (
                    <p className="text-xs text-red-500 font-medium">متبقي: {fCurrency(inv.balance)}</p>
                  )}
                </div>
                {expanded === inv.id
                  ? <ChevronDown className="w-4 h-4 text-gray-300 shrink-0" />
                  : <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                }
              </button>

              {/* Expanded: payment details */}
              {expanded === inv.id && (
                <div className="border-t border-gray-100 p-4 bg-gray-50/50 animate-fade-in">
                  {/* Amount breakdown */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { l:'الإجمالي', v:inv.total_amount, c:'text-gray-700' },
                      { l:'المدفوع',  v:inv.paid_amount,  c:'text-green-600' },
                      { l:'الرصيد',   v:inv.balance,      c:inv.balance > 0 ? 'text-red-500' : 'text-green-600' },
                    ].map(item => (
                      <div key={item.l} className="text-center p-2.5 rounded-xl bg-white border border-gray-100">
                        <p className={cn('text-sm font-bold', item.c)}>{fCurrency(item.v)}</p>
                        <p className="text-[10px] text-gray-400">{item.l}</p>
                      </div>
                    ))}
                  </div>

                  {/* Payment history */}
                  <p className="text-xs font-semibold text-gray-500 mb-2">سجل الدفعات</p>
                  {(inv.payments ?? []).length === 0 ? (
                    <p className="text-xs text-gray-400 py-2 text-center">لا توجد دفعات مسجلة</p>
                  ) : (
                    <div className="space-y-1.5">
                      {inv.payments.map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-gray-100 text-xs">
                          <div>
                            <span className="font-medium text-gray-700">{METHOD_AR[p.method]}</span>
                            {p.reference_no && (
                              <span className="text-gray-400 ms-2 font-mono">{p.reference_no}</span>
                            )}
                          </div>
                          <div className="text-end">
                            <span className="font-bold text-green-600">{fCurrency(p.amount)}</span>
                            <p className="text-[10px] text-gray-400">{fDate(p.paid_at, isRTL ? 'ar' : 'en')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
