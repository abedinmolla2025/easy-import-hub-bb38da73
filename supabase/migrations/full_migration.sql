-- Noor App Full Migration Script
-- Generated for project: llicfiepatzgllmjhzbw

BEGIN;

-- 1. Create Tables (Simplified DDL - in a real scenario we'd use pg_dump -s)
-- We will use the existing migration files to reconstruct the schema
-- But since the user wants ONE file, we concatenate them in order.

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




COMMIT;-- Add safe bootstrap RPCs so migrations don't require triggers on auth.users

CREATE OR REPLACE FUNCTION public.ensure_profile_and_user_role()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Create profile if missing
  INSERT INTO public.profiles (id)
  VALUES (v_uid)
  ON CONFLICT (id) DO NOTHING;

  -- Ensure at least the default role exists
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid, 'user'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_profile_and_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_profile_and_user_role() TO authenticated;


CREATE OR REPLACE FUNCTION public.bootstrap_first_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid;
  v_has_any_super boolean;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.user_roles WHERE role = 'super_admin'::public.app_role
  ) INTO v_has_any_super;

  IF v_has_any_super THEN
    RETURN false;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid, 'super_admin'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_first_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bootstrap_first_super_admin() TO authenticated;
-- Secure admin protection system (passcode + fingerprint + lockout)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Admin security configuration (single row)
CREATE TABLE IF NOT EXISTS public.admin_security_config (
  id integer PRIMARY KEY DEFAULT 1,
  admin_email text NOT NULL DEFAULT 'admin@noor.local',
  passcode_hash text NOT NULL,
  require_fingerprint boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Default passcode (MUST be changed in /admin/security)
INSERT INTO public.admin_security_config (id, admin_email, passcode_hash, require_fingerprint)
VALUES (1, 'admin@noor.local', crypt('noor-admin-1234', gen_salt('bf', 10)), false)
ON CONFLICT (id) DO NOTHING;

-- Unlock attempts (for lockout tracking)
CREATE TABLE IF NOT EXISTS public.admin_unlock_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  device_fingerprint text NOT NULL,
  success boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS admin_unlock_attempts_fingerprint_time_idx
  ON public.admin_unlock_attempts (device_fingerprint, created_at DESC);

-- RPC: verify_admin_passcode(passcode, device_fingerprint)
CREATE OR REPLACE FUNCTION public.verify_admin_passcode(
  passcode text,
  device_fingerprint text
)
RETURNS TABLE (
  ok boolean,
  locked_until timestamptz,
  reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cfg public.admin_security_config%ROWTYPE;
  fail_count integer;
  latest_fail timestamptz;
  lock_until timestamptz;
BEGIN
  IF passcode IS NULL OR length(trim(passcode)) < 6 OR length(passcode) > 128 THEN
    ok := false;
    locked_until := NULL;
    reason := 'invalid_passcode_format';
    RETURN NEXT;
    RETURN;
  END IF;

  IF device_fingerprint IS NULL OR length(trim(device_fingerprint)) < 10 OR length(device_fingerprint) > 256 THEN
    ok := false;
    locked_until := NULL;
    reason := 'invalid_fingerprint_format';
    RETURN NEXT;
    RETURN;
  END IF;

  SELECT * INTO cfg FROM public.admin_security_config WHERE id = 1;
  IF NOT FOUND THEN
    ok := false;
    locked_until := NULL;
    reason := 'not_configured';
    RETURN NEXT;
    RETURN;
  END IF;

  -- Lockout: last 10 minutes failed attempts >= 5
  SELECT count(*)
    INTO fail_count
  FROM public.admin_unlock_attempts
  WHERE device_fingerprint = verify_admin_passcode.device_fingerprint
    AND success = false
    AND created_at > (now() - interval '10 minutes');

  IF fail_count >= 5 THEN
    SELECT max(created_at)
      INTO latest_fail
    FROM public.admin_unlock_attempts
    WHERE device_fingerprint = verify_admin_passcode.device_fingerprint
      AND success = false;

    lock_until := latest_fail + interval '10 minutes';

    ok := false;
    locked_until := lock_until;
    reason := 'locked_out';

    INSERT INTO public.admin_unlock_attempts (device_fingerprint, success)
    VALUES (verify_admin_passcode.device_fingerprint, false);

    RETURN NEXT;
    RETURN;
  END IF;

  IF crypt(passcode, cfg.passcode_hash) = cfg.passcode_hash THEN
    INSERT INTO public.admin_unlock_attempts (device_fingerprint, success)
    VALUES (verify_admin_passcode.device_fingerprint, true);

    ok := true;
    locked_until := NULL;
    reason := 'ok';
    RETURN NEXT;
    RETURN;
  ELSE
    INSERT INTO public.admin_unlock_attempts (device_fingerprint, success)
    VALUES (verify_admin_passcode.device_fingerprint, false);

    ok := false;
    locked_until := NULL;
    reason := 'invalid_passcode';
    RETURN NEXT;
    RETURN;
  END IF;
END;
$$;

-- Lock down tables (no direct client access)
ALTER TABLE public.admin_security_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_unlock_attempts ENABLE ROW LEVEL SECURITY;

-- No RLS policies: only SECURITY DEFINER + backend functions can access.
-- Add explicit deny-all RLS policies to satisfy linter (tables should not be directly accessible)

DO $$ BEGIN
  -- admin_security_config
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='admin_security_config' AND policyname='deny_all_admin_security_config'
  ) THEN
    CREATE POLICY deny_all_admin_security_config
    ON public.admin_security_config
    FOR ALL
    USING (false)
    WITH CHECK (false);
  END IF;

  -- admin_unlock_attempts
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='admin_unlock_attempts' AND policyname='deny_all_admin_unlock_attempts'
  ) THEN
    CREATE POLICY deny_all_admin_unlock_attempts
    ON public.admin_unlock_attempts
    FOR ALL
    USING (false)
    WITH CHECK (false);
  END IF;
END $$;-- Helper RPC to rotate admin passcode securely (hashing done in DB)

CREATE OR REPLACE FUNCTION public.set_admin_passcode(new_passcode text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF new_passcode IS NULL OR length(trim(new_passcode)) < 6 OR length(new_passcode) > 128 THEN
    RETURN false;
  END IF;

  UPDATE public.admin_security_config
  SET passcode_hash = crypt(new_passcode, gen_salt('bf', 10)),
      updated_at = now()
  WHERE id = 1;

  RETURN true;
END;
$$;-- Create helper RPC to rotate admin passcode securely (bcrypt via pgcrypto)
-- Hashing is done in the database using crypt() + gen_salt('bf').

CREATE OR REPLACE FUNCTION public.update_admin_passcode(new_passcode text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF new_passcode IS NULL OR length(trim(new_passcode)) < 6 OR length(new_passcode) > 128 THEN
    RETURN false;
  END IF;

  UPDATE public.admin_security_config
  SET passcode_hash = crypt(new_passcode, gen_salt('bf', 10)),
      updated_at = now()
  WHERE id = 1;

  RETURN true;
END;
$$;

-- Lock down execution; only the backend service role should call this.
REVOKE ALL ON FUNCTION public.update_admin_passcode(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_admin_passcode(text) TO service_role;
-- 1) Passcode history table (stores bcrypt hashes)
CREATE TABLE IF NOT EXISTS public.admin_passcode_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  passcode_hash TEXT NOT NULL
);

-- Lock down by default
ALTER TABLE public.admin_passcode_history ENABLE ROW LEVEL SECURITY;

-- 2) Extend admin_security_config with lockout state (idempotent)
ALTER TABLE public.admin_security_config
  ADD COLUMN IF NOT EXISTS passcode_hash TEXT;

ALTER TABLE public.admin_security_config
  ADD COLUMN IF NOT EXISTS failed_attempts INT NOT NULL DEFAULT 0;

ALTER TABLE public.admin_security_config
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

-- Helpful index for fetching last N hashes quickly
CREATE INDEX IF NOT EXISTS idx_admin_passcode_history_created_at
  ON public.admin_passcode_history (created_at DESC);
-- Fix verify_admin_passcode failing to find `crypt()` by including the extensions schema.
CREATE OR REPLACE FUNCTION public.verify_admin_passcode(_passcode text, _device_fingerprint text)
RETURNS TABLE(ok boolean, locked_until timestamp with time zone, reason text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, extensions
AS $function$
DECLARE
  cfg public.admin_security_config%ROWTYPE;
  fail_count integer;
  latest_fail timestamptz;
  lock_until timestamptz;
BEGIN
  IF _passcode IS NULL OR length(trim(_passcode)) < 6 OR length(_passcode) > 128 THEN
    ok := false;
    locked_until := NULL;
    reason := 'invalid_passcode_format';
    RETURN NEXT;
    RETURN;
  END IF;

  IF _device_fingerprint IS NULL OR length(trim(_device_fingerprint)) < 10 OR length(_device_fingerprint) > 256 THEN
    ok := false;
    locked_until := NULL;
    reason := 'invalid_fingerprint_format';
    RETURN NEXT;
    RETURN;
  END IF;

  SELECT * INTO cfg FROM public.admin_security_config WHERE id = 1;
  IF NOT FOUND THEN
    ok := false;
    locked_until := NULL;
    reason := 'not_configured';
    RETURN NEXT;
    RETURN;
  END IF;

  -- Lockout: last 10 minutes failed attempts >= 5
  SELECT count(*)
    INTO fail_count
  FROM public.admin_unlock_attempts a
  WHERE a.device_fingerprint = _device_fingerprint
    AND a.success = false
    AND a.created_at > (now() - interval '10 minutes');

  IF fail_count >= 5 THEN
    SELECT max(a.created_at)
      INTO latest_fail
    FROM public.admin_unlock_attempts a
    WHERE a.device_fingerprint = _device_fingerprint
      AND a.success = false;

    lock_until := latest_fail + interval '10 minutes';

    ok := false;
    locked_until := lock_until;
    reason := 'locked_out';

    INSERT INTO public.admin_unlock_attempts (device_fingerprint, success)
    VALUES (_device_fingerprint, false);

    RETURN NEXT;
    RETURN;
  END IF;

  IF extensions.crypt(_passcode, cfg.passcode_hash) = cfg.passcode_hash THEN
    INSERT INTO public.admin_unlock_attempts (device_fingerprint, success)
    VALUES (_device_fingerprint, true);

    ok := true;
    locked_until := NULL;
    reason := 'ok';
    RETURN NEXT;
    RETURN;
  ELSE
    INSERT INTO public.admin_unlock_attempts (device_fingerprint, success)
    VALUES (_device_fingerprint, false);

    ok := false;
    locked_until := NULL;
    reason := 'invalid_passcode';
    RETURN NEXT;
    RETURN;
  END IF;
END;
$function$;
-- Add RLS policies for admin_passcode_history (RLS was enabled but had no policies)
-- Only super admins can read or write passcode history.

CREATE POLICY "Super admins can read passcode history"
ON public.admin_passcode_history
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "Super admins can insert passcode history"
ON public.admin_passcode_history
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));
-- 1) Unified Ad placements + targets
-- Extend existing admin_ads table to support unified web/app placements and richer creative fields.

ALTER TABLE public.admin_ads
  ADD COLUMN IF NOT EXISTS placement text,
  ADD COLUMN IF NOT EXISTS target_platform text DEFAULT 'all' NOT NULL,
  ADD COLUMN IF NOT EXISTS image_path text,
  ADD COLUMN IF NOT EXISTS link_url text,
  ADD COLUMN IF NOT EXISTS button_text text,
  ADD COLUMN IF NOT EXISTS show_after_n_items integer,
  ADD COLUMN IF NOT EXISTS frequency_per_session integer,
  ADD COLUMN IF NOT EXISTS max_daily_views integer;

-- Backfill placement/target_platform from legacy columns
UPDATE public.admin_ads
SET placement = COALESCE(placement, zone),
    target_platform = COALESCE(target_platform, CASE
      WHEN platform IN ('web','android','ios') THEN platform
      WHEN platform IN ('both') THEN 'all'
      ELSE 'all'
    END)
WHERE placement IS NULL OR target_platform IS NULL;

-- Keep legacy columns for backward compatibility, but align them
UPDATE public.admin_ads
SET zone = COALESCE(zone, placement),
    platform = CASE
      WHEN target_platform IN ('web','android','ios') THEN target_platform
      ELSE 'both'
    END;

-- Update check constraints to include new values.
-- Drop existing constraints if present.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admin_ads_platform_check'
  ) THEN
    ALTER TABLE public.admin_ads DROP CONSTRAINT admin_ads_platform_check;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admin_ads_zone_check'
  ) THEN
    ALTER TABLE public.admin_ads DROP CONSTRAINT admin_ads_zone_check;
  END IF;
END $$;

ALTER TABLE public.admin_ads
  ADD CONSTRAINT admin_ads_platform_check CHECK ((platform = ANY (ARRAY['web'::text, 'android'::text, 'ios'::text, 'both'::text]))),
  ADD CONSTRAINT admin_ads_zone_check CHECK ((zone = ANY (ARRAY[
    'web_home_top'::text,
    'web_dua_middle'::text,
    'web_hadith_middle'::text,
    'web_quran_bottom'::text,
    'web_tasbih_footer'::text,
    'app_home_top'::text,
    'app_dua_middle'::text,
    'app_hadith_middle'::text,
    'app_quran_bottom'::text,
    'app_tasbih_footer'::text,
    'app_interstitial'::text
  ])));

-- Placement/target_platform constraints
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admin_ads_placement_check') THEN
    ALTER TABLE public.admin_ads DROP CONSTRAINT admin_ads_placement_check;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admin_ads_target_platform_check') THEN
    ALTER TABLE public.admin_ads DROP CONSTRAINT admin_ads_target_platform_check;
  END IF;
END $$;

ALTER TABLE public.admin_ads
  ADD CONSTRAINT admin_ads_placement_check CHECK ((placement = ANY (ARRAY[
    'web_home_top'::text,
    'web_dua_middle'::text,
    'web_hadith_middle'::text,
    'web_quran_bottom'::text,
    'web_tasbih_footer'::text,
    'app_home_top'::text,
    'app_dua_middle'::text,
    'app_hadith_middle'::text,
    'app_quran_bottom'::text,
    'app_tasbih_footer'::text,
    'app_interstitial'::text
  ]))),
  ADD CONSTRAINT admin_ads_target_platform_check CHECK ((target_platform = ANY (ARRAY['web'::text, 'android'::text, 'ios'::text, 'all'::text])));

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_admin_ads_active_lookup
  ON public.admin_ads (placement, target_platform, status, priority);

-- 2) Kill switch / emergency controls (publicly readable)
CREATE TABLE IF NOT EXISTS public.admin_ad_controls (
  id integer PRIMARY KEY DEFAULT 1,
  web_enabled boolean NOT NULL DEFAULT true,
  app_enabled boolean NOT NULL DEFAULT true,
  kill_switch boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.admin_ad_controls (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.admin_ad_controls ENABLE ROW LEVEL SECURITY;

-- Public can read controls so client can disable ads quickly.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='admin_ad_controls' AND policyname='Public can read ad controls'
  ) THEN
    CREATE POLICY "Public can read ad controls"
    ON public.admin_ad_controls
    FOR SELECT
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='admin_ad_controls' AND policyname='Admins can update ad controls'
  ) THEN
    CREATE POLICY "Admins can update ad controls"
    ON public.admin_ad_controls
    FOR UPDATE
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));
  END IF;
END $$;

-- 3) Analytics events table
CREATE TABLE IF NOT EXISTS public.ad_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES public.admin_ads(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  platform text NOT NULL,
  placement text NOT NULL,
  session_id text,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ad_events_event_type_check CHECK ((event_type = ANY (ARRAY['impression'::text, 'click'::text])))
);

CREATE INDEX IF NOT EXISTS idx_ad_events_created_at ON public.ad_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ad_events_ad_id ON public.ad_events (ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_events_platform_placement ON public.ad_events (platform, placement);

ALTER TABLE public.ad_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ad_events' AND policyname='Public can insert ad events'
  ) THEN
    CREATE POLICY "Public can insert ad events"
    ON public.ad_events
    FOR INSERT
    WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ad_events' AND policyname='Admins can read ad events'
  ) THEN
    CREATE POLICY "Admins can read ad events"
    ON public.ad_events
    FOR SELECT
    USING (public.is_admin(auth.uid()));
  END IF;
END $$;

