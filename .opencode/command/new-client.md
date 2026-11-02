---
description: Inicia un nuevo proyecto web para un cliente. Extrae requerimientos, genera site-spec.json en el proyecto, lo valida y exige aprobación explícita del usuario antes de construir. Uso: /new-client <descripción del negocio>
agent: 00-orchestrator
---

# Nuevo cliente: $ARGUMENTS

Ejecuta el flujo completo de creación de un nuevo proyecto web siguiendo EXACTAMENTE este orden:

## 1. Intake de requerimientos
Analiza el prompt de negocio entregado ($ARGUMENTS). Determina qué información falta respecto al checklist obligatorio:
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

Si el prompt no cubre todo lo obligatorio, delega en `01-architect` la entrevista con la skill `grill-me` enfocada SOLO en los campos faltantes (una ronda de preguntas, concisa). No preguntes lo que el prompt ya responde.

## 2. Setup del proyecto y generación del spec
- Delega a `01-architect`:
  - Crear el directorio del proyecto como HERMANO del harness (mismo workspace), con nombre derivado del dominio o nombre del cliente en kebab-case (ej. `../acme-studio/`).
  - Ejecutar: `node <harness-root>/.opencode/scripts/clone-template.mjs <ruta-del-proyecto>`
  - Si el clone falla porque `.opencode/config/template.json` no tiene `repo`, DETENTE y pide al usuario la URL del repositorio de plantilla y la rama a consumir.
  - Generar `site-spec.json` en la RAÍZ del proyecto creado (nunca en el harness), conforme al schema `site-spec.schema.json` que el clone copió al proyecto.
  - Validar con: `node <harness-root>/.opencode/scripts/validate-spec.mjs <proyecto>/site-spec.json` y corregir hasta que pase.

## 3. GATE DE APROBACIÓN (obligatorio, no saltable)
- Muestra al usuario el resumen impreso por validate-spec.mjs.
- Pregunta explícitamente: "¿Apruebas este site-spec.json?"
- NO continúes hasta respuesta afirmativa explícita. Si el usuario pide cambios, delega al architect para actualizar el spec, revalida y vuelve a presentar el resumen.

## 4. Stamp de aprobación
- Tras aprobación explícita, delega a `01-architect` para estampar `meta.approvedAt` con el timestamp ISO-8601 actual en el spec.

## 5. Construcción y QA
- Solo tras el stamp: delega a `02-astro-builder` para implementar el sitio dentro del proyecto usando el spec.
- Luego delega a `03-seo-auditor` para la auditoría contra `<harness-root>/.opencode/guidelines/seo-gtm-standards.md`.

## 6. Demo estática (Fase 1)
- Delega a `04-deployer-ejector` (Fase 1) para publicar la demo estática en GitHub Pages y entregar la URL pública al usuario como promesa de negocio.

## 7. Keystatic CMS (Fase 2)
- Tras aprobación del demo estática, delega a `02-astro-builder` (modo CMS) para añadir colecciones editables con Keystatic.
- Delega a `03-seo-auditor` para auditar el build con CMS.
- Delega a `04-deployer-ejector` (Fase 2) para redeployar a GitHub Pages con CMS habilitado.
- Pregunta al usuario: "¿Apruebas el sitio con CMS para publicar en producción?"

## 8. Producción (Fase 3)
- Tras aprobación del CMS, delega a `04-deployer-ejector` (Fase 3) para:
  - Limpiar rastros del harness (eject).
  - Desplegar a Hostinger vía MCP o al hosting acordado.
  - Entregar la URL de producción final al usuario.
