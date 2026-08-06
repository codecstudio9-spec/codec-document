-- Site-wide key/value settings (starting with the Meta/Facebook Pixel ID
-- for ad conversion tracking). Readable by anyone -- the pixel ID has to
-- be fetched client-side, including by anonymous visitors on public
-- marketing pages, before any script can be injected. Writable only by
-- the admin, reusing the same is_admin_user() guard as the rest of the
-- admin-only tables (see 20260718180500_fix_is_admin_user_null.sql).

CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS app_settings_select_all ON public.app_settings;
CREATE POLICY app_settings_select_all ON public.app_settings
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS app_settings_admin_write ON public.app_settings;
CREATE POLICY app_settings_admin_write ON public.app_settings
  FOR INSERT
  WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS app_settings_admin_update ON public.app_settings;
CREATE POLICY app_settings_admin_update ON public.app_settings
  FOR UPDATE
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS app_settings_admin_delete ON public.app_settings;
CREATE POLICY app_settings_admin_delete ON public.app_settings
  FOR DELETE
  USING (public.is_admin_user());
