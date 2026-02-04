CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'super_admin',
    'admin',
    'editor',
    'user'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: is_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'super_admin')
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: admin_ads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_ads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
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


--
-- Name: admin_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    actor_id uuid NOT NULL,
    action text NOT NULL,
    resource_type text,
    resource_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: admin_content; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_content (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    content_type text NOT NULL,
    title text NOT NULL,
    title_arabic text,
    content text,
    content_arabic text,
    category text,
    audio_url text,
    pdf_url text,
    image_url text,
    is_published boolean DEFAULT false,
    order_index integer DEFAULT 0,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'draft'::text NOT NULL,
    scheduled_at timestamp with time zone,
    published_at timestamp with time zone,
    current_version_id uuid,
    approval_required boolean DEFAULT true NOT NULL,
    approved_by uuid,
    approved_at timestamp with time zone,
    content_pronunciation text,
    title_en text,
    title_hi text,
    title_ur text,
    content_en text,
    content_hi text,
    content_ur text,
    CONSTRAINT admin_content_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'in_review'::text, 'scheduled'::text, 'published'::text, 'archived'::text])))
);


--
-- Name: admin_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    target_role public.app_role,
    target_user_ids uuid[],
    scheduled_at timestamp with time zone,
    sent_at timestamp with time zone,
    status text DEFAULT 'draft'::text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: app_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    setting_key text NOT NULL,
    setting_value jsonb NOT NULL,
    description text,
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: content_approvals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_approvals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    content_id uuid NOT NULL,
    version_id uuid,
    requested_by uuid NOT NULL,
    approved_by uuid,
    status text NOT NULL,
    reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT content_approvals_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


