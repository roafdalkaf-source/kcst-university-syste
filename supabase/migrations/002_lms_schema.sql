-- ════════════════════════════════════════════════════════════════════════════
-- KCST LMS — Migration 002: Learning Management System
-- Run AFTER 001_initial_schema.sql
-- ════════════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════════════════
-- 1. LESSONS
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE public.lms_lessons (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id          UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  title_ar            TEXT,
  description         TEXT,
  order_index         INTEGER NOT NULL DEFAULT 0,
  type                TEXT NOT NULL CHECK (type IN ('video','document','text','scorm','youtube')),
  video_url           TEXT,
  video_duration_sec  INTEGER NOT NULL DEFAULT 0,
  youtube_id          TEXT,
  file_url            TEXT,
  file_name           TEXT,
  content             TEXT,
  is_preview          BOOLEAN NOT NULL DEFAULT FALSE,
  is_published        BOOLEAN NOT NULL DEFAULT FALSE,
  published_at        TIMESTAMPTZ,
  created_by          UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER tg_lms_lessons_upd BEFORE UPDATE ON lms_lessons
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX idx_lessons_section ON lms_lessons(section_id, order_index);
ALTER TABLE lms_lessons ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON lms_lessons TO authenticated;
CREATE POLICY "enrolled_read_lessons" ON lms_lessons FOR SELECT
  USING (
    is_published = TRUE AND (
      section_id IN (SELECT e.section_id FROM enrollments e JOIN students s ON s.id=e.student_id WHERE s.profile_id=auth.uid() AND e.status='enrolled')
      OR section_id IN (SELECT id FROM sections WHERE professor_id = auth.uid())
      OR public.has_any_role(ARRAY['platform_admin','university_admin','registrar'])
    )
  );
CREATE POLICY "prof_manage_lessons" ON lms_lessons FOR ALL
  USING (section_id IN (SELECT id FROM sections WHERE professor_id = auth.uid())
    OR public.has_any_role(ARRAY['platform_admin','university_admin']));

-- ════════════════════════════════════════════════════════════════════════════
-- 2. LESSON PROGRESS
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE public.lms_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id   UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  lesson_id       UUID NOT NULL REFERENCES lms_lessons(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','completed')),
  watched_seconds INTEGER NOT NULL DEFAULT 0,
  last_position   INTEGER NOT NULL DEFAULT 0,
  completed_at    TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(enrollment_id, lesson_id)
);
CREATE TRIGGER tg_lms_progress_upd BEFORE UPDATE ON lms_progress
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX idx_lms_progress_enrollment ON lms_progress(enrollment_id);
ALTER TABLE lms_progress ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON lms_progress TO authenticated;
CREATE POLICY "student_own_progress" ON lms_progress FOR ALL
  USING (enrollment_id IN (SELECT e.id FROM enrollments e JOIN students s ON s.id=e.student_id WHERE s.profile_id=auth.uid()));
CREATE POLICY "staff_read_progress" ON lms_progress FOR SELECT
  USING (public.has_any_role(ARRAY['platform_admin','university_admin','registrar'])
    OR enrollment_id IN (SELECT e.id FROM enrollments e JOIN sections sec ON sec.id=e.section_id WHERE sec.professor_id=auth.uid()));

-- ════════════════════════════════════════════════════════════════════════════
-- 3. ASSIGNMENTS
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE public.lms_assignments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id        UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  title_ar          TEXT,
  instructions      TEXT NOT NULL DEFAULT '',
  instructions_ar   TEXT,
  type              TEXT NOT NULL DEFAULT 'upload' CHECK (type IN ('upload','text','url','peer_review')),
  max_score         NUMERIC(5,1) NOT NULL DEFAULT 100 CHECK (max_score > 0),
  due_date          TIMESTAMPTZ,
  allow_late        BOOLEAN NOT NULL DEFAULT FALSE,
  late_penalty_pct  NUMERIC(5,2) NOT NULL DEFAULT 0,
  max_file_mb       INTEGER NOT NULL DEFAULT 10,
  allowed_types     TEXT[] NOT NULL DEFAULT ARRAY['pdf','doc','docx'],
  is_published      BOOLEAN NOT NULL DEFAULT FALSE,
  order_index       INTEGER NOT NULL DEFAULT 0,
  created_by        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER tg_lms_assignments_upd BEFORE UPDATE ON lms_assignments
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX idx_lms_assign_section ON lms_assignments(section_id, order_index);
ALTER TABLE lms_assignments ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON lms_assignments TO authenticated;
CREATE POLICY "enrolled_read_assignments" ON lms_assignments FOR SELECT
  USING (is_published=TRUE AND (
    section_id IN (SELECT e.section_id FROM enrollments e JOIN students s ON s.id=e.student_id WHERE s.profile_id=auth.uid() AND e.status='enrolled')
    OR section_id IN (SELECT id FROM sections WHERE professor_id=auth.uid())
    OR public.has_any_role(ARRAY['platform_admin','university_admin'])));
CREATE POLICY "prof_manage_assignments" ON lms_assignments FOR ALL
  USING (section_id IN (SELECT id FROM sections WHERE professor_id=auth.uid())
    OR public.has_any_role(ARRAY['platform_admin','university_admin']));

-- ════════════════════════════════════════════════════════════════════════════
-- 4. SUBMISSIONS
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE public.lms_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id   UUID NOT NULL REFERENCES lms_assignments(id) ON DELETE CASCADE,
  enrollment_id   UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  text_content    TEXT,
  file_url        TEXT,
  file_name       TEXT,
  external_url    TEXT,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_late         BOOLEAN NOT NULL DEFAULT FALSE,
  attempt         INTEGER NOT NULL DEFAULT 1,
  score           NUMERIC(5,1),
  feedback        TEXT,
  graded_by       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  graded_at       TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft','submitted','graded','returned')),
  UNIQUE(assignment_id, enrollment_id)
);
CREATE INDEX idx_submissions_assignment ON lms_submissions(assignment_id);
CREATE INDEX idx_submissions_enrollment ON lms_submissions(enrollment_id);
ALTER TABLE lms_submissions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON lms_submissions TO authenticated;
CREATE POLICY "student_own_submissions" ON lms_submissions FOR ALL
  USING (enrollment_id IN (SELECT e.id FROM enrollments e JOIN students s ON s.id=e.student_id WHERE s.profile_id=auth.uid()));
