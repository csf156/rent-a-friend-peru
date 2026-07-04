# Setup para Claude Design + GitHub (mockup navegable)

**Fecha:** 2026-07-03
**Estado:** aprobado (Opción A)

## Objetivo

Conectar el repo `csf156/rent-a-friend-peru` a Claude Design vía `/design-sync`,
con un sistema de diseño en código (no solo prosa) para que el mockup
navegable generado respete la paleta/tipografía ya definidas en
[`2026-07-03-design-system.md`](../../2026-07-03-design-system.md), antes de
seguir con desarrollo de pantallas reales.

## Fuera de alcance

- No se construyen pantallas de producción todavía — solo tokens + 1
  componente seed para que design-sync tenga un patrón real que seguir.
- No se decide aún qué pantalla del "mapa de vistas" (Sección 5 del doc de
  diseño) se maqueta primero en Claude Design — eso se elige en la sesión de
  canvas, no aquí.

## Approach

1. **`lib/theme.ts`** — tokens ejecutables extraídos 1:1 de la Sección 2
   (colores) y 3 (tipografía) del doc de diseño: `colors` (primary, accent,
   semánticos, niveles), `typography` (familias Sora/Nunito + Inter/Manrope,
   escala 12/14/16/20/24/32), soporte modo oscuro dejado como estructura
   (`light`/`dark`) aunque solo se pueble `light` por ahora.
2. **Componente seed** — `components/Button.tsx` usando `theme.ts`
   (variantes primary/accent, estados normal/pressed/disabled), para que
   design-sync tenga al menos un componente real que verificar contra el
   sistema, no solo tokens sueltos.
3. **Commit + push** a `origin/master` (remote ya configurado, nada más que
   hacer ahí).
4. **`/design-sync`** en Claude Code, apuntando al repo GitHub — trae el
   sistema de diseño (tokens + componente) a Claude Design.
5. **Sesión en claude.ai/design** — usar el mapa de vistas (Sección 5) para
   elegir 1-2 pantallas iniciales (candidatas naturales: Swipe/descubrimiento,
   o Perfil público, por ser las más visuales y con menos dependencias de
   lógica de negocio) y generar mockup navegable ahí, iterando por chat/canvas.
6. **Export** — cuando el mockup esté validado, exportar de vuelta a Claude
   Code (o HTML standalone) para continuar el desarrollo real.

## Criterio de éxito

- `theme.ts` + `Button.tsx` compilan y pasan lint/typecheck existentes.
- `/design-sync` reconoce el repo y lista los tokens/componente como parte
  del sistema de diseño (no inventa paleta propia).
- Al menos 1 pantalla del mapa de vistas queda maquetada y navegable en
  Claude Design usando los colores/tipografía correctos.
