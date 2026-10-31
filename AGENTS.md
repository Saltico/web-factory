# AGENTS.md

## Overview

- Harness (OpenCode) que genera sitios web estáticos Astro para clientes. Idioma del proyecto: español.
- Layout de workspace: este repo (`web-factory/`) y cada proyecto cliente generado son repositorios INDEPENDIENTES y hermanos en el mismo workspace. Todo archivo generado vive en el proyecto cliente; el harness solo contiene herramientas y guías.

## Pipeline

- Entrada: comando `/new-client <descripción del negocio>` → agente `00-orchestrator` (default).
- Flujo Fase 1: intake (grill-me si falta info) → `01-architect` genera+valida `site-spec.json` en el proyecto → GATE de aprobación explícita del usuario → `02-astro-builder` construye → `03-seo-auditor` audita → `04-deployer-ejector` publica demo en GitHub Pages.
- Fase 2 (tras aprobación del cliente): eject de rastros del harness + deploy a Hostinger vía MCP (`https://mcp.hostinger.com`, OAuth en navegador la primera vez).
- Flujo alternativo: comando `/migrate <ruta-o-URL-HTML>` → `05-migrator` analiza HTML → genera `site-spec.json` + documenta APIs en `apis.md` si existen → GATE de aprobación → `02-astro-builder` → `03-seo-auditor` → `04-deployer-ejector`.

## Herramientas clave

- `.opencode/config/template.json`: repo GitHub + rama de la plantilla Astro versionada. El desarrollador mantiene la rama actualizada; el harness siempre consume la rama indicada.
- `node .opencode/scripts/clone-template.mjs <target-dir>`: clona la plantilla (depth 1), borra `.git` y copia el schema al proyecto.
- `node .opencode/scripts/validate-spec.mjs <project>/site-spec.json`: valida contra el schema (ajv), imprime resumen y bloque "APPROVAL REQUIRED".
- `.opencode/schemas/site-spec.schema.json`: guía del contrato de datos; se copia a cada proyecto generado (donde vive el spec real).
- `.opencode/guidelines/seo-gtm-standards.md`: checklist del auditor SEO.

## Convenciones

- `site-spec.json` y `site-spec.schema.json` viven en la raíz del proyecto cliente, NUNCA en el harness.
- Assets: durante la demo se usan las imágenes dummy/optimizadas (.avif/.webp) de la plantilla; el usuario las reemplaza manualmente. Imágenes de diseño dadas como URL se descargan y localizan en build; contenido externo genuino (embeds) se queda como URL https.
- Dependencias del tooling del harness: `cd .opencode && npm install` (ajv, ajv-formats, @opencode-ai/plugin).
- La plantilla base incluye toggle dark/light y switcher ES/EN; los flags `features.dark_mode` y `features.i18n` del spec deciden si se mantienen o se REMUEVEN en el build (por defecto se remueven si no se piden).
- CMS ligero Fase 3: Keystatic vía skill `keystatic-astro` (patrón dual-file `cms/{name}Keystatic.ts` + `{name}Astro.ts`). Keystatic gestiona contenido (incluido contenido localizado); el routing i18n y el switcher son responsabilidad de Astro.