CREATE POLICY "prof_grade_submissions" ON lms_submissions FOR ALL
  USING (assignment_id IN (SELECT id FROM lms_assignments WHERE section_id IN (SELECT id FROM sections WHERE professor_id=auth.uid()))
    OR public.has_any_role(ARRAY['platform_admin','university_admin']));

-- ════════════════════════════════════════════════════════════════════════════
-- 5. QUIZZES
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE public.lms_quizzes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id        UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  title_ar          TEXT,
  instructions      TEXT,
  type              TEXT NOT NULL DEFAULT 'graded' CHECK (type IN ('graded','practice','survey')),
  time_limit_min    INTEGER CHECK (time_limit_min > 0),
  max_attempts      INTEGER NOT NULL DEFAULT 1 CHECK (max_attempts BETWEEN 1 AND 10),
  shuffle_questions BOOLEAN NOT NULL DEFAULT FALSE,
  shuffle_answers   BOOLEAN NOT NULL DEFAULT FALSE,
  show_results      TEXT NOT NULL DEFAULT 'after_submit' CHECK (show_results IN ('after_submit','after_due','never')),
  due_date          TIMESTAMPTZ,
  available_from    TIMESTAMPTZ,
  max_score         NUMERIC(5,1) NOT NULL DEFAULT 100,
  passing_score     NUMERIC(5,1),
  is_published      BOOLEAN NOT NULL DEFAULT FALSE,
  order_index       INTEGER NOT NULL DEFAULT 0,
  created_by        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER tg_lms_quizzes_upd BEFORE UPDATE ON lms_quizzes
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX idx_lms_quiz_section ON lms_quizzes(section_id, order_index);
ALTER TABLE lms_quizzes ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON lms_quizzes TO authenticated;
CREATE POLICY "enrolled_read_quizzes" ON lms_quizzes FOR SELECT
  USING (is_published=TRUE AND (
    section_id IN (SELECT e.section_id FROM enrollments e JOIN students s ON s.id=e.student_id WHERE s.profile_id=auth.uid() AND e.status='enrolled')
    OR section_id IN (SELECT id FROM sections WHERE professor_id=auth.uid())
    OR public.has_any_role(ARRAY['platform_admin','university_admin'])));
CREATE POLICY "prof_manage_quizzes" ON lms_quizzes FOR ALL
  USING (section_id IN (SELECT id FROM sections WHERE professor_id=auth.uid())
    OR public.has_any_role(ARRAY['platform_admin','university_admin']));

