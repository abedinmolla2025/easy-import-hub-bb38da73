-- Create app_role enum type
CREATE TYPE public.app_role AS ENUM (
    'super_admin',
    'admin',
    'editor',
    'user'
);

-- Create update_updated_at_column function
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

-- Create profiles table
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY,
    email text,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role),
    CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);

-- Create has_role function (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'super_admin')
  )
$$;

-- Create handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );

  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create user_activity table
CREATE TABLE public.user_activity (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid,
    activity_type text NOT NULL,
    activity_data jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_activity_user_id ON public.user_activity USING btree (user_id);
CREATE INDEX idx_user_activity_created_at ON public.user_activity USING btree (created_at DESC);

-- Create user_mfa_settings table
CREATE TABLE public.user_mfa_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE,
    is_mfa_enabled boolean DEFAULT false NOT NULL,
    method text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create admin_content table
CREATE TABLE public.admin_content (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    content_type text NOT NULL,
    title text NOT NULL,
    title_arabic text,
    title_en text,
    title_hi text,
    title_ur text,
    content text,
    content_arabic text,
    content_en text,
    content_hi text,
    content_ur text,
    content_pronunciation text,
    category text,
    audio_url text,
    pdf_url text,
    image_url text,
    is_published boolean DEFAULT false,
    order_index integer DEFAULT 0,
    metadata jsonb DEFAULT '{}'::jsonb,
    status text DEFAULT 'draft'::text NOT NULL,
    scheduled_at timestamp with time zone,
    published_at timestamp with time zone,
    current_version_id uuid,
    approval_required boolean DEFAULT true NOT NULL,
    approved_by uuid,
    approved_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT admin_content_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'in_review'::text, 'scheduled'::text, 'published'::text, 'archived'::text]))),
    CONSTRAINT admin_content_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

CREATE INDEX idx_admin_content_published ON public.admin_content USING btree (is_published);
CREATE INDEX idx_admin_content_type ON public.admin_content USING btree (content_type);

-- Create content_versions table
CREATE TABLE public.content_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    content_id uuid NOT NULL,
    version_number integer NOT NULL,
    title text NOT NULL,
    title_arabic text,
    content text,
    content_arabic text,
    metadata jsonb DEFAULT '{}'::jsonb,
    change_summary text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid NOT NULL,
    CONSTRAINT content_versions_content_id_version_number_key UNIQUE (content_id, version_number),
    CONSTRAINT content_versions_content_id_fkey FOREIGN KEY (content_id) REFERENCES public.admin_content(id) ON DELETE CASCADE,
    CONSTRAINT content_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

-- Add foreign key for admin_content.current_version_id
ALTER TABLE public.admin_content
    ADD CONSTRAINT admin_content_current_version_id_fkey FOREIGN KEY (current_version_id) REFERENCES public.content_versions(id) ON DELETE SET NULL;

-- Add foreign key for admin_content.approved_by
ALTER TABLE public.admin_content
    ADD CONSTRAINT admin_content_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create content_approvals table
CREATE TABLE public.content_approvals (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    content_id uuid NOT NULL,
    version_id uuid,
    requested_by uuid NOT NULL,
    approved_by uuid,
    status text NOT NULL,
    reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT content_approvals_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]))),
    CONSTRAINT content_approvals_content_id_fkey FOREIGN KEY (content_id) REFERENCES public.admin_content(id) ON DELETE CASCADE,
    CONSTRAINT content_approvals_version_id_fkey FOREIGN KEY (version_id) REFERENCES public.content_versions(id) ON DELETE SET NULL,
    CONSTRAINT content_approvals_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.profiles(id),
    CONSTRAINT content_approvals_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.profiles(id)
);

-- Create content_review_comments table
CREATE TABLE public.content_review_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    content_id uuid NOT NULL,
    actor_id uuid NOT NULL,
    comment text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT content_review_comments_content_id_fkey FOREIGN KEY (content_id) REFERENCES public.admin_content(id) ON DELETE CASCADE
);

-- Create admin_ads table
CREATE TABLE public.admin_ads (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text NOT NULL,
    zone text NOT NULL,
    platform text DEFAULT 'both'::text NOT NULL,
    ad_type text NOT NULL,
    ad_code text NOT NULL,
    status text DEFAULT 'paused'::text NOT NULL,
    start_at timestamp with time zone,
    end_at timestamp with time zone,
    priority integer DEFAULT 1 NOT NULL,
    frequency integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT admin_ads_ad_type_check CHECK ((ad_type = ANY (ARRAY['html'::text, 'script'::text, 'image'::text, 'admob'::text]))),
    CONSTRAINT admin_ads_platform_check CHECK ((platform = ANY (ARRAY['web'::text, 'android'::text, 'both'::text]))),
    CONSTRAINT admin_ads_status_check CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text]))),
    CONSTRAINT admin_ads_zone_check CHECK ((zone = ANY (ARRAY['HOME_TOP'::text, 'DUA_INLINE'::text, 'QURAN_BOTTOM'::text, 'ARTICLE_SIDEBAR'::text, 'FULLSCREEN_SPLASH'::text])))
);

