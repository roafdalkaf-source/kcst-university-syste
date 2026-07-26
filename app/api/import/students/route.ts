import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { withRateLimit } from '@/lib/rate-limit/middleware';
import { genStudentNo } from '@/lib/utils';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const limited = withRateLimit(req, { max: 3, windowMs: 60_000 });
  if (limited) return limited;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
  const canImport = (roles ?? []).map((r: any) => r.role)
    .some((r: any) => ['platform_admin','university_admin','registrar'].includes(r));
  if (!canImport) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { rows, programId, admissionDate } = await req.json();
  if (!rows?.length || !programId) {
    return NextResponse.json({ error: 'rows and programId required' }, { status: 400 });
  }

  const admin = createAdminClient();
  const results = { success: 0, failed: 0, errors: [] as string[] };

  const { count: existingCount } = await admin.from('students')
    .select('*', { count: 'exact', head: true });
  let seq  = (existingCount ?? 0) + 1;
  const yr = new Date().getFullYear();

  for (const row of rows) {
    try {
      const email      = row.email?.trim().toLowerCase();
      const fullName   = row.full_name?.trim();
      const fullNameAr = row.full_name_ar?.trim() || null;
      const phone      = row.phone?.trim() || null;
      const natId      = row.national_id?.trim() || null;

      if (!email || !fullName) {
        results.failed++;
        results.errors.push(`صف بدون بريد أو اسم: ${JSON.stringify(row)}`);
        continue;
      }

      const { data: existing } = await admin.from('profiles').select('id').eq('email', email).single();
      let profileId: string;

      if (existing) {
        profileId = existing.id;
      } else {
        const tempPass = `KCST@${Math.random().toString(36).slice(2, 10)}`;
        const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
          email, password: tempPass, email_confirm: true,
          user_metadata: { full_name: fullName },
        });
        if (authErr || !authUser.user) throw new Error(authErr?.message ?? 'Auth creation failed');
        profileId = authUser.user.id;
        await admin.from('profiles').update({ full_name_ar: fullNameAr, phone, national_id: natId })
          .eq('id', profileId);
      }

      const { data: existingStud } = await admin.from('students').select('id').eq('profile_id', profileId).single();
      if (existingStud) {
        results.failed++;
        results.errors.push(`الطالب موجود: ${email}`);
        continue;
      }

      const studentNo = row.student_number?.trim() || genStudentNo(yr, seq);
      await admin.from('students').insert({
        profile_id:     profileId,
        program_id:     programId,
        student_number: studentNo,
        admission_date: admissionDate || new Date().toISOString().split('T')[0],
        admission_type: row.admission_type || 'regular',
        current_level:  parseInt(row.level) || 1,
        status:         'active',
      });
      await admin.from('user_roles')
        .insert({ user_id: profileId, role: 'student', granted_by: user.id })
        .then(() => {}).catch(() => {});

      seq++;
      results.success++;
    } catch (err: any) {
      results.failed++;
      results.errors.push(err.message);
    }
  }

  return NextResponse.json({
    message: `تم استيراد ${results.success} طالب. فشل ${results.failed}.`,
    ...results,
  });
}