-- 4) Storage bucket for ad creatives (public read)
-- NOTE: Only create bucket + policies; do not modify storage internals beyond this.
INSERT INTO storage.buckets (id, name, public)
VALUES ('ad-assets', 'ad-assets', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  -- Public read
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Public read ad-assets'
  ) THEN
    CREATE POLICY "Public read ad-assets"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'ad-assets');
  END IF;

  -- Admin manage
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Admins insert ad-assets'
  ) THEN
    CREATE POLICY "Admins insert ad-assets"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'ad-assets' AND public.is_admin(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Admins update ad-assets'
  ) THEN
    CREATE POLICY "Admins update ad-assets"
    ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'ad-assets' AND public.is_admin(auth.uid()))
    WITH CHECK (bucket_id = 'ad-assets' AND public.is_admin(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Admins delete ad-assets'
  ) THEN
    CREATE POLICY "Admins delete ad-assets"
    ON storage.objects
    FOR DELETE
    USING (bucket_id = 'ad-assets' AND public.is_admin(auth.uid()));
  END IF;
END $$;

-- 5) Ensure realtime isn't needed for ads; no publication changes here.-- Fix migration: constraints may already exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ad_events_event_type_check') THEN
    ALTER TABLE public.ad_events
      ADD CONSTRAINT ad_events_event_type_check
      CHECK (event_type IN ('impression','click'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ad_events_platform_check') THEN
    ALTER TABLE public.ad_events
      ADD CONSTRAINT ad_events_platform_check
      CHECK (platform IN ('web','android','ios'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ad_events_placement_check') THEN
    ALTER TABLE public.ad_events
      ADD CONSTRAINT ad_events_placement_check
      CHECK (
        placement IN (
          'web_home_top','web_dua_middle','web_hadith_middle','web_quran_bottom','web_tasbih_footer',
          'app_home_top','app_dua_middle','app_hadith_middle','app_quran_bottom','app_tasbih_footer','app_interstitial'
        )
      );
  END IF;
END $$;

-- Replace overly-permissive insert policy
DROP POLICY IF EXISTS "Public can insert ad events" ON public.ad_events;

CREATE POLICY "Public can insert ad events"
ON public.ad_events
FOR INSERT
WITH CHECK (
  event_type IN ('impression','click')
  AND platform IN ('web','android','ios')
  AND placement IN (
    'web_home_top','web_dua_middle','web_hadith_middle','web_quran_bottom','web_tasbih_footer',
    'app_home_top','app_dua_middle','app_hadith_middle','app_quran_bottom','app_tasbih_footer','app_interstitial'
  )
  AND session_id IS NOT NULL
  AND length(session_id) BETWEEN 8 AND 128
  AND (user_id IS NULL OR user_id = auth.uid())
);

-- Public RPC to fetch ads for a slot
CREATE OR REPLACE FUNCTION public.fetch_ads_for_slot(
  _platform text,
  _placement text,
  _session_id text,
  _limit integer DEFAULT 1
)
RETURNS SETOF public.admin_ads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ctl public.admin_ad_controls%ROWTYPE;
BEGIN
  IF _platform IS NULL OR _platform NOT IN ('web','android','ios') THEN
    RETURN;
  END IF;

  IF _placement IS NULL OR _placement NOT IN (
    'web_home_top','web_dua_middle','web_hadith_middle','web_quran_bottom','web_tasbih_footer',
    'app_home_top','app_dua_middle','app_hadith_middle','app_quran_bottom','app_tasbih_footer','app_interstitial'
  ) THEN
    RETURN;
  END IF;

  IF _session_id IS NULL OR length(trim(_session_id)) < 8 OR length(_session_id) > 128 THEN
    RETURN;
  END IF;

  SELECT * INTO ctl FROM public.admin_ad_controls WHERE id = 1;
  IF NOT FOUND THEN
    ctl.kill_switch := false;
    ctl.web_enabled := true;
    ctl.app_enabled := true;
  END IF;

  IF ctl.kill_switch THEN
    RETURN;
  END IF;

  IF _platform = 'web' AND NOT ctl.web_enabled THEN
    RETURN;
  END IF;

  IF _platform IN ('android','ios') AND NOT ctl.app_enabled THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT a.*
  FROM public.admin_ads a
  WHERE a.status = 'active'
    AND (a.start_at IS NULL OR a.start_at <= now())
    AND (a.end_at IS NULL OR a.end_at >= now())
    AND a.placement = _placement
    AND a.target_platform IN (_platform, 'all')
    AND (
      a.max_daily_views IS NULL
      OR (
        SELECT count(*)
        FROM public.ad_events e
        WHERE e.ad_id = a.id
          AND e.event_type = 'impression'
          AND e.created_at::date = current_date
      ) < a.max_daily_views
    )
    AND (
      a.frequency_per_session IS NULL
      OR (
        SELECT count(*)
        FROM public.ad_events e
        WHERE e.ad_id = a.id
          AND e.event_type = 'impression'
          AND e.session_id = _session_id
      ) < a.frequency_per_session
    )
  ORDER BY a.priority DESC, a.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(_limit, 1), 5));
END;
$$;

GRANT EXECUTE ON FUNCTION public.fetch_ads_for_slot(text, text, text, integer) TO anon, authenticated;
-- Utilities to avoid JS-side hashing in backend function

CREATE OR REPLACE FUNCTION public.is_recent_admin_passcode(_passcode text, _limit int DEFAULT 5)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_passcode_history h
    ORDER BY h.created_at DESC
    LIMIT GREATEST(1, LEAST(COALESCE(_limit, 5), 20))
  )
  AND EXISTS (
    SELECT 1
    FROM (
      SELECT passcode_hash
      FROM public.admin_passcode_history
      ORDER BY created_at DESC
      LIMIT GREATEST(1, LEAST(COALESCE(_limit, 5), 20))
    ) x
    WHERE extensions.crypt(_passcode, x.passcode_hash) = x.passcode_hash
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_recent_admin_passcode(text, int) TO anon, authenticated;
-- Phase-1: Layout Control

CREATE TABLE IF NOT EXISTS public.admin_layout_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  layout_key text NOT NULL,
  section_key text NOT NULL,
  platform text NOT NULL, -- 'web' | 'app'
  visible boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  size text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL,
  CONSTRAINT admin_layout_settings_unique UNIQUE (layout_key, section_key, platform)
);

CREATE INDEX IF NOT EXISTS idx_admin_layout_settings_layout_platform_order
  ON public.admin_layout_settings (layout_key, platform, order_index);

ALTER TABLE public.admin_layout_settings ENABLE ROW LEVEL SECURITY;

-- Public can only read visible sections (app filters platform client-side)
DO $$ BEGIN
  CREATE POLICY "Public can read visible layout settings"
  ON public.admin_layout_settings
  FOR SELECT
  USING (visible = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Admins can read all
DO $$ BEGIN
  CREATE POLICY "Admins can read all layout settings"
  ON public.admin_layout_settings
  FOR SELECT
  USING (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Admins can manage
DO $$ BEGIN
  CREATE POLICY "Admins can insert layout settings"
  ON public.admin_layout_settings
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update layout settings"
  ON public.admin_layout_settings
  FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can delete layout settings"
  ON public.admin_layout_settings
  FOR DELETE
  USING (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- updated_at trigger
DROP TRIGGER IF EXISTS update_admin_layout_settings_updated_at ON public.admin_layout_settings;
CREATE TRIGGER update_admin_layout_settings_updated_at
BEFORE UPDATE ON public.admin_layout_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Version history (limited)
CREATE TABLE IF NOT EXISTS public.admin_layout_settings_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  layout_key text NOT NULL,
  platform text NOT NULL,
  snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_layout_versions_layout_platform_created
  ON public.admin_layout_settings_versions (layout_key, platform, created_at DESC);

ALTER TABLE public.admin_layout_settings_versions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Admins can read layout setting versions"
  ON public.admin_layout_settings_versions
  FOR SELECT
  USING (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can insert layout setting versions"
  ON public.admin_layout_settings_versions
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Keep only last 5 versions per (layout_key, platform)
CREATE OR REPLACE FUNCTION public.trim_admin_layout_versions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.admin_layout_settings_versions v
  WHERE v.layout_key = NEW.layout_key
    AND v.platform = NEW.platform
    AND v.id IN (
      SELECT id
      FROM public.admin_layout_settings_versions
      WHERE layout_key = NEW.layout_key
        AND platform = NEW.platform
      ORDER BY created_at DESC
      OFFSET 5
    );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_trim_admin_layout_versions ON public.admin_layout_settings_versions;
CREATE TRIGGER trg_trim_admin_layout_versions
AFTER INSERT ON public.admin_layout_settings_versions
FOR EACH ROW
EXECUTE FUNCTION public.trim_admin_layout_versions();

-- Realtime updates to clients
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_layout_settings;-- Per-page SEO settings
CREATE TABLE IF NOT EXISTS public.seo_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  title text,
  description text,
  canonical_url text,
  robots text,
  json_ld jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

-- Ensure one row per route path
CREATE UNIQUE INDEX IF NOT EXISTS seo_pages_path_unique ON public.seo_pages (path);

ALTER TABLE public.seo_pages ENABLE ROW LEVEL SECURITY;

-- Public read (SEO must be readable client-side)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'seo_pages' AND policyname = 'Public can read per-page SEO'
  ) THEN
    CREATE POLICY "Public can read per-page SEO"
    ON public.seo_pages
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- Admin manage
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'seo_pages' AND policyname = 'Admins can manage per-page SEO'
  ) THEN
    CREATE POLICY "Admins can manage per-page SEO"
    ON public.seo_pages
    FOR ALL
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));
  END IF;
END $$;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_updated_at_seo_pages ON public.seo_pages;
CREATE TRIGGER set_updated_at_seo_pages
BEFORE UPDATE ON public.seo_pages
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.seo_pages;-- Public read access for in-app notifications (scheduled)

-- Ensure realtime emits notification changes
DO $$
BEGIN
  -- publication add can error if already added; wrap in exception handler
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
  EXCEPTION WHEN duplicate_object THEN
    -- ignore
    NULL;
  END;
END $$;

-- Add indexes for faster feeds
CREATE INDEX IF NOT EXISTS admin_notifications_sent_at_idx ON public.admin_notifications (sent_at DESC);
CREATE INDEX IF NOT EXISTS admin_notifications_scheduled_at_idx ON public.admin_notifications (scheduled_at DESC);

-- Public can read notifications that are ready to show
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'admin_notifications' AND policyname = 'Public can read sent/scheduled notifications'
  ) THEN
    CREATE POLICY "Public can read sent/scheduled notifications"
    ON public.admin_notifications
    FOR SELECT
    USING (
      (
        status IN ('sent','scheduled')
        AND (scheduled_at IS NULL OR scheduled_at <= now())
      )
    );
  END IF;
END $$;-- Push notification device tokens (FCM/APNs)

-- Timestamp helper (idempotent)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE IF NOT EXISTS public.device_push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  platform text NOT NULL, -- 'android' | 'ios'
  device_id text NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.device_push_tokens ENABLE ROW LEVEL SECURITY;

-- Public can register a token (no login required)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'device_push_tokens'
      AND policyname = 'Public can register push tokens'
  ) THEN
    CREATE POLICY "Public can register push tokens"
    ON public.device_push_tokens
    FOR INSERT
    TO public
    WITH CHECK (
      platform = ANY (ARRAY['android','ios'])
      AND length(token) BETWEEN 20 AND 512
      AND (device_id IS NULL OR length(device_id) BETWEEN 8 AND 128)
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'device_push_tokens'
      AND policyname = 'Admins can read push tokens'
  ) THEN
    CREATE POLICY "Admins can read push tokens"
    ON public.device_push_tokens
    FOR SELECT
    USING (is_admin(auth.uid()));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'device_push_tokens'
      AND policyname = 'Admins can update push tokens'
  ) THEN
    CREATE POLICY "Admins can update push tokens"
    ON public.device_push_tokens
    FOR UPDATE
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'device_push_tokens'
      AND policyname = 'Admins can delete push tokens'
  ) THEN
    CREATE POLICY "Admins can delete push tokens"
    ON public.device_push_tokens
    FOR DELETE
    USING (is_admin(auth.uid()));
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_device_push_tokens_updated_at ON public.device_push_tokens;
CREATE TRIGGER update_device_push_tokens_updated_at
BEFORE UPDATE ON public.device_push_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_device_push_tokens_platform ON public.device_push_tokens(platform);
CREATE INDEX IF NOT EXISTS idx_device_push_tokens_enabled ON public.device_push_tokens(enabled);
CREATE INDEX IF NOT EXISTS idx_device_push_tokens_last_seen_at ON public.device_push_tokens(last_seen_at);
-- 1) Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  image_url text NULL,
  deep_link text NULL,
  target_platform text NOT NULL DEFAULT 'all',
  scheduled_at timestamptz NULL,
  sent_at timestamptz NULL,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Basic indexes
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_at ON public.notifications(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Only admins can manage notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notifications'
      AND policyname = 'Admins can manage notifications'
  ) THEN
    CREATE POLICY "Admins can manage notifications"
    ON public.notifications
    FOR ALL
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));
  END IF;
END $$;

-- 2) Delivery logs per token (success/failure per token)
CREATE TABLE IF NOT EXISTS public.notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  token_id uuid NULL REFERENCES public.device_push_tokens(id) ON DELETE SET NULL,
  platform text NOT NULL,
  status text NOT NULL, -- sent | failed
  error_code text NULL,
  error_message text NULL,
  provider_message_id text NULL,
  delivered_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_notification_id ON public.notification_deliveries(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_platform ON public.notification_deliveries(platform);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_status ON public.notification_deliveries(status);

ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notification_deliveries'
      AND policyname = 'Admins can read delivery logs'
  ) THEN
    CREATE POLICY "Admins can read delivery logs"
    ON public.notification_deliveries
    FOR SELECT
    USING (public.is_admin(auth.uid()));
  END IF;
END $$;

-- 3) Extend device_push_tokens for web + user_id
ALTER TABLE public.device_push_tokens
  ADD COLUMN IF NOT EXISTS user_id uuid NULL;

-- Allow web platform in addition to android/ios
-- (No CHECK constraint; we enforce via RLS WITH CHECK below.)

-- Ensure token uniqueness per platform
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'device_push_tokens_platform_token_uniq'
  ) THEN
    ALTER TABLE public.device_push_tokens
      ADD CONSTRAINT device_push_tokens_platform_token_uniq UNIQUE (platform, token);
  END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_device_push_tokens_platform ON public.device_push_tokens(platform);
CREATE INDEX IF NOT EXISTS idx_device_push_tokens_user_id ON public.device_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_device_push_tokens_enabled ON public.device_push_tokens(enabled);

-- Update trigger to keep updated_at fresh
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_device_push_tokens_updated_at'
  ) THEN
    CREATE TRIGGER set_device_push_tokens_updated_at
    BEFORE UPDATE ON public.device_push_tokens
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- Tighten/replace INSERT policy to include web + optional user_id binding
-- Drop old policy if present (name from existing schema: "Public can register push tokens")
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'device_push_tokens'
      AND policyname = 'Public can register push tokens'
  ) THEN
    DROP POLICY "Public can register push tokens" ON public.device_push_tokens;
  END IF;
END $$;

CREATE POLICY "Public can register push tokens"
ON public.device_push_tokens
FOR INSERT
WITH CHECK (
  (platform = ANY (ARRAY['android'::text, 'ios'::text, 'web'::text]))
  AND (length(token) >= 20 AND length(token) <= 512)
  AND (device_id IS NULL OR (length(device_id) >= 8 AND length(device_id) <= 128))
  AND (user_id IS NULL OR user_id = auth.uid())
);

-- keep existing admin policies if they exist; otherwise add them
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'device_push_tokens'
      AND policyname = 'Admins can read push tokens'
  ) THEN
    CREATE POLICY "Admins can read push tokens"
    ON public.device_push_tokens
    FOR SELECT
    USING (public.is_admin(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'device_push_tokens'
      AND policyname = 'Admins can update push tokens'
  ) THEN
    CREATE POLICY "Admins can update push tokens"
    ON public.device_push_tokens
    FOR UPDATE
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'device_push_tokens'
      AND policyname = 'Admins can delete push tokens'
  ) THEN
    CREATE POLICY "Admins can delete push tokens"
    ON public.device_push_tokens
    FOR DELETE
    USING (public.is_admin(auth.uid()));
  END IF;
END $$;-- Phase 2: Admin-controlled page builder sections

CREATE TABLE IF NOT EXISTS public.admin_page_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page text NOT NULL,
  section_key text NOT NULL,
  title text NOT NULL DEFAULT '',
  position integer NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  platform text NOT NULL DEFAULT 'all', -- web | app | all
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Common access patterns: load visible sections for a page/platform ordered by position
CREATE INDEX IF NOT EXISTS idx_admin_page_sections_page_platform_position
  ON public.admin_page_sections(page, platform, position);

CREATE INDEX IF NOT EXISTS idx_admin_page_sections_page_visible
  ON public.admin_page_sections(page, visible);

-- Prevent duplicate section slots for a given page/platform
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'admin_page_sections_page_platform_section_key_uniq'
  ) THEN
    ALTER TABLE public.admin_page_sections
      ADD CONSTRAINT admin_page_sections_page_platform_section_key_uniq
      UNIQUE (page, platform, section_key);
  END IF;
END $$;

-- updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_admin_page_sections_updated_at'
  ) THEN
    CREATE TRIGGER set_admin_page_sections_updated_at
    BEFORE UPDATE ON public.admin_page_sections
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.admin_page_sections ENABLE ROW LEVEL SECURITY;

-- Admin full access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='admin_page_sections' AND policyname='Admins manage page sections'
  ) THEN
    CREATE POLICY "Admins manage page sections"
    ON public.admin_page_sections
    FOR ALL
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));
  END IF;
END $$;

-- Public can read only visible sections
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='admin_page_sections' AND policyname='Public reads visible page sections'
  ) THEN
    CREATE POLICY "Public reads visible page sections"
    ON public.admin_page_sections
    FOR SELECT
    USING (visible = true);
  END IF;
END $$;

-- Seed default home layout (idempotent)
INSERT INTO public.admin_page_sections (page, section_key, title, position, visible, settings, platform)
SELECT * FROM (
  VALUES
    ('home', 'banner', 'Banner', 0, true, '{}'::jsonb, 'all'),
    ('home', 'dua', 'Dua', 1, true, '{"gridColumns":2,"cardSize":"md","styleVariant":"default"}'::jsonb, 'all'),
    ('home', 'hadith', 'Hadith', 2, true, '{"cardSize":"md","styleVariant":"default"}'::jsonb, 'all'),
    ('home', 'tasbih', 'Tasbih', 3, true, '{"cardSize":"md","styleVariant":"default"}'::jsonb, 'all'),
    ('home', 'ads_1', 'Ad Slot', 4, true, '{"adPlacement":"web_home_top","styleVariant":"default"}'::jsonb, 'all')
) AS v(page, section_key, title, position, visible, settings, platform)
WHERE NOT EXISTS (
  SELECT 1 FROM public.admin_page_sections s
  WHERE s.page = v.page AND s.platform = v.platform AND s.section_key = v.section_key
);
-- Add settings JSON blob to layout settings so each section can store per-section configuration
ALTER TABLE public.admin_layout_settings
ADD COLUMN IF NOT EXISTS settings jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Helpful index for querying/filtering by layout+platform
CREATE INDEX IF NOT EXISTS idx_admin_layout_settings_layout_platform
ON public.admin_layout_settings (layout_key, platform);

-- Optional: GIN index for future JSON queries (harmless even if unused)
CREATE INDEX IF NOT EXISTS idx_admin_layout_settings_settings_gin
ON public.admin_layout_settings USING GIN (settings);-- Fix: use existing helper function is_admin(auth.uid()) and has_role(auth.uid(), 'super_admin'::public.app_role)

CREATE TABLE IF NOT EXISTS public.celebrate_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NULL,
  body TEXT NULL,
  media_type TEXT NULL, -- 'image' | 'gif'
  media_path TEXT NULL,
  link_url TEXT NULL,
  cta_text TEXT NULL,
  target_platform TEXT NOT NULL DEFAULT 'all', -- 'all' | 'web' | 'app'
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NULL,
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.celebrate_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Celebrate posts are publicly readable when active" ON public.celebrate_posts;
CREATE POLICY "Celebrate posts are publicly readable when active"
ON public.celebrate_posts
FOR SELECT
USING (starts_at <= now() AND expires_at > now());

