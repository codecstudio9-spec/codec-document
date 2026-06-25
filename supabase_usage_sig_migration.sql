-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- Adds per-day signature tracking columns to user_usage

ALTER TABLE public.user_usage
  ADD COLUMN IF NOT EXISTS sigs_today    integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sig_day_start date;
