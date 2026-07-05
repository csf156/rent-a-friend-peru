-- Fase 1.5 — vista de perfil público.
--
-- profiles_select_own (Fase 1.1) bloquea toda lectura cruzada por diseño:
-- cada quien ve solo su fila. Para que un usuario pueda ver el perfil de
-- OTRO (sin datos sensibles), se expone una vista con allowlist explícito de
-- columnas — nunca ampliando la policy de la tabla base.
--
-- Excluye deliberadamente, más allá de lo mínimo pedido (sin DNI/saldo/
-- teléfono — ninguno vive en `profiles`, ya protegidos en storage/auth.users):
--   * nombre          → dato de identidad real; el alias es la cara pública.
--   * kyc internos    → verificado_at (fecha exacta de verificación).
--   * dinero/nivel    → recaudacion_acumulada, gasto_acumulado, nivel,
--                       nivel_actualizado_at (gating de sub-proyecto 6, no
--                       para consumo público).
--   * flags           → feature flags internos.
--
-- Sin `security_invoker`: la vista corre con los privilegios del owner
-- (postgres), que no está sujeto a `profiles_select_own` al no haber FORCE
-- ROW LEVEL SECURITY en profiles — así puede leer todas las filas. El
-- allowlist de columnas es lo único que decide qué se expone.
create view public.perfiles_publicos as
select
  id,
  rol,
  alias,
  edad,
  genero,
  profesion,
  hobbies,
  intereses,
  foto_url,
  kyc_estado
from public.profiles;

grant select on public.perfiles_publicos to authenticated;
revoke select on public.perfiles_publicos from anon;
