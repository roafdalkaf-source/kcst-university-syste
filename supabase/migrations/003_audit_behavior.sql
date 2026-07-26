-- ════════════════════════════════════════════════════════════════
-- KCST UMS — Migration 003: Audit Logs + Behavior Records
-- Run AFTER: 001 and 002
-- ════════════════════════════════════════════════════════════════

-- ── Audit log table ───────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,           -- e.g. 'grade.update', 'role.assign'
  entity_type TEXT NOT NULL,           -- table name
  entity_id   TEXT,                    -- record id (string for flexibility)
  old_data    JSONB,                   -- before snapshot
  new_data    JSONB,                   -- after snapshot
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_actor    ON audit_logs(actor_id, created_at DESC);
CREATE INDEX idx_audit_entity   ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created  ON audit_logs(created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON audit_logs TO authenticated;

CREATE POLICY "admins_read_audit" ON audit_logs FOR SELECT
  USING (public.has_any_role(ARRAY['platform_admin','university_admin']));

CREATE POLICY "system_insert_audit" ON audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Helper: log an action (call from app code)
CREATE OR REPLACE FUNCTION public.log_action(
  p_action      TEXT,
  p_entity_type TEXT,
  p_entity_id   TEXT DEFAULT NULL,
  p_old_data    JSONB DEFAULT NULL,
  p_new_data    JSONB DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, old_data, new_data)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_old_data, p_new_data);
END; $$;

-- ── Behavior records ──────────────────────
CREATE TABLE IF NOT EXISTS public.behavior_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('violation','warning','commendation','suspension')),
  severity      TEXT CHECK (severity IN ('minor','major','critical')),
  title         TEXT NOT NULL,
  description   TEXT,
  incident_date DATE NOT NULL DEFAULT CURRENT_DATE,
  action_taken  TEXT,
  recorded_by   UUID REFERENCES profiles(id),
  section_id    UUID REFERENCES sections(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER tg_behavior_upd BEFORE UPDATE ON behavior_records
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE INDEX idx_behavior_student ON behavior_records(student_id, incident_date DESC);

ALTER TABLE behavior_records ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON behavior_records TO authenticated;

CREATE POLICY "student_own_behavior" ON behavior_records FOR SELECT
  USING (student_id IN (SELECT id FROM students WHERE profile_id = auth.uid()));

CREATE POLICY "staff_manage_behavior" ON behavior_records FOR ALL
  USING (public.has_any_role(ARRAY[
    'platform_admin','university_admin','registrar','dean','department_head'
  ]));

CREATE POLICY "prof_record_behavior" ON behavior_records FOR INSERT
  WITH CHECK (public.has_any_role(ARRAY['professor','teaching_assistant']));

-- ── Add lms_assignments index ─────────────
CREATE INDEX IF NOT EXISTS idx_lms_assign_section ON lms_assignments(section_id, order_index);
CREATE INDEX IF NOT EXISTS idx_lms_quiz_section   ON lms_quizzes(section_id, order_index);

-- ── Seed: default app settings ────────────
INSERT INTO app_settings (key, value) VALUES
  ('features', '{"enable_online_payment":false,"enable_student_self_enrollment":true,"enable_lms":true,"enable_certificates":true}')
ON CONFLICT (key) DO NOTHING;
