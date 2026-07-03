-- Hardening (security-review Fase 1.1): privilegios a nivel de COLUMNA.
--
-- RLS es por fila, no por columna. Sin esto, un usuario podría UPDATE/INSERT su
-- propia fila de profiles y auto-verificar su KYC, inflar recaudacion/nivel o
-- auto-otorgarse feature flags premium. Esas columnas solo las escribe el
-- service_role (webhook KYC, ledger, jobs de nivel, IAP), que bypassa estos
-- grants. El cliente autenticado queda acotado a:
--   * INSERT de su fila con (id, rol) — el resto toma defaults seguros.
--   * UPDATE solo de los campos de su perfil editable.
-- SELECT permanece sobre todas las columnas (limitado a su fila por RLS).

-- profiles: revocar escritura amplia y re-otorgar por columna.
revoke insert, update on public.profiles from authenticated;

grant insert (id, rol) on public.profiles to authenticated;

grant update (
  nombre,
  alias,
  edad,
  genero,
  profesion,
  foto_url,
  hobbies,
  intereses
) on public.profiles to authenticated;

-- suscripcion: defensa en profundidad. El cliente jamás escribe su suscripción
-- (ya bloqueado por RLS al no tener política de write; aquí se refuerza a nivel
-- de privilegio de tabla). La escritura es exclusiva del service_role.
revoke insert, update, delete on public.suscripcion from authenticated;