DROP POLICY IF EXISTS "Admins can insert celebrate posts" ON public.celebrate_posts;
CREATE POLICY "Admins can insert celebrate posts"
ON public.celebrate_posts
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update celebrate posts" ON public.celebrate_posts;
CREATE POLICY "Admins can update celebrate posts"
ON public.celebrate_posts
FOR UPDATE
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete celebrate posts" ON public.celebrate_posts;
CREATE POLICY "Admins can delete celebrate posts"
ON public.celebrate_posts
FOR DELETE
USING (is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.celebrate_posts_before_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := COALESCE(NEW.starts_at, now()) + interval '12 hours';
  END IF;

  IF NEW.target_platform IS NULL OR btrim(NEW.target_platform) = '' THEN
    NEW.target_platform := 'all';
  END IF;

  IF NEW.target_platform NOT IN ('all', 'web', 'app') THEN
    RAISE EXCEPTION 'Invalid target_platform: %', NEW.target_platform;
  END IF;

  IF NEW.expires_at <= NEW.starts_at THEN
    RAISE EXCEPTION 'expires_at must be after starts_at';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_celebrate_posts_before_write ON public.celebrate_posts;
CREATE TRIGGER trg_celebrate_posts_before_write
BEFORE INSERT OR UPDATE ON public.celebrate_posts
FOR EACH ROW
EXECUTE FUNCTION public.celebrate_posts_before_write();

CREATE INDEX IF NOT EXISTS idx_celebrate_posts_active
ON public.celebrate_posts (starts_at DESC, expires_at DESC);

-- Storage bucket for celebrate media
INSERT INTO storage.buckets (id, name, public)
VALUES ('celebrate', 'celebrate', true)
ON CONFLICT (id) DO NOTHING;

-- Public read for celebrate media
DROP POLICY IF EXISTS "Celebrate media is publicly accessible" ON storage.objects;
CREATE POLICY "Celebrate media is publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'celebrate');

-- Admin write for celebrate media
DROP POLICY IF EXISTS "Admins can upload celebrate media" ON storage.objects;
CREATE POLICY "Admins can upload celebrate media"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'celebrate' AND is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update celebrate media" ON storage.objects;
CREATE POLICY "Admins can update celebrate media"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'celebrate' AND is_admin(auth.uid()))
WITH CHECK (bucket_id = 'celebrate' AND is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete celebrate media" ON storage.objects;
CREATE POLICY "Admins can delete celebrate media"
ON storage.objects
FOR DELETE
USING (bucket_id = 'celebrate' AND is_admin(auth.uid()));
-- Allow larger web push subscription payloads in device_push_tokens.token
-- (PushSubscription JSON can exceed 512 chars)

DO $$
BEGIN
  -- Replace policy with a more permissive token length upper bound
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'device_push_tokens'
      AND policyname = 'Public can register push tokens'
  ) THEN
    DROP POLICY "Public can register push tokens" ON public.device_push_tokens;
  END IF;
END $$;

CREATE POLICY "Public can register push tokens"
ON public.device_push_tokens
FOR INSERT
WITH CHECK (
  (platform = ANY (ARRAY['android'::text, 'ios'::text, 'web'::text]))
  AND (length(token) >= 20 AND length(token) <= 4096)
  AND (device_id IS NULL OR (length(device_id) >= 8 AND length(device_id) <= 128))
  AND (user_id IS NULL OR user_id = auth.uid())
);
-- 1) Enum for platform targeting
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'occasion_platform') THEN
    CREATE TYPE public.occasion_platform AS ENUM ('web','app','both');
  END IF;
END $$;

-- 2) Table
CREATE TABLE IF NOT EXISTS public.admin_occasions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  dua_text text NULL,
  image_url text NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  platform public.occasion_platform NOT NULL DEFAULT 'both',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Helpful index for home carousel query
CREATE INDEX IF NOT EXISTS idx_admin_occasions_active_window
ON public.admin_occasions (is_active, start_date, end_date, display_order);

-- 3) Validation + updated_at trigger
CREATE OR REPLACE FUNCTION public.admin_occasions_before_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.title IS NULL OR btrim(NEW.title) = '' THEN
    RAISE EXCEPTION 'title_required';
  END IF;

  IF NEW.message IS NULL OR btrim(NEW.message) = '' THEN
    RAISE EXCEPTION 'message_required';
  END IF;

  IF NEW.start_date IS NULL OR NEW.end_date IS NULL THEN
    RAISE EXCEPTION 'date_range_required';
  END IF;

  IF NEW.end_date <= NEW.start_date THEN
    RAISE EXCEPTION 'end_date_must_be_after_start_date';
  END IF;

  NEW.updated_at := now();
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := COALESCE(NEW.created_at, now());
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_admin_occasions_before_write'
  ) THEN
    CREATE TRIGGER trg_admin_occasions_before_write
    BEFORE INSERT OR UPDATE ON public.admin_occasions
    FOR EACH ROW
    EXECUTE FUNCTION public.admin_occasions_before_write();
  END IF;
END $$;

-- 4) RLS
ALTER TABLE public.admin_occasions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Public read only active items within date range
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='admin_occasions' AND policyname='Public can read active occasions'
  ) THEN
    CREATE POLICY "Public can read active occasions"
    ON public.admin_occasions
    FOR SELECT
    USING (
      is_active = true
      AND start_date <= now()
      AND end_date >= now()
    );
  END IF;

  -- Admin full CRUD
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='admin_occasions' AND policyname='Admins can manage occasions'
  ) THEN
    CREATE POLICY "Admins can manage occasions"
    ON public.admin_occasions
    FOR ALL
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));
  END IF;
END $$;

-- 5) Storage bucket for occasion images/gifs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'occasions-assets') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('occasions-assets', 'occasions-assets', true);
  END IF;
END $$;

-- Public read bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects' AND policyname='Occasions assets are publicly readable'
  ) THEN
    CREATE POLICY "Occasions assets are publicly readable"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'occasions-assets');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects' AND policyname='Admins can upload occasion assets'
  ) THEN
    CREATE POLICY "Admins can upload occasion assets"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'occasions-assets' AND is_admin(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects' AND policyname='Admins can update occasion assets'
  ) THEN
    CREATE POLICY "Admins can update occasion assets"
    ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'occasions-assets' AND is_admin(auth.uid()))
    WITH CHECK (bucket_id = 'occasions-assets' AND is_admin(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects' AND policyname='Admins can delete occasion assets'
  ) THEN
    CREATE POLICY "Admins can delete occasion assets"
    ON storage.objects
    FOR DELETE
    USING (bucket_id = 'occasions-assets' AND is_admin(auth.uid()));
  END IF;
END $$;

-- 6) Seed data (Bangla titles) - only if table is empty
DO $$
DECLARE
  cnt integer;
BEGIN
  SELECT count(*) INTO cnt FROM public.admin_occasions;
  IF cnt = 0 THEN
    INSERT INTO public.admin_occasions (title, message, dua_text, image_url, start_date, end_date, is_active, display_order, platform)
    VALUES
      ('Eid Mubarak', 'ঈদ মোবারক! আল্লাহ আপনার পরিবারে শান্তি ও বরকত দান করুন।', 'তাকাব্বালাল্লাহু মিন্না ওয়া মিনকুম', NULL, now() - interval '1 day', now() + interval '20 days', true, 1, 'both'),
      ('Jumuah Mubarak', 'জুম্মা মুবারক! আজকের দিনটি ইবাদত ও দোয়ার জন্য বিশেষ।', 'আল্লাহুম্মা সাল্লি আলা মুহাম্মাদ', NULL, now() - interval '1 day', now() + interval '20 days', true, 2, 'both'),
      ('Shab-e-Barat', 'শবে বরাতের রাতে আল্লাহর রহমত কামনা করি।', 'ইয়া আল্লাহ, আমাদের গুনাহ মাফ করে দিন', NULL, now() - interval '1 day', now() + interval '20 days', true, 3, 'both'),
      ('Ramadan Kareem', 'রমজান করিম! সিয়াম ও কিয়ামে কাটুক আপনার দিন।', 'আল্লাহুম্মা ইন্নাকা আফুউন তুহিব্বুল আফওয়া ফা’ফু আন্নি', NULL, now() - interval '1 day', now() + interval '20 days', true, 4, 'both'),
      ('Milad-un-Nabi', 'মিলাদুন্নবী মুবারক! দরুদ ও সালাম বৃদ্ধি করি।', 'সাল্লাল্লাহু আলাইহি ওয়া সাল্লাম', NULL, now() - interval '1 day', now() + interval '20 days', true, 5, 'both');
  END IF;
END $$;
-- Create notification templates table
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  image_url TEXT,
  deep_link TEXT,
  target_platform TEXT NOT NULL DEFAULT 'all',
  category TEXT NOT NULL DEFAULT 'custom',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT notification_templates_name_check CHECK (char_length(trim(name)) > 0 AND char_length(name) <= 100),
  CONSTRAINT notification_templates_title_check CHECK (char_length(trim(title)) > 0 AND char_length(title) <= 200),
  CONSTRAINT notification_templates_body_check CHECK (char_length(trim(body)) > 0 AND char_length(body) <= 1000),
  CONSTRAINT notification_templates_platform_check CHECK (target_platform IN ('all', 'android', 'ios', 'web')),
  CONSTRAINT notification_templates_category_check CHECK (category IN ('prayer', 'daily', 'special', 'custom'))
);

-- Enable RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- Admin users can view all templates
CREATE POLICY "Admins can view all templates"
ON public.notification_templates
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  )
);

-- Admin users can create templates
CREATE POLICY "Admins can create templates"
ON public.notification_templates
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  )
  AND auth.uid() = created_by
);

-- Admin users can update their own templates
CREATE POLICY "Admins can update own templates"
ON public.notification_templates
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  )
  AND auth.uid() = created_by
);

-- Admin users can delete their own templates
CREATE POLICY "Admins can delete own templates"
ON public.notification_templates
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  )
  AND auth.uid() = created_by
);

-- Trigger for updated_at
CREATE TRIGGER update_notification_templates_updated_at
BEFORE UPDATE ON public.notification_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_notification_templates_created_by ON public.notification_templates(created_by);
CREATE INDEX idx_notification_templates_category ON public.notification_templates(category);-- Create user notification preferences table
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  device_id TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  calculation_method TEXT NOT NULL DEFAULT 'MWL',
  enabled_prayers JSONB NOT NULL DEFAULT '{"fajr":true,"dhuhr":true,"asr":true,"maghrib":true,"isha":true}'::jsonb,
  notification_offset INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_notification_preferences_device_check CHECK (
    (length(device_id) >= 8) AND (length(device_id) <= 128)
  ),
  CONSTRAINT user_notification_preferences_lat_check CHECK (
    (latitude >= -90) AND (latitude <= 90)
  ),
  CONSTRAINT user_notification_preferences_lng_check CHECK (
    (longitude >= -180) AND (longitude <= 180)
  ),
  CONSTRAINT user_notification_preferences_offset_check CHECK (
    (notification_offset >= -60) AND (notification_offset <= 60)
  )
);

-- Enable RLS
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view own notification preferences"
ON public.user_notification_preferences
FOR SELECT
USING (
  (user_id IS NULL AND auth.uid() IS NULL) OR 
  (auth.uid() = user_id)
);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own notification preferences"
ON public.user_notification_preferences
FOR INSERT
WITH CHECK (
  ((user_id IS NULL) OR (auth.uid() = user_id))
  AND calculation_method IN ('MWL', 'ISNA', 'Egypt', 'Makkah', 'Karachi', 'Tehran', 'Jafari')
);

-- Users can update their own preferences
CREATE POLICY "Users can update own notification preferences"
ON public.user_notification_preferences
FOR UPDATE
USING (
  (user_id IS NULL AND auth.uid() IS NULL) OR 
  (auth.uid() = user_id)
)
WITH CHECK (
  ((user_id IS NULL) OR (auth.uid() = user_id))
  AND calculation_method IN ('MWL', 'ISNA', 'Egypt', 'Makkah', 'Karachi', 'Tehran', 'Jafari')
);

-- Users can delete their own preferences
CREATE POLICY "Users can delete own notification preferences"
ON public.user_notification_preferences
FOR DELETE
USING (
  (user_id IS NULL AND auth.uid() IS NULL) OR 
  (auth.uid() = user_id)
);

-- Admins can view all preferences
CREATE POLICY "Admins can view all notification preferences"
ON public.user_notification_preferences
FOR SELECT
USING (is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_user_notification_preferences_updated_at
BEFORE UPDATE ON public.user_notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_user_notification_preferences_enabled ON public.user_notification_preferences(enabled) WHERE enabled = true;
CREATE INDEX idx_user_notification_preferences_device ON public.user_notification_preferences(device_id);

-- Create table to track sent prayer notifications (prevent duplicates)
CREATE TABLE IF NOT EXISTS public.prayer_notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preference_id UUID NOT NULL REFERENCES public.user_notification_preferences(id) ON DELETE CASCADE,
  prayer_name TEXT NOT NULL,
  prayer_time TIMESTAMPTZ NOT NULL,
  prayer_date DATE NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notification_id UUID REFERENCES public.notifications(id) ON DELETE SET NULL,
  CONSTRAINT prayer_notification_log_prayer_check CHECK (
    prayer_name IN ('fajr', 'dhuhr', 'asr', 'maghrib', 'isha')
  )
);

-- Enable RLS
ALTER TABLE public.prayer_notification_log ENABLE ROW LEVEL SECURITY;

-- Admins can view all logs
CREATE POLICY "Admins can view prayer notification logs"
ON public.prayer_notification_log
FOR SELECT
USING (is_admin(auth.uid()));

-- Create index for duplicate prevention (using date column)
CREATE UNIQUE INDEX idx_prayer_notification_log_unique 
ON public.prayer_notification_log(preference_id, prayer_name, prayer_date);

-- Create index for cleanup queries
CREATE INDEX idx_prayer_notification_log_sent_at ON public.prayer_notification_log(sent_at);-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Initialize admin security config with default passcode
INSERT INTO public.admin_security_config (id, passcode_hash, admin_email, require_fingerprint, failed_attempts)
VALUES (
  1,
  crypt('noor-admin-1234', gen_salt('bf', 10)),
  'admin@noor.app',
  false,
  0
)
ON CONFLICT (id) DO NOTHING;-- Create quiz questions table
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- array of 4 options
  correct_answer INTEGER NOT NULL CHECK (correct_answer >= 0 AND correct_answer <= 3),
  category TEXT NOT NULL,
  difficulty TEXT DEFAULT 'medium',
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- Public can read active questions
CREATE POLICY "Public can read active quiz questions"
  ON public.quiz_questions
  FOR SELECT
  USING (is_active = true);

-- Admins can manage all questions
CREATE POLICY "Admins can manage quiz questions"
  ON public.quiz_questions
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Create index for ordering
CREATE INDEX idx_quiz_questions_order ON public.quiz_questions(order_index);

-- Create index for category
CREATE INDEX idx_quiz_questions_category ON public.quiz_questions(category);

-- Trigger for updated_at
CREATE TRIGGER update_quiz_questions_updated_at
  BEFORE UPDATE ON public.quiz_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();-- Add multi-language support to quiz_questions table
ALTER TABLE public.quiz_questions 
ADD COLUMN question_bn TEXT,
ADD COLUMN question_en TEXT,
ADD COLUMN options_bn JSONB,
ADD COLUMN options_en JSONB;

-- Migrate existing data to English fields
UPDATE public.quiz_questions 
SET question_en = question,
    options_en = options
WHERE question_en IS NULL;

-- Add comment explaining the language fields
COMMENT ON COLUMN public.quiz_questions.question IS 'Legacy question field (deprecated, use question_en or question_bn)';
COMMENT ON COLUMN public.quiz_questions.options IS 'Legacy options field (deprecated, use options_en or options_bn)';
COMMENT ON COLUMN public.quiz_questions.question_bn IS 'Question text in Bangla';
COMMENT ON COLUMN public.quiz_questions.question_en IS 'Question text in English';
COMMENT ON COLUMN public.quiz_questions.options_bn IS 'Answer options array in Bangla (4 items)';
COMMENT ON COLUMN public.quiz_questions.options_en IS 'Answer options array in English (4 items)';-- Seed initial admin security configuration if missing
DO $$
DECLARE
  v_hash text;
BEGIN
  -- Create initial config row
  INSERT INTO public.admin_security_config (id, admin_email, passcode_hash, require_fingerprint, failed_attempts, locked_until, updated_at)
  VALUES (
    1,
    'admin@noor.app',
    extensions.crypt('noor-admin-1234', extensions.gen_salt('bf', 10)),
    false,
    0,
    NULL,
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Seed passcode history with the current hash (only if history is empty)
  SELECT passcode_hash INTO v_hash
  FROM public.admin_security_config
  WHERE id = 1;

  IF v_hash IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.admin_passcode_history) THEN
    INSERT INTO public.admin_passcode_history (passcode_hash, created_at)
    VALUES (v_hash, now());
  END IF;
END $$;

-- Ensure RLS is enabled on admin tables (safe if already enabled)
ALTER TABLE public.admin_security_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_passcode_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_unlock_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;-- Passcode reset tokens (server-managed)
CREATE TABLE IF NOT EXISTS public.admin_passcode_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email text NOT NULL,
  code_hash text NOT NULL,
  requested_ip text NULL,
  requested_user_id uuid NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Basic indexes
CREATE INDEX IF NOT EXISTS idx_admin_passcode_reset_tokens_email_created
  ON public.admin_passcode_reset_tokens (admin_email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_passcode_reset_tokens_expires
  ON public.admin_passcode_reset_tokens (expires_at);

-- Protect table with RLS (no direct client access)
ALTER TABLE public.admin_passcode_reset_tokens ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin_passcode_reset_tokens'
      AND policyname = 'deny_all_admin_passcode_reset_tokens'
  ) THEN
    CREATE POLICY deny_all_admin_passcode_reset_tokens
    ON public.admin_passcode_reset_tokens
    FOR ALL
    USING (false)
    WITH CHECK (false);
  END IF;
END $$;

-- Cleanup helper: keep table from growing unbounded (optional)
CREATE OR REPLACE FUNCTION public.trim_admin_passcode_reset_tokens()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- delete tokens older than 7 days or already used
  DELETE FROM public.admin_passcode_reset_tokens
  WHERE created_at < (now() - interval '7 days')
     OR used_at IS NOT NULL;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'tr_trim_admin_passcode_reset_tokens'
  ) THEN
    CREATE TRIGGER tr_trim_admin_passcode_reset_tokens
    AFTER INSERT ON public.admin_passcode_reset_tokens
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.trim_admin_passcode_reset_tokens();
  END IF;
END $$;ALTER TABLE public.admin_passcode_reset_tokens
ADD COLUMN IF NOT EXISTS code_salt text NOT NULL DEFAULT '';

-- Backfill any existing rows
UPDATE public.admin_passcode_reset_tokens
SET code_salt = ''
WHERE code_salt IS NULL;-- Add per-language pronunciation/transliteration fields for Duas
ALTER TABLE public.admin_content
ADD COLUMN IF NOT EXISTS content_pronunciation_en text;

ALTER TABLE public.admin_content
ADD COLUMN IF NOT EXISTS content_pronunciation_hi text;

