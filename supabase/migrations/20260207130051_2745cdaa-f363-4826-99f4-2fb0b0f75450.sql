
-- ==========================================
-- DCS ATS Core Database Schema - Phase 1
-- ==========================================

-- Role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'hr_manager', 'recruiter');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper: check if user has at least a certain role level
CREATE OR REPLACE FUNCTION public.has_min_role(_user_id UUID, _min_role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND CASE ur.role
        WHEN 'super_admin' THEN 4
        WHEN 'admin' THEN 3
        WHEN 'hr_manager' THEN 2
        WHEN 'recruiter' THEN 1
      END >= CASE _min_role
        WHEN 'super_admin' THEN 4
        WHEN 'admin' THEN 3
        WHEN 'hr_manager' THEN 2
        WHEN 'recruiter' THEN 1
      END
  )
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  -- Default role: recruiter
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'recruiter');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- RLS Policies for profiles
-- ==========================================
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_min_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.has_min_role(auth.uid(), 'admin'));

-- ==========================================
-- RLS Policies for user_roles
-- ==========================================
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_min_role(auth.uid(), 'admin'));

CREATE POLICY "Super admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_min_role(auth.uid(), 'super_admin'));

-- ==========================================
-- Companies
-- ==========================================
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  location TEXT,
  address TEXT,
  description TEXT,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Authenticated users can view companies"
  ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "HR+ can create companies"
  ON public.companies FOR INSERT TO authenticated
  WITH CHECK (public.has_min_role(auth.uid(), 'hr_manager'));
CREATE POLICY "HR+ can update companies"
  ON public.companies FOR UPDATE TO authenticated
  USING (public.has_min_role(auth.uid(), 'hr_manager'));
CREATE POLICY "Admins can delete companies"
  ON public.companies FOR DELETE TO authenticated
  USING (public.has_min_role(auth.uid(), 'admin'));

-- ==========================================
-- Company Contacts
-- ==========================================
CREATE TABLE public.company_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  designation TEXT,
  email TEXT,
  phone TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.company_contacts ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_company_contacts_updated_at
  BEFORE UPDATE ON public.company_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Authenticated users can view contacts"
  ON public.company_contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "HR+ can manage contacts"
  ON public.company_contacts FOR ALL TO authenticated
  USING (public.has_min_role(auth.uid(), 'hr_manager'));

-- ==========================================
-- Jobs
-- ==========================================
CREATE TYPE public.job_status AS ENUM ('draft', 'open', 'on_hold', 'closed', 'filled');
CREATE TYPE public.job_priority AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  description TEXT,
  requirements TEXT,
  location TEXT,
  job_type TEXT, -- full-time, part-time, contract
  experience_min INTEGER,
  experience_max INTEGER,
  salary_min NUMERIC,
  salary_max NUMERIC,
  salary_currency TEXT DEFAULT 'INR',
  skills TEXT[] DEFAULT '{}',
  status job_status NOT NULL DEFAULT 'draft',
  priority job_priority NOT NULL DEFAULT 'medium',
  openings INTEGER DEFAULT 1,
  created_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Authenticated users can view jobs"
  ON public.jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Recruiters+ can create jobs"
  ON public.jobs FOR INSERT TO authenticated
  WITH CHECK (public.has_min_role(auth.uid(), 'recruiter'));
CREATE POLICY "Recruiters+ can update jobs"
  ON public.jobs FOR UPDATE TO authenticated
  USING (public.has_min_role(auth.uid(), 'recruiter'));
CREATE POLICY "Admins can delete jobs"
  ON public.jobs FOR DELETE TO authenticated
  USING (public.has_min_role(auth.uid(), 'admin'));

-- ==========================================
-- Candidates
-- ==========================================
CREATE TYPE public.candidate_status AS ENUM ('new', 'screening', 'shortlisted', 'interview', 'offered', 'hired', 'rejected', 'on_hold');

CREATE TABLE public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  location TEXT,
  current_company TEXT,
  current_designation TEXT,
  experience_years NUMERIC,
  skills TEXT[] DEFAULT '{}',
  education TEXT,
  resume_url TEXT,
  resume_parsed JSONB,
  status candidate_status NOT NULL DEFAULT 'new',
  source TEXT, -- portal, referral, linkedin, etc.
  notes TEXT,
  expected_salary NUMERIC,
  current_salary NUMERIC,
  notice_period TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_candidates_updated_at
  BEFORE UPDATE ON public.candidates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Authenticated users can view candidates"
  ON public.candidates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Recruiters+ can create candidates"
  ON public.candidates FOR INSERT TO authenticated
  WITH CHECK (public.has_min_role(auth.uid(), 'recruiter'));
