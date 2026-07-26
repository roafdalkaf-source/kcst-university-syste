export type UserRole =
  | 'platform_admin' | 'university_admin' | 'dean' | 'department_head'
  | 'professor' | 'teaching_assistant' | 'registrar' | 'finance_officer' | 'student';

export interface UserWithRoles {
  id:           string;
  email:        string;
  full_name:    string;
  full_name_ar?: string | null;
  avatar_url?:  string | null;
  phone?:       string | null;
  is_active:    boolean;
  roles:        UserRole[];
  branding?:    any;
  created_at:   string;
}

export type LetterGrade = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D+' | 'D' | 'F';

export type StudentStatus = 'active' | 'suspended' | 'graduated' | 'withdrawn' | 'on_leave';
export type InvoiceStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled' | 'waived';

export const ROLE_LABELS: Record<UserRole, { ar: string; en: string }> = {
  platform_admin:    { ar:'مدير المنصة',      en:'Platform Admin' },
  university_admin:  { ar:'مدير الجامعة',     en:'University Admin' },
  dean:              { ar:'عميد',              en:'Dean' },
  department_head:   { ar:'رئيس قسم',         en:'Department Head' },
  professor:         { ar:'أستاذ',             en:'Professor' },
  teaching_assistant:{ ar:'مساعد تدريس',      en:'Teaching Assistant' },
  registrar:         { ar:'مسجّل',            en:'Registrar' },
  finance_officer:   { ar:'موظف مالية',       en:'Finance Officer' },
  student:           { ar:'طالب',              en:'Student' },
};

export const STUDENT_STATUS: Record<StudentStatus, { ar: string; en: string; badge: string }> = {
  active:    { ar:'نشط',      en:'Active',     badge:'badge-green' },
  suspended: { ar:'موقوف',    en:'Suspended',  badge:'badge-red' },
  graduated: { ar:'متخرج',    en:'Graduated',  badge:'badge-blue' },
  withdrawn: { ar:'منسحب',    en:'Withdrawn',  badge:'badge-gray' },
  on_leave:  { ar:'في إجازة', en:'On Leave',   badge:'badge-yellow' },
};

export const INVOICE_STATUS: Record<InvoiceStatus, { ar: string; badge: string }> = {
  pending:   { ar:'معلق',   badge:'badge-yellow' },
  partial:   { ar:'جزئي',   badge:'badge-yellow' },
  paid:      { ar:'مدفوع',  badge:'badge-green' },
  overdue:   { ar:'متأخر',  badge:'badge-red' },
  cancelled: { ar:'ملغي',   badge:'badge-gray' },
  waived:    { ar:'معفو',   badge:'badge-gray' },
};

export const GRADE_SCALE: Array<{ min: number; letter: LetterGrade; points: number }> = [
  { min:95, letter:'A+', points:4.0 },
  { min:90, letter:'A',  points:4.0 },
  { min:85, letter:'B+', points:3.5 },
  { min:80, letter:'B',  points:3.0 },
  { min:75, letter:'C+', points:2.5 },
  { min:70, letter:'C',  points:2.0 },
  { min:65, letter:'D+', points:1.5 },
  { min:60, letter:'D',  points:1.0 },
  { min:0,  letter:'F',  points:0.0 },
];