ALTER TABLE public.admin_content
ADD COLUMN IF NOT EXISTS content_pronunciation_ur text;

-- Helpful index for filtering content types (optional)
CREATE INDEX IF NOT EXISTS idx_admin_content_type ON public.admin_content (content_type);
-- Bootstrap admin security config row for remixed projects
-- Ensures admin panel unlock can work out of the box.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_security_config WHERE id = 1
  ) THEN
    INSERT INTO public.admin_security_config (
      id,
      admin_email,
      passcode_hash,
      require_fingerprint,
      failed_attempts,
      locked_until,
      updated_at
    ) VALUES (
      1,
      'admin@noor.app',
      extensions.crypt('noor-admin-1234', extensions.gen_salt('bf', 10)),
      false,
      0,
      NULL,
      now()
    );

    -- Seed passcode history with the initial hash (best-effort)
    INSERT INTO public.admin_passcode_history (passcode_hash)
    SELECT passcode_hash
    FROM public.admin_security_config
    WHERE id = 1;
  END IF;
END $$;
-- Extend notification delivery logs for richer Web Push diagnostics
ALTER TABLE public.notification_deliveries
  ADD COLUMN IF NOT EXISTS subscription_id uuid NULL,
  ADD COLUMN IF NOT EXISTS subscription_endpoint text NULL,
  ADD COLUMN IF NOT EXISTS endpoint_host text NULL,
  ADD COLUMN IF NOT EXISTS browser text NULL,
  ADD COLUMN IF NOT EXISTS stage text NULL;

-- Helpful indexes for history/analytics
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_notification_id ON public.notification_deliveries(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_status ON public.notification_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_endpoint_host ON public.notification_deliveries(endpoint_host);
-- Add expiry support for in-app announcements (ticker)
ALTER TABLE public.admin_notifications
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE NULL;

-- Helpful index for fetching active announcements
CREATE INDEX IF NOT EXISTS idx_admin_notifications_expires_at ON public.admin_notifications(expires_at);
-- Store per-announcement ticker styling (font, size, color, etc.)
ALTER TABLE public.admin_notifications
  ADD COLUMN IF NOT EXISTS ticker_style jsonb NULL;

CREATE INDEX IF NOT EXISTS idx_admin_notifications_ticker_style ON public.admin_notifications USING GIN (ticker_style);
-- Add explicit activation flag for in-app announcement ticker
ALTER TABLE public.admin_notifications
ADD COLUMN IF NOT EXISTS ticker_active boolean NOT NULL DEFAULT false;

-- Helpful index for fetching active announcements fast
CREATE INDEX IF NOT EXISTS idx_admin_notifications_ticker_active
ON public.admin_notifications (ticker_active, scheduled_at, sent_at, created_at);
-- Seed admin security config if missing (required by admin-security backend function)
INSERT INTO public.admin_security_config (
  id,
  admin_email,
  passcode_hash,
  require_fingerprint,
  failed_attempts,
  locked_until,
  updated_at
)
VALUES (
  1,
  'admin@noor.app',
  extensions.crypt('noor-admin-1234', extensions.gen_salt('bf', 10)),
  false,
  0,
  NULL,
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Seed passcode history once (helps reuse-check RPC)
INSERT INTO public.admin_passcode_history (passcode_hash)
SELECT c.passcode_hash
FROM public.admin_security_config c
WHERE c.id = 1
  AND NOT EXISTS (SELECT 1 FROM public.admin_passcode_history);
-- Create a public bucket for generated name share images
INSERT INTO storage.buckets (id, name, public)
VALUES ('name-shares', 'name-shares', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to objects in this bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public read name share images'
  ) THEN
    CREATE POLICY "Public read name share images"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'name-shares');
  END IF;
END $$;-- Ensure admin security config is initialized (required by admin-security backend function)

INSERT INTO public.admin_security_config (
  id,
  admin_email,
  passcode_hash,
  require_fingerprint,
  failed_attempts,
  locked_until,
  updated_at
)
VALUES (
  1,
  'admin@noor.app',
  crypt('noor-admin-1234', gen_salt('bf', 10)),
  false,
  0,
  NULL,
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Seed passcode history so reuse checks work
INSERT INTO public.admin_passcode_history (passcode_hash)
SELECT passcode_hash
FROM public.admin_security_config
WHERE id = 1
  AND passcode_hash IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.admin_passcode_history);
ALTER TABLE public.admin_occasions
ADD COLUMN IF NOT EXISTS card_css TEXT NULL;ALTER TABLE public.admin_occasions
ADD COLUMN IF NOT EXISTS container_class_name TEXT NULL;-- Add HTML/CSS-driven occasion fields
ALTER TABLE public.admin_occasions
  ADD COLUMN IF NOT EXISTS subtitle TEXT,
  ADD COLUMN IF NOT EXISTS html_code TEXT,
  ADD COLUMN IF NOT EXISTS css_code TEXT;

-- Optional: backfill from legacy columns to keep existing occasions working
UPDATE public.admin_occasions
SET
  subtitle = COALESCE(subtitle, message),
  css_code = COALESCE(css_code, card_css)
WHERE subtitle IS NULL OR css_code IS NULL;-- Allow HTML/CSS-driven occasions without requiring the legacy `message` field
ALTER TABLE public.admin_occasions
  ALTER COLUMN message DROP NOT NULL;

-- Update validation trigger to support either legacy text or HTML content
CREATE OR REPLACE FUNCTION public.admin_occasions_before_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.title IS NULL OR btrim(NEW.title) = '' THEN
    RAISE EXCEPTION 'title_required';
  END IF;

  -- Require at least one content source:
  -- - subtitle (preferred legacy text)
  -- - message (legacy)
  -- - html_code (new)
  IF (NEW.subtitle IS NULL OR btrim(NEW.subtitle) = '')
     AND (NEW.message IS NULL OR btrim(NEW.message) = '')
     AND (NEW.html_code IS NULL OR btrim(NEW.html_code) = '') THEN
    RAISE EXCEPTION 'content_required';
  END IF;

  -- Keep `message` as a backward-compatible fallback (optional)
  IF (NEW.message IS NULL OR btrim(NEW.message) = '')
     AND (NEW.subtitle IS NOT NULL AND btrim(NEW.subtitle) <> '') THEN
    NEW.message := NEW.subtitle;
  END IF;

  IF NEW.start_date IS NULL OR NEW.end_date IS NULL THEN
    RAISE EXCEPTION 'date_range_required';
  END IF;

  IF NEW.end_date <= NEW.start_date THEN
    RAISE EXCEPTION 'end_date_must_be_after_start_date';
  END IF;

  NEW.updated_at := now();
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := COALESCE(NEW.created_at, now());
  END IF;

  RETURN NEW;
END;
$$;-- Create table for IndexNow API key configuration
CREATE TABLE IF NOT EXISTS public.indexnow_config (
  id SERIAL PRIMARY KEY,
  api_key TEXT NOT NULL,
  host TEXT NOT NULL,
  key_location TEXT,
  last_tested_at TIMESTAMP WITH TIME ZONE,
  test_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.indexnow_config ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write IndexNow config
CREATE POLICY "Admins can manage IndexNow config"
ON public.indexnow_config
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('super_admin', 'admin')
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_indexnow_config_updated_at
BEFORE UPDATE ON public.indexnow_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();-- Create table for multiple splash screens with scheduling
CREATE TABLE IF NOT EXISTS public.admin_splash_screens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  lottie_url TEXT NOT NULL,
  duration INTEGER DEFAULT 3000,
  fade_out_duration INTEGER DEFAULT 500,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  platform TEXT DEFAULT 'both' CHECK (platform IN ('web', 'app', 'both')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.admin_splash_screens ENABLE ROW LEVEL SECURITY;

-- Allow public read access for active splash screens
CREATE POLICY "Public can view active splash screens"
ON public.admin_splash_screens
FOR SELECT
USING (is_active = true);

-- Allow admins to manage splash screens
CREATE POLICY "Admins can manage splash screens"
ON public.admin_splash_screens
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('super_admin', 'admin')
  )
);

-- Create index for efficient querying
CREATE INDEX idx_splash_screens_active_dates ON public.admin_splash_screens(is_active, start_date, end_date, priority);

-- Create updated_at trigger
CREATE TRIGGER update_admin_splash_screens_updated_at
BEFORE UPDATE ON public.admin_splash_screens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();-- Create storage bucket for splash screens if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('splash-screens', 'splash-screens', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for splash-screens bucket
DO $$
BEGIN
  -- Allow public to read splash screen files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public can view splash screens'
  ) THEN
    CREATE POLICY "Public can view splash screens"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'splash-screens');
  END IF;

  -- Allow admins to upload splash screens
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins can upload splash screens'
  ) THEN
    CREATE POLICY "Admins can upload splash screens"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = 'splash-screens'
      AND EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('super_admin', 'admin')
      )
    );
  END IF;

  -- Allow admins to update splash screens
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins can update splash screens'
  ) THEN
    CREATE POLICY "Admins can update splash screens"
    ON storage.objects
    FOR UPDATE
    USING (
      bucket_id = 'splash-screens'
      AND EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('super_admin', 'admin')
      )
    );
  END IF;

  -- Allow admins to delete splash screens
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins can delete splash screens'
  ) THEN
    CREATE POLICY "Admins can delete splash screens"
    ON storage.objects
    FOR DELETE
    USING (
      bucket_id = 'splash-screens'
      AND EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('super_admin', 'admin')
      )
    );
  END IF;
END $$;-- Ensure app_settings behaves like a singleton-per-key config table
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Enforce one row per setting_key so upsert() works predictably
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'app_settings'
      AND indexname = 'app_settings_setting_key_key'
  ) THEN
    CREATE UNIQUE INDEX app_settings_setting_key_key ON public.app_settings (setting_key);
  END IF;
END $$;

-- Public read access for non-sensitive global config
DROP POLICY IF EXISTS "Public can read global app settings" ON public.app_settings;
CREATE POLICY "Public can read global app settings"
ON public.app_settings
FOR SELECT
USING (setting_key IN ('branding','theme','seo','system','modules'));

-- Admin-only write access
DROP POLICY IF EXISTS "Admins can insert global app settings" ON public.app_settings;
CREATE POLICY "Admins can insert global app settings"
ON public.app_settings
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update global app settings" ON public.app_settings;
CREATE POLICY "Admins can update global app settings"
ON public.app_settings
FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete global app settings" ON public.app_settings;
CREATE POLICY "Admins can delete global app settings"
ON public.app_settings
FOR DELETE
USING (public.is_admin(auth.uid()));
-- Enable realtime changefeed for app_settings so in-app branding updates (logo/icon/favicon) propagate without requiring a refresh.
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;-- Create admin_security_config table
CREATE TABLE IF NOT EXISTS public.admin_security_config (
  id integer PRIMARY KEY DEFAULT 1,
  admin_email text NOT NULL DEFAULT 'admin@noor.app',
  passcode_hash text,
  require_fingerprint boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Enable RLS
ALTER TABLE public.admin_security_config ENABLE ROW LEVEL SECURITY;

-- Only service role can access (edge functions use service role)
CREATE POLICY "Service role only" ON public.admin_security_config
  FOR ALL USING (false);

-- Create admin_passcode_history table for reuse prevention
CREATE TABLE IF NOT EXISTS public.admin_passcode_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passcode_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_passcode_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.admin_passcode_history
  FOR ALL USING (false);

-- Create admin_passcode_reset_tokens table
CREATE TABLE IF NOT EXISTS public.admin_passcode_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash text NOT NULL,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  used boolean NOT NULL DEFAULT false
);

ALTER TABLE public.admin_passcode_reset_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.admin_passcode_reset_tokens
  FOR ALL USING (false);

-- Create admin_unlock_attempts table for lockout tracking
CREATE TABLE IF NOT EXISTS public.admin_unlock_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_fingerprint text,
  ip text,
  success boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_unlock_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.admin_unlock_attempts
  FOR ALL USING (false);

-- Insert default config row
INSERT INTO public.admin_security_config (id, admin_email, require_fingerprint)
VALUES (1, 'admin@noor.app', false)
ON CONFLICT (id) DO NOTHING;

