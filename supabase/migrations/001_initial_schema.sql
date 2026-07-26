-- ════════════════════════════════════════════════════════════════════════════
-- KCST UMS — Migration 001: Initial Schema (Fixed Roles Operator Type)
-- PostgreSQL 15 + Supabase Auth
-- ════════════════════════════════════════════════════════════════════════════

SET search_path TO public, extensions;

-- ── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- Full-text search
CREATE EXTENSION IF NOT EXISTS "unaccent";  -- Arabic/Latin search

-- ── Shared updated_at trigger ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- 1. PROFILES
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL UNIQUE,
  full_name       TEXT NOT NULL,
  full_name_ar    TEXT,
  avatar_url      TEXT,
  phone           TEXT,
  national_id     TEXT,
  gender          TEXT CHECK (gender IN ('male','female')),
  date_of_birth   DATE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tg_profiles_upd BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE INDEX idx_profiles_email    ON public.profiles(email);
CREATE INDEX idx_profiles_name_trgm ON public.profiles USING gin(full_name gin_trgm_ops);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.fn_handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1))
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.fn_handle_new_user();

-- ════════════════════════════════════════════════════════════════════════════
-- 2. USER ROLES
-- ════════════════════════════════════════════════════════════════════════════
CREATE TYPE public.user_role AS ENUM (
  'platform_admin','university_admin','dean','department_head',
  'professor','teaching_assistant','registrar','finance_officer','student'
);

CREATE TABLE public.user_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role        public.user_role NOT NULL,
  granted_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  granted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.user_roles TO authenticated;

-- ── Helper Functions Dependent on Tables (FIXED TYPE CASTING HERE) ───────────
CREATE OR REPLACE FUNCTION public.has_any_role(roles TEXT[])
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = ANY(roles::public.user_role[])
  );
$$;

-- RLS Policies for Profiles & User Roles
CREATE POLICY "users_own_profile" ON public.profiles FOR ALL
  USING (id = auth.uid());

CREATE POLICY "admins_all_profiles" ON public.profiles FOR ALL
  USING (public.has_any_role(ARRAY['platform_admin','university_admin','registrar','dean','department_head']));

CREATE POLICY "users_read_own_roles" ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "admins_manage_roles" ON public.user_roles FOR ALL
  USING (public.has_any_role(ARRAY['platform_admin','university_admin']));

-- ════════════════════════════════════════════════════════════════════════════
-- 3. ACADEMIC STRUCTURE
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE public.faculties (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,
  name_en     TEXT NOT NULL,
  name_ar     TEXT NOT NULL,
  description TEXT,
  dean_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tg_faculties_upd BEFORE UPDATE ON public.faculties
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

ALTER TABLE public.faculties ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faculties TO authenticated;

CREATE POLICY "all_read_faculties" ON public.faculties FOR SELECT USING (TRUE);
CREATE POLICY "admins_manage_faculties" ON public.faculties FOR ALL
  USING (public.has_any_role(ARRAY['platform_admin','university_admin']));

-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE public.departments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id  UUID NOT NULL REFERENCES public.faculties(id) ON DELETE CASCADE,
  code        TEXT NOT NULL UNIQUE,
  name_en     TEXT NOT NULL,
  name_ar     TEXT NOT NULL,
  head_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tg_departments_upd BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE INDEX idx_departments_faculty ON public.departments(faculty_id);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments TO authenticated;

CREATE POLICY "all_read_depts" ON public.departments FOR SELECT USING (TRUE);
CREATE POLICY "admins_manage_depts" ON public.departments FOR ALL
  USING (public.has_any_role(ARRAY['platform_admin','university_admin']));

-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE public.programs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id   UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  code            TEXT NOT NULL UNIQUE,
  name_en         TEXT NOT NULL,
  name_ar         TEXT NOT NULL,
  degree_level    TEXT NOT NULL CHECK (degree_level IN ('diploma','bachelor','master','phd')),
  duration_years  INTEGER NOT NULL DEFAULT 4,
  total_credits   INTEGER NOT NULL DEFAULT 120,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tg_programs_upd BEFORE UPDATE ON public.programs
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE INDEX idx_programs_dept ON public.programs(department_id);

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.programs TO authenticated;

CREATE POLICY "all_read_programs" ON public.programs FOR SELECT USING (TRUE);
CREATE POLICY "admins_manage_programs" ON public.programs FOR ALL
  USING (public.has_any_role(ARRAY['platform_admin','university_admin']));

-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE public.courses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id   UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
  code            TEXT NOT NULL UNIQUE,
  name_en         TEXT NOT NULL,
  name_ar         TEXT NOT NULL,
  credits         INTEGER NOT NULL DEFAULT 3 CHECK (credits BETWEEN 1 AND 6),
  level           INTEGER NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 8),
  description     TEXT,
  is_elective     BOOLEAN NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  prerequisites   UUID[] NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tg_courses_upd BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE INDEX idx_courses_dept  ON public.courses(department_id);
