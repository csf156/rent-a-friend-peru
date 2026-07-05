-- Fase 1.4 — KYC (Truora, con modo demo).
--
-- kyc_verificaciones: registro de auditoría + idempotencia de cada intento
-- de verificación (demo o real). Nunca escribible por el cliente: solo el
-- Edge Function (service_role) escribe aquí, tras crear la verificación en
-- el proveedor (o simularla en modo demo) y al recibir el webhook.

create type kyc_proveedor as enum ('demo', 'truora');

create table public.kyc_verificaciones (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.profiles (id) on delete cascade,
  proveedor kyc_proveedor not null,
  -- id de la verificación en el proveedor externo (null en modo demo).
  -- unique para que el webhook sea idempotente: un mismo evento no se
  -- procesa dos veces.
  external_id text unique,
  estado kyc_estado not null default 'pendiente',
  dni_path text not null,
  selfie_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger kyc_verificaciones_set_updated_at
  before update on public.kyc_verificaciones
  for each row execute function public.set_updated_at();

alter table public.kyc_verificaciones enable row level security;

-- El usuario puede ver su propio historial de verificación (útil para la UI
-- de estado), pero nunca puede insertar/actualizar: eso es exclusivo del
-- Edge Function con service_role (bypassa RLS).
create policy kyc_verificaciones_select_own
  on public.kyc_verificaciones for select
  to authenticated
  using (perfil_id = (select auth.uid()));

revoke insert, update, delete on public.kyc_verificaciones from authenticated;