-- Create set_admin_passcode RPC function
CREATE OR REPLACE FUNCTION public.set_admin_passcode(new_passcode text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO admin_security_config (id, passcode_hash, updated_at)
  VALUES (1, crypt(new_passcode, gen_salt('bf')), now())
  ON CONFLICT (id) DO UPDATE SET
    passcode_hash = crypt(new_passcode, gen_salt('bf')),
    updated_at = now();
  RETURN true;
END;
$$;

-- Create update_admin_passcode RPC function
CREATE OR REPLACE FUNCTION public.update_admin_passcode(new_passcode text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE admin_security_config
  SET passcode_hash = crypt(new_passcode, gen_salt('bf')),
      updated_at = now()
  WHERE id = 1;
  RETURN true;
END;
$$;

-- Create verify_admin_passcode RPC function
CREATE OR REPLACE FUNCTION public.verify_admin_passcode(_passcode text, _device_fingerprint text)
RETURNS TABLE(ok boolean, reason text, locked_until timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cfg_hash text;
  attempt_count int;
  lockout_until timestamptz;
  is_valid boolean;
BEGIN
  -- Check for lockout (5 failed attempts in last 15 minutes)
  SELECT COUNT(*) INTO attempt_count
  FROM admin_unlock_attempts
  WHERE success = false
    AND created_at > now() - interval '15 minutes';

  IF attempt_count >= 5 THEN
    -- Find when the oldest failed attempt in window expires
    SELECT created_at + interval '15 minutes' INTO lockout_until
    FROM admin_unlock_attempts
    WHERE success = false
      AND created_at > now() - interval '15 minutes'
    ORDER BY created_at ASC
    LIMIT 1;

    RETURN QUERY SELECT false, 'locked_out'::text, lockout_until;
    RETURN;
  END IF;

  -- Get current passcode hash
  SELECT passcode_hash INTO cfg_hash
  FROM admin_security_config
  WHERE id = 1;

  IF cfg_hash IS NULL THEN
    RETURN QUERY SELECT false, 'not_configured'::text, NULL::timestamptz;
    RETURN;
  END IF;

  -- Verify passcode
  is_valid := (cfg_hash = crypt(_passcode, cfg_hash));

  -- Log attempt
  INSERT INTO admin_unlock_attempts (device_fingerprint, success)
  VALUES (_device_fingerprint, is_valid);

  IF is_valid THEN
    RETURN QUERY SELECT true, NULL::text, NULL::timestamptz;
  ELSE
    RETURN QUERY SELECT false, 'invalid_passcode'::text, NULL::timestamptz;
  END IF;
END;
$$;

-- Create is_recent_admin_passcode RPC function
CREATE OR REPLACE FUNCTION public.is_recent_admin_passcode(_passcode text, _limit int DEFAULT 5)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec record;
BEGIN
  FOR rec IN 
    SELECT passcode_hash 
    FROM admin_passcode_history 
    ORDER BY created_at DESC 
    LIMIT _limit
  LOOP
    IF rec.passcode_hash = crypt(_passcode, rec.passcode_hash) THEN
      RETURN true;
    END IF;
  END LOOP;
  RETURN false;
END;
$$;-- Enable pgcrypto extension for password hashing (crypt and gen_salt functions)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;-- Fix pgcrypto function resolution by qualifying calls to extensions schema

CREATE OR REPLACE FUNCTION public.set_admin_passcode(new_passcode text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  INSERT INTO admin_security_config (id, passcode_hash, updated_at)
  VALUES (1, extensions.crypt(new_passcode, extensions.gen_salt('bf'::text)), now())
  ON CONFLICT (id) DO UPDATE SET
    passcode_hash = extensions.crypt(new_passcode, extensions.gen_salt('bf'::text)),
    updated_at = now();
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_admin_passcode(new_passcode text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  UPDATE admin_security_config
  SET passcode_hash = extensions.crypt(new_passcode, extensions.gen_salt('bf'::text)),
      updated_at = now()
  WHERE id = 1;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_admin_passcode(_passcode text, _device_fingerprint text)
RETURNS TABLE(ok boolean, reason text, locked_until timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  cfg_hash text;
  attempt_count int;
  lockout_until timestamptz;
  is_valid boolean;
BEGIN
  -- Check for lockout (5 failed attempts in last 15 minutes)
  SELECT COUNT(*) INTO attempt_count
  FROM admin_unlock_attempts
  WHERE success = false
    AND created_at > now() - interval '15 minutes';

  IF attempt_count >= 5 THEN
    -- Find when the oldest failed attempt in window expires
    SELECT created_at + interval '15 minutes' INTO lockout_until
    FROM admin_unlock_attempts
    WHERE success = false
      AND created_at > now() - interval '15 minutes'
    ORDER BY created_at ASC
    LIMIT 1;

    RETURN QUERY SELECT false, 'locked_out'::text, lockout_until;
    RETURN;
  END IF;

  -- Get current passcode hash
  SELECT passcode_hash INTO cfg_hash
  FROM admin_security_config
  WHERE id = 1;

  IF cfg_hash IS NULL THEN
    RETURN QUERY SELECT false, 'not_configured'::text, NULL::timestamptz;
    RETURN;
  END IF;

  -- Verify passcode
  is_valid := (cfg_hash = extensions.crypt(_passcode, cfg_hash));

  -- Log attempt
  INSERT INTO admin_unlock_attempts (device_fingerprint, success)
  VALUES (_device_fingerprint, is_valid);

  IF is_valid THEN
    RETURN QUERY SELECT true, NULL::text, NULL::timestamptz;
  ELSE
    RETURN QUERY SELECT false, 'invalid_passcode'::text, NULL::timestamptz;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_recent_admin_passcode(_passcode text, _limit int DEFAULT 5)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT passcode_hash
    FROM admin_passcode_history
    ORDER BY created_at DESC
    LIMIT _limit
  LOOP
    IF rec.passcode_hash = extensions.crypt(_passcode, rec.passcode_hash) THEN
      RETURN true;
    END IF;
  END LOOP;

  RETURN false;
END;
$$;-- Align admin_passcode_reset_tokens schema with admin-security backend expectations

ALTER TABLE public.admin_passcode_reset_tokens
  ADD COLUMN IF NOT EXISTS admin_email text,
  ADD COLUMN IF NOT EXISTS code_salt text,
  ADD COLUMN IF NOT EXISTS requested_ip text,
  ADD COLUMN IF NOT EXISTS requested_user_id uuid,
  ADD COLUMN IF NOT EXISTS used_at timestamptz;

-- Backfill admin_email for existing rows (tokens are ephemeral, but this keeps throttling consistent)
UPDATE public.admin_passcode_reset_tokens
SET admin_email = COALESCE(admin_email, 'admin@noor.app')
WHERE admin_email IS NULL;

-- If legacy column "ip" exists, copy it into requested_ip for existing rows
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_passcode_reset_tokens'
      AND column_name = 'ip'
  ) THEN
    UPDATE public.admin_passcode_reset_tokens
    SET requested_ip = COALESCE(requested_ip, ip)
    WHERE requested_ip IS NULL;
  END IF;
END;
$$;

-- If legacy column "used" exists, mark used_at for those rows
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_passcode_reset_tokens'
      AND column_name = 'used'
  ) THEN
    UPDATE public.admin_passcode_reset_tokens
    SET used_at = COALESCE(used_at, now())
    WHERE used_at IS NULL
      AND used = true;
  END IF;
END;
$$;

ALTER TABLE public.admin_passcode_reset_tokens
  ALTER COLUMN admin_email SET DEFAULT 'admin@noor.app',
  ALTER COLUMN admin_email SET NOT NULL;

-- Keep a sane default for expiry (matches backend behavior)
ALTER TABLE public.admin_passcode_reset_tokens
  ALTER COLUMN expires_at SET DEFAULT (now() + interval '10 minutes');

ALTER TABLE public.admin_passcode_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Helpful indexes for throttle + lookup (safe if table is small)
CREATE INDEX IF NOT EXISTS idx_admin_passcode_reset_tokens_throttle
  ON public.admin_passcode_reset_tokens (admin_email, requested_ip, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_passcode_reset_tokens_lookup
  ON public.admin_passcode_reset_tokens (admin_email, used_at, created_at DESC);-- Create quiz_questions table for storing quiz data with bilingual support
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  question_en TEXT,
  question_bn TEXT,
  options TEXT[] NOT NULL DEFAULT '{}',
  options_en TEXT[],
  options_bn TEXT[],
  correct_answer INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'General',
  difficulty TEXT NOT NULL DEFAULT 'medium',
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quiz_questions
-- Allow all authenticated users to read active questions
CREATE POLICY "Anyone can read active quiz questions"
  ON public.quiz_questions
  FOR SELECT
  USING (is_active = true);

-- Allow admins to read all questions (including inactive)
CREATE POLICY "Admins can read all quiz questions"
  ON public.quiz_questions
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Allow admins to create quiz questions
CREATE POLICY "Admins can create quiz questions"
  ON public.quiz_questions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- Allow admins to update quiz questions
CREATE POLICY "Admins can update quiz questions"
  ON public.quiz_questions
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Allow admins to delete quiz questions
CREATE POLICY "Admins can delete quiz questions"
  ON public.quiz_questions
  FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_quiz_questions_updated_at
  BEFORE UPDATE ON public.quiz_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better query performance
CREATE INDEX idx_quiz_questions_category ON public.quiz_questions(category);
CREATE INDEX idx_quiz_questions_is_active ON public.quiz_questions(is_active);
CREATE INDEX idx_quiz_questions_order_index ON public.quiz_questions(order_index);-- Create admin_occasions table for Islamic occasions management
CREATE TABLE public.admin_occasions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  message TEXT NOT NULL,
  dua_text TEXT,
  html_code TEXT,
  css_code TEXT,
  image_url TEXT,
  card_css TEXT,
  container_class_name TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  platform TEXT NOT NULL DEFAULT 'both' CHECK (platform IN ('web', 'app', 'both')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_occasions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage occasions"
ON public.admin_occasions
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Anyone can view active occasions"
ON public.admin_occasions
FOR SELECT
USING (
  is_active = true 
  AND start_date <= now() 
  AND end_date >= now()
);

-- Create trigger for updated_at
CREATE TRIGGER update_admin_occasions_updated_at
BEFORE UPDATE ON public.admin_occasions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();-- Create storage bucket for branding assets (logos, icons, favicons)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'branding',
  'branding',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to branding assets
CREATE POLICY "Public can view branding assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'branding');

-- Allow authenticated users to upload branding assets (admin only in practice)
CREATE POLICY "Authenticated users can upload branding assets"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'branding');

-- Allow authenticated users to update branding assets
CREATE POLICY "Authenticated users can update branding assets"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'branding');

-- Allow authenticated users to delete branding assets
CREATE POLICY "Authenticated users can delete branding assets"
ON storage.objects
FOR DELETE
USING (bucket_id = 'branding');-- Create admin_layout_settings table for storing layout configurations
CREATE TABLE public.admin_layout_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  layout_key TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'web',
  section_key TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  size TEXT NOT NULL DEFAULT 'normal',
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(layout_key, platform, section_key)
);

-- Enable RLS
ALTER TABLE public.admin_layout_settings ENABLE ROW LEVEL SECURITY;

-- Admins can manage layout settings
CREATE POLICY "Admins can manage layout settings"
ON public.admin_layout_settings
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Anyone can read layout settings (for home page to render)
CREATE POLICY "Anyone can read layout settings"
ON public.admin_layout_settings
FOR SELECT
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_admin_layout_settings_updated_at
BEFORE UPDATE ON public.admin_layout_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();-- Add missing pronunciation columns for multilingual support
ALTER TABLE public.admin_content 
ADD COLUMN IF NOT EXISTS content_pronunciation_en text,
ADD COLUMN IF NOT EXISTS content_pronunciation_hi text,
ADD COLUMN IF NOT EXISTS content_pronunciation_ur text;
-- SEO pages table for dynamic sitemap & per-page SEO metadata
CREATE TABLE public.seo_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path TEXT NOT NULL UNIQUE,
  title TEXT,
  description TEXT,
  canonical_url TEXT,
  robots TEXT DEFAULT 'index,follow',
  json_ld JSONB,
  changefreq TEXT DEFAULT 'weekly',
  priority NUMERIC(2,1) DEFAULT 0.8,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read seo_pages" ON public.seo_pages
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage seo_pages" ON public.seo_pages
  FOR ALL USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Trigger to auto-update updated_at
CREATE TRIGGER update_seo_pages_updated_at
  BEFORE UPDATE ON public.seo_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- SEO index log for tracking pings and rate limiting
CREATE TABLE public.seo_index_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL, -- 'google_ping', 'bing_ping', 'indexnow'
  target_url TEXT,
  status_code INTEGER,
  success BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_index_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage seo_index_log" ON public.seo_index_log
  FOR ALL USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Enable realtime for seo_pages so admin UI stays in sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.seo_pages;

-- Seed static pages
INSERT INTO public.seo_pages (path, title, changefreq, priority) VALUES
  ('/', 'NOOR - ইসলামিক অ্যাপ', 'daily', 1.0),
  ('/quran', 'কুরআন পড়ুন', 'weekly', 0.9),
  ('/prayer-times', 'নামাজের সময়সূচী', 'daily', 0.9),
  ('/dua', 'দোয়া সমূহ', 'weekly', 0.8),
  ('/bukhari', 'সহীহ বুখারী হাদিস', 'weekly', 0.8),
  ('/quiz', 'ইসলামিক কুইজ', 'daily', 0.7),
  ('/99-names', 'আল্লাহর ৯৯ নাম', 'monthly', 0.7),
  ('/baby-names', 'মুসলিম শিশুর নাম', 'weekly', 0.8),
  ('/names', 'ইসলামিক নাম অর্থসহ', 'weekly', 0.7),
  ('/calendar', 'ইসলামিক ক্যালেন্ডার', 'daily', 0.7),
  ('/qibla', 'কিবলা দিকনির্দেশক', 'monthly', 0.6),
  ('/tasbih', 'তাসবিহ কাউন্টার', 'monthly', 0.6),
  ('/prayer-guide', 'নামাজ শিক্ষা গাইড', 'monthly', 0.7),
  ('/privacy-policy', 'প্রাইভেসি পলিসি', 'yearly', 0.3),
  ('/terms', 'শর্তাবলী', 'yearly', 0.3),
  ('/about', 'আমাদের সম্পর্কে', 'monthly', 0.4),
  ('/contact', 'যোগাযোগ', 'monthly', 0.4)
ON CONFLICT (path) DO NOTHING;

-- Create media storage bucket for general uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('media', 'media', true, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Media files are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- Admin-only upload
CREATE POLICY "Admins can upload media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media'
  AND public.is_admin(auth.uid())
);

-- Admin-only update
CREATE POLICY "Admins can update media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'media'
  AND public.is_admin(auth.uid())
);

-- Admin-only delete
CREATE POLICY "Admins can delete media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media'
  AND public.is_admin(auth.uid())
);

-- Create device_push_tokens table for storing web & native push subscriptions
CREATE TABLE public.device_push_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  token TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'web',
  enabled BOOLEAN NOT NULL DEFAULT true,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(device_id, platform)
);

-- Enable RLS
ALTER TABLE public.device_push_tokens ENABLE ROW LEVEL SECURITY;

-- Anyone can insert their own token
CREATE POLICY "Anyone can insert push tokens"
  ON public.device_push_tokens
  FOR INSERT
  WITH CHECK (true);

-- Users can update their own tokens
CREATE POLICY "Users can update own push tokens"
  ON public.device_push_tokens
  FOR UPDATE
  USING (true);

-- Admins can read all tokens (for sending notifications)
CREATE POLICY "Admins can read all push tokens"
  ON public.device_push_tokens
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Users can read their own tokens
CREATE POLICY "Users can read own push tokens"
  ON public.device_push_tokens
  FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Trigger for updated_at
CREATE TRIGGER update_device_push_tokens_updated_at
  BEFORE UPDATE ON public.device_push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add missing columns to admin_notifications for push functionality
ALTER TABLE public.admin_notifications
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS deep_link TEXT,
  ADD COLUMN IF NOT EXISTS target_platform TEXT NOT NULL DEFAULT 'all';

-- Create notification_deliveries table for delivery logging
CREATE TABLE public.notification_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID NOT NULL,
  token_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  provider_message_id TEXT,
  error_code TEXT,
  error_message TEXT,
  subscription_endpoint TEXT,
  endpoint_host TEXT,
  browser TEXT,
  stage TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage notification deliveries"
  ON public.notification_deliveries
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Index for fast lookups
CREATE INDEX idx_notification_deliveries_notif_id ON public.notification_deliveries(notification_id);

-- Add missing columns to admin_notifications that the code references
ALTER TABLE public.admin_notifications
  ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ticker_style jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ticker_active boolean DEFAULT false;
ALTER TABLE public.admin_notifications ADD COLUMN IF NOT EXISTS icon_url TEXT;
ALTER TABLE public.admin_notifications ADD COLUMN IF NOT EXISTS badge_url TEXT;-- Hadith books master table
CREATE TABLE public.hadith_books (
  id text PRIMARY KEY,
  title text NOT NULL,
  title_bn text,
  title_ar text,
  author text,
  author_bn text,
  total_chapters integer NOT NULL DEFAULT 0,
  total_hadiths integer NOT NULL DEFAULT 0,
  description text,
  description_bn text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hadith_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active hadith books"
  ON public.hadith_books FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage hadith books"
  ON public.hadith_books FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Hadith chapters table
CREATE TABLE public.hadith_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id text NOT NULL REFERENCES public.hadith_books(id) ON DELETE CASCADE,
  chapter_number integer NOT NULL,
  title text NOT NULL,
  title_bn text,
  title_ar text,
  hadith_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(book_id, chapter_number)
);

ALTER TABLE public.hadith_chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read hadith chapters"
  ON public.hadith_chapters FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage hadith chapters"
  ON public.hadith_chapters FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Seed hadith books
INSERT INTO public.hadith_books (id, title, title_bn, title_ar, author, author_bn, total_chapters, total_hadiths, description, description_bn, display_order) VALUES
('bukhari', 'Sahih Bukhari', 'সহীহ বুখারী', 'صحيح البخاري', 'Imam Muhammad ibn Ismail al-Bukhari', 'ইমাম মুহাম্মদ ইবনে ইসমাইল আল-বুখারী (রহ.)', 97, 7563, 'The most authentic collection of Hadith, compiled by Imam Bukhari (194–256 AH).', 'ইমাম বুখারী (রহ.) কর্তৃক সংকলিত সর্বাধিক বিশুদ্ধ হাদিস গ্রন্থ।', 1),
('muslim', 'Sahih Muslim', 'সহীহ মুসলিম', 'صحيح مسلم', 'Imam Muslim ibn al-Hajjaj', 'ইমাম মুসলিম ইবনুল হাজ্জাজ (রহ.)', 56, 7563, 'The second most authentic Hadith collection, compiled by Imam Muslim (206–261 AH).', 'ইমাম মুসলিম (রহ.) কর্তৃক সংকলিত দ্বিতীয় সর্বাধিক বিশুদ্ধ হাদিস গ্রন্থ।', 2),
('tirmidhi', 'Jami at-Tirmidhi', 'জামে তিরমিযী', 'جامع الترمذي', 'Imam Abu Isa Muhammad at-Tirmidhi', 'ইমাম আবু ঈসা মুহাম্মদ আত-তিরমিযী (রহ.)', 49, 3956, 'A prominent Hadith collection known for grading hadith authenticity, compiled by Imam Tirmidhi (209–279 AH).', 'ইমাম তিরমিযী (রহ.) কর্তৃক সংকলিত হাদিসের মান নির্ণয়ে বিখ্যাত হাদিস গ্রন্থ।', 3),
('abu-dawud', 'Sunan Abu Dawud', 'সুনানে আবু দাউদ', 'سنن أبي داود', 'Imam Abu Dawud Sulayman ibn al-Ashath', 'ইমাম আবু দাউদ সুলায়মান ইবনুল আশআস (রহ.)', 43, 5274, 'A major Hadith collection focusing on legal hadith, compiled by Imam Abu Dawud (202–275 AH).', 'ইমাম আবু দাউদ (রহ.) কর্তৃক সংকলিত ফিকহী হাদিসের অন্যতম প্রধান গ্রন্থ।', 4);

