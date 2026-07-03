-- pgTAP: aislamiento RLS de profiles.
-- Prueba que un usuario NO puede leer el perfil KYC ni el saldo/nivel de otro,
-- ni modificar su fila. (Requisito crítico de la Fase 1.1.)
select plan(6);

-- --- setup (rol postgres, bypass RLS) ---
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

insert into public.profiles (id, rol, alias, kyc_estado, recaudacion_acumulada)
values
  ('11111111-1111-1111-1111-111111111111', 'amigo', 'AliceAlias', 'verificado', 999.00),
  ('22222222-2222-2222-2222-222222222222', 'rentador', 'BobAlias', 'verificado', 500.00);

-- --- impersonar a Alice ---
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '11111111-1111-1111-1111-111111111111', 'role', 'authenticated')::text,
  true
);
set local role authenticated;

select is(
  (select count(*) from public.profiles where id = '11111111-1111-1111-1111-111111111111')::int,
  1, 'Alice ve su propia fila');

select is(
  (select count(*) from public.profiles where id = '22222222-2222-2222-2222-222222222222')::int,
  0, 'Alice NO puede leer el perfil/KYC/saldo de Bob');

select is(
  (select count(*) from public.profiles)::int,
  1, 'Alice solo ve 1 fila en total (la suya)');

-- Alice intenta modificar la fila de Bob (RLS filtra -> 0 filas afectadas)
update public.profiles set alias = 'HACKED' where id = '22222222-2222-2222-2222-222222222222';

-- volver a postgres para verificar
reset role;
select set_config('request.jwt.claims', null, true);

select is(
  (select alias from public.profiles where id = '22222222-2222-2222-2222-222222222222'),
  'BobAlias', 'Alice NO pudo modificar la fila de Bob');

-- anon no lee nada
set local role anon;
select set_config(
  'request.jwt.claims',
  json_build_object('role', 'anon')::text, true);
select is(
  (select count(*) from public.profiles)::int,
  0, 'anon no puede leer profiles');
reset role;
select set_config('request.jwt.claims', null, true);

-- Alice SÍ puede actualizar su propia fila
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '11111111-1111-1111-1111-111111111111', 'role', 'authenticated')::text,
  true);
set local role authenticated;
update public.profiles set profesion = 'diseñadora'
  where id = '11111111-1111-1111-1111-111111111111';
reset role;
select set_config('request.jwt.claims', null, true);
select is(
  (select profesion from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  'diseñadora', 'Alice SÍ puede actualizar su propia fila');

select * from finish();