--
-- Name: content_review_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_review_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    content_id uuid NOT NULL,
    actor_id uuid NOT NULL,
    comment text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: content_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    content_id uuid NOT NULL,
    version_number integer NOT NULL,
    title text NOT NULL,
    title_arabic text,
    content text,
    content_arabic text,
    metadata jsonb DEFAULT '{}'::jsonb,
    change_summary text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: role_capabilities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_capabilities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role public.app_role NOT NULL,
    capability text NOT NULL,
    allowed boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_activity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_activity (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    activity_type text NOT NULL,
    activity_data jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_mfa_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_mfa_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    is_mfa_enabled boolean DEFAULT false NOT NULL,
    method text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: admin_ads admin_ads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_ads
    ADD CONSTRAINT admin_ads_pkey PRIMARY KEY (id);


--
-- Name: admin_audit_log admin_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_audit_log
    ADD CONSTRAINT admin_audit_log_pkey PRIMARY KEY (id);


--
-- Name: admin_content admin_content_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_content
    ADD CONSTRAINT admin_content_pkey PRIMARY KEY (id);


--
-- Name: admin_notifications admin_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_notifications
    ADD CONSTRAINT admin_notifications_pkey PRIMARY KEY (id);


--
-- Name: app_settings app_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (id);


--
-- Name: app_settings app_settings_setting_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_setting_key_key UNIQUE (setting_key);


--
-- Name: content_approvals content_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_approvals
    ADD CONSTRAINT content_approvals_pkey PRIMARY KEY (id);


--
-- Name: content_review_comments content_review_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_review_comments
    ADD CONSTRAINT content_review_comments_pkey PRIMARY KEY (id);


--
-- Name: content_versions content_versions_content_id_version_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_versions
    ADD CONSTRAINT content_versions_content_id_version_number_key UNIQUE (content_id, version_number);


--
-- Name: content_versions content_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_versions
    ADD CONSTRAINT content_versions_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: role_capabilities role_capabilities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_capabilities
    ADD CONSTRAINT role_capabilities_pkey PRIMARY KEY (id);


--
-- Name: role_capabilities role_capabilities_role_capability_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_capabilities
    ADD CONSTRAINT role_capabilities_role_capability_key UNIQUE (role, capability);


--
-- Name: user_activity user_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_activity
    ADD CONSTRAINT user_activity_pkey PRIMARY KEY (id);


--
-- Name: user_mfa_settings user_mfa_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_mfa_settings
    ADD CONSTRAINT user_mfa_settings_pkey PRIMARY KEY (id);


--
-- Name: user_mfa_settings user_mfa_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_mfa_settings
    ADD CONSTRAINT user_mfa_settings_user_id_key UNIQUE (user_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_admin_ads_platform; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_ads_platform ON public.admin_ads USING btree (platform);


--
-- Name: idx_admin_ads_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_ads_priority ON public.admin_ads USING btree (priority);


--
-- Name: idx_admin_ads_schedule; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_ads_schedule ON public.admin_ads USING btree (start_at, end_at);


--
-- Name: idx_admin_ads_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_ads_status ON public.admin_ads USING btree (status);


--
-- Name: idx_admin_ads_zone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_ads_zone ON public.admin_ads USING btree (zone);


--
-- Name: idx_admin_content_published; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_content_published ON public.admin_content USING btree (is_published);


--
-- Name: idx_admin_content_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_content_type ON public.admin_content USING btree (content_type);


--
-- Name: idx_user_activity_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_activity_created_at ON public.user_activity USING btree (created_at DESC);


--
-- Name: idx_user_activity_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_activity_user_id ON public.user_activity USING btree (user_id);


--
-- Name: idx_user_roles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);


--
-- Name: admin_ads update_admin_ads_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_admin_ads_updated_at BEFORE UPDATE ON public.admin_ads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: admin_audit_log admin_audit_log_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_audit_log
    ADD CONSTRAINT admin_audit_log_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.profiles(id);


--
-- Name: admin_content admin_content_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_content
    ADD CONSTRAINT admin_content_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: admin_content admin_content_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_content
    ADD CONSTRAINT admin_content_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: admin_content admin_content_current_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_content
    ADD CONSTRAINT admin_content_current_version_id_fkey FOREIGN KEY (current_version_id) REFERENCES public.content_versions(id) ON DELETE SET NULL;


--
-- Name: admin_notifications admin_notifications_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_notifications
    ADD CONSTRAINT admin_notifications_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: app_settings app_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: content_approvals content_approvals_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_approvals
    ADD CONSTRAINT content_approvals_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.profiles(id);


--
-- Name: content_approvals content_approvals_content_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_approvals
    ADD CONSTRAINT content_approvals_content_id_fkey FOREIGN KEY (content_id) REFERENCES public.admin_content(id) ON DELETE CASCADE;


--
-- Name: content_approvals content_approvals_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_approvals
    ADD CONSTRAINT content_approvals_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.profiles(id);


--
-- Name: content_approvals content_approvals_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_approvals
    ADD CONSTRAINT content_approvals_version_id_fkey FOREIGN KEY (version_id) REFERENCES public.content_versions(id) ON DELETE SET NULL;


--
-- Name: content_review_comments content_review_comments_content_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_review_comments
    ADD CONSTRAINT content_review_comments_content_id_fkey FOREIGN KEY (content_id) REFERENCES public.admin_content(id) ON DELETE CASCADE;


--
-- Name: content_versions content_versions_content_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_versions
    ADD CONSTRAINT content_versions_content_id_fkey FOREIGN KEY (content_id) REFERENCES public.admin_content(id) ON DELETE CASCADE;


--
-- Name: content_versions content_versions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_versions
    ADD CONSTRAINT content_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_activity user_activity_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_activity
    ADD CONSTRAINT user_activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: admin_content Admins and editors can manage content; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and editors can manage content" ON public.admin_content USING ((public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'editor'::public.app_role))) WITH CHECK ((public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'editor'::public.app_role)));


--
-- Name: content_approvals Admins and editors manage content approvals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and editors manage content approvals" ON public.content_approvals USING ((public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'editor'::public.app_role))) WITH CHECK ((public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'editor'::public.app_role)));


--
-- Name: content_versions Admins and editors manage content versions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and editors manage content versions" ON public.content_versions USING ((public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'editor'::public.app_role))) WITH CHECK ((public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'editor'::public.app_role)));


--
-- Name: content_review_comments Admins and editors manage review comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and editors manage review comments" ON public.content_review_comments USING ((public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'editor'::public.app_role))) WITH CHECK ((public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'editor'::public.app_role)));


--
-- Name: admin_ads Admins can delete ads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete ads" ON public.admin_ads FOR DELETE USING (public.is_admin(auth.uid()));


--
-- Name: admin_ads Admins can insert ads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert ads" ON public.admin_ads FOR INSERT WITH CHECK (public.is_admin(auth.uid()));


--
-- Name: admin_notifications Admins can manage notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage notifications" ON public.admin_notifications USING (public.is_admin(auth.uid()));


--
-- Name: app_settings Admins can manage settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage settings" ON public.app_settings USING (public.is_admin(auth.uid()));


--
-- Name: admin_ads Admins can update ads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update ads" ON public.admin_ads FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));


--
-- Name: user_activity Admins can view all activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all activity" ON public.user_activity FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: user_mfa_settings Admins can view all mfa settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all mfa settings" ON public.user_mfa_settings FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: admin_audit_log Admins can view audit log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view audit log" ON public.admin_audit_log FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: admin_audit_log Anyone can insert own audit log entry; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert own audit log entry" ON public.admin_audit_log FOR INSERT WITH CHECK ((auth.uid() = actor_id));


--
-- Name: admin_content Anyone can view published content; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view published content" ON public.admin_content FOR SELECT USING (((is_published = true) OR public.is_admin(auth.uid())));


--
-- Name: content_review_comments Anyone can view review comments for published content; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view review comments for published content" ON public.content_review_comments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.admin_content c
  WHERE ((c.id = content_review_comments.content_id) AND ((c.is_published = true) OR public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'editor'::public.app_role))))));


--
-- Name: role_capabilities Anyone can view role capabilities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view role capabilities" ON public.role_capabilities FOR SELECT USING (true);


--
-- Name: app_settings Anyone can view settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view settings" ON public.app_settings FOR SELECT USING (true);


--
-- Name: admin_ads Public can read active scheduled ads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can read active scheduled ads" ON public.admin_ads FOR SELECT USING (((status = 'active'::text) AND ((start_at IS NULL) OR (start_at <= now())) AND ((end_at IS NULL) OR (end_at >= now()))));


--
-- Name: user_roles Super admins can manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can manage roles" ON public.user_roles USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));


--
-- Name: role_capabilities Super admins manage role capabilities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins manage role capabilities" ON public.role_capabilities USING (public.has_role(auth.uid(), 'super_admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));


--
-- Name: user_activity Users can insert own activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own activity" ON public.user_activity FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: profiles Users can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);


--
-- Name: user_mfa_settings Users manage own mfa settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own mfa settings" ON public.user_mfa_settings USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: admin_ads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_ads ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_content; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_content ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: app_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: content_approvals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.content_approvals ENABLE ROW LEVEL SECURITY;

--
-- Name: content_review_comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.content_review_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: content_versions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.content_versions ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: role_capabilities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.role_capabilities ENABLE ROW LEVEL SECURITY;

--
-- Name: user_activity; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

--
-- Name: user_mfa_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_mfa_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;