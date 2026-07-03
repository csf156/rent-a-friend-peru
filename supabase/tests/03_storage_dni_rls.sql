-- pgTAP: aislamiento del bucket privado `dni` y lectura de `fotos`.
-- El DNI de un usuario nunca es accesible por otro. (Requisito crítico Fase 1.1.)
select plan(5);

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

-- Bucket dni existe y es privado
select is(
  (select public from storage.buckets where id = 'dni'),
  false, 'bucket dni existe y es privado');

-- Objetos preexistentes de Bob (creados como postgres): su DNI y su foto
insert into storage.objects (bucket_id, name)
values
  ('dni', '22222222-2222-2222-2222-222222222222/dni-frente.jpg'),
  ('fotos', '22222222-2222-2222-2222-222222222222/perfil.jpg');

-- impersonar a Alice
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '11111111-1111-1111-1111-111111111111', 'role', 'authenticated')::text,
  true);
set local role authenticated;

-- Alice sube su propio DNI (bajo su carpeta) -> permitido
select lives_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('dni', '11111111-1111-1111-1111-111111111111/dni-frente.jpg') $$,
  'Alice puede subir su propio DNI');

-- Alice NO puede leer el DNI de Bob
select is(
  (select count(*) from storage.objects
    where bucket_id = 'dni'
      and name = '22222222-2222-2222-2222-222222222222/dni-frente.jpg')::int,
  0, 'Alice NO puede leer el DNI de Bob');

-- Alice NO puede subir a la carpeta de Bob (with check falla -> 42501)
select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('dni', '22222222-2222-2222-2222-222222222222/hack.jpg') $$,
  '42501',
  null,
  'Alice NO puede subir un DNI a la carpeta de Bob');

-- fotos: legibles por cualquier autenticado (para descubrimiento)
select is(
  (select count(*) from storage.objects
    where bucket_id = 'fotos'
      and name = '22222222-2222-2222-2222-222222222222/perfil.jpg')::int,
  1, 'las fotos de perfil son legibles por usuarios autenticados');

reset role;
select set_config('request.jwt.claims', null, true);

select * from finish();