CREATE INDEX idx_admin_ads_platform ON public.admin_ads USING btree (platform);
CREATE INDEX idx_admin_ads_priority ON public.admin_ads USING btree (priority);
CREATE INDEX idx_admin_ads_schedule ON public.admin_ads USING btree (start_at, end_at);
CREATE INDEX idx_admin_ads_status ON public.admin_ads USING btree (status);
CREATE INDEX idx_admin_ads_zone ON public.admin_ads USING btree (zone);

-- Create trigger for admin_ads updated_at
CREATE TRIGGER update_admin_ads_updated_at 
  BEFORE UPDATE ON public.admin_ads 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create admin_notifications table
CREATE TABLE public.admin_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text NOT NULL,
    message text NOT NULL,
    target_role public.app_role,
    target_user_ids uuid[],
    scheduled_at timestamp with time zone,
    sent_at timestamp with time zone,
    status text DEFAULT 'draft'::text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT admin_notifications_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

-- Create admin_audit_log table
CREATE TABLE public.admin_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    actor_id uuid NOT NULL,
    action text NOT NULL,
    resource_type text,
    resource_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT admin_audit_log_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.profiles(id)
);

-- Create app_settings table
CREATE TABLE public.app_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    setting_key text NOT NULL UNIQUE,
    setting_value jsonb NOT NULL,
    description text,
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT app_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);

-- Create role_capabilities table
CREATE TABLE public.role_capabilities (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    role public.app_role NOT NULL,
    capability text NOT NULL,
    allowed boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT role_capabilities_role_capability_key UNIQUE (role, capability)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mfa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_capabilities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));

-- RLS Policies for user_roles
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Super admins can manage roles" ON public.user_roles USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- RLS Policies for user_activity
CREATE POLICY "Users can insert own activity" ON public.user_activity FOR INSERT WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Admins can view all activity" ON public.user_activity FOR SELECT USING (public.is_admin(auth.uid()));

-- RLS Policies for user_mfa_settings
CREATE POLICY "Users manage own mfa settings" ON public.user_mfa_settings USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Admins can view all mfa settings" ON public.user_mfa_settings FOR SELECT USING (public.is_admin(auth.uid()));

-- RLS Policies for admin_content
CREATE POLICY "Anyone can view published content" ON public.admin_content FOR SELECT USING (((is_published = true) OR public.is_admin(auth.uid())));
CREATE POLICY "Admins and editors can manage content" ON public.admin_content USING ((public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'editor'::public.app_role))) WITH CHECK ((public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'editor'::public.app_role)));

-- RLS Policies for content_versions
CREATE POLICY "Admins and editors manage content versions" ON public.content_versions USING ((public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'editor'::public.app_role))) WITH CHECK ((public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'editor'::public.app_role)));

-- RLS Policies for content_approvals
CREATE POLICY "Admins and editors manage content approvals" ON public.content_approvals USING ((public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'editor'::public.app_role))) WITH CHECK ((public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'editor'::public.app_role)));

-- RLS Policies for content_review_comments
CREATE POLICY "Admins and editors manage review comments" ON public.content_review_comments USING ((public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'editor'::public.app_role))) WITH CHECK ((public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'editor'::public.app_role)));
CREATE POLICY "Anyone can view review comments for published content" ON public.content_review_comments FOR SELECT USING ((EXISTS ( SELECT 1 FROM public.admin_content c WHERE ((c.id = content_review_comments.content_id) AND ((c.is_published = true) OR public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'editor'::public.app_role))))));

-- RLS Policies for admin_ads
CREATE POLICY "Public can read active scheduled ads" ON public.admin_ads FOR SELECT USING (((status = 'active'::text) AND ((start_at IS NULL) OR (start_at <= now())) AND ((end_at IS NULL) OR (end_at >= now()))));
CREATE POLICY "Admins can insert ads" ON public.admin_ads FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update ads" ON public.admin_ads FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete ads" ON public.admin_ads FOR DELETE USING (public.is_admin(auth.uid()));

-- RLS Policies for admin_notifications
CREATE POLICY "Admins can manage notifications" ON public.admin_notifications USING (public.is_admin(auth.uid()));

-- RLS Policies for admin_audit_log
CREATE POLICY "Admins can view audit log" ON public.admin_audit_log FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Anyone can insert own audit log entry" ON public.admin_audit_log FOR INSERT WITH CHECK ((auth.uid() = actor_id));

-- RLS Policies for app_settings
CREATE POLICY "Anyone can view settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON public.app_settings USING (public.is_admin(auth.uid()));

-- RLS Policies for role_capabilities
CREATE POLICY "Anyone can view role capabilities" ON public.role_capabilities FOR SELECT USING (true);
CREATE POLICY "Super admins manage role capabilities" ON public.role_capabilities USING (public.has_role(auth.uid(), 'super_admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));