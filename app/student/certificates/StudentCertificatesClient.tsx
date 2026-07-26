'use client';

import { useTranslation } from 'react-i18next';
import { Award, Download, QrCode, AlertCircle } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/shared';
import { fDate, cn } from '@/lib/utils';

const TYPE_AR: Record<string, string> = {
  enrollment:    'شهادة تسجيل',
  transcript:    'كشف الدرجات',
  graduation:    'شهادة تخرج',
  good_standing: 'شهادة حسن سير',
  conduct:       'شهادة سلوك',
  completion:    'شهادة إتمام',
};

const STATUS_CONFIG = {
  active:  { label: 'سارية',   badge: 'badge-green' },
  revoked: { label: 'ملغية',   badge: 'badge-red' },
  expired: { label: 'منتهية',  badge: 'badge-gray' },
};

interface Props {
  student:      any;
  certificates: any[];
  userName:     string;
}

export function StudentCertificatesClient({ student, certificates, userName }: Props) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const active = certificates.filter(c => c.status === 'active').length;

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <PageHeader
        title="شهاداتي"
        description={`${userName} • ${student?.student_number}`}
      />

      <div className="grid grid-cols-3 gap-3">
        <StatCard title="إجمالي الشهادات" value={certificates.length} icon={Award}      iconClass="text-accent-500" />
        <StatCard title="سارية"            value={active}             icon={Award}      iconClass="text-green-600" />
        <StatCard title="المعدل"           value={student?.gpa?.toFixed(2) ?? '—'}
          icon={Award} iconClass="text-blue-600" />
      </div>

      {/* Request info */}
      <div className="card p-4 flex items-start gap-3 bg-blue-50 border-blue-200">
        <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800">طلب شهادة جديدة</p>
          <p className="text-xs text-blue-600 mt-0.5">
            لطلب شهادة تسجيل أو كشف درجات أو شهادة تخرج، تواصل مع مكتب التسجيل.
          </p>
        </div>
      </div>

      {/* Certificates list */}
      {certificates.length === 0 ? (
        <div className="card p-12 text-center">
          <Award className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-600">لا توجد شهادات مُصدَرة بعد</p>
          <p className="text-xs text-gray-400 mt-1">تواصل مع مكتب التسجيل لإصدار شهادة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {certificates.map(cert => {
            const statusCfg = STATUS_CONFIG[cert.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.active;
            return (
              <div key={cert.id} className={cn(
                'card p-5',
                cert.status === 'revoked' && 'opacity-60'
              )}>
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                    cert.status === 'active' ? 'bg-accent/15' : 'bg-gray-100'
                  )}>
                    <Award className={cn('w-6 h-6', cert.status === 'active' ? 'text-accent-600' : 'text-gray-400')} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-gray-800">
                          {TYPE_AR[cert.type] ?? cert.type}
                        </p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{cert.serial_number}</p>
                      </div>
                      <span className={cn('badge text-xs shrink-0', statusCfg.badge)}>
                        {statusCfg.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>تاريخ الإصدار: {fDate(cert.issued_date, isRTL ? 'ar' : 'en')}</span>
                      {cert.expiry_date && (
                        <span>تنتهي: {fDate(cert.expiry_date, isRTL ? 'ar' : 'en')}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {cert.status === 'active' && (
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                    {cert.file_url && (
                      <a href={cert.file_url} target="_blank" rel="noopener noreferrer"
                        download className="btn-primary text-sm py-1.5 flex-1 justify-center">
                        <Download className="w-4 h-4" />
                        تحميل الشهادة (PDF)
                      </a>
                    )}
                    {cert.qr_code_url && (
                      <a href={cert.qr_code_url} target="_blank" rel="noopener noreferrer"
                        className="btn-secondary text-sm py-1.5">
                        <QrCode className="w-4 h-4" />
                        رمز QR
                      </a>
                    )}
                    {!cert.file_url && (
                      <p className="text-xs text-gray-400 flex-1 text-center py-1.5">
                        ملف الشهادة غير متوفر — تواصل مع مكتب التسجيل
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
