-- ============================================================
-- CODEC DOCUMENT — Credits & User Profile Migration
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. User profiles table (auto-populated on first login)
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Credit/subscription table
CREATE TABLE IF NOT EXISTS public.user_credits (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  credits         INTEGER DEFAULT 0 NOT NULL,
  plan            TEXT DEFAULT 'free' CHECK (plan IN ('free', 'monthly')),
  plan_expires_at TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Row Level Security — users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own"  ON public.users;
DROP POLICY IF EXISTS "users_insert_own"  ON public.users;
DROP POLICY IF EXISTS "users_update_own"  ON public.users;

CREATE POLICY "users_select_own"  ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert_own"  ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own"  ON public.users FOR UPDATE USING (auth.uid() = id);

-- 4. Row Level Security — user_credits table
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "credits_select_own"  ON public.user_credits;
DROP POLICY IF EXISTS "credits_insert_own"  ON public.user_credits;
DROP POLICY IF EXISTS "credits_update_own"  ON public.user_credits;

CREATE POLICY "credits_select_own"  ON public.user_credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "credits_insert_own"  ON public.user_credits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "credits_update_own"  ON public.user_credits FOR UPDATE USING (auth.uid() = user_id);

-- 5. Storage bucket (run once if bucket doesn't exist yet)
--    Go to Supabase > Storage > New bucket > Name: "documents-bucket", Public: true
--    Then paste these policies:

-- Storage RLS for documents-bucket (if not already set)
-- INSERT policy
CREATE POLICY IF NOT EXISTS "Allow authenticated uploads"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents-bucket' AND auth.role() = 'authenticated');

-- SELECT policy (public read)
CREATE POLICY IF NOT EXISTS "Allow public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents-bucket');

-- UPDATE/DELETE policy
CREATE POLICY IF NOT EXISTS "Allow owners to update/delete"
  ON storage.objects FOR ALL
  USING (bucket_id = 'documents-bucket' AND auth.uid()::text = (storage.foldername(name))[1]);