CREATE INDEX idx_courses_code  ON public.courses USING gin(code gin_trgm_ops);
CREATE INDEX idx_courses_name  ON public.courses USING gin(name_ar gin_trgm_ops);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;

CREATE POLICY "all_read_courses" ON public.courses FOR SELECT USING (TRUE);
CREATE POLICY "admins_manage_courses" ON public.courses FOR ALL
  USING (public.has_any_role(ARRAY['platform_admin','university_admin','registrar']));

-- ════════════════════════════════════════════════════════════════════════════
-- 4. SEMESTERS
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE public.semesters (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en         TEXT NOT NULL,
  name_ar         TEXT NOT NULL,
  academic_year   TEXT NOT NULL,
  term            TEXT NOT NULL CHECK (term IN ('fall','spring','summer')),
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  reg_start       DATE,
  reg_end         DATE,
  grade_deadline  DATE,
  is_active       BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT only_one_active CHECK (
    NOT (is_active = TRUE AND is_archived = TRUE)
  )
);

CREATE INDEX idx_semesters_active ON public.semesters(is_active) WHERE is_active = TRUE;

ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.semesters TO authenticated;

CREATE POLICY "all_read_semesters" ON public.semesters FOR SELECT USING (TRUE);
CREATE POLICY "admins_manage_semesters" ON public.semesters FOR ALL
  USING (public.has_any_role(ARRAY['platform_admin','university_admin','registrar']));

-- ════════════════════════════════════════════════════════════════════════════
-- 5. SECTIONS (Shubah)
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE public.sections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  semester_id     UUID NOT NULL REFERENCES public.semesters(id) ON DELETE RESTRICT,
  professor_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  code            TEXT NOT NULL,
  room            TEXT,
  schedule        JSONB NOT NULL DEFAULT '[]',
  capacity        INTEGER NOT NULL DEFAULT 40 CHECK (capacity BETWEEN 5 AND 500),
  enrolled_count  INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','cancelled')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(course_id, semester_id, code)
);

CREATE TRIGGER tg_sections_upd BEFORE UPDATE ON public.sections
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE INDEX idx_sections_course    ON public.sections(course_id);
CREATE INDEX idx_sections_semester  ON public.sections(semester_id);
CREATE INDEX idx_sections_professor ON public.sections(professor_id);

ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sections TO authenticated;

CREATE POLICY "all_read_sections" ON public.sections FOR SELECT USING (TRUE);
CREATE POLICY "admins_manage_sections" ON public.sections FOR ALL
  USING (public.has_any_role(ARRAY['platform_admin','university_admin','registrar']));
CREATE POLICY "prof_read_own_sections" ON public.sections FOR SELECT
  USING (professor_id = auth.uid());

