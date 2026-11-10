---
description: Inicia un nuevo proyecto web para un cliente. Extrae requerimientos, genera site-spec.json en el proyecto, lo valida y exige aprobación explícita antes de construir.
argument-hint: <descripción del negocio>
---

# Nuevo cliente: $ARGUMENTS

Actúas como `00-orchestrator` (si la sesión no se inició con `claude --agent 00-orchestrator`, sigue igualmente sus reglas en `.claude/agents/00-orchestrator.md` y NO escribas código tú: delega). Ejecuta el flujo EXACTAMENTE en este orden:

## 1. Intake de requerimientos
Analiza $ARGUMENTS contra el checklist obligatorio:
- Nombre del negocio/cliente y rubro
- Dominio (si existe)
- Páginas requeridas (rutas)
- Colores de marca (hex) y tipografías
- Redes sociales (RRSS) con URLs
- Tono de voz
- GTM ID / GA4 ID (si aplica)
- Formulario de contacto y canales (email, teléfono, WhatsApp, mapa)
- Datos de contacto reales: email, teléfono, dirección, URL embed de Google Maps
- Dark mode, i18n (idiomas)
- Integraciones externas (mapas, Calendly, embeds)

Si falta información, entrevista TÚ al usuario con AskUserQuestion, solo sobre los campos faltantes, en una ronda concisa. No preguntes lo que el prompt ya responde.

## 2. Setup del proyecto y generación del spec
Delega a `01-architect` (pasándole rutas absolutas y las respuestas del intake):
- Crear `../<slug>/` como HERMANO del harness.
- `node <harness-root>/.opencode/scripts/clone-template.mjs <ruta-del-proyecto>`
- Si el clone falla porque `.opencode/config/template.json` no tiene `repo`, DETENTE y pide al usuario la URL del repo de plantilla y la rama.
- Generar `site-spec.json` en la raíz del proyecto y validarlo con `validate-spec.mjs` hasta que pase.

## 3. GATE DE APROBACIÓN (obligatorio, no saltable)
- Muestra el resumen de `validate-spec.mjs`.
- Pregunta: "¿Apruebas este site-spec.json?"
- NO continúes sin un sí explícito. Si hay cambios, vuelve al architect, revalida y presenta de nuevo.

## 4. Stamp de aprobación
Delega a `01-architect` el stamp de `meta.approvedAt` (ISO-8601).

## 5. Construcción y QA
- `02-astro-builder` implementa el sitio.
- `03-seo-auditor` audita contra `<harness-root>/.opencode/guidelines/seo-gtm-standards.md`.

## 6. Demo estática (Fase 1)
`04-deployer-ejector` (Fase 1) publica en GitHub Pages; entrega la URL al usuario.

## 7. Keystatic CMS (Fase 2)
Tras aprobación de la demo: `02-astro-builder` (modo CMS) → `03-seo-auditor` → `04-deployer-ejector` (Fase 2). Pregunta: "¿Apruebas el sitio con CMS para publicar en producción?"

## 8. Producción (Fase 3)
Tras aprobación del CMS: `04-deployer-ejector` (Fase 3) hace eject, despliega a Hostinger vía MCP o al hosting acordado y entrega la URL final.
