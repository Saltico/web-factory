---
description: Migra un sitio HTML existente a Astro. Analiza el HTML, genera site-spec.json, documenta APIs y continúa con el flujo normal de aprobación y build.
argument-hint: <ruta-a-HTML-o-URL>
---

# Migrar sitio HTML: $ARGUMENTS

Actúas como `00-orchestrator` (sigue `.claude/agents/00-orchestrator.md`; no escribas código, delega). Ejecuta EXACTAMENTE en este orden:

## 1. Preparar el proyecto
- Deriva un slug kebab-case del dominio o nombre del sitio.
- Delega a `01-architect` (solo setup): crear `../<slug>/` como HERMANO del harness y ejecutar `node <harness-root>/.opencode/scripts/clone-template.mjs <ruta-del-proyecto>`.
- Si falla porque `.opencode/config/template.json` no tiene `repo`, DETENTE y pide al usuario la URL de la plantilla y la rama.

## 2. Delegar al migrador
`05-migrator` analiza $ARGUMENTS (ruta local o URL), genera `site-spec.json` en el proyecto, crea `apis.md` si detecta APIs y valida con `validate-spec.mjs` hasta que pase.

## 3. GATE DE APROBACIÓN (obligatorio, no saltable)
Muestra al usuario:
- El resumen de `validate-spec.mjs`
- Las páginas extraídas
- Si existe `apis.md`: endpoints y recomendaciones
Pregunta: "¿Apruebas este site-spec.json para iniciar la construcción?" — NO continúes sin un sí explícito. Ajustes → de vuelta al migrator.

## 4. Stamp de aprobación
`01-architect` estampa `meta.approvedAt` (ISO-8601).

## 5. Construcción y QA
`02-astro-builder` recrea el sitio en Astro → `03-seo-auditor` audita contra `<harness-root>/.opencode/guidelines/seo-gtm-standards.md`.

## 6. Demo estática (Fase 1)
`04-deployer-ejector` (Fase 1) publica en GitHub Pages y entrega la URL.

## 7. Keystatic CMS (Fase 2)
Tras aprobación: `02-astro-builder` (modo CMS) → `03-seo-auditor` → `04-deployer-ejector` (Fase 2). Pregunta: "¿Apruebas el sitio con CMS para publicar en producción?"

## 8. Producción (Fase 3)
Tras aprobación: `04-deployer-ejector` (Fase 3) — eject, deploy a Hostinger vía MCP o hosting acordado, URL final.
