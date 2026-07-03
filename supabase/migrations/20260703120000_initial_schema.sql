-- Fase 1.1 — Esquema de datos + RLS + storage
-- Sub-proyecto 1 (Identidad y perfiles). Tablas base con RLS estricto y
-- las "costuras" de expansión (columnas de nivel, suscripción, flags,
-- enums de cita completos) listas aunque el MVP no las use todavía.
--
-- Reglas de seguridad (doc de negocio, Sección E):
--   * El cliente nunca ve/edita datos de otro usuario (RLS estricto por fila).
--   * DNI y saldos jamás expuestos a otro usuario.
--   * La suscripción se otorga server-side (service_role), nunca por el cliente.

-- ============================================================================
-- Enums
-- ============================================================================

create type rol_usuario as enum ('amigo', 'rentador');

create type kyc_estado as enum ('pendiente', 'verificado', 'rechazado');

create type estado_suscripcion as enum ('activa', 'inactiva');

-- Enum de estado de cita COMPLETO desde el día 1, aunque el MVP no use todos
-- los valores todavía (costura de expansión — no cambiar el significado luego,
-- solo agregar valores de forma aditiva).
create type estado_cita as enum (
  'pendiente',
  'confirmada',
  'en_curso',
  'finalizada',
  'no_show',
  'disputa'
);

-- ============================================================================
-- Helper: mantener updated_at
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- profiles
-- ============================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  rol rol_usuario not null,
  nombre text,
  alias text,
  edad integer check (edad is null or edad >= 18),
  genero text,
  profesion text,
  foto_url text,
  hobbies text[] not null default '{}',
  intereses text[] not null default '{}',
  -- KYC (sensible — nunca legible por otro usuario)
  kyc_estado kyc_estado not null default 'pendiente',
  verificado_at timestamptz,
  -- Costuras de nivel (sub-proyecto 6). Presentes ya, no usadas para gating aún.
  recaudacion_acumulada numeric(12, 2) not null default 0,
  gasto_acumulado numeric(12, 2) not null default 0,
  nivel text not null default 'bronce',
  nivel_actualizado_at timestamptz,
  -- Feature flags por usuario (leídos server-side en Edge Functions).
  flags jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

-- Un usuario solo ve su propia fila. Esto aísla KYC, saldos y nivel.
-- El perfil público "sin datos sensibles" (Fase 1.5) se expondrá luego con
-- una vista/función acotada; NO se abre aquí.
create policy profiles_select_own
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy profiles_insert_own
  on public.profiles for insert
  to authenticated
  with check (id = (select auth.uid()));

create policy profiles_update_own
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Sin política de DELETE: la fila se borra por cascade desde auth.users.
-- El usuario no puede borrar su perfil directamente en esta fase.

-- ============================================================================
-- preferencias_salida  (1 fila por perfil)
-- ============================================================================

create table public.preferencias_salida (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null unique references public.profiles (id) on delete cascade,
  sexo_pref text,
  tipo_salida text,
  rango_edad int4range,
  horario text,
  distritos text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger preferencias_salida_set_updated_at
  before update on public.preferencias_salida
  for each row execute function public.set_updated_at();

alter table public.preferencias_salida enable row level security;

create policy preferencias_select_own
  on public.preferencias_salida for select
  to authenticated
  using (perfil_id = (select auth.uid()));

create policy preferencias_insert_own
  on public.preferencias_salida for insert
  to authenticated
  with check (perfil_id = (select auth.uid()));

create policy preferencias_update_own
  on public.preferencias_salida for update
  to authenticated
  using (perfil_id = (select auth.uid()))
  with check (perfil_id = (select auth.uid()));

create policy preferencias_delete_own
  on public.preferencias_salida for delete
  to authenticated
  using (perfil_id = (select auth.uid()));

-- ============================================================================
-- suscripcion  (vacía en MVP; el gating lee de aquí en el futuro)
-- ============================================================================

create table public.suscripcion (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.profiles (id) on delete cascade,
  tipo text,
  estado estado_suscripcion not null default 'inactiva',
  vigente_hasta timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger suscripcion_set_updated_at
  before update on public.suscripcion
  for each row execute function public.set_updated_at();

alter table public.suscripcion enable row level security;

-- El usuario solo PUEDE LEER su suscripción. La escritura es exclusiva del
-- service_role (tras confirmación de IAP): un cliente jamás se auto-otorga
-- premium. service_role bypassa RLS, así que no necesita política.
create policy suscripcion_select_own
  on public.suscripcion for select
  to authenticated
  using (perfil_id = (select auth.uid()));

-- ============================================================================
-- Storage buckets + políticas por owner
-- ============================================================================

-- Bucket privado para el DNI. Nunca público. Acceso solo del dueño.
insert into storage.buckets (id, name, public)
values ('dni', 'dni', false)
on conflict (id) do nothing;

-- Bucket de fotos de perfil (privado a nivel bucket; lectura permitida a
-- usuarios autenticados para descubrimiento, escritura solo del dueño).
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', false)
on conflict (id) do nothing;

-- Convención de ruta: el primer segmento de la carpeta es el uid del dueño,
-- p.ej. '<uid>/dni-frente.jpg'. Así owner = (storage.foldername(name))[1].

-- --- dni: acceso exclusivo del dueño en las 4 operaciones ---
create policy dni_select_own
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'dni'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy dni_insert_own
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'dni'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy dni_update_own
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'dni'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy dni_delete_own
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'dni'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- --- fotos: escritura solo del dueño; lectura para autenticados ---
create policy fotos_select_authenticated
  on storage.objects for select
  to authenticated
  using (bucket_id = 'fotos');

create policy fotos_insert_own
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'fotos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy fotos_update_own
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'fotos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy fotos_delete_own
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'fotos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
