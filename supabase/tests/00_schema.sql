-- pgTAP: estructura del esquema y costuras de expansión.
select plan(12);

-- Tablas base existen
select has_table('public', 'profiles', 'existe tabla profiles');
select has_table('public', 'preferencias_salida', 'existe tabla preferencias_salida');
select has_table('public', 'suscripcion', 'existe tabla suscripcion');

-- Costuras de nivel en profiles
select has_column('public', 'profiles', 'recaudacion_acumulada', 'profiles tiene recaudacion_acumulada');
select has_column('public', 'profiles', 'gasto_acumulado', 'profiles tiene gasto_acumulado');
select has_column('public', 'profiles', 'nivel', 'profiles tiene nivel');
select has_column('public', 'profiles', 'flags', 'profiles tiene flags (feature flags)');

-- RLS habilitado en las 3 tablas
select is(relrowsecurity, true, 'RLS habilitado en profiles')
  from pg_class where oid = 'public.profiles'::regclass;
select is(relrowsecurity, true, 'RLS habilitado en preferencias_salida')
  from pg_class where oid = 'public.preferencias_salida'::regclass;
select is(relrowsecurity, true, 'RLS habilitado en suscripcion')
  from pg_class where oid = 'public.suscripcion'::regclass;

-- Enum de estado de cita completo (costura para sub-proyectos 4 y 5)
select is(
  (select array_agg(e.enumlabel::text order by e.enumsortorder)
     from pg_enum e
     join pg_type t on t.oid = e.enumtypid
    where t.typname = 'estado_cita'),
  array['pendiente', 'confirmada', 'en_curso', 'finalizada', 'no_show', 'disputa'],
  'estado_cita tiene los 6 valores completos'
);

-- Nivel por defecto = bronce
select is(
  (select column_default from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'nivel'),
  '''bronce''::text',
  'nivel por defecto es bronce'
);

select * from finish();
