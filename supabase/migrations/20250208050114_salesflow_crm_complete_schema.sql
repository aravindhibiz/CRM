-- Location: supabase/migrations/20250208050114_salesflow_crm_complete_schema.sql
-- Schema Analysis: Fresh project - no existing tables
-- Integration Type: Complete CRM system implementation
-- Dependencies: None - creating complete schema from scratch

-- 1. Extensions & Types
CREATE TYPE public.user_role AS ENUM ('admin', 'manager', 'sales_rep', 'user');
CREATE TYPE public.deal_stage AS ENUM ('lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost');
CREATE TYPE public.activity_type AS ENUM ('email', 'call', 'meeting', 'note', 'task', 'demo', 'proposal_sent', 'document_shared');
CREATE TYPE public.contact_status AS ENUM ('active', 'inactive', 'prospect', 'customer');
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.document_type AS ENUM ('proposal', 'contract', 'presentation', 'other');
CREATE TYPE public.lead_source AS ENUM ('website', 'referral', 'cold_call', 'email_campaign', 'social_media', 'event', 'partner', 'other');

-- 2. Core Tables (no foreign keys)

-- Critical intermediary table for auth
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    role public.user_role DEFAULT 'sales_rep'::public.user_role,
    phone TEXT,
    avatar_url TEXT,
    territory TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Companies/Organizations
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    domain TEXT,
    industry TEXT,
    size_range TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'US',
    phone TEXT,
    website TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Dependent Tables (with foreign keys)

-- Contacts
CREATE TABLE public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    owner_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    email TEXT,
    phone TEXT,
    mobile TEXT,
    position TEXT,
    department TEXT,
    status public.contact_status DEFAULT 'prospect'::public.contact_status,
    lead_source public.lead_source,
    avatar_url TEXT,
    linkedin_url TEXT,
    twitter_url TEXT,
    notes TEXT,
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}',
    last_contact_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Deals/Opportunities
CREATE TABLE public.deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    owner_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    stage public.deal_stage DEFAULT 'lead'::public.deal_stage,
    value DECIMAL(12,2) NOT NULL DEFAULT 0,
    probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
    expected_close_date DATE,
    actual_close_date DATE,
    lead_source public.lead_source,
    description TEXT,
    next_step TEXT,
    competitor_info TEXT,
    custom_fields JSONB DEFAULT '{}',
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Activities (emails, calls, meetings, notes, etc.)
CREATE TABLE public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    type public.activity_type NOT NULL,
    subject TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER,
    completed_at TIMESTAMPTZ,
    scheduled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tasks and Reminders
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status public.task_status DEFAULT 'pending'::public.task_status,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Documents and Files
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT,
    document_type public.document_type DEFAULT 'other'::public.document_type,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Email Templates
CREATE TABLE public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Pipeline Settings
CREATE TABLE public.pipeline_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    stage_order JSONB DEFAULT '["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"]',
    stage_probabilities JSONB DEFAULT '{"lead": 10, "qualified": 25, "proposal": 50, "negotiation": 75, "closed_won": 100, "closed_lost": 0}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Essential Indexes
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX idx_companies_name ON public.companies(name);
CREATE INDEX idx_companies_domain ON public.companies(domain);
CREATE INDEX idx_contacts_owner_id ON public.contacts(owner_id);
CREATE INDEX idx_contacts_company_id ON public.contacts(company_id);
CREATE INDEX idx_contacts_email ON public.contacts(email);
CREATE INDEX idx_contacts_full_name ON public.contacts(full_name);
CREATE INDEX idx_deals_owner_id ON public.deals(owner_id);
CREATE INDEX idx_deals_company_id ON public.deals(company_id);
CREATE INDEX idx_deals_contact_id ON public.deals(contact_id);
CREATE INDEX idx_deals_stage ON public.deals(stage);
CREATE INDEX idx_deals_expected_close_date ON public.deals(expected_close_date);
CREATE INDEX idx_activities_deal_id ON public.activities(deal_id);
CREATE INDEX idx_activities_contact_id ON public.activities(contact_id);
CREATE INDEX idx_activities_user_id ON public.activities(user_id);
CREATE INDEX idx_activities_type ON public.activities(type);
CREATE INDEX idx_activities_created_at ON public.activities(created_at DESC);
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_documents_deal_id ON public.documents(deal_id);
CREATE INDEX idx_documents_contact_id ON public.documents(contact_id);

-- 5. RLS Setup
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_settings ENABLE ROW LEVEL SECURITY;

-- 6. Helper Functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid() 
    AND (au.raw_user_meta_data->>'role' = 'admin' 
         OR au.raw_app_meta_data->>'role' = 'admin')
)
$$;

CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() AND up.role::TEXT = required_role
)
$$;

-- 7. RLS Policies using corrected patterns