-- Auto update enrolled_count
CREATE OR REPLACE FUNCTION public.fn_section_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'enrolled' THEN
    UPDATE public.sections SET enrolled_count = enrolled_count + 1 WHERE id = NEW.section_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'enrolled' AND NEW.status = 'enrolled' THEN
      UPDATE public.sections SET enrolled_count = enrolled_count + 1 WHERE id = NEW.section_id;
    ELSIF OLD.status = 'enrolled' AND NEW.status != 'enrolled' THEN
      UPDATE public.sections SET enrolled_count = GREATEST(0, enrolled_count - 1) WHERE id = NEW.section_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'enrolled' THEN
    UPDATE public.sections SET enrolled_count = GREATEST(0, enrolled_count - 1) WHERE id = OLD.section_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- 6. STUDENTS
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE public.students (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_id      UUID NOT NULL REFERENCES public.programs(id) ON DELETE RESTRICT,
  student_number  TEXT NOT NULL UNIQUE,
  admission_date  DATE NOT NULL,
  admission_type  TEXT NOT NULL DEFAULT 'regular' CHECK (admission_type IN ('regular','transfer','exceptional')),
  current_level   INTEGER NOT NULL DEFAULT 1 CHECK (current_level BETWEEN 1 AND 8),
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','graduated','withdrawn','on_leave')),
  gpa             NUMERIC(3,2) NOT NULL DEFAULT 0.00 CHECK (gpa BETWEEN 0 AND 4),
  total_credits   INTEGER NOT NULL DEFAULT 0,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tg_students_upd BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE INDEX idx_students_profile   ON public.students(profile_id);
CREATE INDEX idx_students_program   ON public.students(program_id);
CREATE INDEX idx_students_number    ON public.students(student_number);
CREATE INDEX idx_students_status    ON public.students(status);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.students TO authenticated;

CREATE POLICY "student_own_record" ON public.students FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "staff_manage_students" ON public.students FOR ALL
  USING (public.has_any_role(ARRAY['platform_admin','university_admin','registrar','dean','department_head','finance_officer']));

-- Helper: get current student ID safely
CREATE OR REPLACE FUNCTION public.get_current_student_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT id FROM public.students WHERE profile_id = auth.uid() LIMIT 1;
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- 7. ENROLLMENTS
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE public.enrollments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  section_id  UUID NOT NULL REFERENCES public.sections(id) ON DELETE RESTRICT,
  status      TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled','dropped','completed','incomplete')),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dropped_at  TIMESTAMPTZ,
  UNIQUE(student_id, section_id)
);

CREATE TRIGGER tg_enrollment_count
  AFTER INSERT OR UPDATE OR DELETE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.fn_section_count();

CREATE INDEX idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX idx_enrollments_section ON public.enrollments(section_id);
CREATE INDEX idx_enrollments_status  ON public.enrollments(status);

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.enrollments TO authenticated;

CREATE POLICY "student_own_enrollments" ON public.enrollments FOR SELECT
  USING (student_id = public.get_current_student_id());

CREATE POLICY "staff_manage_enrollments" ON public.enrollments FOR ALL
  USING (public.has_any_role(ARRAY['platform_admin','university_admin','registrar']));

CREATE POLICY "prof_read_section_enrollments" ON public.enrollments FOR SELECT
  USING (section_id IN (SELECT id FROM public.sections WHERE professor_id = auth.uid()));

-- ════════════════════════════════════════════════════════════════════════════
-- 8. GRADE ENTRIES
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE public.grade_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id   UUID NOT NULL UNIQUE REFERENCES public.enrollments(id) ON DELETE CASCADE,
  participation   NUMERIC(4,1) NOT NULL DEFAULT 0 CHECK (participation BETWEEN 0 AND 10),
  assignments     NUMERIC(4,1) NOT NULL DEFAULT 0 CHECK (assignments   BETWEEN 0 AND 10),
  midterm         NUMERIC(4,1) NOT NULL DEFAULT 0 CHECK (midterm       BETWEEN 0 AND 30),
  final           NUMERIC(4,1) NOT NULL DEFAULT 0 CHECK (final         BETWEEN 0 AND 50),
  total           NUMERIC(5,2) GENERATED ALWAYS AS (
                    ROUND(participation*0.10 + assignments*0.10 + midterm*0.30 + final*0.50, 2)
                  ) STORED,
  letter          TEXT,
  grade_points    NUMERIC(3,1),
  is_published    BOOLEAN NOT NULL DEFAULT FALSE,
  published_at    TIMESTAMPTZ,
  graded_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tg_grades_upd BEFORE UPDATE ON public.grade_entries
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE INDEX idx_grades_enrollment ON public.grade_entries(enrollment_id);
CREATE INDEX idx_grades_published  ON public.grade_entries(is_published);