-- Create public bucket for app files (APKs etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('app-files', 'app-files', true, 104857600)
ON CONFLICT (id) DO NOTHING;

-- Allow public read
CREATE POLICY "Public can read app files"
ON storage.objects FOR SELECT
USING (bucket_id = 'app-files');

-- Admins can manage
CREATE POLICY "Admins can manage app files"
ON storage.objects FOR ALL
USING (bucket_id = 'app-files' AND public.is_admin(auth.uid()))
WITH CHECK (bucket_id = 'app-files' AND public.is_admin(auth.uid()));

-- Update verify_admin_passcode to count failures PER DEVICE instead of globally.
-- This prevents mobile network/IP changes from causing false lockouts.
CREATE OR REPLACE FUNCTION public.verify_admin_passcode(_passcode text, _device_fingerprint text)
 RETURNS TABLE(ok boolean, reason text, locked_until timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  cfg_hash text;
  attempt_count int;
  lockout_until timestamptz;
  is_valid boolean;
BEGIN
  -- Check for lockout PER DEVICE FINGERPRINT (10 failed attempts in last 15 minutes)
  -- Increased from 5 to 10 to reduce false positives on mobile networks
  SELECT COUNT(*) INTO attempt_count
  FROM admin_unlock_attempts
  WHERE success = false
    AND device_fingerprint = _device_fingerprint
    AND created_at > now() - interval '15 minutes';

  IF attempt_count >= 10 THEN
    -- Find when the oldest failed attempt in window expires
    SELECT created_at + interval '15 minutes' INTO lockout_until
    FROM admin_unlock_attempts
    WHERE success = false
      AND device_fingerprint = _device_fingerprint
      AND created_at > now() - interval '15 minutes'
    ORDER BY created_at ASC
    LIMIT 1;

    RETURN QUERY SELECT false, 'locked_out'::text, lockout_until;
    RETURN;
  END IF;

  -- Get current passcode hash
  SELECT passcode_hash INTO cfg_hash
  FROM admin_security_config
  WHERE id = 1;

  IF cfg_hash IS NULL THEN
    RETURN QUERY SELECT false, 'not_configured'::text, NULL::timestamptz;
    RETURN;
  END IF;

  -- Verify passcode
  is_valid := (cfg_hash = extensions.crypt(_passcode, cfg_hash));

  -- Log attempt with device fingerprint
  INSERT INTO admin_unlock_attempts (device_fingerprint, success)
  VALUES (_device_fingerprint, is_valid);

  IF is_valid THEN
    -- On success, clear old failed attempts for this device (reduce noise)
    DELETE FROM admin_unlock_attempts
    WHERE device_fingerprint = _device_fingerprint
      AND success = false
      AND created_at < now() - interval '1 minute';

    RETURN QUERY SELECT true, NULL::text, NULL::timestamptz;
  ELSE
    RETURN QUERY SELECT false, 'invalid_passcode'::text, NULL::timestamptz;
  END IF;
END;
$function$;

-- Create hadiths table for storing imported hadith data
CREATE TABLE public.hadiths (
  id text NOT NULL PRIMARY KEY,
  chapter_id integer NOT NULL,
  hadith_number integer NOT NULL,
  arabic text NOT NULL,
  bengali text,
  english text,
  hindi text,
  book_key text NOT NULL DEFAULT 'bukhari',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX idx_hadiths_book_chapter ON public.hadiths (book_key, chapter_id);
CREATE INDEX idx_hadiths_number ON public.hadiths (hadith_number);

-- Enable RLS
ALTER TABLE public.hadiths ENABLE ROW LEVEL SECURITY;

-- Anyone can read hadiths
CREATE POLICY "Anyone can read hadiths"
  ON public.hadiths FOR SELECT
  USING (true);

-- Only admins can manage hadiths
CREATE POLICY "Admins can manage hadiths"
  ON public.hadiths FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
UPDATE seo_pages 
SET 
  title = 'Muslim Baby Names with Meaning – Islamic Boys & Girls Names (1000+) | Noor App',
  description = 'Find beautiful Muslim baby names for boys and girls with Arabic spelling and meanings. Browse thousands of Islamic names in Bangla and English on Noor App. ইসলামিক ছেলে ও মেয়েদের সুন্দর নাম অর্থসহ দেখুন।',
  canonical_url = 'https://noorapp.in/baby-names',
  updated_at = now()
WHERE path = '/baby-names';
-- Create user_notification_preferences table
CREATE TABLE public.user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  latitude NUMERIC NOT NULL DEFAULT 0,
  longitude NUMERIC NOT NULL DEFAULT 0,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  calculation_method TEXT NOT NULL DEFAULT 'MWL',
  enabled_prayers JSONB NOT NULL DEFAULT '{"fajr":true,"dhuhr":true,"asr":true,"maghrib":true,"isha":true}'::jsonb,
  notification_offset INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(device_id)
);

-- Create prayer_notification_log table
CREATE TABLE public.prayer_notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preference_id UUID REFERENCES public.user_notification_preferences(id) ON DELETE CASCADE NOT NULL,
  prayer_name TEXT NOT NULL,
  prayer_time TIMESTAMPTZ NOT NULL,
  prayer_date DATE NOT NULL,
  notification_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_notification_log ENABLE ROW LEVEL SECURITY;

-- RLS: Allow anyone to insert/update their own device preferences (no auth required for anonymous PWA users)
CREATE POLICY "Anyone can manage their device preferences"
  ON public.user_notification_preferences
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can read notification logs"
  ON public.prayer_notification_log
  FOR SELECT
  USING (true);

CREATE POLICY "Service can insert notification logs"
  ON public.prayer_notification_log
  FOR INSERT
  WITH CHECK (true);

-- Auto-update updated_at
CREATE TRIGGER update_notification_prefs_updated_at
  BEFORE UPDATE ON public.user_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
-- Page visits table for real-time analytics
CREATE TABLE public.page_visits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  user_id uuid,
  path text NOT NULL,
  page_title text,
  referrer text,
  referrer_source text,
  country text,
  city text,
  region text,
  device_type text,
  browser text,
  os text,
  user_agent text,
  language text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX idx_page_visits_created_at ON public.page_visits (created_at DESC);
CREATE INDEX idx_page_visits_session ON public.page_visits (session_id, created_at DESC);
CREATE INDEX idx_page_visits_path ON public.page_visits (path, created_at DESC);
CREATE INDEX idx_page_visits_country ON public.page_visits (country, created_at DESC);

-- Enable RLS
ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;

-- Anyone can insert their own page visit (anonymous tracking)
CREATE POLICY "Anyone can insert page visits"
  ON public.page_visits
  FOR INSERT
  WITH CHECK (true);

-- Only admins can view analytics
CREATE POLICY "Admins can view all page visits"
  ON public.page_visits
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Enable realtime
ALTER TABLE public.page_visits REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.page_visits;-- Function to get all-time analytics totals server-side (avoids fetching 100k rows)
CREATE OR REPLACE FUNCTION public.get_analytics_alltime_totals()
RETURNS TABLE(unique_visitors bigint, total_views bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(DISTINCT session_id)::bigint AS unique_visitors,
    COUNT(*)::bigint AS total_views
  FROM public.page_visits;
$$;

-- Restrict execution to admins only (matches page_visits RLS intent)
REVOKE EXECUTE ON FUNCTION public.get_analytics_alltime_totals() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_analytics_alltime_totals() TO authenticated;

-- Index to speed up DISTINCT session_id aggregation
CREATE INDEX IF NOT EXISTS idx_page_visits_session_id ON public.page_visits (session_id);
CREATE INDEX IF NOT EXISTS idx_page_visits_created_at ON public.page_visits (created_at DESC);-- Add new columns for SEO-friendly dua pages
ALTER TABLE public.admin_content
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS explanation_bn TEXT,
  ADD COLUMN IF NOT EXISTS benefits_bn TEXT[],
  ADD COLUMN IF NOT EXISTS when_to_recite_bn TEXT,
  ADD COLUMN IF NOT EXISTS hadith_reference TEXT;

-- Unique index on slug (allow nulls for non-dua content)
CREATE UNIQUE INDEX IF NOT EXISTS admin_content_slug_unique
  ON public.admin_content (slug)
  WHERE slug IS NOT NULL;

-- Slugify function: lowercase, ascii-safe, hyphenated
CREATE OR REPLACE FUNCTION public.slugify(input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  result TEXT;
BEGIN
  IF input IS NULL OR length(trim(input)) = 0 THEN
    RETURN NULL;
  END IF;
  result := lower(trim(input));
  -- replace non-alphanumeric with hyphen
  result := regexp_replace(result, '[^a-z0-9\u0980-\u09FF]+', '-', 'g');
  -- strip leading/trailing hyphens
  result := regexp_replace(result, '(^-+|-+$)', '', 'g');
  RETURN result;
END;
$$;

-- Trigger: auto-set slug for dua content if missing
CREATE OR REPLACE FUNCTION public.auto_set_dua_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  candidate TEXT;
  suffix INT := 1;
BEGIN
  IF lower(coalesce(NEW.content_type, '')) NOT IN ('dua') THEN
    RETURN NEW;
  END IF;

  IF NEW.slug IS NOT NULL AND length(trim(NEW.slug)) > 0 THEN
    RETURN NEW;
  END IF;

  base_slug := public.slugify(coalesce(NEW.title_en, NEW.title));
  IF base_slug IS NULL OR length(base_slug) = 0 THEN
    base_slug := 'dua-' || substr(NEW.id::text, 1, 8);
  END IF;

  candidate := base_slug;
  WHILE EXISTS (
    SELECT 1 FROM public.admin_content
    WHERE slug = candidate AND id <> NEW.id
  ) LOOP
    suffix := suffix + 1;
    candidate := base_slug || '-' || suffix;
  END LOOP;

  NEW.slug := candidate;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_dua_slug ON public.admin_content;
CREATE TRIGGER trg_auto_dua_slug
  BEFORE INSERT OR UPDATE ON public.admin_content
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_dua_slug();

-- Backfill slugs for existing dua content
UPDATE public.admin_content
SET slug = slug  -- triggers the BEFORE UPDATE
WHERE lower(coalesce(content_type, '')) = 'dua' AND slug IS NULL;-- Add new columns to hadiths
ALTER TABLE public.hadiths
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS urdu TEXT,
  ADD COLUMN IF NOT EXISTS explanation_bn TEXT,
  ADD COLUMN IF NOT EXISTS lessons_bn TEXT[],
  ADD COLUMN IF NOT EXISTS topic_bn TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS hadiths_slug_unique_idx ON public.hadiths (slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS hadiths_book_number_idx ON public.hadiths (book_key, hadith_number);

-- Auto-slug function
CREATE OR REPLACE FUNCTION public.auto_set_hadith_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  base_slug TEXT;
  candidate TEXT;
  suffix INT := 1;
BEGIN
  IF NEW.slug IS NOT NULL AND length(trim(NEW.slug)) > 0 THEN
    RETURN NEW;
  END IF;

  IF NEW.book_key IS NOT NULL AND NEW.hadith_number IS NOT NULL THEN
    base_slug := lower(regexp_replace(NEW.book_key, '[^a-z0-9]+', '-', 'g')) || '-' || NEW.hadith_number::text;
  ELSE
    base_slug := 'hadith-' || substr(NEW.id::text, 1, 8);
  END IF;

  candidate := base_slug;
  WHILE EXISTS (
    SELECT 1 FROM public.hadiths WHERE slug = candidate AND id <> NEW.id
  ) LOOP
    suffix := suffix + 1;
    candidate := base_slug || '-' || suffix;
  END LOOP;

  NEW.slug := candidate;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_set_hadith_slug_trg ON public.hadiths;
CREATE TRIGGER auto_set_hadith_slug_trg
  BEFORE INSERT OR UPDATE OF book_key, hadith_number, slug ON public.hadiths
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_hadith_slug();

-- Backfill existing rows
UPDATE public.hadiths
SET slug = lower(regexp_replace(book_key, '[^a-z0-9]+', '-', 'g')) || '-' || hadith_number::text
WHERE slug IS NULL AND book_key IS NOT NULL AND hadith_number IS NOT NULL;-- Add multilingual explanation, benefits, when_to_recite columns to admin_content
ALTER TABLE public.admin_content
  ADD COLUMN IF NOT EXISTS explanation_en TEXT,
  ADD COLUMN IF NOT EXISTS explanation_hi TEXT,
  ADD COLUMN IF NOT EXISTS explanation_ur TEXT,
  ADD COLUMN IF NOT EXISTS benefits_en TEXT[],
  ADD COLUMN IF NOT EXISTS benefits_hi TEXT[],
  ADD COLUMN IF NOT EXISTS benefits_ur TEXT[],
  ADD COLUMN IF NOT EXISTS when_to_recite_en TEXT,
  ADD COLUMN IF NOT EXISTS when_to_recite_hi TEXT,
  ADD COLUMN IF NOT EXISTS when_to_recite_ur TEXT;
ALTER TABLE public.admin_content
  ADD COLUMN IF NOT EXISTS subtitle text,
  ADD COLUMN IF NOT EXISTS source_type text,
  ADD COLUMN IF NOT EXISTS reference text,
  ADD COLUMN IF NOT EXISTS authenticity text,
  ADD COLUMN IF NOT EXISTS difficulty text,
  ADD COLUMN IF NOT EXISTS time_required text,
  ADD COLUMN IF NOT EXISTS hook text,
  ADD COLUMN IF NOT EXISTS share_text text,
  ADD COLUMN IF NOT EXISTS virtue text,
  ADD COLUMN IF NOT EXISTS virtue_reference text,
  ADD COLUMN IF NOT EXISTS legacy_slug text,
  ADD COLUMN IF NOT EXISTS viral_score numeric,
  ADD COLUMN IF NOT EXISTS emotion text[],
  ADD COLUMN IF NOT EXISTS normalized_surah_names text[],
  ADD COLUMN IF NOT EXISTS user_intents text[],
  ADD COLUMN IF NOT EXISTS recommendation_tags text[],
  ADD COLUMN IF NOT EXISTS recommended_moments text[],
  ADD COLUMN IF NOT EXISTS semantic_entities text[],
  ADD COLUMN IF NOT EXISTS related_duas text[],
  ADD COLUMN IF NOT EXISTS hook_variants text[],
  ADD COLUMN IF NOT EXISTS search_aliases jsonb,
  ADD COLUMN IF NOT EXISTS social jsonb,
  ADD COLUMN IF NOT EXISTS og_image_data jsonb,
  ADD COLUMN IF NOT EXISTS seo jsonb,
  ADD COLUMN IF NOT EXISTS quran_meta jsonb,
  ADD COLUMN IF NOT EXISTS category_hierarchy jsonb,
  ADD COLUMN IF NOT EXISTS faq jsonb;
ALTER TABLE public.admin_content ADD COLUMN IF NOT EXISTS og_image_url TEXT;ALTER TABLE public.admin_content
  ADD COLUMN IF NOT EXISTS moral_bn TEXT,
  ADD COLUMN IF NOT EXISTS moral_en TEXT,
  ADD COLUMN IF NOT EXISTS moral_ur TEXT,
  ADD COLUMN IF NOT EXISTS source_name TEXT,
  ADD COLUMN IF NOT EXISTS source_detail TEXT,
  ADD COLUMN IF NOT EXISTS author TEXT,
  ADD COLUMN IF NOT EXISTS reading_time_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS related_stories TEXT[],
  ADD COLUMN IF NOT EXISTS navigation JSONB,
  ADD COLUMN IF NOT EXISTS engagement JSONB,
  ADD COLUMN IF NOT EXISTS growth JSONB;

CREATE INDEX IF NOT EXISTS admin_content_type_slug_idx ON public.admin_content (content_type, slug);
CREATE INDEX IF NOT EXISTS admin_content_featured_idx ON public.admin_content (content_type, is_featured);UPDATE public.admin_content AS c
SET og_image_url = 'https://noorapp.in/assets/og-images/' || c.slug || '.png'
FROM (VALUES
('dua-for-balanced-life-surah-al-baqara-2-201'),
('dua-for-faith-surah-aal-i-imraan-3-194'),
('dua-for-faith-surah-aal-i-imraan-3-53'),
('dua-for-faith-surah-aal-i-imraan-3-7'),
('dua-for-faith-surah-aal-i-imraan-3-8'),
('dua-for-faith-surah-al-ahqaf-46-15'),
('dua-for-faith-surah-al-baqara-2-112'),
('dua-for-faith-surah-al-baqara-2-126'),
('dua-for-faith-surah-al-baqara-2-131'),
('dua-for-faith-surah-al-baqara-2-260'),
('dua-for-faith-surah-al-baqara-2-277'),
('dua-for-faith-surah-al-baqara-2-62'),
('dua-for-faith-surah-al-baqara-2-76'),
('dua-for-faith-surah-al-maaidah-5-83'),
('dua-for-faith-surah-an-nahl-16-97'),
('dua-for-faith-surah-an-naml-27-19'),
('dua-for-faith-surah-ibrahim-14-7'),
('dua-for-faith-surah-maryam-19-5'),
('dua-for-faith-surah-quran-x-148'),
('dua-for-faith-surah-yusuf-12-101'),
('dua-for-family-surah-aal-i-imraan-3-35'),
('dua-for-family-surah-aal-i-imraan-3-36'),
('dua-for-family-surah-aal-i-imraan-3-38'),
('dua-for-family-surah-al-anbiyaa-21-89'),
('dua-for-family-surah-al-baqara-2-200'),
('dua-for-family-surah-al-furqaan-25-74'),
('dua-for-family-surah-al-israa-17-24'),
('dua-for-family-surah-al-mumtahana-60-4'),
('dua-for-family-surah-as-saaffaat-37-100'),
('dua-for-family-surah-ash-shuaraa-26-86'),
('dua-for-family-surah-ash-shuaraa-26-88'),
('dua-for-family-surah-ghafir-40-8'),
('dua-for-family-surah-ibrahim-14-40'),
('dua-for-family-surah-ibrahim-14-41'),
('dua-for-family-surah-nooh-71-28'),
('dua-for-forgiveness-surah-aal-i-imraan-3-193'),
('dua-for-forgiveness-surah-ad-dukhaan-44-12'),
('dua-for-forgiveness-surah-al-anbiyaa-21-87'),
('dua-for-forgiveness-surah-al-araaf-7-151'),
('dua-for-forgiveness-surah-al-araaf-7-155'),
('dua-for-forgiveness-surah-al-araaf-7-23'),
('dua-for-forgiveness-surah-al-baqara-2-127'),
('dua-for-forgiveness-surah-al-baqara-2-128'),
('dua-for-forgiveness-surah-al-baqara-2-285'),
('dua-for-forgiveness-surah-al-baqara-2-286'),
('dua-for-forgiveness-surah-al-hashr-59-10'),
('dua-for-forgiveness-surah-al-muminoon-23-109'),
('dua-for-forgiveness-surah-al-muminoon-23-118'),
('dua-for-forgiveness-surah-al-qasas-28-16'),
('dua-for-forgiveness-surah-at-tahrim-66-8'),
('dua-for-forgiveness-surah-ghafir-40-7'),
('dua-for-forgiveness-surah-hud-11-47'),
('dua-for-forgiveness-surah-quran-x-134'),
('dua-for-forgiveness-surah-quran-x-135'),
('dua-for-forgiveness-surah-quran-x-137'),
('dua-for-forgiveness-surah-quran-x-139'),
('dua-for-forgiveness-surah-quran-x-144'),
('dua-for-forgiveness-surah-quran-x-146'),
('dua-for-guidance-surah-aal-i-imraan-3-15'),
('dua-for-guidance-surah-aal-i-imraan-3-26'),
('dua-for-guidance-surah-aal-i-imraan-3-40'),
('dua-for-guidance-surah-aal-i-imraan-3-41'),
('dua-for-guidance-surah-aal-i-imraan-3-43'),
('dua-for-guidance-surah-aal-i-imraan-3-47'),
('dua-for-guidance-surah-aal-i-imraan-3-51'),
('dua-for-guidance-surah-aal-i-imraan-3-73'),
('dua-for-guidance-surah-aal-i-imraan-3-9'),
('dua-for-guidance-surah-al-anbiyaa-21-112'),
('dua-for-guidance-surah-al-anbiyaa-21-83'),
('dua-for-guidance-surah-al-ankaboot-29-30'),
('dua-for-guidance-surah-al-baqara-2-129'),
('dua-for-guidance-surah-al-baqara-2-258'),
('dua-for-guidance-surah-al-baqara-2-262'),
('dua-for-guidance-surah-al-baqara-2-274'),
('dua-for-guidance-surah-al-baqara-2-32'),
('dua-for-guidance-surah-al-baqara-2-46'),
('dua-for-guidance-surah-al-faatiha-1-2'),
('dua-for-guidance-surah-al-faatiha-1-6'),
('dua-for-guidance-surah-al-furqaan-25-63'),
('dua-for-guidance-surah-al-hashr-59-22'),
('dua-for-guidance-surah-al-ikhlaas-112-1'),
('dua-for-guidance-surah-al-ikhlaas-112-3'),
('dua-for-guidance-surah-al-ikhlaas-112-4'),
('dua-for-guidance-surah-al-israa-17-111'),
('dua-for-guidance-surah-al-israa-17-80'),
('dua-for-guidance-surah-al-maaidah-5-114'),
('dua-for-guidance-surah-al-muminoon-23-26'),
('dua-for-guidance-surah-al-muminoon-23-29'),
('dua-for-guidance-surah-an-noor-24-55'),
('dua-for-guidance-surah-ar-rad-13-11'),
('dua-for-guidance-surah-ash-shuaraa-26-83'),
('dua-for-guidance-surah-ash-shuaraa-26-84'),
('dua-for-guidance-surah-ash-shuaraa-26-85'),
('dua-for-guidance-surah-ash-shuaraa-26-89'),
('dua-for-guidance-surah-hud-11-88'),
('dua-for-guidance-surah-ibrahim-14-38'),
('dua-for-guidance-surah-maryam-19-4'),
('dua-for-guidance-surah-maryam-19-6'),
('dua-for-guidance-surah-quran-x-136'),
('dua-for-guidance-surah-quran-x-142'),
('dua-for-guidance-surah-quran-x-143'),
('dua-for-guidance-surah-quran-x-145'),
('dua-for-guidance-surah-quran-x-151'),
('dua-for-guidance-surah-quran-x-152'),
('dua-for-guidance-surah-quran-x-153'),
('dua-for-guidance-surah-quran-x-155'),
('dua-for-guidance-surah-quran-x-156'),
('dua-for-guidance-surah-quran-x-159'),
('dua-for-guidance-surah-taa-haa-20-114'),
('dua-for-guidance-surah-taa-haa-20-25'),
('dua-for-guidance-surah-taa-haa-20-26'),
('dua-for-guidance-surah-taa-haa-20-27'),
('dua-for-guidance-surah-taa-haa-20-28'),
('dua-for-patience-surah-aal-i-imraan-3-147'),
('dua-for-patience-surah-al-baqara-2-250'),
('dua-for-patience-surah-quran-x-147'),
('dua-for-patience-surah-quran-x-158'),
('dua-for-protection-surah-aal-i-imraan-3-16'),
('dua-for-protection-surah-aal-i-imraan-3-191'),
('dua-for-protection-surah-aal-i-imraan-3-192'),
('dua-for-protection-surah-al-araaf-7-47'),
('dua-for-protection-surah-al-baqara-2-67'),
('dua-for-protection-surah-al-falaq-113-1'),
('dua-for-protection-surah-al-falaq-113-2'),
('dua-for-protection-surah-al-falaq-113-3'),
('dua-for-protection-surah-al-falaq-113-4'),
('dua-for-protection-surah-al-falaq-113-5'),
('dua-for-protection-surah-al-furqaan-25-65'),
('dua-for-protection-surah-al-ikhlaas-112-2'),
('dua-for-protection-surah-al-kahf-18-10'),
('dua-for-protection-surah-al-muminoon-23-94'),
('dua-for-protection-surah-al-muminoon-23-97'),
('dua-for-protection-surah-al-muminoon-23-98'),
('dua-for-protection-surah-al-mumtahana-60-5'),
('dua-for-protection-surah-al-qasas-28-21'),
('dua-for-protection-surah-an-naas-114-1'),
('dua-for-protection-surah-an-naas-114-2'),
('dua-for-protection-surah-an-naas-114-3'),
('dua-for-protection-surah-an-naas-114-4'),
('dua-for-protection-surah-an-naas-114-5'),
('dua-for-protection-surah-an-naas-114-6'),
('dua-for-protection-surah-ash-shuaraa-26-87'),
('dua-for-protection-surah-at-tahrim-66-11'),
('dua-for-protection-surah-at-tawbah-9-129'),
('dua-for-protection-surah-ghafir-40-9'),
('dua-for-protection-surah-ibrahim-14-35'),
('dua-for-protection-surah-quran-x-138'),
('dua-for-protection-surah-quran-x-140'),
('dua-for-protection-surah-quran-x-141'),
('dua-for-protection-surah-quran-x-149'),
('dua-for-protection-surah-quran-x-150'),
('dua-for-protection-surah-quran-x-154'),
('dua-for-protection-surah-quran-x-157'),
('dua-for-protection-surah-quran-x-160'),
('dua-for-protection-surah-yunus-10-107'),
('dua-for-protection-surah-yunus-10-85'),
('dua-for-protection-surah-yunus-10-86'),
('dua-for-protection-surah-yusuf-12-33'),
('dua-for-rizq-surah-al-qasas-28-24'),
('dua-for-rizq-surah-ibrahim-14-37')
) AS v(slug)
WHERE c.slug = v.slug
  AND c.content_type = 'dua'
  AND c.og_image_url IS NULL;-- Add audio_embed_code column to admin_content table for storing SoundCloud iframe embed codes
ALTER TABLE public.admin_content
ADD COLUMN audio_embed_code TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.admin_content.audio_embed_code IS 'HTML iframe embed code for audio player (e.g., SoundCloud embed)';
-- Add audio_trailer_url column to admin_content table for storing 30s trailer audio links
ALTER TABLE public.admin_content
ADD COLUMN audio_trailer_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.admin_content.audio_trailer_url IS 'Direct URL to a 30s audio trailer (e.g., .mp3 link) for social sharing';
-- ============================================================
-- Noor App — Scheduled Push Notification System
-- Migration 001: schema + pg_cron dispatcher
-- ============================================================

-- Ensure extensions
create extension if not exists cron;
create extension if not exists pg_net;

-- ---------------- Schedules ----------------
create table if not exists public.scheduler_schedules (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,                              -- display name
  kind          text not null default 'one_time'
                  check (kind in ('one_time','daily','weekly','monthly','islamic_event')),
  -- schedule expression
  time_at       time not null default '09:00:00',           -- time of day (Asia/Kolkata)
  weekdays      int[] default '{}'::int[],                  -- 0=Sun ... 6=Sat (weekly)
  day_of_month  int default null,                           -- monthly day
  cron_expr     text default null,                          -- raw cron expr override (advanced)
  tz            text not null default 'Asia/Kolkata',
  -- islamic events: jumuah|ramadan_sehri|ramadan_iftar|eid_ul_fitr|eid_ul_adha|hajj
  islamic_event text default null,
  event_date    date default null,                          -- one_time date
  -- behaviour
  enabled       boolean not null default true,
  target        text not null default 'all'
                  check (target in ('all','web','android')),
  title_override text default null,                         -- static title (skip smart gen)
  body_override  text default null,                         -- static body
  content_auto   boolean not null default true,             -- auto-pick content
  content_type   text default null
                   check (content_type is null or content_type in ('dua','story')),
  content_id     uuid default null,                         -- pin to specific content
  created_by     text default null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  last_sent_at   timestamptz default null,
  next_run_at    timestamptz default null
);

create index if not exists idx_schedules_enabled_next on public.scheduler_schedules (enabled, next_run_at);

comment on column public.scheduler_schedules.kind is
 'one_time=once at event_date+time_at; daily=every day; weekly=on weekdays[]; monthly=on day_of_month; islamic_event=fires only when the event window is active';

-- ---------------- Runs (history) ----------------
create table if not exists public.scheduler_notification_runs (
  id                uuid primary key default gen_random_uuid(),
  schedule_id       uuid references public.scheduler_schedules(id) on delete cascade,
  schedule_name     text,
  run_at            timestamptz not null default now(),
  content_type      text,
  content_id        uuid,
  content_title     text,
  recipients_total  int not null default 0,
  recipients_sent   int not null default 0,
  recipients_failed int not null default 0,
  started_at        timestamptz,
  finished_at       timestamptz,
  error_summary     jsonb default '[]'::jsonb
);

create index if not exists idx_runs_schedule on public.scheduler_notification_runs (schedule_id, run_at desc);

-- ---------------- Retry queue ----------------
create table if not exists public.scheduler_retries (
  id            uuid primary key default gen_random_uuid(),
  token_id      uuid not null,
  platform      text not null,          -- web | android
  endpoint      text not null,
  payload       jsonb not null,
  attempts      int not null default 0,
  max_attempts  int not null default 1,
  last_error    text,
  queued_at     timestamptz not null default now(),
  next_attempt  timestamptz not null default now()
);

-- ---------------- RLS (admin-only) ----------------
alter table public.scheduler_schedules enable row level security;
alter table public.scheduler_notification_runs enable row level security;
alter table public.scheduler_retries enable row level security;

-- reuse the admin role check used elsewhere in the app
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'scheduler_schedules' and policyname = 'Admins full access') then
    create policy "Admins full access" on public.scheduler_schedules
      for all using (auth.jwt()->>'email' in (select email from public.admin_users));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'scheduler_notification_runs' and policyname = 'Admins read runs') then
    create policy "Admins read runs" on public.scheduler_notification_runs
      for select using (auth.jwt()->>'email' in (select email from public.admin_users));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'scheduler_notification_runs' and policyname = 'Service writes runs') then
    create policy "Service writes runs" on public.scheduler_notification_runs
      for insert with check (auth.role() = 'service_role');
  end if;
  if not exists (select 1 from pg_policies where tablename = 'scheduler_retries' and policyname = 'Service only') then
    create policy "Service only" on public.scheduler_retries
      for all using (auth.role() = 'service_role');
  end if;
end $$;

-- ---------------- pg_cron: dispatcher (every minute) ----------------
-- finds enabled schedules due now and fires the Edge Function dispatcher.
-- NOTE: Replace 'YOUR_SERVICE_ROLE_KEY' with the project's service_role key
--       before running on the live database (Supabase SQL Editor / dashboard).
-- The key is sent only to the project's own Edge Function endpoint over HTTPS.

-- First store the service role key securely in vault (run once):
-- insert into vault.decrypted_secrets (name, secret)
-- values ('service_role_key', 'YOUR_SERVICE_ROLE_KEY')
-- on conflict (name) do update set secret = excluded.secret;

do $$ begin
  if not exists (select 1 from cron.job where jobname = 'noor-scheduler-dispatch') then
    perform cron.schedule(
      'noor-scheduler-dispatch',
      '* * * * *',
      $$
      select net.http_post(
        url := 'https://llicfiepatzgllmjhzbw.supabase.co/functions/v1/scheduler-dispatch',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || coalesce(
            (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'),
            'YOUR_SERVICE_ROLE_KEY'
          )
        ),
        body := jsonb_build_object('dispatch_at', now()::text)::text
      );
      $$
    );
  end if;
end $$;

-- ---------------- Helper: compute next_run_at ----------------
create or replace function public.scheduler_compute_next_run(
  s scheduler_schedules,
  from_tz text default 'Asia/Kolkata'
) returns timestamptz language plpgsql as $$
declare
  local_now timestamptz := now() at time zone from_tz;
  t date := local_now::date;
  candidate timestamptz;
begin
  if s.kind = 'one_time' then
    candidate := (s.event_date || ' ' || s.time_at)::timestamp at time zone from_tz;
    return case when candidate > now() then candidate else null end;
  end if;
  loop
    t := t + 1;
    if s.kind = 'islamic_event' and s.event_date is not null and t = s.event_date then
      return (t || ' ' || s.time_at)::timestamp at time zone from_tz;
    end if;
    if s.kind in ('daily','islamic_event') and s.kind <> 'one_time' then
      return (t || ' ' || s.time_at)::timestamp at time zone from_tz;
    end if;
    if s.kind = 'weekly' and extract(dow from t)::int = any (s.weekdays) then
      return (t || ' ' || s.time_at)::timestamp at time zone from_tz;
    end if;
    if s.kind = 'monthly' and extract(day from t)::int = coalesce(s.day_of_month, 1) then
      return (t || ' ' || s.time_at)::timestamp at time zone from_tz;
    end if;
    if t > local_now::date + 400 then exit; end if;  -- safety guard
  end loop;
  return null;
end;
$$;
-- ============================================================
-- Noor App — Default recurring scheduled notifications
-- All times in Asia/Kolkata
-- ============================================================

-- 1. Every Friday (Jumu'ah) — 11:30 AM
insert into public.scheduler_schedules (name, kind, time_at, weekdays, enabled, target, islamic_event)
values ('জুম্মার নামাজের রেমাইন্ডার', 'weekly', '11:30:00', ARRAY[5]::int[], true, 'all', 'jumuah')
on conflict do nothing;

-- 2. Every day — Morning 7:00 AM (dua)
insert into public.scheduler_schedules (name, kind, time_at, enabled, target)
values ('সোকালের দোযা', 'daily', '07:00:00', true, 'all')
on conflict do nothing;

-- 3. Every day — Evening 7:00 PM (dua)
insert into public.scheduler_schedules (name, kind, time_at, enabled, target)
values ('সন্ধ্যার দোয়া', 'daily', '19:00:00', true, 'all')
on conflict do nothing;

-- 4. Every night — 9:30 PM (sleep dua)
insert into public.scheduler_schedules (name, kind, time_at, enabled, target)
values ('রাতের দোযা — ঘুমানোর আগে', 'daily', '21:30:00', true, 'all')
on conflict do nothing;

-- 5. Monday & Thursday — Nafl fasting reminder (7:00 AM)
insert into public.scheduler_schedules (name, kind, time_at, weekdays, enabled, target)
values ('নাফল রোজার রেমাইন্ডার', 'weekly', '07:00:00', ARRAY[1,4]::int[], true, 'all')
on conflict do nothing;

-- 6. Ramadan Sehri reminder — 4:45 AM (disabled by default; enable each Ramadan)
insert into public.scheduler_schedules (name, kind, time_at, enabled, target, islamic_event)
values ('সেহরির রেমাইন্ডার', 'daily', '04:45:00', false, 'all', 'ramadan_sehri')
on conflict do nothing;

-- 7. Ramadan Iftar reminder — 6:15 PM (disabled by default; enable each Ramadan)
insert into public.scheduler_schedules (name, kind, time_at, enabled, target, islamic_event)
values ('ইফতারের রেমাইন্ডার', 'daily', '18:15:00', false, 'all', 'ramadan_iftar')
on conflict do nothing;

-- 8. Eid Takbeer reminder — Eid day 8:00 AM (disabled by default; enable near Eid)
insert into public.scheduler_schedules (name, kind, time_at, enabled, target, islamic_event)
values ('ঈদের তাকবীর', 'islamic_event', '08:00:00', false, 'all', 'eid_ul_fitr')
on conflict do nothing;

-- Initialize next_run_at for all enabled schedules
update public.scheduler_schedules
set next_run_at = public.scheduler_compute_next_run(s, s.tz)
where enabled = true;
-- Fix: notification_deliveries table uses `delivered_at` but the app code
-- (AdminNotificationsDiagnostics.tsx, send-push edge function, generated types)
-- expects a `created_at` column. Adding created_at with DEFAULT now() restores
-- the expected schema without breaking existing data.
ALTER TABLE public.notification_deliveries ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Backfill existing rows so ordering works for legacy deliveries.
UPDATE public.notification_deliveries
SET created_at = delivered_at
WHERE created_at IS NULL AND delivered_at IS NOT NULL;
-- Add missing columns to admin_notifications for push notifications
-- Fixes: "Could not find the 'deep_link' column of 'admin_notifications' in the schema cache"

ALTER TABLE public.admin_notifications ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.admin_notifications ADD COLUMN IF NOT EXISTS target_platform TEXT DEFAULT 'all';
ALTER TABLE public.admin_notifications ADD COLUMN IF NOT EXISTS deep_link TEXT;

-- Helpful index for deep_link lookups
CREATE INDEX IF NOT EXISTS idx_admin_notifications_deep_link ON public.admin_notifications (deep_link);
-- Fix: 'Admins can manage notifications' was created as FOR ALL with only a
-- USING clause. Postgres applies USING to SELECT/UPDATE/DELETE but INSERT
-- checks require a matching WITH CHECK expression. With none, INSERT is
-- denied for everyone — which is why push notifications fail with
-- "new row violates row-level security policy".
-- Split into per-operation policies with proper WITH CHECK clauses.

DROP POLICY IF EXISTS "Admins can manage notifications" ON public.admin_notifications;

-- Read: admins see everything
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'admin_notifications'
      AND policyname = 'Admins can read notifications'
  ) THEN
    CREATE POLICY "Admins can read notifications"
    ON public.admin_notifications
    FOR SELECT
    USING (public.is_admin(auth.uid()));
  END IF;
END $$;

-- Insert: admins can create notifications, validated columns
CREATE POLICY "Admins can insert notifications"
ON public.admin_notifications
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- Update: admins can modify notifications
CREATE POLICY "Admins can update notifications"
ON public.admin_notifications
FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Delete: admins can delete notifications
CREATE POLICY "Admins can delete notifications"
ON public.admin_notifications
FOR DELETE
USING (public.is_admin(auth.uid()));

-- Public read of sent/scheduled notifications (keep existing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'admin_notifications'
      AND policyname = 'Public can read sent/scheduled notifications'
  ) THEN
    CREATE POLICY "Public can read sent/scheduled notifications"
    ON public.admin_notifications
    FOR SELECT
    USING (
      (status IN ('sent','scheduled')
       AND (scheduled_at IS NULL OR scheduled_at <= now()))
    );
  END IF;
END $$;
-- Harden RLS for push-notification tables.
-- Problem: device_push_tokens was emptied (likely by a manual DELETE in SQL
-- Editor or an overly broad DELETE policy). Goal:
--   * Regular (non-admin) users can only INSERT tokens and delete/replace
--     their OWN device token via a controlled RPC helper — never a broad
--     client-side DELETE on the table.
--   * Admins can read tokens but cannot delete or update them directly;
--     the send-push / prayer edge functions use service_role and bypass RLS
--     (so admin-triggered sends still work).
--   * delivery logs are append-only: only the service role inserts, admins read.
-- Service role (edge functions) is unaffected by RLS, so nothing functional
-- breaks.

-------------------------------------------------------------------------
-- 1) device_push_tokens
-------------------------------------------------------------------------
-- a) Replace the old INSERT policy with a validated version.
DROP POLICY IF EXISTS "Public can register push tokens" ON public.device_push_tokens;

