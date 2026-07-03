# Rent a Friend Perú

App de acompañamiento social bajo demanda (Perú). Cliente React Native + Expo, backend Supabase (Auth, Postgres+RLS, Realtime, Storage, Edge Functions).

Docs de producto y arquitectura en [`docs/`](docs).

## Base de datos (migraciones + tests RLS)

Migraciones en [`supabase/migrations/`](supabase/migrations). Tests pgTAP de
seguridad/RLS en [`supabase/tests/`](supabase/tests).

Los tests de DB corren contra una base Supabase real (dependen de los schemas
`auth` y `storage`), sin Docker ni psql, vía un runner Node. Requieren la
variable `DATABASE_URL` (Session pooler del proyecto). Guardar en `.env`
(ignorado por git):

```bash
# .env
DATABASE_URL=postgresql://postgres.<ref>:<password>@<host>.pooler.supabase.com:5432/postgres
```

```bash
# aplicar migraciones a la base de DATABASE_URL
node tests/db/apply-migrations.mjs

# correr los tests pgTAP (RLS, privilegios de columna, storage)
npm run test:db
```

> No corren en CI porque necesitan una base Supabase con `auth`/`storage`.
> El CI ejecuta lint + typecheck + unit tests.
