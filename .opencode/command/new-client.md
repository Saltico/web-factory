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
- Dark mode, i18n (idiomas)
- Integraciones externas (mapas, Calendly, embeds)

Si el prompt no cubre todo lo obligatorio, realiza una entrevista con la skill `grill-me` enfocada SOLO en los campos faltantes (una ronda de preguntas, concisa). No preguntes lo que el prompt ya responde.

## 2. Crear el proyecto y clonar la plantilla
- Crea el directorio del proyecto como HERMANO del harness (mismo workspace), con nombre derivado del dominio o nombre del cliente en kebab-case (ej. `../acme-studio/`).
- Ejecuta: `node .opencode/scripts/clone-template.mjs <ruta-del-proyecto>`
- Si el clone falla porque `.opencode/config/template.json` no tiene `repo`, DETENTE y pide al usuario la URL del repositorio de plantilla y la rama a consumir.

## 3. Generar y validar site-spec.json
- Delega al agente `01-architect` la generación de `site-spec.json` en la RAÍZ del proyecto creado (nunca en el harness), conforme al schema `site-spec.schema.json` que el clone copió al proyecto.
- El architect debe validar con: `node <harness>/.opencode/scripts/validate-spec.mjs <proyecto>/site-spec.json` y corregir hasta que pase.

## 4. GATE DE APROBACIÓN (obligatorio, no saltable)
- Muestra al usuario el resumen impreso por validate-spec.mjs.
- Pregunta explícitamente: "¿Apruebas este site-spec.json?"
- NO continúes hasta respuesta afirmativa explícita. Si el usuario pide cambios, actualiza el spec, revalida y vuelve a presentar el resumen.

## 5. Construcción y QA
- Solo tras aprobación: delega a `02-astro-builder` para implementar el sitio dentro del proyecto usando el spec.
- Luego delega a `03-seo-auditor` para la auditoría contra `.opencode/guidelines/seo-gtm-standards.md`.

## 6. Demo (Fase 1)
- Delega a `04-deployer-ejector` (Fase 1) para publicar la demo en GitHub Pages y entregar la URL pública al usuario como promesa de negocio.