-- Pattern 1: Core user table - simple, no functions
CREATE POLICY "users_manage_own_user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Pattern 2: Simple user ownership
CREATE POLICY "users_manage_own_contacts"
ON public.contacts
FOR ALL
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "users_manage_own_deals"
ON public.deals
FOR ALL
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "users_manage_own_activities"
ON public.activities
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_manage_assigned_tasks"
ON public.tasks
FOR ALL
TO authenticated
USING (assigned_to = auth.uid() OR created_by = auth.uid())
WITH CHECK (assigned_to = auth.uid() OR created_by = auth.uid());

CREATE POLICY "users_manage_own_documents"
ON public.documents
FOR ALL
TO authenticated
USING (uploaded_by = auth.uid())
WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "users_manage_own_email_templates"
ON public.email_templates
FOR ALL
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "users_manage_own_pipeline_settings"
ON public.pipeline_settings
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Pattern 4: Public read, private write for companies (shared resource)
CREATE POLICY "public_can_read_companies"
ON public.companies
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "authenticated_can_create_companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "authenticated_can_update_companies"
ON public.companies
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 8. Functions for automatic profile creation and updates
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id, 
    email, 
    first_name, 
    last_name, 
    role
  )
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'sales_rep'::public.user_role)
  );
  RETURN NEW;
END;
$$;

-- Update function for user profiles
CREATE OR REPLACE FUNCTION public.handle_user_updated()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.user_profiles
  SET
    email = NEW.email,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- 9. Triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_updated();

-- Updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_pipeline_settings_updated_at
  BEFORE UPDATE ON public.pipeline_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 10. Complete Mock Data
DO $$
DECLARE
    admin_uuid UUID := gen_random_uuid();
    sales_rep1_uuid UUID := gen_random_uuid();
    sales_rep2_uuid UUID := gen_random_uuid();
    company1_uuid UUID := gen_random_uuid();
    company2_uuid UUID := gen_random_uuid();
    company3_uuid UUID := gen_random_uuid();
    contact1_uuid UUID := gen_random_uuid();
    contact2_uuid UUID := gen_random_uuid();
    contact3_uuid UUID := gen_random_uuid();
    deal1_uuid UUID := gen_random_uuid();
    deal2_uuid UUID := gen_random_uuid();
    deal3_uuid UUID := gen_random_uuid();
