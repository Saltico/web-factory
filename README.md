# web-factory

Workspace del harness Astro Web Factory. Genera sitios web estáticos Astro para clientes mediante un pipeline de agentes OpenCode.

## Quickstart

1. **Instalar dependencias del harness:**
   ```bash
   cd .opencode && npm install
   ```

2. **Configurar la plantilla Astro:**
   Edita `.opencode/config/template.json` y define el repo de la plantilla:
   ```json
   {
     "repo": "https://github.com/usuario/astro-template",
     "branch": "main"
   }
   ```
   La plantilla debe cumplir el [contrato de plantilla](.opencode/template-contract.md).

3. **Crear un nuevo proyecto:**
   ```
   /new-client <descripción del negocio>
   ```
   El orquestador guiará el flujo completo: intake, spec, aprobación, build, QA, demo y producción.

4. **Migrar un sitio HTML existente:**
   ```
   /migrate <ruta-a-HTML-o-URL>
   ```

## Fases del pipeline

| Fase | Artifact | Descripción |
|------|----------|-------------|
| 1 | Demo estática (GitHub Pages) | Intake → spec → aprobación → build → QA → deploy a GH Pages |
| 2 | Demo con CMS (Keystatic) | Añadir Keystatic → rebuild → QA → redeploy a GH Pages → aprobación |
| 3 | Producción (Hostinger) | Eject de rastros del harness → deploy a Hostinger o hosting acordado |

## Agentes

| Agente | Rol |
|--------|-----|
| `00-orchestrator` | Coordina el pipeline, nunca escribe código |
| `01-architect` | Entrevista al cliente, crea el proyecto, clona plantilla, genera `site-spec.json` |
| `02-astro-builder` | Construye el sitio Astro desde el spec |
| `03-seo-auditor` | Auditoría SEO y accesibilidad |
| `04-deployer-ejector` | Deploy a GH Pages y Hostinger, eject de rastros |
| `05-migrator` | Migración HTML → Astro |

## Herramientas

- `node .opencode/scripts/clone-template.mjs <dir> [--force]` — clona la plantilla
- `node .opencode/scripts/validate-spec.mjs <spec.json>` — valida el spec contra el schema
- `npm test` (en `.opencode/`) — tests de fixtures

## Convenciones clave

- El harness es **read-only** para los subagentes; todo output va al proyecto cliente.
- Los datos del cliente (emails, teléfonos, analytics) se guardan como `.env` en el proyecto, nunca en el harness.
- La aprobación del spec es un gate **obligatorio** con stamp `meta.approvedAt`.
- La comunicación al usuario es siempre en **español**.

## Docs adicionales

- [AGENTS.md](./AGENTS.md) — resumen ejecutivo del pipeline
- [SEO & GTM Standards](.opencode/guidelines/seo-gtm-standards.md) — checklist de auditoría
- [Template Contract](.opencode/template-contract.md) — requisitos de la plantilla Astro
- [Site Spec Schema](.opencode/schemas/site-spec.schema.json) — contrato de datos