CREATE POLICY "Recruiters+ can update candidates"
  ON public.candidates FOR UPDATE TO authenticated
  USING (public.has_min_role(auth.uid(), 'recruiter'));
CREATE POLICY "Admins can delete candidates"
  ON public.candidates FOR DELETE TO authenticated
  USING (public.has_min_role(auth.uid(), 'admin'));

-- ==========================================
-- Matches
-- ==========================================
CREATE TYPE public.match_status AS ENUM ('new', 'reviewed', 'shortlisted', 'rejected', 'hired');

CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  overall_score NUMERIC DEFAULT 0,
  skill_score NUMERIC DEFAULT 0,
  experience_score NUMERIC DEFAULT 0,
  education_score NUMERIC DEFAULT 0,
  location_score NUMERIC DEFAULT 0,
  salary_score NUMERIC DEFAULT 0,
  score_breakdown JSONB,
  status match_status NOT NULL DEFAULT 'new',
  notes TEXT,
  matched_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(candidate_id, job_id)
);
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Authenticated users can view matches"
  ON public.matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Recruiters+ can create matches"
  ON public.matches FOR INSERT TO authenticated
  WITH CHECK (public.has_min_role(auth.uid(), 'recruiter'));
CREATE POLICY "Recruiters+ can update matches"
  ON public.matches FOR UPDATE TO authenticated
  USING (public.has_min_role(auth.uid(), 'recruiter'));

-- ==========================================
-- Interviews
-- ==========================================
CREATE TYPE public.interview_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');

CREATE TABLE public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  interview_type TEXT DEFAULT 'in_person',
  location TEXT,
  meeting_link TEXT,
  interviewers TEXT[] DEFAULT '{}',
  status interview_status NOT NULL DEFAULT 'scheduled',
  feedback TEXT,
  rating INTEGER,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_interviews_updated_at
  BEFORE UPDATE ON public.interviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Authenticated users can view interviews"
  ON public.interviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Recruiters+ can manage interviews"
  ON public.interviews FOR ALL TO authenticated
  USING (public.has_min_role(auth.uid(), 'recruiter'));