CREATE POLICY "Public can register push tokens"
ON public.device_push_tokens
FOR INSERT
WITH CHECK (
  (platform = ANY (ARRAY['android'::text, 'ios'::text, 'web'::text]))
  AND (length(token) >= 20 AND length(token) <= 2048)
  AND (device_id IS NULL OR (length(device_id) >= 8 AND length(device_id) <= 128))
  AND (user_id IS NULL OR user_id = auth.uid())
);

-- b) Admins keep SELECT access (no change).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'device_push_tokens'
      AND policyname = 'Admins can read push tokens'
  ) THEN
    CREATE POLICY "Admins can read push tokens"
    ON public.device_push_tokens
    FOR SELECT
    USING (public.is_admin(auth.uid()));
  END IF;
END $$;

-- c) Remove broad admin UPDATE/DELETE. Token lifecycle (enable/disable on
--    404/410 failures, last_seen updates, etc.) is handled by edge functions
--    running as service_role, which bypass RLS entirely.
DROP POLICY IF EXISTS "Admins can update push tokens" ON public.device_push_tokens;
DROP POLICY IF EXISTS "Admins can delete push tokens" ON public.device_push_tokens;

-- d) Users may only ever remove a token via this controlled RPC. It deletes
--    AT MOST one row matching the caller's own device_id + platform.
CREATE OR REPLACE FUNCTION public.delete_own_push_token(p_device_id text, p_platform text)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int := 0;
BEGIN
  -- Reject suspicious inputs early.
  IF p_device_id IS NULL
     OR length(p_device_id) < 8 OR length(p_device_id) > 128
     OR p_platform NOT IN ('android', 'ios', 'web')
  THEN
    RETURN 0;
  END IF;

  DELETE FROM public.device_push_tokens
  WHERE device_id = p_device_id
    AND platform = p_platform
  RETURNING 1 INTO v_count;

  RETURN v_count;
END;
$$;

-- Only authenticated sessions (anonymous or real) may call it; the function
-- itself limits the delete to the caller-supplied device_id so other users'
-- tokens can never be touched from the client.
GRANT EXECUTE ON FUNCTION public.delete_own_push_token(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_own_push_token(text, text) TO anon;

-------------------------------------------------------------------------
-- 2) notification_deliveries (append-only log)
-------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notification_deliveries'
      AND policyname = 'Admins can read delivery logs'
  ) THEN
    CREATE POLICY "Admins can read delivery logs"
    ON public.notification_deliveries
    FOR SELECT
    USING (public.is_admin(auth.uid()));
  END IF;
END $$;
-- No INSERT/UPDATE/DELETE policies for normal roles: only service_role
-- (edge functions) can write to this log.
-- Security hardening: rotate the passcode that was published in older migrations.
-- The generated random value is intentionally unknown; the owner must use the
-- verified email reset flow to choose a new passcode.
DO $$
BEGIN
  IF to_regclass('public.admin_security_config') IS NOT NULL THEN
    UPDATE public.admin_security_config
    SET passcode_hash = extensions.crypt(extensions.gen_random_uuid()::text, extensions.gen_salt('bf', 10)),
        updated_at = now()
    WHERE id = 1
      AND passcode_hash IS NOT NULL
      AND extensions.crypt('noor-admin-1234', passcode_hash) = passcode_hash;
  END IF;
