# Sesion FiguScan - Launch publico +18, seguridad y skill de album

Fecha: 2026-06-14
Proyecto: FiguScan (ex FiguSwap / FiguMatch)
Repositorio: `Mad-Max8063/figu-swap`
Deploy: landing en Hostinger via GitHub Actions; app/functions/rules en Firebase (manual)

## Objetivo

Preparar el lanzamiento al publico general aprovechando el inicio del Mundial 2026. Auditoria de readiness y cierre de los bloqueantes antes de salir en vivo.

## Auditoria: bloqueantes detectados

1. Verificacion parental de fachada: PIN del tutor hardcodeado `1234` (y `9876` en el chat), sin envio real de mail al tutor. La pantalla incluso decia "Intenta con 1234".
2. `isMinor` autodeclarado y editable por el propio usuario; sin verificacion de edad.
3. Gate de menores solo client-side; las rules no lo reforzaban.
4. Fuga de datos: `allow list` en `users` exponia email/tutorEmail/securityPin de todos los perfiles a cualquier logueado.
5. IA estrella (escaner + filtro anti-estafas) corriendo en mock y con modelo Gemini invalido `gemini-3.5-flash`.

Menores (no bloqueantes): reviews sin anti-fraude, reputacion sin recalculo server-side, app en modo demo, deploy de app manual.

## Decisiones

- Politica de edad: **18+ ahora, menores en v2**. Sin menores no hace falta control parental real; los bloqueantes 1-3 colapsan en un solo gate de edad.
- Marco legal AR (orientativo, a validar con abogado): Ley 25.326 + CCyC; proyecto de reforma 2025-26 (FiguScan = SDIS). Falta vincular `contacto@maxdevssolutions.com`.
- Verificacion de edad por declaracion de fecha de nacimiento (sin KYC), estandar de la industria.
- Sacar el login anonimo ("Ingreso Rapido") del launch.
- Onboarding real (modo demo) se pospone como "bloque 0".

## Archivos modificados

Bloque 1 - Politica +18:
- `src/types.ts`: agrega `birthDate` y `ageVerified`; depreca `isMinor`/`tutorEmail`/`tutorVerified`.
- `src/App.tsx`: age gate (pantalla fecha de nacimiento, rechazo + signOut si <18); guarda birthDate al crear perfil; remueve `renderMinorBlockedScreen`, PIN 1234, login anonimo y `handleUpdateTutorInfo`.
- `src/components/UserProfileView.tsx`: borra seccion tutor/menor y PIN 1234; el PIN de borrado de album pasa a confirmacion sin default.
- `src/components/ChatRoomView.tsx`: borra banner de tutor (mostraba PIN 9876) y la autorizacion por PIN del tutor en el validador QR.
- `firestore.rules`: create exige `ageVerified == true` + `birthDate`; birthDate inmutable; campos de menores fuera de los editables.
- `landing_page_hostinger.html`: seccion "Proteccion de Menores" -> "Plataforma exclusiva para +18"; badge +18 y links legales en el footer.
- `terminos.html` (nuevo) y `privacidad.html` (nuevos): T&C y Politica de Privacidad sobre Ley 25.326/AAIP.
- `.github/workflows/deploy-landing.yml`: sube tambien terminos.html y privacidad.html.

Bloque 2 - Fuga de datos:
- `firestore.rules`: eliminado `allow list` en `users`; `allow get` restringido al dueño (la app nunca enumera users; otherUser sale de MOCK_COLLECTORS).
- `src/App.tsx`: eliminado el codigo muerto que intentaba leer/actualizar el perfil ajeno (recalculo de reputacion).

Bloque 3 - IA:
- `server.ts` y `functions/src/index.ts`: modelo `gemini-3.5-flash` -> `gemini-2.0-flash` (3 ocurrencias c/u).

Album / contenido:
- `src/data.ts`: plantel Argentina alineado al album Panini real. `ARG-1` = Escudo Argentina, `ARG-13` = Plantel Argentina (foto grupal). Los 18 jugadores ya coincidian (validado: Balerdi = 7).
- `.agents/skills/figuscan-album-sync/SKILL.md` (nuevo) + copia en `~/.claude/skills/figuscan-album-sync/`: skill reutilizable que cruza una seleccion con el album Panini real, corrige el plantel, detecta cromos animé faltantes y genera los prompts (con reglas de copyright).

## Verificacion local

- `npx tsc --noEmit`: OK.
- `npm run build` (vite + esbuild server): OK.
- `npm run build` en `functions/` (tsc): OK.
- Slots de Argentina: 20/20 con nombre, sin genericos.

## Deploy

- Commit `5d47bf2`: politica +18 y endurecimiento de seguridad (bloques 1-3).
- Commit `e5c81f8`: plantel Argentina alineado a Panini + skill figuscan-album-sync.
- Push a `main`: `f59ffa0..e5c81f8`.
- El GitHub Action "Deploy Landing Page to Hostinger" se dispara (el commit de seguridad toca landing/terminos/privacidad) -> landing +18 en vivo en `figuscan.maxdevssolutions.com`.

## Estado final

Landing +18 desplegandose a Hostinger. Codigo de la app listo y verificado.

Pendientes:
- Verificar el Action en GitHub > Actions y la landing en produccion.
- Correr `firebase deploy --only hosting,functions,firestore:rules` (CLAVE: el age gate y el cierre de la fuga viven en las rules; sin esto no quedan activos server-side).
- Generar los cromos animé con Antigravity usando la skill `figuscan-album-sync` (faltan ARG-1,6,7,8,9,10,11,12,13,14,15,16,18,19,20; luego BRA, FRA, etc.).
- Vincular `contacto@maxdevssolutions.com`.
- Al activar `GEMINI_API_KEY`: confirmar el id del modelo y alinear la numeracion del prompt del escaner con `data.ts`.
- Post-launch: bloque 0 (onboarding real, salir del modo demo), reputacion server-side, anti-fraude en reviews.
