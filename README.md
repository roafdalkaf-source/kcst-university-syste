# KCST UMS+LMS — كلية كوش للعلوم والتكنولوجيا

نظام إدارة جامعي + تعليم إلكتروني متكامل

## المكدس
- **Next.js 14** (App Router)
- **Supabase** (PostgreSQL + Auth + Storage + Realtime)
- **Tailwind CSS v3** + Cairo Display font
- **TypeScript strict**

## التشغيل السريع

```bash
# 1. تثبيت الحزم
npm install

# 2. إعداد البيئة
cp .env.example .env.local
# عدّل .env.local بمفاتيح Supabase

# 3. شغّل Migrations في Supabase SQL Editor
# supabase/migrations/001_initial_schema.sql
# supabase/migrations/002_lms_schema.sql
# supabase/migrations/003_audit_behavior.sql

# 4. تشغيل محلي
npm run dev

# 5. اختبار البناء
npm run build
```

## إنشاء أول مدير
```sql
INSERT INTO user_roles (user_id, role)
SELECT id, 'platform_admin'
FROM profiles WHERE email = 'your@email.com';
```

## الصفحات الرئيسية
- `/auth/login` — تسجيل الدخول
- `/dashboard/admin` — لوحة المدير
- `/dashboard/student` — لوحة الطالب
- `/lms/my-courses` — المقررات
- `/admin/structure` — الهيكل الأكاديمي

## الأدوار (9 أدوار)
`platform_admin` | `university_admin` | `dean` | `department_head`
`professor` | `teaching_assistant` | `registrar` | `finance_officer` | `student`
