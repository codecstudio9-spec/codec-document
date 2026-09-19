-- Carpetas para "Mis documentos" — crear, nombrar y mover documentos
-- dentro. folder_id queda NULL para cualquier documento existente
-- (comportamiento actual sin cambios: "sin carpeta").

create table if not exists public.document_folders (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  color      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.document_folders enable row level security;

drop policy if exists "document_folders_own" on public.document_folders;
create policy "document_folders_own" on public.document_folders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- user_documents: documentos de plantilla generados en el flujo de 3 pasos.
alter table public.user_documents
  add column if not exists folder_id uuid references public.document_folders(id) on delete set null;

-- documents: el flujo de firma (creador + invitados).
alter table public.documents
  add column if not exists folder_id uuid references public.document_folders(id) on delete set null;

create index if not exists idx_user_documents_folder_id on public.user_documents(folder_id);
create index if not exists idx_documents_folder_id on public.documents(folder_id);
