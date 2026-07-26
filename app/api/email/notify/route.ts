import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRateLimit } from '@/lib/rate-limit/middleware';
import {
  sendGradePublishedEmail, sendJoinRequestApprovedEmail,
  sendJoinRequestRejectedEmail, sendInvoiceCreatedEmail,
  sendLiveSessionReminderEmail, sendWelcomeEmail,
} from '@/lib/email';

export async function POST(req: NextRequest) {
  const limited = withRateLimit(req, { max: 50, windowMs: 60_000 });
  if (limited) return limited;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { type, payload } = await req.json();
  let success = false;

  switch (type) {
    case 'welcome':
      success = await sendWelcomeEmail(payload.email, payload.name); break;
    case 'grade_published':
      success = await sendGradePublishedEmail(payload.email, payload.name, payload.courseName, payload.grade, payload.gpa); break;
    case 'join_approved':
      success = await sendJoinRequestApprovedEmail(payload.email, payload.name, payload.role); break;
    case 'join_rejected':
      success = await sendJoinRequestRejectedEmail(payload.email, payload.name, payload.reason); break;
    case 'invoice_created':
      success = await sendInvoiceCreatedEmail(payload.email, payload.name, payload.invoiceNo, payload.amount, payload.dueDate); break;
    case 'live_reminder':
      success = await sendLiveSessionReminderEmail(payload.email, payload.name, payload.sessionTitle, payload.scheduledAt, payload.meetingUrl); break;
    default:
      return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
  }
  return NextResponse.json({ success });
}