-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE public.lms_questions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id     UUID NOT NULL REFERENCES lms_quizzes(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('mcq','true_false','short_answer','essay','matching')),
  body        TEXT NOT NULL,
  body_ar     TEXT,
  image_url   TEXT,
  points      NUMERIC(5,1) NOT NULL DEFAULT 1 CHECK (points > 0),
  order_index INTEGER NOT NULL DEFAULT 0,
  explanation TEXT
);
CREATE INDEX idx_lms_questions_quiz ON lms_questions(quiz_id, order_index);
ALTER TABLE lms_questions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON lms_questions TO authenticated;
CREATE POLICY "all_read_questions" ON lms_questions FOR SELECT USING (TRUE);
CREATE POLICY "prof_manage_questions" ON lms_questions FOR ALL
  USING (quiz_id IN (SELECT id FROM lms_quizzes WHERE section_id IN (SELECT id FROM sections WHERE professor_id=auth.uid()))
    OR public.has_any_role(ARRAY['platform_admin','university_admin']));

-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE public.lms_answers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES lms_questions(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  body_ar     TEXT,
  is_correct  BOOLEAN NOT NULL DEFAULT FALSE,
  order_index INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_lms_answers_question ON lms_answers(question_id, order_index);
ALTER TABLE lms_answers ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON lms_answers TO authenticated;
CREATE POLICY "all_read_answers" ON lms_answers FOR SELECT USING (TRUE);
CREATE POLICY "prof_manage_answers" ON lms_answers FOR ALL
  USING (question_id IN (SELECT id FROM lms_questions WHERE quiz_id IN (SELECT id FROM lms_quizzes WHERE section_id IN (SELECT id FROM sections WHERE professor_id=auth.uid())))
    OR public.has_any_role(ARRAY['platform_admin','university_admin']));

-- ════════════════════════════════════════════════════════════════════════════
-- 6. QUIZ ATTEMPTS
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE public.lms_quiz_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id         UUID NOT NULL REFERENCES lms_quizzes(id) ON DELETE CASCADE,
  enrollment_id   UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  attempt_number  INTEGER NOT NULL DEFAULT 1,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at    TIMESTAMPTZ,
  time_taken_sec  INTEGER,
  score           NUMERIC(5,1),
  max_score       NUMERIC(5,1),
  percentage      NUMERIC(5,2),
  passed          BOOLEAN,
  status          TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','submitted','graded','expired')),
  answers         JSONB NOT NULL DEFAULT '[]'
);
CREATE INDEX idx_attempts_quiz       ON lms_quiz_attempts(quiz_id);
CREATE INDEX idx_attempts_enrollment ON lms_quiz_attempts(enrollment_id);
ALTER TABLE lms_quiz_attempts ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON lms_quiz_attempts TO authenticated;
CREATE POLICY "student_own_attempts" ON lms_quiz_attempts FOR ALL
  USING (enrollment_id IN (SELECT e.id FROM enrollments e JOIN students s ON s.id=e.student_id WHERE s.profile_id=auth.uid()));
CREATE POLICY "prof_read_attempts" ON lms_quiz_attempts FOR SELECT
  USING (quiz_id IN (SELECT id FROM lms_quizzes WHERE section_id IN (SELECT id FROM sections WHERE professor_id=auth.uid()))
    OR public.has_any_role(ARRAY['platform_admin','university_admin']));

-- ════════════════════════════════════════════════════════════════════════════
-- 7. DISCUSSIONS
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE public.lms_discussions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id    UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  lesson_id     UUID REFERENCES lms_lessons(id) ON DELETE SET NULL,
  author_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  is_pinned     BOOLEAN NOT NULL DEFAULT FALSE,
  is_closed     BOOLEAN NOT NULL DEFAULT FALSE,
  views         INTEGER NOT NULL DEFAULT 0,
  replies_count INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER tg_lms_discussions_upd BEFORE UPDATE ON lms_discussions
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX idx_discussions_section ON lms_discussions(section_id, created_at DESC);
ALTER TABLE lms_discussions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON lms_discussions TO authenticated;
CREATE POLICY "section_members_discussions" ON lms_discussions FOR ALL
  USING (section_id IN (
    SELECT e.section_id FROM enrollments e JOIN students s ON s.id=e.student_id WHERE s.profile_id=auth.uid() AND e.status='enrolled'
    UNION SELECT id FROM sections WHERE professor_id=auth.uid()
  ) OR public.has_any_role(ARRAY['platform_admin','university_admin']));

