# AGENTS.md

## Overview

- Harness (OpenCode) que genera sitios web estáticos Astro para clientes. Idioma del proyecto: español.
- Layout de workspace: este repo (`web-factory/`) y cada proyecto cliente generado son repositorios INDEPENDIENTES y hermanos en el mismo workspace. Todo archivo generado vive en el proyecto cliente; el harness solo contiene herramientas y guías.

## Pipeline

- Entrada: comando `/new-client <descripción del negocio>` → agente `00-orchestrator` (default).
- Flujo Fase 1 (demo estática): intake (grill-me si falta info) → `01-architect` configura proyecto + genera+valida `site-spec.json` → GATE de aprobación explícita → stamp `meta.approvedAt` → `02-astro-builder` construye → `03-seo-auditor` audita → `04-deployer-ejector` publica demo estática en GitHub Pages.
- Flujo Fase 2 (Keystatic CMS): tras aprobación del demo estática → `02-astro-builder` añade colecciones Keystatic → `03-seo-auditor` audita → `04-deployer-ejector` redeploya demo con CMS en GitHub Pages → aprobación del cliente.
- Fase 3 (producción): tras aprobación del CMS → `04-deployer-ejector` ejecta rastros del harness y despliega a Hostinger vía MCP (`https://mcp.hostinger.com`, OAuth en navegador la primera vez) o al hosting acordado.
- Flujo alternativo: comando `/migrate <ruta-o-URL-HTML>` → `05-migrator` analiza HTML → genera `site-spec.json` + documenta APIs en `apis.md` si existen → GATE de aprobación → stamp `meta.approvedAt` → `02-astro-builder` → `03-seo-auditor` → `04-deployer-ejector` (Fase 1 → Fase 2 → Fase 3).

## Herramientas clave

- `.opencode/config/template.json`: repo GitHub + rama de la plantilla Astro versionada. El desarrollador mantiene la rama actualizada; el harness siempre consume la rama indicada.
- `node .opencode/scripts/clone-template.mjs <target-dir>`: clona la plantilla (depth 1), borra `.git` y copia el schema al proyecto. Soporta `--force` para limpiar directorio existente.
- `node .opencode/scripts/validate-spec.mjs <project>/site-spec.json`: valida contra el schema (ajv), imprime resumen con contacto, analytics, aprobación, y bloque "APPROVAL REQUIRED". Detecta drift entre el schema local del proyecto y el del harness.
- `.opencode/schemas/site-spec.schema.json`: guía del contrato de datos; se copia a cada proyecto generado (donde vive el spec real).
- `.opencode/guidelines/seo-gtm-standards.md`: checklist del auditor SEO.
- `.opencode/template-contract.md`: contrato que debe cumplir la plantilla Astro del repo versionado.

## Convenciones

- `site-spec.json` y `site-spec.schema.json` viven en la raíz del proyecto cliente, NUNCA en el harness.
- Los datos del cliente (email, teléfono, analytics IDs, etc.) se almacenan como variables de entorno en el proyecto Astro (`.env`), NUNCA en el harness. El harness solo sirve de guía, instructor y revisor.
- Assets: durante la demo se usan las imágenes dummy/optimizadas (.avif/.webp) de la plantilla; el usuario las reemplaza manualmente. Imágenes de diseño dadas como URL se descargan y localizan en build; contenido externo genuino (embeds) se queda como URL https.
- Dependencias del tooling del harness: `cd .opencode && npm install` (ajv, ajv-formats). Tests: `npm test` valida fixtures contra el schema.
- La plantilla base incluye toggle dark/light y switcher ES/EN; los flags `features.dark_mode` y `features.i18n` del spec deciden si se mantienen o se REMUEVEN en el build (por defecto se remueven si no se piden).
- CMS ligero Fase 2: Keystatic vía skill `keystatic-astro` (patrón dual-file `cms/{name}Keystatic.ts` + `{name}Astro.ts`). Keystatic gestiona contenido (incluido contenido localizado); el routing i18n y el switcher son responsabilidad de Astro.
- El stamp `meta.approvedAt` es obligatorio: el builder no empieza sin él. Lo escribe el architect tras confirmación explícita del usuario en el gate.
- Todos los agentes comunican al usuario en español.
