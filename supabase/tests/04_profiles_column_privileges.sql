-- pgTAP: privilegios a nivel de COLUMNA en profiles.
-- RLS es por fila, no por columna: sin grants por columna, un usuario podría
-- editar su propia fila para auto-verificar KYC, inflar nivel/saldo o
-- auto-otorgarse premium (flags). Estas columnas solo las escribe el
-- service_role (webhook KYC, ledger, jobs de nivel, IAP). El cliente solo
-- puede tocar los campos de su perfil editable.
select plan(7);

insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password,
   email_confirmed_at, created_at, updated_at,
   confirmation_token, email_change, email_change_token_new, recovery_token)
values
  ('00000000-0000-0000-0000-000000000000',
   '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated',
   'alice@test.dev', '', now(), now(), now(), '', '', '', ''),
  -- usuario sin perfil aún (para probar INSERT)
  ('00000000-0000-0000-0000-000000000000',
   '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated',
   'carol@test.dev', '', now(), now(), now(), '', '', '', '');

insert into public.profiles (id, rol, alias)
values ('11111111-1111-1111-1111-111111111111', 'amigo', 'AliceAlias');

-- impersonar a Alice
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '11111111-1111-1111-1111-111111111111', 'role', 'authenticated')::text,
  true);
set local role authenticated;

-- Alice NO puede auto-verificar su KYC
select throws_ok(
  $$ update public.profiles set kyc_estado = 'verificado'
     where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501', null, 'Alice NO puede auto-verificar su KYC');

-- Alice NO puede inflar su recaudación (nivel)
select throws_ok(
  $$ update public.profiles set recaudacion_acumulada = 999999
     where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501', null, 'Alice NO puede inflar su recaudacion_acumulada');

-- Alice NO puede saltar su nivel
select throws_ok(
  $$ update public.profiles set nivel = 'diamante'
     where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501', null, 'Alice NO puede cambiar su nivel');

-- Alice NO puede auto-otorgarse flags premium
select throws_ok(
  $$ update public.profiles set flags = '{"is_premium": true}'
     where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501', null, 'Alice NO puede modificar sus feature flags');

-- Regresión: Alice SÍ puede editar su alias (campo de perfil editable)
select lives_ok(
  $$ update public.profiles set alias = 'AliceNueva'
     where id = '11111111-1111-1111-1111-111111111111' $$,
  'Alice SÍ puede editar su alias (campo editable)');

reset role;
select set_config('request.jwt.claims', null, true);

-- impersonar a Carol (sin perfil)
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '33333333-3333-3333-3333-333333333333', 'role', 'authenticated')::text,
  true);
set local role authenticated;

-- Carol NO puede crear su perfil ya verificado (columna kyc_estado bloqueada en insert)
select throws_ok(
  $$ insert into public.profiles (id, rol, kyc_estado)
     values ('33333333-3333-3333-3333-333333333333', 'amigo', 'verificado') $$,
  '42501', null, 'Carol NO puede crear su perfil con KYC ya verificado');

-- Carol SÍ puede crear su perfil mínimo (id + rol; el resto toma defaults seguros)
select lives_ok(
  $$ insert into public.profiles (id, rol)
     values ('33333333-3333-3333-3333-333333333333', 'amigo') $$,
  'Carol SÍ puede crear su perfil mínimo (id + rol)');

reset role;
select set_config('request.jwt.claims', null, true);

select * from finish();