-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE public.lms_replies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id   UUID NOT NULL REFERENCES lms_discussions(id) ON DELETE CASCADE,
  author_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id       UUID REFERENCES lms_replies(id) ON DELETE SET NULL,
  body            TEXT NOT NULL,
  is_answer       BOOLEAN NOT NULL DEFAULT FALSE,
  upvotes         INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER tg_lms_replies_upd BEFORE UPDATE ON lms_replies
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX idx_replies_discussion ON lms_replies(discussion_id, created_at);
ALTER TABLE lms_replies ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON lms_replies TO authenticated;
CREATE POLICY "section_members_replies" ON lms_replies FOR ALL
  USING (discussion_id IN (
    SELECT id FROM lms_discussions WHERE section_id IN (
      SELECT e.section_id FROM enrollments e JOIN students s ON s.id=e.student_id WHERE s.profile_id=auth.uid() AND e.status='enrolled'
      UNION SELECT id FROM sections WHERE professor_id=auth.uid()
    )
  ) OR public.has_any_role(ARRAY['platform_admin','university_admin']));

-- Auto-update replies_count
CREATE OR REPLACE FUNCTION fn_inc_replies_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP='INSERT' THEN
    UPDATE lms_discussions SET replies_count=replies_count+1 WHERE id=NEW.discussion_id;
  ELSIF TG_OP='DELETE' THEN
    UPDATE lms_discussions SET replies_count=GREATEST(0,replies_count-1) WHERE id=OLD.discussion_id;
  END IF;
  RETURN COALESCE(NEW,OLD);
END; $$;
CREATE TRIGGER tg_replies_count AFTER INSERT OR DELETE ON lms_replies
  FOR EACH ROW EXECUTE FUNCTION fn_inc_replies_count();

-- ════════════════════════════════════════════════════════════════════════════
-- 8. LIVE SESSIONS
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE public.lms_live_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id      UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  scheduled_at    TIMESTAMPTZ NOT NULL,
  duration_min    INTEGER NOT NULL DEFAULT 60 CHECK (duration_min BETWEEN 15 AND 480),
  platform        TEXT NOT NULL DEFAULT 'zoom' CHECK (platform IN ('zoom','meet','teams','jitsi','bigbluebutton')),
  meeting_url     TEXT,
  meeting_id      TEXT,
  meeting_pass    TEXT,
  status          TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','ended','cancelled')),
  recording_url   TEXT,
  attendees_count INTEGER NOT NULL DEFAULT 0,
  created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER tg_lms_live_upd BEFORE UPDATE ON lms_live_sessions
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX idx_live_section     ON lms_live_sessions(section_id, scheduled_at);
CREATE INDEX idx_live_scheduled   ON lms_live_sessions(scheduled_at) WHERE status='scheduled';
ALTER TABLE lms_live_sessions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON lms_live_sessions TO authenticated;
CREATE POLICY "section_members_live" ON lms_live_sessions FOR SELECT
  USING (section_id IN (
    SELECT e.section_id FROM enrollments e JOIN students s ON s.id=e.student_id WHERE s.profile_id=auth.uid() AND e.status='enrolled'
    UNION SELECT id FROM sections WHERE professor_id=auth.uid()
  ) OR public.has_any_role(ARRAY['platform_admin','university_admin']));
CREATE POLICY "prof_manage_live" ON lms_live_sessions FOR ALL
  USING (section_id IN (SELECT id FROM sections WHERE professor_id=auth.uid())
    OR public.has_any_role(ARRAY['platform_admin','university_admin']));

-- ════════════════════════════════════════════════════════════════════════════
-- 9. ANNOUNCEMENTS
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE public.lms_announcements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id  UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  is_pinned   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER tg_lms_ann_upd BEFORE UPDATE ON lms_announcements
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX idx_lms_ann_section ON lms_announcements(section_id, is_pinned DESC, created_at DESC);
ALTER TABLE lms_announcements ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON lms_announcements TO authenticated;
CREATE POLICY "section_members_read_ann" ON lms_announcements FOR SELECT
  USING (section_id IN (
    SELECT e.section_id FROM enrollments e JOIN students s ON s.id=e.student_id WHERE s.profile_id=auth.uid() AND e.status='enrolled'
    UNION SELECT id FROM sections WHERE professor_id=auth.uid()
  ) OR public.has_any_role(ARRAY['platform_admin','university_admin']));
CREATE POLICY "prof_manage_ann" ON lms_announcements FOR ALL
  USING (section_id IN (SELECT id FROM sections WHERE professor_id=auth.uid())
    OR public.has_any_role(ARRAY['platform_admin','university_admin']));

-- ════════════════════════════════════════════════════════════════════════════
-- 10. RESOURCES
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE public.lms_resources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id  UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  type        TEXT NOT NULL DEFAULT 'link' CHECK (type IN ('link','file','book','reference')),
  url         TEXT,
  file_url    TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_lms_resources_section ON lms_resources(section_id, order_index);
