import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateCertificateHTML, generateSerialNumber, type CertificateData } from '@/lib/pdf/certificates';
import { withRateLimit } from '@/lib/rate-limit/middleware';
import { getBranding } from '@/lib/auth';

export async function POST(req: NextRequest) {
  // Rate limit
  const limited = withRateLimit(req, { max: 10, windowMs: 60_000 });
  if (limited) return limited;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check role
  const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
  const userRoles = (roles ?? []).map(r => r.role);
  const canIssue = userRoles.some(r => ['platform_admin','university_admin','registrar'].includes(r));
  if (!canIssue) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { studentId, type } = await req.json();
  if (!studentId || !type) return NextResponse.json({ error: 'studentId and type required' }, { status: 400 });

  // Fetch student data
  const { data: student } = await supabase
    .from('students')
    .select('*,profile:profiles(*),program:programs(name_ar,name_en)')
    .eq('id', studentId)
    .single();

  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

  const branding = await getBranding();
  const serial   = generateSerialNumber(type);

  const certData: CertificateData = {
    type,
    studentName:   student.profile.full_name,
    studentNameAr: student.profile.full_name_ar ?? student.profile.full_name,
    studentNumber: student.student_number,
    programName:   student.program.name_en,
    programNameAr: student.program.name_ar,
    gpa:           student.gpa,
    totalCredits:  student.total_credits,
    serialNumber:  serial,
    issuedDate:    new Date().toISOString(),
    level:         student.current_level,
    branding: {
      nameAr:       branding.name_ar,
      nameEn:       branding.name_en,
      primaryColor: branding.primary_color,
      accentColor:  branding.accent_color,
    },
  };

  const html = generateCertificateHTML(certData);

  // Try Puppeteer if available (server-side)
  let pdfBuffer: Buffer | null = null;
  try {
    const puppeteer = await import('puppeteer');
    const browser   = await puppeteer.default.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
    const page      = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.emulateMediaType('print');
    pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top:'0',right:'0',bottom:'0',left:'0' } }) as Buffer;
    await browser.close();
  } catch {
    // Puppeteer not available — return HTML for client-side print
  }

  if (pdfBuffer) {
    // Save to storage
    const admin    = createAdminClient();
    const filename = `${serial}.pdf`;
    const { data: stored } = await admin.storage.from('certificates')
      .upload(`${studentId}/${filename}`, pdfBuffer, { contentType: 'application/pdf', upsert: true });

    const { data: { publicUrl } } = admin.storage.from('certificates')
      .getPublicUrl(`${studentId}/${filename}`);

    // Save to DB
    await admin.from('certificates').insert({
      student_id:    studentId,
      type,
      serial_number: serial,
      issued_date:   new Date().toISOString().split('T')[0],
      status:        'active',
      file_url:      publicUrl,
      issued_by:     user.id,
    });

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });
  }

  // Fallback: return HTML for browser print
  return NextResponse.json({ html, serial, type: 'html' });
}
