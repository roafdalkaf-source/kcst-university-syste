import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import type { UserRole, LetterGrade, StudentStatus, InvoiceStatus } from '@/types';
import { STUDENT_STATUS, INVOICE_STATUS, GRADE_SCALE } from '@/types';

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export function fDate(date: string | Date | null, lang: 'ar'|'en' = 'ar'): string {
  if (!date) return '—';
  try { return format(new Date(date), 'dd/MM/yyyy', { locale: lang === 'ar' ? ar : enUS }); }
  catch { return '—'; }
}
export function fDateTime(date: string | Date | null, lang: 'ar'|'en' = 'ar'): string {
  if (!date) return '—';
  try { return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: lang === 'ar' ? ar : enUS }); }
  catch { return '—'; }
}
export function fRelative(date: string | Date, lang: 'ar'|'en' = 'ar'): string {
  try { return formatDistanceToNow(new Date(date), { addSuffix: true, locale: lang === 'ar' ? ar : enUS }); }
  catch { return '—'; }
}
export function fCurrency(amount: number, currency = 'SDG'): string {
  return `${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })} ${currency}`;
}
export function getInitials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || 'U';
}
export function getDashboardUrl(roles: UserRole[]): string {
  if (roles.some(r => ['platform_admin','university_admin','dean','department_head'].includes(r))) return '/dashboard/admin';
  if (roles.includes('professor') || roles.includes('teaching_assistant')) return '/dashboard/professor';
  if (roles.includes('registrar'))     return '/dashboard/registrar';
  if (roles.includes('finance_officer')) return '/dashboard/finance';
  if (roles.includes('student'))       return '/dashboard/student';
  return '/join-request';
}
export function genStudentNo(year: number, seq: number): string {
  return `KCST-${year}-${String(seq).padStart(4, '0')}`;
}
export function calcGradeTotal(g: { participation:number; assignments:number; midterm:number; final:number }): number {
  return Math.round((g.participation * 0.10 + g.assignments * 0.10 + g.midterm * 0.30 + g.final * 0.50) * 10) / 10;
}
export function getLetterGrade(total: number): { letter: LetterGrade; points: number } {
  const entry = GRADE_SCALE.find(g => total >= g.min) ?? GRADE_SCALE[GRADE_SCALE.length - 1];
  return { letter: entry.letter, points: entry.points };
}
export function gradeColor(letter: string): string {
  const map: Record<string,string> = {
    'A+':'text-emerald-600','A':'text-emerald-500',
    'B+':'text-blue-600',   'B':'text-blue-500',
    'C+':'text-yellow-600', 'C':'text-yellow-500',
    'D+':'text-orange-600', 'D':'text-orange-500',
    'F': 'text-red-600',
  };
  return map[letter] ?? 'text-text-primary';
}
export function gpaColor(gpa: number): string {
  if (gpa >= 3.7) return 'text-emerald-600';
  if (gpa >= 3.0) return 'text-blue-600';
  if (gpa >= 2.0) return 'text-yellow-600';
  return 'text-red-500';
}
export function calcAttendance(records: { status: string }[]) {
  const total    = records.length;
  const attended = records.filter(r => r.status === 'present').length;
  const absent   = records.filter(r => r.status === 'absent').length;
  const late     = records.filter(r => r.status === 'late').length;
  const excused  = records.filter(r => r.status === 'excused').length;
  const effective = attended + late * 0.5;
  const rate      = total > 0 ? Math.round((effective / total) * 100) : 100;
  return {
    total, attended, absent, late, excused, rate,
    isAtRisk:   rate < 75 && rate >= 60,
    isDebarred: rate < 60,
  };
}
export { STUDENT_STATUS, INVOICE_STATUS, GRADE_SCALE };