ALTER TABLE lms_resources ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON lms_resources TO authenticated;
CREATE POLICY "section_members_resources" ON lms_resources FOR SELECT
  USING (section_id IN (
    SELECT e.section_id FROM enrollments e JOIN students s ON s.id=e.student_id WHERE s.profile_id=auth.uid() AND e.status='enrolled'
    UNION SELECT id FROM sections WHERE professor_id=auth.uid()
  ) OR public.has_any_role(ARRAY['platform_admin','university_admin']));
CREATE POLICY "prof_manage_resources" ON lms_resources FOR ALL
  USING (section_id IN (SELECT id FROM sections WHERE professor_id=auth.uid())
    OR public.has_any_role(ARRAY['platform_admin','university_admin']));

-- ════════════════════════════════════════════════════════════════════════════
-- 11. STORAGE BUCKETS (LMS)
-- ════════════════════════════════════════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('lms-videos',      'lms-videos',      FALSE, 2147483648, ARRAY['video/mp4','video/webm','video/ogg']),
  ('lms-submissions', 'lms-submissions', FALSE, 104857600,  NULL),
  ('lms-resources',   'lms-resources',   FALSE, 104857600,  NULL)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "lms_videos_auth"      ON storage.objects FOR SELECT USING (bucket_id='lms-videos'      AND auth.uid() IS NOT NULL);
CREATE POLICY "lms_videos_prof"      ON storage.objects FOR INSERT WITH CHECK (bucket_id='lms-videos' AND public.has_any_role(ARRAY['professor','teaching_assistant','platform_admin','university_admin']));
CREATE POLICY "lms_subs_student"     ON storage.objects FOR INSERT WITH CHECK (bucket_id='lms-submissions' AND auth.uid() IS NOT NULL);
CREATE POLICY "lms_subs_read"        ON storage.objects FOR SELECT USING (bucket_id='lms-submissions'  AND auth.uid() IS NOT NULL);
CREATE POLICY "lms_resources_read"   ON storage.objects FOR SELECT USING (bucket_id='lms-resources'    AND auth.uid() IS NOT NULL);
CREATE POLICY "lms_resources_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id='lms-resources' AND public.has_any_role(ARRAY['professor','teaching_assistant','platform_admin','university_admin']));

-- ════════════════════════════════════════════════════════════════════════════
-- 12. COMPLETION VIEW
-- ════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW public.lms_section_stats AS
SELECT
  e.id                                                          AS enrollment_id,
  e.section_id,
  e.student_id,
  COUNT(DISTINCT l.id)                                          AS total_lessons,
  COUNT(DISTINCT CASE WHEN p.status='completed' THEN p.lesson_id END) AS completed_lessons,
  ROUND(
    COUNT(DISTINCT CASE WHEN p.status='completed' THEN p.lesson_id END)::NUMERIC
    / NULLIF(COUNT(DISTINCT l.id),0) * 100, 1
  )                                                             AS lesson_completion_pct,
  COUNT(DISTINCT a.id)                                          AS total_assignments,
  COUNT(DISTINCT CASE WHEN sub.status IN ('submitted','graded') THEN sub.id END) AS submitted_assignments,
  COUNT(DISTINCT q.id)                                          AS total_quizzes,
  COUNT(DISTINCT CASE WHEN att.status != 'in_progress' THEN att.id END) AS attempted_quizzes,
  ROUND(AVG(CASE WHEN att.status='graded' THEN att.percentage END), 1) AS avg_quiz_score
FROM enrollments   e
LEFT JOIN lms_lessons     l   ON l.section_id = e.section_id AND l.is_published = TRUE
LEFT JOIN lms_progress    p   ON p.lesson_id = l.id AND p.enrollment_id = e.id
LEFT JOIN lms_assignments a   ON a.section_id = e.section_id AND a.is_published = TRUE
LEFT JOIN lms_submissions sub ON sub.assignment_id = a.id AND sub.enrollment_id = e.id
LEFT JOIN lms_quizzes     q   ON q.section_id = e.section_id AND q.is_published = TRUE
LEFT JOIN lms_quiz_attempts att ON att.quiz_id = q.id AND att.enrollment_id = e.id
WHERE e.status = 'enrolled'
GROUP BY e.id, e.section_id, e.student_id;

GRANT SELECT ON lms_section_stats TO authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- 13. REALTIME
-- ════════════════════════════════════════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE lms_live_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE lms_discussions;
