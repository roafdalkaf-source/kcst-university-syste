'use client';
import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

if (!i18n.isInitialized) {
  const ar = { nav:{dashboard:'الرئيسية',students:'الطلاب',sections:'الشعب',calendar:'التقويم',grades:'الدرجات',attendance:'الحضور',finance:'المالية',behavior:'السلوك',certificates:'الشهادات',notifications:'الإشعارات',admin:'الإدارة',structure:'الهيكل الأكاديمي',users:'المستخدمون',joinRequests:'طلبات الانضمام',reports:'التقارير',audit:'سجل التدقيق',branding:'الهوية البصرية',myGrades:'درجاتي',mySchedule:'جدولي',myFinance:'حسابي',myCertificates:'شهاداتي',myAttendance:'حضوري',logout:'تسجيل الخروج'},
    auth:{welcomeBack:'مرحباً بعودتك',loginSubtitle:'ادخل بياناتك للوصول للمنصة',email:'البريد الإلكتروني',password:'كلمة المرور',login:'تسجيل الدخول',loginGoogle:'الدخول بـ Google',forgotPassword:'نسيت كلمة المرور؟',noAccount:'ليس لديك حساب؟',createAccount:'إنشاء حساب',fullName:'الاسم الكامل',confirmPassword:'تأكيد كلمة المرور',signup:'إنشاء الحساب',haveAccount:'لديك حساب بالفعل؟',signInInstead:'تسجيل الدخول',invalidCredentials:'بريد أو كلمة مرور خاطئة',checkEmail:'تحقق من بريدك'},
    common:{save:'حفظ',cancel:'إلغاء',delete:'حذف',edit:'تعديل',add:'إضافة',search:'بحث',loading:'جاري التحميل...',noData:'لا توجد بيانات',actions:'الإجراءات',status:'الحالة',date:'التاريخ',name:'الاسم',yes:'نعم',no:'لا',confirm:'تأكيد',back:'رجوع',all:'الكل',export:'تصدير',import:'استيراد',view:'عرض',close:'إغلاق',submit:'إرسال',required:'هذا الحقل مطلوب',optional:'اختياري',page:'صفحة',of:'من',rows:'صفوف',appName:'كلية كوش للعلوم والتكنولوجيا'},
    academic:{faculty:'الكلية',faculties:'الكليات',department:'القسم',departments:'الأقسام',program:'البرنامج',programs:'البرامج',course:'المقرر',courses:'المقررات',semester:'الفصل',semesters:'الفصول',section:'الشعبة',sections:'الشعب',student:'الطالب',students:'الطلاب',credits:'الساعات',level:'المستوى',gpa:'المعدل التراكمي',diploma:'دبلوم',bachelor:'بكالوريوس',master:'ماجستير',phd:'دكتوراه',studentNumber:'رقم الطالب',active:'نشط',suspended:'موقوف',graduated:'متخرج',withdrawn:'منسحب',on_leave:'في إجازة'},
    finance:{invoice:'الفاتورة',invoices:'الفواتير',payment:'الدفعة',payments:'المدفوعات',amount:'المبلغ',balance:'الرصيد',paid:'مدفوع',pending:'معلق',partial:'جزئي',overdue:'متأخر',cancelled:'ملغي',waived:'معفو',cash:'نقداً',bank_transfer:'تحويل',card:'بطاقة',mobile_money:'محفظة',waiver:'إعفاء',totalRevenue:'إجمالي الإيرادات',pendingAmount:'المبالغ المعلقة',dueDate:'تاريخ الاستحقاق'},
    errors:{notFound:'الصفحة غير موجودة',forbidden:'غير مصرح بالوصول',serverError:'خطأ في الخادم',network:'خطأ في الاتصال',deleteConfirm:'هل تريد الحذف؟ لا يمكن التراجع.'} };
  const en: typeof ar = { nav:{dashboard:'Dashboard',students:'Students',sections:'Sections',calendar:'Calendar',grades:'Grades',attendance:'Attendance',finance:'Finance',behavior:'Behavior',certificates:'Certificates',notifications:'Notifications',admin:'Administration',structure:'Academic Structure',users:'Users',joinRequests:'Join Requests',reports:'Reports',audit:'Audit Log',branding:'Branding',myGrades:'My Grades',mySchedule:'My Schedule',myFinance:'My Finance',myCertificates:'My Certificates',myAttendance:'My Attendance',logout:'Sign Out'},
    auth:{welcomeBack:'Welcome back',loginSubtitle:'Sign in to access the portal',email:'Email address',password:'Password',login:'Sign In',loginGoogle:'Continue with Google',forgotPassword:'Forgot password?',noAccount:"Don't have an account?",createAccount:'Create account',fullName:'Full name',confirmPassword:'Confirm password',signup:'Create Account',haveAccount:'Already have an account?',signInInstead:'Sign in',invalidCredentials:'Invalid email or password',checkEmail:'Check your email'},
    common:{save:'Save',cancel:'Cancel',delete:'Delete',edit:'Edit',add:'Add',search:'Search',loading:'Loading...',noData:'No data found',actions:'Actions',status:'Status',date:'Date',name:'Name',yes:'Yes',no:'No',confirm:'Confirm',back:'Back',all:'All',export:'Export',import:'Import',view:'View',close:'Close',submit:'Submit',required:'This field is required',optional:'Optional',page:'Page',of:'of',rows:'rows',appName:'Kush College for Science and Technology'},
    academic:{faculty:'Faculty',faculties:'Faculties',department:'Department',departments:'Departments',program:'Program',programs:'Programs',course:'Course',courses:'Courses',semester:'Semester',semesters:'Semesters',section:'Section',sections:'Sections',student:'Student',students:'Students',credits:'Credits',level:'Level',gpa:'GPA',diploma:'Diploma',bachelor:'Bachelor',master:'Master',phd:'PhD',studentNumber:'Student Number',active:'Active',suspended:'Suspended',graduated:'Graduated',withdrawn:'Withdrawn',on_leave:'On Leave'},
    finance:{invoice:'Invoice',invoices:'Invoices',payment:'Payment',payments:'Payments',amount:'Amount',balance:'Balance',paid:'Paid',pending:'Pending',partial:'Partial',overdue:'Overdue',cancelled:'Cancelled',waived:'Waived',cash:'Cash',bank_transfer:'Bank Transfer',card:'Card',mobile_money:'Mobile Money',waiver:'Waiver',totalRevenue:'Total Revenue',pendingAmount:'Pending Amount',dueDate:'Due Date'},
    errors:{notFound:'Page not found',forbidden:'Access denied',serverError:'Server error',network:'Network error',deleteConfirm:'Are you sure? This cannot be undone.'} };
  i18n.use(LanguageDetector).use(initReactI18next).init({
    resources: { ar: { translation: ar }, en: { translation: en } },
    fallbackLng:'ar', supportedLngs:['ar','en'],
    detection: { order:['localStorage','navigator'], caches:['localStorage'], lookupLocalStorage:'kcst-lang' },
    interpolation: { escapeValue: false },
  });
}

const qc = new QueryClient({ defaultOptions: { queries: { staleTime:60_000*2, retry:1, refetchOnWindowFocus:false } } });

export function Providers({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const lang = localStorage.getItem('kcst-lang') ?? 'ar';
    document.documentElement.lang = lang;
    document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr';
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang).then(() => setReady(true));
    } else { setReady(true); }
  }, []);
  if (!ready) return null;
  return (
    <QueryClientProvider client={qc}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </QueryClientProvider>
  );
}