ALTER TABLE public.grade_entries ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.grade_entries TO authenticated;

CREATE POLICY "student_own_grades" ON public.grade_entries FOR SELECT
  USING (enrollment_id IN (
    SELECT e.id FROM public.enrollments e
    WHERE e.student_id = public.get_current_student_id()
  ) AND is_published = TRUE);

CREATE POLICY "prof_manage_grades" ON public.grade_entries FOR ALL
  USING (enrollment_id IN (
    SELECT e.id FROM public.enrollments e
    JOIN public.sections sec ON sec.id = e.section_id
    WHERE sec.professor_id = auth.uid()
  ));

CREATE POLICY "staff_manage_grades" ON public.grade_entries FOR ALL
  USING (public.has_any_role(ARRAY['platform_admin','university_admin','registrar']));

-- Auto-compute letter grade and grade points
CREATE OR REPLACE FUNCTION public.fn_compute_grade()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_total NUMERIC;
BEGIN
  v_total := ROUND(NEW.participation*0.10 + NEW.assignments*0.10 + NEW.midterm*0.30 + NEW.final*0.50, 2);

  NEW.letter := CASE
    WHEN v_total >= 95 THEN 'A+'
    WHEN v_total >= 90 THEN 'A'
    WHEN v_total >= 85 THEN 'B+'
    WHEN v_total >= 80 THEN 'B'
    WHEN v_total >= 75 THEN 'C+'
    WHEN v_total >= 70 THEN 'C'
    WHEN v_total >= 65 THEN 'D+'
    WHEN v_total >= 60 THEN 'D'
    ELSE 'F'
  END;

  NEW.grade_points := CASE
    WHEN v_total >= 90 THEN 4.0
    WHEN v_total >= 85 THEN 3.5
    WHEN v_total >= 80 THEN 3.0
    WHEN v_total >= 75 THEN 2.5
    WHEN v_total >= 70 THEN 2.0
    WHEN v_total >= 65 THEN 1.5
    WHEN v_total >= 60 THEN 1.0
    ELSE 0.0
  END;

  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_compute_grade BEFORE INSERT OR UPDATE ON public.grade_entries
  FOR EACH ROW EXECUTE FUNCTION public.fn_compute_grade();

-- Auto-recalculate student GPA after grade publish
CREATE OR REPLACE FUNCTION public.fn_recalc_gpa()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_student_id UUID;
  v_gpa        NUMERIC(3,2);
  v_credits    INTEGER;
BEGIN
  IF NOT (NEW.is_published AND (NOT OLD.is_published OR OLD.total != NEW.total)) THEN
    RETURN NEW;
  END IF;

  SELECT e.student_id INTO v_student_id FROM public.enrollments e WHERE e.id = NEW.enrollment_id;

  SELECT
    COALESCE(ROUND(SUM(ge.grade_points * c.credits) / NULLIF(SUM(c.credits),0), 2), 0),
    COALESCE(SUM(CASE WHEN ge.grade_points > 0 THEN c.credits ELSE 0 END), 0)
  INTO v_gpa, v_credits
  FROM public.grade_entries ge
  JOIN public.enrollments  e   ON e.id   = ge.enrollment_id
  JOIN public.sections     sec ON sec.id = e.section_id
  JOIN public.courses      c   ON c.id   = sec.course_id
  WHERE e.student_id = v_student_id AND ge.is_published = TRUE;

  UPDATE public.students SET gpa = v_gpa, total_credits = v_credits WHERE id = v_student_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_recalc_gpa AFTER UPDATE ON public.grade_entries
  FOR EACH ROW EXECUTE FUNCTION public.fn_recalc_gpa();

-- ════════════════════════════════════════════════════════════════════════════
-- 9. ATTENDANCE
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE public.attendance (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id   UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('present','absent','late','excused')),
  notes           TEXT,
  recorded_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(enrollment_id, date)
);

