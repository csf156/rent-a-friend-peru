-- pgTAP: la suscripción es de solo-lectura para el cliente.
-- Un usuario no puede auto-otorgarse premium ni leer la suscripción de otro.
select plan(3);

insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password,
   email_confirmed_at, created_at, updated_at,
   confirmation_token, email_change, email_change_token_new, recovery_token)
values
  ('00000000-0000-0000-0000-000000000000',
   '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated',
   'alice@test.dev', '', now(), now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000',
   '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated',
   'bob@test.dev', '', now(), now(), now(), '', '', '', '');

insert into public.profiles (id, rol) values
  ('11111111-1111-1111-1111-111111111111', 'amigo'),
  ('22222222-2222-2222-2222-222222222222', 'rentador');

-- suscripción de Bob creada server-side (rol postgres)
insert into public.suscripcion (perfil_id, tipo, estado)
values ('22222222-2222-2222-2222-222222222222', 'amigo_premium', 'activa');

-- impersonar a Alice
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '11111111-1111-1111-1111-111111111111', 'role', 'authenticated')::text,
  true);
set local role authenticated;

select is(
  (select count(*) from public.suscripcion
    where perfil_id = '22222222-2222-2222-2222-222222222222')::int,
  0, 'Alice NO puede leer la suscripción de Bob');

-- Alice intenta auto-otorgarse suscripción -> bloqueado por RLS (sin política de insert)
select throws_ok(
  $$ insert into public.suscripcion (perfil_id, tipo, estado)
     values ('11111111-1111-1111-1111-111111111111', 'amigo_premium', 'activa') $$,
  '42501',
  null,
  'Alice NO puede auto-otorgarse una suscripción (insert bloqueado por RLS)');

-- Alice intenta desactivar la suscripción de Bob. La escritura a suscripcion
-- está revocada para authenticated (defensa en profundidad, ver migración
-- 20260703120100), así que lanza permission denied (42501).
select throws_ok(
  $$ update public.suscripcion set estado = 'inactiva'
     where perfil_id = '22222222-2222-2222-2222-222222222222' $$,
  '42501',
  null,
  'Alice NO puede modificar la suscripción de Bob (write revocado)');

reset role;
select set_config('request.jwt.claims', null, true);

select * from finish();