BEGIN
    -- Create auth users with required fields
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES
        (admin_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'admin@salesflow.com', crypt('password123', gen_salt('bf', 10)), now(), now(), now(),
         '{"first_name": "Admin", "last_name": "User", "role": "admin"}'::jsonb, 
         '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (sales_rep1_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'john.smith@salesflow.com', crypt('password123', gen_salt('bf', 10)), now(), now(), now(),
         '{"first_name": "John", "last_name": "Smith", "role": "sales_rep"}'::jsonb, 
         '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (sales_rep2_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'sarah.johnson@salesflow.com', crypt('password123', gen_salt('bf', 10)), now(), now(), now(),
         '{"first_name": "Sarah", "last_name": "Johnson", "role": "sales_rep"}'::jsonb, 
         '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null);

    -- Create companies
    INSERT INTO public.companies (id, name, industry, domain, size_range, city, state, phone, website, description)
    VALUES
        (company1_uuid, 'Acme Corporation', 'Technology', 'acmecorp.com', '500-1000', 'San Francisco', 'CA', 
         '+1 (555) 123-4567', 'https://acmecorp.com', 'Leading technology solutions provider'),
        (company2_uuid, 'Global Systems Ltd', 'Manufacturing', 'globalsys.com', '1000+', 'Chicago', 'IL',
         '+1 (555) 987-6543', 'https://globalsys.com', 'Industrial automation and systems integration'),
        (company3_uuid, 'StartupXYZ', 'SaaS', 'startupxyz.com', '10-50', 'Austin', 'TX',
         '+1 (555) 456-7890', 'https://startupxyz.com', 'Innovative productivity software startup');

    -- Create contacts
    INSERT INTO public.contacts (id, company_id, owner_id, first_name, last_name, email, phone, position, 
                                status, lead_source, linkedin_url, notes, tags, last_contact_date)
    VALUES
        (contact1_uuid, company1_uuid, sales_rep1_uuid, 'Michael', 'Chen', 'michael.chen@acmecorp.com', 
         '+1 (555) 123-4568', 'Chief Technology Officer', 'active', 'website',
         'linkedin.com/in/michaelchen', 'Primary technical decision maker', 
         ARRAY['enterprise', 'tech', 'decision-maker'], now() - interval '2 hours'),
        (contact2_uuid, company2_uuid, sales_rep2_uuid, 'Emily', 'Rodriguez', 'emily.r@globalsys.com',
         '+1 (555) 987-6544', 'VP of Operations', 'active', 'referral',
         'linkedin.com/in/emilyrodriguez', 'Interested in automation solutions',
         ARRAY['manufacturing', 'operations', 'mid-market'], now() - interval '1 day'),
        (contact3_uuid, company3_uuid, sales_rep1_uuid, 'Alex', 'Martinez', 'alex@startupxyz.com',
         '+1 (555) 456-7891', 'Founder & CEO', 'prospect', 'cold_call',
         'linkedin.com/in/alexmartinez', 'Young entrepreneur, budget conscious',
         ARRAY['startup', 'ceo', 'cost-sensitive'], now() - interval '3 days');

    -- Create deals
    INSERT INTO public.deals (id, name, company_id, contact_id, owner_id, stage, value, probability, 
                             expected_close_date, lead_source, description, next_step, tags)
    VALUES
        (deal1_uuid, 'Enterprise Software License - Acme Corp', company1_uuid, contact1_uuid, sales_rep1_uuid,
         'proposal', 125000, 75, '2025-03-15', 'website',
         'Comprehensive enterprise software solution with implementation and training',
         'Schedule technical review meeting with IT team',
         ARRAY['enterprise', 'software', 'high-value']),
        (deal2_uuid, 'Automation Platform - Global Systems', company2_uuid, contact2_uuid, sales_rep2_uuid,
         'negotiation', 180000, 85, '2025-02-28', 'referral',
         'Manufacturing automation and process optimization platform',
         'Final contract negotiations and pricing approval',
         ARRAY['manufacturing', 'automation', 'large-deal']),
        (deal3_uuid, 'Growth Package - StartupXYZ', company3_uuid, contact3_uuid, sales_rep1_uuid,
         'qualified', 35000, 40, '2025-04-30', 'cold_call',
         'Small business growth package with basic features',
         'Prepare customized proposal within budget constraints',
         ARRAY['startup', 'growth', 'budget-conscious']);

    -- Create activities
    INSERT INTO public.activities (deal_id, contact_id, user_id, type, subject, description, duration_minutes, created_at)
    VALUES
        (deal1_uuid, contact1_uuid, sales_rep1_uuid, 'email', 'Proposal sent - Enterprise License',
         'Sent comprehensive proposal with pricing breakdown and implementation timeline', null,
         now() - interval '2 hours'),
        (deal1_uuid, contact1_uuid, sales_rep1_uuid, 'call', 'Discovery call with CTO',
         'Discussed technical requirements, security compliance, and integration needs', 45,
         now() - interval '2 days'),
        (deal2_uuid, contact2_uuid, sales_rep2_uuid, 'meeting', 'On-site demonstration',
         'Live demo of automation features to operations team', 90,
         now() - interval '1 day'),
        (deal3_uuid, contact3_uuid, sales_rep1_uuid, 'call', 'Budget discussion',
         'Explored flexible pricing options and payment terms', 30,
         now() - interval '3 days');

    -- Create tasks
    INSERT INTO public.tasks (deal_id, contact_id, assigned_to, created_by, title, description, priority, due_date, status)
    VALUES
        (deal1_uuid, contact1_uuid, sales_rep1_uuid, admin_uuid, 'Follow up on proposal',
         'Check if technical team has reviewed the proposal', 'high', now() + interval '1 day', 'pending'),
        (deal2_uuid, contact2_uuid, sales_rep2_uuid, admin_uuid, 'Prepare final contract',
         'Draft final contract terms based on negotiation outcomes', 'urgent', now() + interval '2 days', 'pending'),
        (deal3_uuid, contact3_uuid, sales_rep1_uuid, admin_uuid, 'Create budget-friendly proposal',
         'Prepare scaled-down proposal within startup budget', 'medium', now() + interval '1 week', 'pending');

    -- Create sample email templates
    INSERT INTO public.email_templates (created_by, name, subject, body)
    VALUES
        (admin_uuid, 'Follow-up Template', 'Following up on our conversation',
         'Hi {{first_name}},\n\nI wanted to follow up on our recent conversation about {{company_name}}''s needs.\n\nBest regards,\n{{sender_name}}'),
        (admin_uuid, 'Proposal Sent', 'Proposal for {{company_name}}',
         'Hello {{first_name}},\n\nPlease find attached our proposal for {{deal_name}}.\n\nLet me know if you have any questions.\n\nBest,\n{{sender_name}}');

    -- Create pipeline settings for users
    INSERT INTO public.pipeline_settings (user_id, stage_order, stage_probabilities)
    VALUES
        (sales_rep1_uuid, 
         '["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"]',
         '{"lead": 10, "qualified": 25, "proposal": 50, "negotiation": 75, "closed_won": 100, "closed_lost": 0}'),
        (sales_rep2_uuid,
         '["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"]', 
         '{"lead": 15, "qualified": 30, "proposal": 60, "negotiation": 80, "closed_won": 100, "closed_lost": 0}');

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'Foreign key error: %', SQLERRM;
    WHEN unique_violation THEN
        RAISE NOTICE 'Unique constraint error: %', SQLERRM;
    WHEN OTHERS THEN
        RAISE NOTICE 'Unexpected error: %', SQLERRM;
END $$;