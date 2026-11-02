---
description: Migra un sitio HTML existente al framework Astro. Analiza el HTML, extrae estructura y diseño, genera site-spec.json, documenta APIs si existen, y continúa con el flujo normal de aprobación y build. Uso: /migrate <ruta-a-HTML-o-URL>
agent: 00-orchestrator
---

# Migrar sitio HTML: $ARGUMENTS

Ejecuta el flujo de migración de un sitio HTML existente siguiendo EXACTAMENTE este orden:

## 1. Preparar el proyecto
- Deriva un slug del dominio o nombre del sitio (kebab-case).
- Crea el directorio del proyecto como HERMANO del harness: `../<slug>/`.
- Ejecuta: `node .opencode/scripts/clone-template.mjs <ruta-del-proyecto>`
- Si el clone falla porque `.opencode/config/template.json` no tiene `repo`, DETENTE y pide al usuario la URL del repositorio de plantilla y la rama a consumir.

## 2. Delegar al migrador
- Delega a `05-migrator` el análisis del HTML proporcionado en `$ARGUMENTS` (ruta local o URL).
- El migrador extraerá estructura, diseño, datos de contacto, generará `site-spec.json` dentro del proyecto, y creará `apis.md` si detecta llamadas a APIs.

## 3. Validación
- El migrador valida con: `node <harness-root>/.opencode/scripts/validate-spec.mjs <proyecto>/site-spec.json`
- Si hay errores, el migrador corrige y revalida.

## 4. GATE DE APROBACIÓN (obligatorio, no saltable)
- Muestra al usuario:
  - El resumen de validación impreso por `validate-spec.mjs`
  - Una lista de páginas extraídas del HTML original
  - Si existe `apis.md`: resumen de endpoints detectados y recomendaciones
- Pregunta explícitamente: "¿Apruebas este site-spec.json para iniciar la construcción?"
- NO continúes hasta respuesta afirmativa explícita. Si el usuario pide ajustes, delega de vuelta al migrator para actualizar el spec.

## 5. Stamp de aprobación
- Tras aprobación explícita, delega a `01-architect` para estampar `meta.approvedAt` con el timestamp ISO-8601 actual en el spec.

## 6. Construcción y QA
- Solo tras el stamp: delega a `02-astro-builder` para implementar el sitio dentro del proyecto usando el spec (el builder recreará el diseño original en Astro).
- Luego delega a `03-seo-auditor` para la auditoría contra `<harness-root>/.opencode/guidelines/seo-gtm-standards.md`.

## 7. Demo estática (Fase 1)
- Delega a `04-deployer-ejector` (Fase 1) para publicar la demo estática en GitHub Pages y entregar la URL pública al usuario como promesa de negocio.

## 8. Keystatic CMS (Fase 2)
- Tras aprobación del demo estática, delega a `02-astro-builder` (modo CMS) para añadir colecciones editables con Keystatic.
- Delega a `03-seo-auditor` para auditar el build con CMS.
- Delega a `04-deployer-ejector` (Fase 2) para redeployar a GitHub Pages con CMS habilitado.
- Pregunta al usuario: "¿Apruebas el sitio con CMS para publicar en producción?"

## 9. Producción (Fase 3)
- Tras aprobación del CMS, delega a `04-deployer-ejector` (Fase 3) para:
  - Limpiar rastros del harness (eject).
  - Desplegar a Hostinger vía MCP o al hosting acordado.
  - Entregar la URL de producción final al usuario.