CREATE INDEX idx_attendance_enrollment ON public.attendance(enrollment_id, date DESC);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.attendance TO authenticated;

CREATE POLICY "student_own_attendance" ON public.attendance FOR SELECT
  USING (enrollment_id IN (
    SELECT e.id FROM public.enrollments e WHERE e.student_id = public.get_current_student_id()
  ));

CREATE POLICY "prof_manage_attendance" ON public.attendance FOR ALL
  USING (enrollment_id IN (
    SELECT e.id FROM public.enrollments e JOIN public.sections sec ON sec.id=e.section_id WHERE sec.professor_id=auth.uid()
  ));

CREATE POLICY "staff_manage_attendance" ON public.attendance FOR ALL
  USING (public.has_any_role(ARRAY['platform_admin','university_admin','registrar']));

-- ════════════════════════════════════════════════════════════════════════════
-- 10. FINANCE
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE public.invoices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
  semester_id   UUID REFERENCES public.semesters(id) ON DELETE SET NULL,
  invoice_no    TEXT NOT NULL UNIQUE,
  total_amount  NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  paid_amount   NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  balance       NUMERIC(10,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','partial','paid','overdue','cancelled','waived')),
  due_date      DATE,
  notes         TEXT,
  created_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tg_invoices_upd BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE INDEX idx_invoices_student ON public.invoices(student_id);
CREATE INDEX idx_invoices_status  ON public.invoices(status);
CREATE INDEX idx_invoices_due     ON public.invoices(due_date) WHERE status NOT IN ('paid','cancelled','waived');

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.invoices TO authenticated;

CREATE POLICY "student_own_invoices" ON public.invoices FOR SELECT
  USING (student_id = public.get_current_student_id());

CREATE POLICY "finance_manage_invoices" ON public.invoices FOR ALL
  USING (public.has_any_role(ARRAY['platform_admin','university_admin','finance_officer']));

-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE public.payments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id    UUID NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
  amount        NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  method        TEXT NOT NULL CHECK (method IN ('cash','bank_transfer','card','mobile_money','waiver')),
  reference_no  TEXT,
  notes         TEXT,
  received_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  paid_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_invoice ON public.payments(invoice_id);
CREATE INDEX idx_payments_paid_at ON public.payments(paid_at DESC);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.payments TO authenticated;

CREATE POLICY "student_own_payments" ON public.payments FOR SELECT
  USING (invoice_id IN (
    SELECT id FROM public.invoices WHERE student_id = public.get_current_student_id()
  ));

CREATE POLICY "finance_manage_payments" ON public.payments FOR ALL
  USING (public.has_any_role(ARRAY['platform_admin','university_admin','finance_officer']));

-- Auto-update invoice after payment
CREATE OR REPLACE FUNCTION public.fn_update_invoice()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_paid NUMERIC(10,2); v_total NUMERIC(10,2); v_new_status TEXT;
BEGIN
  SELECT SUM(amount), inv.total_amount INTO v_paid, v_total
  FROM public.payments p JOIN public.invoices inv ON inv.id = p.invoice_id
  WHERE p.invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
  GROUP BY inv.total_amount;

  v_paid := COALESCE(v_paid, 0);
  IF    v_paid >= v_total THEN v_new_status := 'paid';
  ELSIF v_paid > 0        THEN v_new_status := 'partial';
  ELSE                         v_new_status := 'pending';
  END IF;

  UPDATE public.invoices SET paid_amount=v_paid, status=v_new_status
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER tg_update_invoice AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_invoice();

-- ════════════════════════════════════════════════════════════════════════════
-- 11. CERTIFICATES
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE public.certificates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
  type            TEXT NOT NULL CHECK (type IN ('enrollment','transcript','graduation','good_standing','conduct','completion')),
  serial_number   TEXT NOT NULL UNIQUE,
  issued_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date     DATE,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked','expired')),
  file_url        TEXT,
  qr_code_url     TEXT,
  issued_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_certificates_student ON public.certificates(student_id);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.certificates TO authenticated;

CREATE POLICY "student_own_certs" ON public.certificates FOR SELECT
  USING (student_id = public.get_current_student_id());

CREATE POLICY "staff_manage_certs" ON public.certificates FOR ALL
  USING (public.has_any_role(ARRAY['platform_admin','university_admin','registrar']));

-- ════════════════════════════════════════════════════════════════════════════
-- 12. NOTIFICATIONS
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title_ar    TEXT NOT NULL,
  title_en    TEXT NOT NULL,
  body_ar     TEXT,
  body_en     TEXT,
  link        TEXT,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifs_user    ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifs_created ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;

CREATE POLICY "user_own_notifs" ON public.notifications FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "staff_send_notifs" ON public.notifications FOR INSERT
  WITH CHECK (public.has_any_role(ARRAY['platform_admin','university_admin','registrar','finance_officer','professor','teaching_assistant']));

-- Notify student when grade published
CREATE OR REPLACE FUNCTION public.fn_after_grade_publish()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_profile_id UUID; v_course_name TEXT;
BEGIN
  IF NOT (NEW.is_published AND NOT OLD.is_published) THEN RETURN NEW; END IF;

  SELECT s.profile_id INTO v_profile_id FROM public.enrollments e JOIN public.students s ON s.id=e.student_id WHERE e.id=NEW.enrollment_id;
  SELECT c.name_ar INTO v_course_name FROM public.enrollments e JOIN public.sections sec ON sec.id=e.section_id JOIN public.courses c ON c.id=sec.course_id WHERE e.id=NEW.enrollment_id;

  INSERT INTO public.notifications(user_id,type,title_ar,title_en,body_ar,body_en,link)
  VALUES(v_profile_id,'grade_published','تم نشر درجاتك','Grades Published',
    'تم نشر درجات مقرر: '||v_course_name||' — التقدير: '||NEW.letter,
    'Grade published for: '||v_course_name||' — Grade: '||NEW.letter,
    '/student/grades');

  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_grade_notify AFTER UPDATE ON public.grade_entries
  FOR EACH ROW EXECUTE FUNCTION public.fn_after_grade_publish();

-- ════════════════════════════════════════════════════════════════════════════
-- 13. JOIN REQUESTS
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE public.join_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_role    public.user_role NOT NULL,
  department_id     UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  student_id_no     TEXT,
  motivation        TEXT,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at       TIMESTAMPTZ,
  rejection_reason  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_join_requests_user   ON public.join_requests(user_id);
CREATE INDEX idx_join_requests_status ON public.join_requests(status);

ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.join_requests TO authenticated;

CREATE POLICY "user_own_requests" ON public.join_requests FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_insert_request" ON public.join_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "admins_manage_requests" ON public.join_requests FOR ALL
  USING (public.has_any_role(ARRAY['platform_admin','university_admin']));

-- ════════════════════════════════════════════════════════════════════════════
-- 14. APP SETTINGS
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE public.app_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL DEFAULT '{}',
  updated_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.app_settings TO authenticated;

CREATE POLICY "all_read_settings" ON public.app_settings FOR SELECT USING (TRUE);
CREATE POLICY "admins_manage_settings" ON public.app_settings FOR ALL
  USING (public.has_any_role(ARRAY['platform_admin','university_admin']));

-- Default branding
INSERT INTO public.app_settings (key, value) VALUES
  ('branding', '{"name_ar":"كلية كوش للعلوم والتكنولوجيا","name_en":"Kush College for Science and Technology","logo_url":null,"primary_color":"#1E3A5F","accent_color":"#C9A84C"}'),
  ('features', '{"enable_lms":true,"enable_certificates":true,"enable_online_payment":false,"enable_student_self_enrollment":true}')
ON CONFLICT (key) DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- 15. STORAGE BUCKETS
-- ════════════════════════════════════════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('avatars',      'avatars',      TRUE,  2097152,   ARRAY['image/jpeg','image/png','image/webp']),
  ('branding',     'branding',     TRUE,  5242880,   ARRAY['image/jpeg','image/png','image/svg+xml','image/webp']),
  ('certificates', 'certificates', FALSE, 10485760,  ARRAY['application/pdf']),
  ('documents',    'documents',    FALSE, 52428800,  ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;