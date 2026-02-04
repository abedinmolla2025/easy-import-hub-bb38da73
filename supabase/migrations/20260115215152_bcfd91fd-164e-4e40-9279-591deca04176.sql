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