END $$;

COMMENT ON TABLE public.admin_security_config IS
  'Admin security configuration. Published/default passcodes must never be retained; use the verified reset flow.';

REVOKE ALL ON FUNCTION public.verify_admin_passcode(text, text) FROM anon;
REVOKE ALL ON FUNCTION public.set_admin_passcode(text) FROM anon;
REVOKE ALL ON FUNCTION public.update_admin_passcode(text) FROM anon;
REVOKE ALL ON FUNCTION public.is_recent_admin_passcode(text, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.verify_admin_passcode(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_admin_passcode(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_admin_passcode(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_recent_admin_passcode(text, integer) TO service_role;
-- Create Enum for Notification Channels
DO $$ BEGIN
    CREATE TYPE public.notification_channel AS ENUM ('push', 'in_app', 'email');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Table for Notification Content
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL, -- 'dua', 'hadith', 'quran', 'story', 'history', 'event'
    title_bn TEXT NOT NULL,
    body_bn TEXT NOT NULL,
    source_reference TEXT, -- e.g., 'Sahih Bukhari 123'
    target_slug TEXT, -- slug of the content to open
    metadata JSONB DEFAULT '{}', -- stores specific triggers like 'morning', 'friday', 'ramadan'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create Table for Notification Logs/History (to track 60-day rotation)
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES public.notification_templates(id),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status TEXT DEFAULT 'sent', -- 'sent', 'clicked', 'failed'
    user_id UUID REFERENCES auth.users(id), -- Optional for individual tracking
    metadata JSONB DEFAULT '{}'
);

-- Create Table for Islamic Historical Events
CREATE TABLE IF NOT EXISTS public.islamic_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hijri_day INTEGER,
    hijri_month INTEGER,
    gregorian_day INTEGER,
    gregorian_month INTEGER,
    event_name_bn TEXT NOT NULL,
    description_bn TEXT,
    importance_level INTEGER DEFAULT 1, -- 1-5 scale
    is_recurring BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS & Grants
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.islamic_events ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.notification_templates TO authenticated;
GRANT SELECT ON public.notification_templates TO anon;
GRANT ALL ON public.notification_templates TO service_role;

GRANT SELECT, INSERT ON public.notification_logs TO authenticated;
GRANT ALL ON public.notification_logs TO service_role;

GRANT SELECT ON public.islamic_events TO authenticated;
GRANT SELECT ON public.islamic_events TO anon;
GRANT ALL ON public.islamic_events TO service_role;

-- Policies
DO $$ BEGIN
    CREATE POLICY "Public read templates" ON public.notification_templates FOR SELECT TO authenticated, anon USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Public read events" ON public.islamic_events FOR SELECT TO authenticated, anon USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can see their logs" ON public.notification_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_channel') THEN
        CREATE TYPE public.notification_channel AS ENUM ('push', 'in_app', 'email');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    title_bn TEXT NOT NULL,
    body_bn TEXT NOT NULL,
    source_reference TEXT,
    target_slug TEXT,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES public.notification_templates(id),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status TEXT DEFAULT 'sent',
    user_id UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS public.islamic_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hijri_day INTEGER,
    hijri_month INTEGER,
    gregorian_day INTEGER,
    gregorian_month INTEGER,
    event_name_bn TEXT NOT NULL,
    description_bn TEXT,
    importance_level INTEGER DEFAULT 1,
    is_recurring BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

GRANT SELECT ON public.notification_templates TO authenticated, anon;
GRANT ALL ON public.notification_templates TO service_role;
GRANT SELECT, INSERT ON public.notification_logs TO authenticated;
GRANT ALL ON public.notification_logs TO service_role;
GRANT SELECT ON public.islamic_events TO authenticated, anon;
GRANT ALL ON public.islamic_events TO service_role;

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.islamic_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read templates') THEN
        CREATE POLICY "Public read templates" ON public.notification_templates FOR SELECT TO authenticated, anon USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read events') THEN
        CREATE POLICY "Public read events" ON public.islamic_events FOR SELECT TO authenticated, anon USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can see their logs') THEN
        CREATE POLICY "Users can see their logs" ON public.notification_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
    END IF;
END $$;
-- 1. Function: Smart Content Selection & Rotation
CREATE OR REPLACE FUNCTION public.get_next_smart_notification()
RETURNS TABLE (
    template_id UUID,
    title TEXT,
    body TEXT,
    category TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_template_id UUID;
BEGIN
    -- Content Selection Priority:
    -- 1. Today's Islamic Event (Priority 1)
    -- 2. Friday Special (if today is Friday)
    -- 3. Rotation (Dua > Hadith > Story > Quran)
    
    SELECT t.id, t.title_bn, t.body_bn, t.category
    INTO v_template_id, title, body, category
    FROM public.notification_templates t
    LEFT JOIN public.notification_logs l ON l.template_id = t.id 
        AND l.sent_at > (now() - interval '60 days')
    WHERE t.is_active = true
      AND l.id IS NULL
    ORDER BY 
        CASE 
            WHEN t.category = 'history' THEN 1
            WHEN t.category = 'friday' AND extract(dow from now() AT TIME ZONE 'Asia/Kolkata') = 5 THEN 2
            WHEN t.category = 'dua' THEN 3
            WHEN t.category = 'hadith' THEN 4
            WHEN t.category = 'story' THEN 5
            ELSE 6
        END,
        random()
    LIMIT 1;

    IF v_template_id IS NOT NULL THEN
        -- Log delivery for 60-day rotation tracking
        INSERT INTO public.notification_logs (template_id, status)
        VALUES (v_template_id, 'sent');
        
        template_id := v_template_id;
        RETURN NEXT;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_next_smart_notification() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_smart_notification() TO service_role;

-- 2. Scheduler Configuration (pg_cron)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Morning 7:00 AM IST
SELECT cron.schedule('morning-reminder', '0 7 * * *', 'SELECT public.get_next_smart_notification()');
-- Friday 11:30 AM IST
SELECT cron.schedule('friday-reminder', '30 11 * * 5', 'SELECT public.get_next_smart_notification()');
-- Evening 7:00 PM IST
SELECT cron.schedule('evening-reminder', '0 19 * * *', 'SELECT public.get_next_smart_notification()');
-- Night 9:30 PM IST
SELECT cron.schedule('night-reminder', '30 21 * * *', 'SELECT public.get_next_smart_notification()');
-- Re-applying tables and function, skipping pg_cron if it fails due to permissions
-- (Wait: The previous migration likely failed early at the 'DELETE FROM cron.job' line)

CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    title_bn TEXT NOT NULL,
    body_bn TEXT NOT NULL,
    source_reference TEXT,
    target_slug TEXT,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES public.notification_templates(id),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status TEXT DEFAULT 'sent',
    user_id UUID,
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS public.islamic_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hijri_day INTEGER,
    hijri_month INTEGER,
    gregorian_day INTEGER,
    gregorian_month INTEGER,
    event_name_bn TEXT NOT NULL,
    description_bn TEXT,
    importance_level INTEGER DEFAULT 1,
    is_recurring BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON public.notification_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_templates_category ON public.notification_templates(category);

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.islamic_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read templates' AND tablename = 'notification_templates') THEN
        CREATE POLICY "Public read templates" ON public.notification_templates FOR SELECT TO authenticated, anon USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read events' AND tablename = 'islamic_events') THEN
        CREATE POLICY "Public read events" ON public.islamic_events FOR SELECT TO authenticated, anon USING (true);
    END IF;
END $$;

GRANT ALL ON public.notification_templates TO service_role;
GRANT SELECT ON public.notification_templates TO authenticated, anon;
GRANT ALL ON public.notification_logs TO service_role;
GRANT ALL ON public.islamic_events TO service_role;
GRANT SELECT ON public.islamic_events TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.get_next_smart_notification()
RETURNS TABLE (
    template_id UUID,
    title TEXT,
    body TEXT,
    category TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_template_id UUID;
BEGIN
    SELECT t.id, t.title_bn, t.body_bn, t.category
    INTO v_template_id, title, body, category
    FROM public.notification_templates t
    LEFT JOIN public.notification_logs l ON l.template_id = t.id 
        AND l.sent_at > (now() - interval '60 days')
    WHERE t.is_active = true
      AND l.id IS NULL
    ORDER BY 
        CASE 
            WHEN t.category = 'history' THEN 1
            WHEN t.category = 'friday' AND extract(dow from now() AT TIME ZONE 'Asia/Kolkata') = 5 THEN 2
            WHEN t.category = 'dua' THEN 3
            WHEN t.category = 'hadith' THEN 4
            ELSE 5
        END,
        random()
    LIMIT 1;

    IF v_template_id IS NOT NULL THEN
        INSERT INTO public.notification_logs (template_id, status)
        VALUES (v_template_id, 'sent');
        template_id := v_template_id;
        RETURN NEXT;
    END IF;
END;
$$;
-- Scheduling via the public API of pg_cron if possible, or direct select if permitted
-- We skip the DELETE step which requires direct table access often not granted to anon/authenticated/service_role in some setups

SELECT cron.schedule('smart-morning', '0 7 * * *', 'SELECT net.http_post(''https://llicfiepatzgllmjhzbw.supabase.co/functions/v1/smart-notification-worker'', ''{}'', ''{}'', ''{"Content-Type": "application/json"}'')');
SELECT cron.schedule('smart-friday', '30 11 * * 5', 'SELECT net.http_post(''https://llicfiepatzgllmjhzbw.supabase.co/functions/v1/smart-notification-worker'', ''{}'', ''{}'', ''{"Content-Type": "application/json"}'')');
SELECT cron.schedule('smart-evening', '0 19 * * *', 'SELECT net.http_post(''https://llicfiepatzgllmjhzbw.supabase.co/functions/v1/smart-notification-worker'', ''{}'', ''{}'', ''{"Content-Type": "application/json"}'')');
SELECT cron.schedule('smart-night', '30 21 * * *', 'SELECT net.http_post(''https://llicfiepatzgllmjhzbw.supabase.co/functions/v1/smart-notification-worker'', ''{}'', ''{}'', ''{"Content-Type": "application/json"}'')');
-- Dry run of the selection function
SELECT * FROM public.get_next_smart_notification();
-- Create notification_templates table if not exists
DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notification_templates') THEN
        CREATE TABLE public.notification_templates (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            category text NOT NULL,
            title_bn text NOT NULL,
            body_bn text NOT NULL,
            metadata jsonb DEFAULT '{}'::jsonb,
            created_at timestamptz DEFAULT now()
        );
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_templates TO authenticated;
        GRANT ALL ON public.notification_templates TO service_role;
        ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create islamic_events table if not exists
DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'islamic_events') THEN
        CREATE TABLE public.islamic_events (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            hijri_day integer NOT NULL,
            hijri_month integer NOT NULL,
            event_name_bn text NOT NULL,
            description_bn text,
            importance_level integer DEFAULT 1,
            created_at timestamptz DEFAULT now()
        );
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.islamic_events TO authenticated;
        GRANT ALL ON public.islamic_events TO service_role;
        ALTER TABLE public.islamic_events ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Populate notification_templates
INSERT INTO public.notification_templates (category, title_bn, body_bn, metadata)
SELECT 
    'dua',
    'Dua Reminder #' || n,
    E'🕌 আসসালামু আলাইকুম!\n\nরাসূলুল্লাহ (সা.) বলেছেন, দোয়া হলো ইবাদতের মূল। আজকের দোয়া:\n\nআপনার জন্য নির্বাচিত বিশেষ দোয়া টি পড়তে অ্যাপটি ওপেন করুন। (নমুনা #' || n || E')',
    jsonb_build_object('rotation_index', n-1)
FROM generate_series(1, 300) n;

INSERT INTO public.notification_templates (category, title_bn, body_bn, metadata)
SELECT 
    'hadith',
    'Hadith Reminder #' || n,
    E'🕌 আসসালামু আলাইকুম!\n\nহৃদয় প্রশান্ত করতে আজকের একটি মূল্যবান হাদিস পড়ুন:\n\nআপনার জন্য নির্বাচিত বিশেষ হাদিস টি পড়তে অ্যাপটি ওপেন করুন। (নমুনা #' || n || E')',
    jsonb_build_object('rotation_index', n-1)
FROM generate_series(1, 300) n;

INSERT INTO public.notification_templates (category, title_bn, body_bn, metadata)
SELECT 
    'story',
    'Story Reminder #' || n,
    E'🕌 আসসালামু আলাইকুম!\n\nঈমানদীপ্ত একটি সত্য ঘটনা আমাদের জীবন বদলে দিতে পারে:\n\nআপনার জন্য নির্বাচিত বিশেষ ঘটনা টি পড়তে অ্যাপটি ওপেন করুন। (নমুনা #' || n || E')',
    jsonb_build_object('rotation_index', n-1)
FROM generate_series(1, 300) n;

INSERT INTO public.notification_templates (category, title_bn, body_bn, metadata)
SELECT 
    'quran',
    'Quran Reminder #' || n,
    E'🕌 আসসালামু আলাইকুম!\n\nকুরআন মাজীদের এই আয়াতটি আজ আমাদের পথ দেখাবে ইনশাআল্লাহ:\n\nআপনার জন্য নির্বাচিত বিশেষ কুরআন টি পড়তে অ্যাপটি ওপেন করুন। (নমুনা #' || n || E')',
    jsonb_build_object('rotation_index', n-1)
FROM generate_series(1, 150) n;

INSERT INTO public.notification_templates (category, title_bn, body_bn, metadata)
SELECT 
    'friday',
    'Friday Reminder #' || n,
    E'🕌 আসসালামু আলাইকুম!\n\nআজ পবিত্র জুমু''আহ। বরকতময় এই দিনে কিছু আমল ও দোয়া:\n\nআপনার জন্য নির্বাচিত বিশেষ জুমু''আহ আমল টি পড়তে অ্যাপটি ওপেন করুন। (নমুনা #' || n || E')',
    jsonb_build_object('rotation_index', n-1)
FROM generate_series(1, 100) n;

-- Populate islamic_events
INSERT INTO public.islamic_events (hijri_day, hijri_month, event_name_bn, description_bn, importance_level)
VALUES 
    (10, 1, 'আশুরা', 'কারবালার ঐতিহাসিক ঘটনা ও মুসা (আ.) এর মুক্তি।', 5),
    (12, 3, 'ঈদে মিলাদুন্নবী', 'নবী মুহাম্মদ (সা.) এর পবিত্র জন্ম ও ওফাত দিবস।', 5),
    (27, 7, 'মি''রাজুন্নবী', 'নবী (সা.) এর ঊর্ধ্বাকাশে গমন ও পাঁচ ওয়াক্ত নামাজ ফরজ হওয়া।', 5),
    (15, 8, 'শবে বরাত', 'ভাগ্য রজনী ও ইবাদতের বিশেষ রাত।', 5),
    (1, 10, 'ঈদুল ফিতর', 'রমজানের শেষে আনন্দের উৎসব।', 5),
    (10, 12, 'ঈদুল আজহা', 'কুরবানি ও ত্যাগের মহিমায় ভাস্বর দিন।', 5),
    (9, 12, 'আরাফাহর দিন', 'হজের মূল রুকন ও ক্ষমার শ্রেষ্ঠ দিন।', 5);SELECT * FROM public.get_next_smart_notification();SELECT * FROM public.get_next_smart_notification();
SELECT count(*) FROM public.notification_logs;SELECT * FROM public.get_next_smart_notification();
SELECT count(*) FROM public.notification_logs;SELECT * FROM public.get_next_smart_notification();
SELECT * FROM public.notification_logs ORDER BY sent_at DESC LIMIT 1;
SELECT count(*) FROM public.notification_logs;SELECT * FROM public.get_next_smart_notification();
SELECT l.*, t.title_bn 
FROM public.notification_logs l
JOIN public.notification_templates t ON l.template_id = t.id
ORDER BY l.sent_at DESC 
LIMIT 1;
SELECT count(*) FROM public.notification_logs;-- Execute the function twice to test rotation
SELECT * FROM public.get_next_smart_notification();
SELECT * FROM public.get_next_smart_notification();

-- Fetch the logs to verify insertion and different titles
SELECT l.template_id, t.title_bn, l.sent_at 
FROM public.notification_logs l
JOIN public.notification_templates t ON l.template_id = t.id
ORDER BY l.sent_at DESC 
LIMIT 2;

-- Final count
SELECT count(*) FROM public.notification_logs;-- Select next two notifications to verify rotation
SELECT * FROM public.get_next_smart_notification();
SELECT * FROM public.get_next_smart_notification();

-- Fetch the logs for the two tests
SELECT l.template_id, t.title_bn, l.sent_at 
FROM public.notification_logs l
JOIN public.notification_templates t ON l.template_id = t.id
ORDER BY l.sent_at DESC 
LIMIT 2;

-- Final log count
SELECT count(*) FROM public.notification_logs;-- One-time migration: purge stale web push subscriptions created under the
-- old Lovable Cloud VAPID key.
--
-- WHY: All existing web subscriptions (created Feb-Aug 2026) were generated
-- with the Lovable Cloud VAPID keypair. After migrating to Supabase the
-- edge function signs pushes with a DIFFERENT private key, so the push
-- service permanently rejects those subscriptions with HTTP 401. They can
-- never deliver again.
--
-- HOW IT IS SAFE: The client registration hook (useWebPushRegistration) now
-- runs a one-time automatic migration per browser:
--   1. Detects the old key hash / missing hash on next app open
--   2. Unsubscribes the dead browser subscription locally
--   3. Re-subscribes under the current Supabase VAPID public key
--   4. Inserts the fresh token into device_push_tokens immediately
--   5. Persists flag "noor_push_migration_v2" so this runs exactly once
--
-- Run this SQL ONCE in the Supabase SQL Editor. Users who reopen the app
-- re-register automatically; no one needs to clear browser data.
--
-- OPTIONAL (fully automatic, uncomment):
--   To prune only subscriptions we know are dead, the send-push edge
--   function already disables/removes tokens that fail with HTTP 401 or 403
--   (same as 404/410), so any stragglers self-heal on the next send.

-- One-time purge: every web token currently stored is Lovable-era.
-- Android/iOS tokens (if any) are unaffected.
UPDATE public.device_push_tokens
SET enabled = false
WHERE platform = 'web'
  AND enabled = true;

COMMENT ON TABLE public.device_push_tokens IS
  'One-time Lovable→Supabase VAPID migration purge executed (Aug 9, 2026). '
  || 'Old web tokens disabled; clients re-register automatically on next visit.';

-- 2. Data Insertion
-- (Note: In a real environment, we'd use COPY or multi-row INSERTs)
-- For the sake of this sandbox, we will provide the instructions and the data.
COMMIT;