-- ==========================================
-- Todos
-- ==========================================
CREATE TYPE public.todo_type AS ENUM ('general', 'interview_docs', 'company_contacts', 'background_verification');
CREATE TYPE public.todo_priority AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TABLE public.todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type todo_type NOT NULL DEFAULT 'general',
  priority todo_priority NOT NULL DEFAULT 'medium',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  is_sequential BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER DEFAULT 0,
  due_date TIMESTAMPTZ,
  assigned_to UUID REFERENCES auth.users(id),
  related_candidate_id UUID REFERENCES public.candidates(id) ON DELETE SET NULL,
  related_job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  related_company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  checklist JSONB DEFAULT '[]',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_todos_updated_at
  BEFORE UPDATE ON public.todos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Users can view own todos"
  ON public.todos FOR SELECT TO authenticated
  USING (assigned_to = auth.uid() OR created_by = auth.uid() OR public.has_min_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create todos"
  ON public.todos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own todos"
  ON public.todos FOR UPDATE TO authenticated
  USING (assigned_to = auth.uid() OR created_by = auth.uid() OR public.has_min_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete todos"
  ON public.todos FOR DELETE TO authenticated
  USING (public.has_min_role(auth.uid(), 'admin'));

-- ==========================================
-- Activity Logs
-- ==========================================
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view activity logs"
  ON public.activity_logs FOR SELECT TO authenticated
  USING (public.has_min_role(auth.uid(), 'admin'));
CREATE POLICY "Any authenticated user can insert logs"
  ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ==========================================
-- Verifications
-- ==========================================
CREATE TYPE public.verification_status AS ENUM ('pending', 'email_sent', 'verified', 'rejected');

CREATE TABLE public.verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.company_contacts(id) ON DELETE SET NULL,
  status verification_status NOT NULL DEFAULT 'pending',
  verification_type TEXT DEFAULT 'employment',
  notes TEXT,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_verifications_updated_at
  BEFORE UPDATE ON public.verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Authenticated users can view verifications"
  ON public.verifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Recruiters+ can manage verifications"
  ON public.verifications FOR ALL TO authenticated
  USING (public.has_min_role(auth.uid(), 'recruiter'));

-- ==========================================
-- Email Queue
-- ==========================================
CREATE TYPE public.email_status AS ENUM ('draft', 'pending_approval', 'approved', 'rejected', 'sent', 'failed');

CREATE TABLE public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  template_type TEXT,
  status email_status NOT NULL DEFAULT 'draft',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  related_candidate_id UUID REFERENCES public.candidates(id) ON DELETE SET NULL,
  related_job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_email_queue_updated_at
  BEFORE UPDATE ON public.email_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "HR+ can view emails"
  ON public.email_queue FOR SELECT TO authenticated
  USING (public.has_min_role(auth.uid(), 'hr_manager') OR created_by = auth.uid());
CREATE POLICY "Recruiters+ can create emails"
  ON public.email_queue FOR INSERT TO authenticated
  WITH CHECK (public.has_min_role(auth.uid(), 'recruiter'));
CREATE POLICY "HR+ can update emails"
  ON public.email_queue FOR UPDATE TO authenticated
  USING (public.has_min_role(auth.uid(), 'hr_manager') OR created_by = auth.uid());

-- ==========================================
-- Hired Candidates
-- ==========================================
CREATE TABLE public.hired_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  offer_salary NUMERIC,
  joining_date DATE,
  offer_date DATE,
  placement_fee NUMERIC,
  fee_percentage NUMERIC,
  fee_status TEXT DEFAULT 'pending',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hired_candidates ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_hired_candidates_updated_at
  BEFORE UPDATE ON public.hired_candidates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Authenticated users can view hired candidates"
  ON public.hired_candidates FOR SELECT TO authenticated USING (true);
CREATE POLICY "HR+ can manage hired candidates"
  ON public.hired_candidates FOR ALL TO authenticated
  USING (public.has_min_role(auth.uid(), 'hr_manager'));

-- ==========================================
-- HR Pipeline
-- ==========================================
CREATE TYPE public.hr_pipeline_status AS ENUM ('pending', 'sent', 'reviewed', 'accepted', 'rejected', 'opted_out');

CREATE TABLE public.hr_pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.company_contacts(id) ON DELETE SET NULL,
  status hr_pipeline_status NOT NULL DEFAULT 'pending',
  review_token TEXT UNIQUE,
  reviewed_at TIMESTAMPTZ,
  feedback TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hr_pipeline ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_hr_pipeline_updated_at
  BEFORE UPDATE ON public.hr_pipeline
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Authenticated users can view pipeline"
  ON public.hr_pipeline FOR SELECT TO authenticated USING (true);
CREATE POLICY "Recruiters+ can manage pipeline"
  ON public.hr_pipeline FOR ALL TO authenticated
  USING (public.has_min_role(auth.uid(), 'recruiter'));
-- Public access by token for HR review pages
CREATE POLICY "Public token access for reviews"
  ON public.hr_pipeline FOR SELECT TO anon
  USING (review_token IS NOT NULL);
CREATE POLICY "Public token update for reviews"
  ON public.hr_pipeline FOR UPDATE TO anon
  USING (review_token IS NOT NULL);

-- ==========================================
-- Money Alerts
-- ==========================================
CREATE TABLE public.money_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hired_candidate_id UUID REFERENCES public.hired_candidates(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- payment_due, invoice_sent, payment_received
  amount NUMERIC,
  due_date DATE,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.money_alerts ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_money_alerts_updated_at
  BEFORE UPDATE ON public.money_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "HR+ can view money alerts"
  ON public.money_alerts FOR SELECT TO authenticated
  USING (public.has_min_role(auth.uid(), 'hr_manager'));
CREATE POLICY "HR+ can manage money alerts"
  ON public.money_alerts FOR ALL TO authenticated
  USING (public.has_min_role(auth.uid(), 'hr_manager'));

-- ==========================================
-- Settings
-- ==========================================
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Authenticated users can view settings"
  ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can manage settings"
  ON public.settings FOR ALL TO authenticated
  USING (public.has_min_role(auth.uid(), 'super_admin'));
