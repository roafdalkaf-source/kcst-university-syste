/**
 * Certificate PDF Generator
 * يستخدم HTML → PDF عبر Supabase Edge Function أو API Route
 * 
 * للتشغيل المحلي: يحتاج puppeteer
 * npm install puppeteer
 * 
 * للإنتاج: استخدم Supabase Edge Function أو خدمة مثل html-pdf-node
 */

export interface CertificateData {
  type:          'enrollment' | 'graduation' | 'good_standing' | 'transcript';
  studentName:   string;
  studentNameAr: string;
  studentNumber: string;
  programName:   string;
  programNameAr: string;
  gpa:           number;
  totalCredits:  number;
  serialNumber:  string;
  issuedDate:    string;
  level:         number;
  branding: {
    nameAr:       string;
    nameEn:       string;
    primaryColor: string;
    accentColor:  string;
  };
}

export function generateCertificateHTML(data: CertificateData): string {
  const titles: Record<string, { ar: string; en: string }> = {
    enrollment:    { ar: 'شهادة قيد وانتظام', en: 'Certificate of Enrollment' },
    graduation:    { ar: 'شهادة التخرج',        en: 'Certificate of Graduation' },
    good_standing: { ar: 'شهادة حسن سير وسلوك', en: 'Good Standing Certificate' },
    transcript:    { ar: 'كشف الدرجات',          en: 'Academic Transcript' },
  };

  const title = titles[data.type] ?? titles.enrollment;
  const dateFormatted = new Date(data.issuedDate).toLocaleDateString('ar-SA', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const bodyText: Record<string, string> = {
    enrollment:    `يُشهد بأن الطالب/ة <strong>${data.studentNameAr}</strong> مقيد/ة في برنامج <strong>${data.programNameAr}</strong> وهو/هي منتظم/ة في الدراسة خلال العام الدراسي الحالي.`,
    graduation:    `يُشهد بأن الطالب/ة <strong>${data.studentNameAr}</strong> قد أتم/ت متطلبات برنامج <strong>${data.programNameAr}</strong> بنجاح، وحصل/ت على معدل تراكمي <strong>${data.gpa.toFixed(2)}</strong> من 4.00.`,
    good_standing: `يُشهد بأن الطالب/ة <strong>${data.studentNameAr}</strong> طالب/ة منتظم/ة في الكلية وحسن/ة السير والسلوك، ولا توجد عليه/ها أي موانع أكاديمية أو تأديبية.`,
    transcript:    `فيما يلي كشف بدرجات الطالب/ة <strong>${data.studentNameAr}</strong> حتى تاريخه.`,
  };

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Times New Roman', 'Cairo', serif;
      background: #fff;
      color: #1a1a1a;
      direction: rtl;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 20mm;
      position: relative;
    }
    .border-outer {
      border: 3px solid ${data.branding.primaryColor};
      padding: 8mm;
      min-height: 257mm;
      position: relative;
    }
    .border-inner {
      border: 1px solid ${data.branding.accentColor};
      padding: 12mm;
      min-height: 241mm;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .logo-area {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 8mm;
    }
    .logo-circle {
      width: 60px; height: 60px;
      border-radius: 50%;
      background: ${data.branding.primaryColor};
      display: flex; align-items: center; justify-content: center;
      color: ${data.branding.accentColor};
      font-size: 28px; font-weight: 900;
    }
    .college-name { text-align: center; }
    .college-name-ar { font-size: 18px; font-weight: 700; color: ${data.branding.primaryColor}; }
    .college-name-en { font-size: 12px; color: #666; margin-top: 2px; }
    .divider {
      width: 100%;
      height: 2px;
      background: linear-gradient(to left, transparent, ${data.branding.accentColor}, transparent);
      margin: 6mm 0;
    }
    .cert-title-ar {
      font-size: 28px;
      font-weight: 900;
      color: ${data.branding.primaryColor};
      text-align: center;
      margin: 4mm 0;
    }
    .cert-title-en {
      font-size: 14px;
      color: #666;
      text-align: center;
      margin-bottom: 6mm;
      font-style: italic;
    }
    .bismillah {
      font-size: 20px;
      text-align: center;
      color: ${data.branding.primaryColor};
      margin-bottom: 6mm;
      font-family: 'Traditional Arabic', 'Cairo', serif;
    }
    .intro { font-size: 14px; color: #444; text-align: center; margin-bottom: 4mm; }
    .body-text {
      font-size: 16px;
      line-height: 2;
      text-align: center;
      color: #222;
      max-width: 140mm;
      margin: 0 auto 6mm;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4mm;
      width: 100%;
      margin: 6mm 0;
    }
    .info-item {
      background: #f8f9fc;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 8px 12px;
    }
    .info-label { font-size: 11px; color: #9CA3AF; }
    .info-value { font-size: 14px; font-weight: 700; color: #1a1a1a; margin-top: 2px; }
    .gpa-badge {
      background: ${data.branding.primaryColor};
      color: ${data.branding.accentColor};
      font-size: 22px;
      font-weight: 900;
      padding: 10px 30px;
      border-radius: 30px;
      display: inline-block;
      margin: 6mm 0;
    }
    .signatures {
      display: flex;
      justify-content: space-between;
      width: 100%;
      margin-top: auto;
      padding-top: 8mm;
    }
    .sig-block { text-align: center; }
    .sig-line { width: 45mm; border-bottom: 1px solid #999; margin: 20mm auto 4px; }
    .sig-title { font-size: 12px; color: #444; }
    .serial-footer {
      text-align: center;
      margin-top: 6mm;
      padding-top: 4mm;
      border-top: 1px solid #e5e7eb;
      width: 100%;
    }
    .serial { font-family: monospace; font-size: 11px; color: #9CA3AF; }
    .date  { font-size: 12px; color: #666; margin-top: 2px; }
    .watermark {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%,-50%) rotate(-30deg);
      font-size: 60px;
      font-weight: 900;
      color: rgba(30,58,95,0.04);
      white-space: nowrap;
      pointer-events: none;
      z-index: 0;
    }
  </style>
</head>
<body>
<div class="page">
  <div class="border-outer">
    <div class="watermark">${data.branding.nameAr}</div>
    <div class="border-inner">
      
      <!-- Header -->
      <div class="logo-area">
        <div class="logo-circle">🎓</div>
        <div class="college-name">
          <div class="college-name-ar">${data.branding.nameAr}</div>
          <div class="college-name-en">${data.branding.nameEn}</div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Title -->
      <div class="bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
      <div class="cert-title-ar">${title.ar}</div>
      <div class="cert-title-en">${title.en}</div>

      <div class="divider"></div>

      <!-- Body -->
      <p class="intro">تشهد إدارة ${data.branding.nameAr} بما يلي:</p>
      <p class="body-text">${bodyText[data.type] ?? ''}</p>

      <!-- Student Info Grid -->
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">اسم الطالب (عربي)</div>
          <div class="info-value">${data.studentNameAr}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Student Name (EN)</div>
          <div class="info-value">${data.studentName}</div>
        </div>
        <div class="info-item">
          <div class="info-label">رقم الطالب</div>
          <div class="info-value" style="font-family:monospace">${data.studentNumber}</div>
        </div>
        <div class="info-item">
          <div class="info-label">البرنامج الأكاديمي</div>
          <div class="info-value">${data.programNameAr}</div>
        </div>
        <div class="info-item">
          <div class="info-label">المستوى الحالي</div>
          <div class="info-value">المستوى ${data.level}</div>
        </div>
        <div class="info-item">
          <div class="info-label">الساعات المعتمدة</div>
          <div class="info-value">${data.totalCredits} ساعة</div>
        </div>
      </div>

      ${data.type !== 'enrollment' ? `
      <div style="text-align:center;margin:4mm 0">
        <div style="font-size:13px;color:#6B7280;margin-bottom:4px">المعدل التراكمي</div>
        <div class="gpa-badge">${data.gpa.toFixed(2)} / 4.00</div>
      </div>
      ` : ''}

      <!-- Signatures -->
      <div class="signatures">
        <div class="sig-block">
          <div class="sig-line"></div>
          <div class="sig-title">مدير شؤون الطلاب</div>
        </div>
        <div class="sig-block">
          <div class="sig-line"></div>
          <div class="sig-title">رئيس قسم التسجيل</div>
        </div>
        <div class="sig-block">
          <div class="sig-line"></div>
          <div class="sig-title">مدير الجامعة</div>
        </div>
      </div>

      <!-- Footer -->
      <div class="serial-footer">
        <div class="date">تاريخ الإصدار: ${dateFormatted}</div>
        <div class="serial">الرقم التسلسلي: ${data.serialNumber}</div>
      </div>

    </div>
  </div>
</div>
</body>
</html>`;
}

export function generateSerialNumber(type: string): string {
  const prefix: Record<string, string> = {
    enrollment: 'ENR', graduation: 'GRD', good_standing: 'GS', transcript: 'TRN',
  };
  const p   = prefix[type] ?? 'CERT';
  const yr  = new Date().getFullYear();
  const rnd = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
  return `KCST-${p}-${yr}-${rnd}`;
}
