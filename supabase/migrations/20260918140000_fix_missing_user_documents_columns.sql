-- Fix (found live while testing the new folders feature, unrelated to it):
-- `public.user_documents` and `public.profile_documents` were each missing
-- most of their intended columns in production. Confirmed live via the
-- REST API: `GET /rest/v1/user_documents?select=template_id` returned
-- 42703 "column does not exist" — same for document_name, created_at,
-- updated_at. Root cause: `supabase_missing_tables_migration.sql` and
-- `supabase_lockdown_documents_migration.sql` (root-level, meant to be run
-- by hand in the Supabase SQL Editor per this repo's convention) both use
-- `CREATE TABLE IF NOT EXISTS` — a no-op against a table that already
-- exists with fewer columns, which is exactly what happened here: these
-- two tables exist with only their bare minimum (id/user_id/color and
-- id/profile_id/document_id respectively) and were never actually
-- brought up to the schema those fix files describe.
--
-- Net effect: fetchUserDocuments() / fetchAssociatedDocuments()'s
-- profile_documents join have 400'd for every account since whenever
-- those tables were first created — the "Mis documentos" generated-
-- template grid has never rendered anything for any user, and the
-- 90-day-old codec-document-architecture memory's own description of the
-- 3-step flow's persistence was never actually reachable in production.
--
-- ADD COLUMN IF NOT EXISTS is safe against however many rows already
-- exist (there may be some under other accounts) — it never touches
-- existing data, and new columns are added as NULL-safe additions where
-- the original design intended NOT NULL, since retrofitting NOT NULL
-- onto a column with unknown existing rows could break silently instead.

ALTER TABLE public.user_documents
  ADD COLUMN IF NOT EXISTS template_id   text,
  ADD COLUMN IF NOT EXISTS document_name text,
  ADD COLUMN IF NOT EXISTS created_at    timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at    timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.profile_documents
  ADD COLUMN IF NOT EXISTS role          text NOT NULL DEFAULT 'signer',
  ADD COLUMN IF NOT EXISTS associated_at timestamptz NOT NULL DEFAULT now();
