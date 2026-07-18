# Codec Document — instructions for Claude

## Standing authorization (no need to ask each time)

The user has explicitly asked to skip confirmation prompts for the following routine actions in this repo. Do them directly, then report what was done when finished — don't pause mid-task to ask permission first:

- `git push origin master` (regular commits, not force-push)
- Supabase: `supabase db push`, `supabase functions deploy <name>`, `supabase link` — always with `--workdir` pointed at this project folder (see gotcha below) and `--yes` to skip interactive prompts
- `vercel deploy` / anything that ships this app to its existing Vercel project

Still stop and ask first for anything genuinely destructive or one-way: force-push, `git reset --hard`, dropping/truncating tables, deleting data, rotating/revoking credentials, or touching a Vercel/Supabase project other than this app's own.

## Known environment gotcha

The Supabase CLI on this machine does not reliably detect this project's `supabase/` folder as workdir (the path has spaces/parentheses: `CODEC DOCUMENT (2)\CODEC DOCUMENT`). Without `--workdir`, it silently latches onto a stray leftover `supabase/` folder in `C:\Users\hp` from an unrelated old project, and commands fail with confusing "entrypoint not found" errors. Always pass `--workdir "C:\Users\hp\Downloads\CODEC DOCUMENT (2)\CODEC DOCUMENT"` explicitly on every `supabase link` / `db push` / `functions deploy` call.

## Stack

Vite + React 18 + TypeScript + Tailwind + Supabase (project ref `yxzchnldmfsgdtbjurey`) + react-router v7. Dev server port 5174. All Supabase signature/document operations live in `src/lib/signatureService.ts`; company/enterprise-module operations in `src/app/services/company-service.ts`.
