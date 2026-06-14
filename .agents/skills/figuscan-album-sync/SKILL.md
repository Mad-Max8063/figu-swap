---
name: figuscan-album-sync
description: Sincroniza una selección de FiguScan con el álbum oficial Panini Mundial 2026 (vía búsqueda web), corrige el plantel en el código, detecta qué cromos animé faltan y genera los prompts de imagen consistentes con el estilo del juego. Invocala para "completar/cargar la selección de <país>", "cruzar con el álbum Panini real", "generar las figuritas que faltan de <país>".
---

# FiguScan · Sincronización de Álbum por Selección

Esta skill replica, para **cualquier selección**, el trabajo de cruzar la data de la app con el álbum **oficial Panini Mundial 2026**, corregir el plantel, detectar los cromos animé faltantes y producir los prompts de imagen listos para generar. Se usa una selección por vez (ARG, BRA, FRA, ESP, GER, URU, MEX, MAR, JPN…).

## ⚠️ Regla de oro (copyright) — leer siempre primero
- Los **IDs** (ej. `ARG-7`) se alinean con la numeración oficial Panini, pero **NO se reproducen las imágenes oficiales**.
- Las ilustraciones son **estilo animé, medio cuerpo, de frente**, con **uniformes genéricos** que evocan los colores del país, **SIN escudos oficiales, sin logos de AFA/CBF/FIFA/Adidas/Nike/Panini, sin nombres de marca**.
- El nombre comercial es siempre **FiguScan**.

## Archivos clave del repo
- `src/data.ts` → `STAR_PLAYERS[<PREFIX>]`: mapa `{ número: 'Nombre' }` por selección. También `TEAMS` (cada país tiene `size: 20`).
- `src/components/InventoryView.tsx` → array `generatedStickers`: lista blanca de IDs que tienen ilustración propia en `/public/stickers/{ID}.png`. Lo que no está ahí cae al genérico `getStickerImage()` → `/stickers/generic_<PREFIX>.png`.
- `public/stickers/` → los PNG. Nombrar cada cromo como `{ID}.png` (ej. `ARG-7.png`). Fallbacks: `generic_<PREFIX>.png` y `generic_player.png`.

## Estructura de una selección (20 cromos)
Según el álbum real, cada selección trae **20 cromos = escudo + foto del plantel + 18 jugadores**.
- `XX-01`: **escudo** del país (versión metálica/dorada). En FiguScan se ilustra con un **emblema genérico** (colores y estrellas del país, sin el escudo oficial).
- Un slot de **foto grupal / plantel** (en Argentina resultó ser `ARG-13`; **verificá la posición cruzando**, puede variar por país).
- **18 jugadores** en los slots restantes.

## Flujo paso a paso

### 1. Cruzar con el álbum Panini real (WebSearch)
Buscá el roster oficial de la selección en el álbum Panini World Cup 2026. Queries útiles:
- `"álbum Panini Mundial 2026 <país> figuritas plantel jugadores números"`
- `"Panini World Cup 2026 <country> sticker checklist players"`
- `"códigos álbum Panini Mundial 2026 <país>"` (ej. fuente: misfiguritas.com)
Obtené: los ~18 jugadores oficiales, el orden/numeración, y validá al menos un dato cruzado (ej. en ARG, **Balerdi = 7**). Anotá ausencias notables (jugadores convocados que **no** tienen cromo) para no inventarlos.

### 2. Corregir el plantel en `src/data.ts`
- Compará `STAR_PLAYERS[<PREFIX>]` con la lista oficial.
- **Sacá** nombres que no estén en el álbum (no inventar jugadores).
- **Completá** los huecos: jugadores faltantes, `XX-01` → `'Escudo <País> ⭐'`, y el slot de plantel → `'Plantel <País> 📸'`.
- Mantené el emoji `⭐` para la figura estrella y `🌟` para semi-estrellas si aplica.
- Sin nombre cargado, `getStickerName()` cae a un genérico feo ("Defensor Titular N° X") → por eso hay que llenar los 20 slots.

### 3. Detectar las imágenes faltantes
- Mirá `generatedStickers` en `InventoryView.tsx` y listá qué IDs del país **no** están (esos usan el genérico).
- Resultado: la lista de cromos a generar (jugadores + escudo + plantel).

### 4. Generar los prompts de imagen
Por cada cromo faltante, producí un prompt consistente con el estilo del juego (referencia: `public/stickers/ARG-17.png` = Messi). Plantilla base:

> Semi-realistic **anime-style** digital illustration, front-facing **half-body portrait** of a [nacionalidad] male soccer player, [pelo/rasgos distintivos], wearing a **generic** football jersey in [colores del país] (NO official crest, NO brand logos, NO sponsor). Premium holographic trading-card look: **silver hexagonal metallic frame**, glowing [color] crystalline shards background, soft rim lighting, vibrant, clean, high detail. Square 1:1.

Variantes:
- **Figura estrella** (`⭐`): fondo más brillante/holográfico, aura premium.
- **Escudo** (`XX-01`): emblema **genérico** del país (colores + estrellas, estilo metálico dorado), sin el escudo oficial.
- **Plantel** (foto grupal): grupo de jugadores estilo animé en uniforme genérico del país, formación de equipo.
Nombrá cada salida `{ID}.png`.

> El render del PNG lo hace un motor de imágenes (Antigravity/Gemini Imagen, etc.). Esta skill entrega los **prompts** y deja el **código enganchado**; si el agente tiene capacidad de generación de imágenes, puede generarlas directamente.

### 5. Enganchar y verificar
- Cuando los PNG estén en `public/stickers/`, agregá esos IDs al array `generatedStickers` de `InventoryView.tsx`.
- Verificá: `npx tsc --noEmit` y `npm run build`.
- Opcional: validar en producción que ningún cromo quede roto (ver script en la skill `figuscan-ops`).

## Estado de referencia (Argentina, ya hecho)
- Plantel ARG completo y alineado a Panini (18 jugadores + `ARG-1` escudo + `ARG-13` plantel).
- Con ilustración propia: `ARG-2, ARG-3, ARG-4, ARG-5, ARG-17`. **Faltan generar** las otras 15 (`ARG-1, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 19, 20`).
- Usá Argentina como molde de calidad/estilo al hacer las demás selecciones.
