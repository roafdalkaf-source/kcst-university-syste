/**
 * Email Service — يستخدم Resend API
 * https://resend.com  (مجاناً حتى 3000 بريد/شهر)
 * 
 * للتفعيل: أضف RESEND_API_KEY في .env.local
 * إذا لم تكن لديك مفتاح، الإشعارات تعمل داخل المنصة فقط
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL     = process.env.EMAIL_FROM ?? 'noreply@kcst.edu.sd';
const APP_NAME       = 'كلية كوش للعلوم والتكنولوجيا';
const APP_URL        = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

interface EmailPayload {
  to:       string;
  subject:  string;
  html:     string;
}

async function sendEmail({ to, subject, html }: EmailPayload): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.log(`[Email disabled] To: ${to} | Subject: ${subject}`);
    return false;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: `${APP_NAME} <${FROM_EMAIL}>`, to, subject, html }),
    });
    if (!res.ok) { console.error('[Email] Failed:', await res.text()); return false; }
    return true;
  } catch (err) {
    console.error('[Email] Error:', err);
    return false;
  }
}

// ── Email Templates ──────────────────────────────────────────────────────

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<style>
  body{margin:0;padding:0;background:#F8F9FC;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;direction:rtl;}
  .container{max-width:580px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);}
  .header{background:#1E3A5F;padding:32px 40px;text-align:center;}
  .header h1{color:#C9A84C;margin:0;font-size:22px;font-weight:700;}
  .header p{color:rgba(255,255,255,.6);margin:6px 0 0;font-size:13px;}
  .body{padding:36px 40px;}
  .body p{color:#374151;font-size:15px;line-height:1.8;margin:0 0 16px;}
  .btn{display:inline-block;background:#1E3A5F;color:#fff!important;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:600;margin:16px 0;}
  .footer{background:#F3F4F6;padding:20px 40px;text-align:center;color:#9CA3AF;font-size:12px;}
  .badge{display:inline-block;background:#EEF2FA;color:#1E3A5F;padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;margin:12px 0;}
  .divider{border:0;border-top:1px solid #F3F4F6;margin:24px 0;}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>🎓 كلية كوش للعلوم والتكنولوجيا</h1>
    <p>Kush College for Science and Technology</p>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    <p>هذا البريد أُرسل تلقائياً من منصة KCST. يُرجى عدم الرد عليه.</p>
    <p>© ${new Date().getFullYear()} كلية كوش للعلوم والتكنولوجيا</p>
  </div>
</div>
</body></html>`;
}

// ── Specific email functions ──────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: `مرحباً بك في منصة KCST — ${name}`,
    html: baseTemplate(`
      <p>أهلاً <strong>${name}</strong>،</p>
      <p>مرحباً بك في منصة إدارة كلية كوش للعلوم والتكنولوجيا. تم إنشاء حسابك بنجاح.</p>
      <p>للبدء، قم بتسجيل الدخول إلى المنصة:</p>
      <a href="${APP_URL}/auth/login" class="btn">تسجيل الدخول</a>
      <hr class="divider"/>
      <p style="color:#6B7280;font-size:13px;">إذا لم تقم بإنشاء هذا الحساب، يُرجى تجاهل هذا البريد.</p>
    `),
  });
}

export async function sendJoinRequestApprovedEmail(to: string, name: string, role: string): Promise<boolean> {
  const roleNames: Record<string,string> = {
    student:'طالب', professor:'أستاذ', teaching_assistant:'مساعد تدريس',
    registrar:'مسجّل أكاديمي', finance_officer:'موظف مالية',
    department_head:'رئيس قسم', dean:'عميد كلية',
  };
  return sendEmail({
    to,
    subject: 'تمت الموافقة على طلب انضمامك — KCST',
    html: baseTemplate(`
      <p>أهلاً <strong>${name}</strong>،</p>
      <p>يسعدنا إخبارك بأنه <strong>تمت الموافقة</strong> على طلب انضمامك للمنصة.</p>
      <div class="badge">الدور الممنوح: ${roleNames[role] ?? role}</div>
      <p>يمكنك الآن تسجيل الدخول والوصول إلى جميع ميزات المنصة المتاحة لدورك.</p>
      <a href="${APP_URL}/auth/login" class="btn">تسجيل الدخول الآن</a>
    `),
  });
}

export async function sendJoinRequestRejectedEmail(to: string, name: string, reason?: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: 'بخصوص طلب انضمامك — KCST',
    html: baseTemplate(`
      <p>أهلاً <strong>${name}</strong>،</p>
      <p>نأسف لإخبارك بأنه لم تتم الموافقة على طلب انضمامك في الوقت الحالي.</p>
      ${reason ? `<div class="badge">السبب: ${reason}</div>` : ''}
      <p>إذا كنت تعتقد أن هناك خطأ، يُرجى التواصل مع إدارة الكلية.</p>
      <a href="${APP_URL}/join-request" class="btn">إعادة تقديم الطلب</a>
    `),
  });
}

export async function sendGradePublishedEmail(to: string, name: string, courseName: string, grade: string, gpa: number): Promise<boolean> {
  const gradeColors: Record<string,string> = { 'A+':'#16A34A','A':'#16A34A','B+':'#0284C7','B':'#0284C7','C+':'#D97706','C':'#D97706','D+':'#F97316','D':'#F97316','F':'#DC2626' };
  const color = gradeColors[grade] ?? '#374151';
  return sendEmail({
    to,
    subject: `تم نشر درجات ${courseName} — KCST`,
    html: baseTemplate(`
      <p>أهلاً <strong>${name}</strong>،</p>
      <p>تم نشر درجات مقرر <strong>${courseName}</strong>.</p>
      <div style="text-align:center;padding:24px;background:#F8F9FC;border-radius:12px;margin:20px 0;">
        <div style="font-size:48px;font-weight:900;color:${color}">${grade}</div>
        <div style="font-size:14px;color:#6B7280;margin-top:8px;">المعدل التراكمي الجديد: <strong>${gpa.toFixed(2)}</strong></div>
      </div>
      <a href="${APP_URL}/student/grades" class="btn">عرض سجل الدرجات</a>
    `),
  });
}

export async function sendInvoiceCreatedEmail(to: string, name: string, invoiceNo: string, amount: number, dueDate?: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: `فاتورة جديدة ${invoiceNo} — KCST`,
    html: baseTemplate(`
      <p>أهلاً <strong>${name}</strong>،</p>
      <p>تم إصدار فاتورة جديدة باسمك.</p>
      <div style="background:#F8F9FC;border-radius:12px;padding:20px;margin:20px 0;">
        <p style="margin:4px 0;font-size:13px;color:#6B7280;">رقم الفاتورة</p>
        <p style="margin:4px 0;font-size:16px;font-weight:700;font-family:monospace">${invoiceNo}</p>
        <p style="margin:16px 0 4px;font-size:13px;color:#6B7280;">المبلغ المستحق</p>
        <p style="margin:4px 0;font-size:24px;font-weight:900;color:#DC2626">${amount.toLocaleString('ar-SD')} SDG</p>
        ${dueDate ? `<p style="margin:12px 0 0;font-size:12px;color:#D97706">⏰ تاريخ الاستحقاق: ${dueDate}</p>` : ''}
      </div>
      <a href="${APP_URL}/student/finance" class="btn">عرض الفاتورة</a>
    `),
  });
}

export async function sendLiveSessionReminderEmail(to: string, name: string, sessionTitle: string, scheduledAt: string, meetingUrl?: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: `تذكير: جلسة مباشرة "${sessionTitle}" — KCST`,
    html: baseTemplate(`
      <p>أهلاً <strong>${name}</strong>،</p>
      <p>تذكير بجلستك المباشرة القادمة:</p>
      <div style="background:#EEF2FA;border-right:4px solid #1E3A5F;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="margin:0;font-size:16px;font-weight:700;color:#1E3A5F">${sessionTitle}</p>
        <p style="margin:8px 0 0;font-size:13px;color:#6B7280">🕐 ${scheduledAt}</p>
      </div>
      ${meetingUrl ? `<a href="${meetingUrl}" class="btn">🎥 الانضمام للجلسة</a>` : ''}
      <p style="font-size:13px;color:#6B7280">احرص على الانضمام قبل 5 دقائق من الموعد المحدد.</p>
    `),
  });
}

export async function sendPasswordResetEmail(to: string, name: string, resetLink: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: 'إعادة تعيين كلمة المرور — KCST',
    html: baseTemplate(`
      <p>أهلاً <strong>${name}</strong>،</p>
      <p>تلقينا طلباً لإعادة تعيين كلمة مرور حسابك. انقر على الزر أدناه لإنشاء كلمة مرور جديدة:</p>
      <a href="${resetLink}" class="btn">إعادة تعيين كلمة المرور</a>
      <hr class="divider"/>
      <p style="color:#6B7280;font-size:13px;">⚠️ هذا الرابط صالح لمدة ساعة واحدة فقط.</p>
      <p style="color:#6B7280;font-size:13px;">إذا لم تطلب إعادة التعيين، يُرجى تجاهل هذا البريد.</p>
    `),
  });
}

export async function sendBroadcastEmail(to: string[], subject: string, bodyAr: string): Promise<number> {
  if (!RESEND_API_KEY || to.length === 0) return 0;
  let sent = 0;
  // Send in batches of 50 (Resend free tier limit)
  const BATCH = 50;
  for (let i = 0; i < to.length; i += BATCH) {
    const batch = to.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map(email => sendEmail({ to: email, subject, html: baseTemplate(`<p>${bodyAr}</p>`) }))
    );
    sent += results.filter(r => r.status === 'fulfilled' && r.value).length;
    // Small delay between batches
    if (i + BATCH < to.length) await new Promise(r => setTimeout(r, 200));
  }
  return sent;
}
