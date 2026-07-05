-- pgTAP: RLS + privilegios de kyc_verificaciones.
-- Solo el service_role escribe (Edge Functions kyc-start/kyc-webhook). El
-- cliente autenticado únicamente puede leer su propio historial.
select plan(6);

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
  ('22222222-2222-2222-2222-222222222222', 'amigo');

-- Como postgres (service_role-equivalente en el test): crea verificaciones
-- para Alice y Bob.
insert into public.kyc_verificaciones (perfil_id, proveedor, estado, dni_path, selfie_path)
values
  ('11111111-1111-1111-1111-111111111111', 'demo', 'verificado',
   '11111111-1111-1111-1111-111111111111/dni.jpg',
   '11111111-1111-1111-1111-111111111111/selfie.jpg'),
  ('22222222-2222-2222-2222-222222222222', 'demo', 'verificado',
   '22222222-2222-2222-2222-222222222222/dni.jpg',
   '22222222-2222-2222-2222-222222222222/selfie.jpg');

-- impersonar a Alice
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '11111111-1111-1111-1111-111111111111', 'role', 'authenticated')::text,
  true);
set local role authenticated;

select is(
  (select count(*)::int from public.kyc_verificaciones),
  1,
  'Alice ve solo su propia verificación (RLS aísla por perfil_id)');

select is(
  (select proveedor::text from public.kyc_verificaciones
    where perfil_id = '11111111-1111-1111-1111-111111111111'),
  'demo',
  'Alice puede leer su propia verificación');

-- Alice NO puede insertar su propia verificación (eso es solo del Edge Function)
select throws_ok(
  $$ insert into public.kyc_verificaciones (perfil_id, proveedor, estado, dni_path, selfie_path)
     values ('11111111-1111-1111-1111-111111111111', 'demo', 'verificado', 'x', 'y') $$,
  '42501', null, 'Alice NO puede insertar una fila de kyc_verificaciones');

-- Alice NO puede auto-aprobarse editando una verificación existente
select throws_ok(
  $$ update public.kyc_verificaciones set estado = 'verificado'
     where perfil_id = '11111111-1111-1111-1111-111111111111' $$,
  '42501', null, 'Alice NO puede actualizar su verificación');

-- Alice NO puede borrar su verificación
select throws_ok(
  $$ delete from public.kyc_verificaciones
     where perfil_id = '11111111-1111-1111-1111-111111111111' $$,
  '42501', null, 'Alice NO puede borrar su verificación');

reset role;
select set_config('request.jwt.claims', null, true);

-- Verificar (rol postgres) que la fila de Bob sigue intacta.
select is(
  (select estado::text from public.kyc_verificaciones
    where perfil_id = '22222222-2222-2222-2222-222222222222'),
  'verificado',
  'La verificación de Bob permanece intacta');

select * from finish();
