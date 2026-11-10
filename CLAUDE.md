@AGENTS.md

## Claude Code

Este harness funciona tanto en OpenCode (`.opencode/`) como en Claude Code (`.claude/`). Las reglas del pipeline viven en `AGENTS.md` (fuente única) y se importan arriba.

- Arranque recomendado: `claude --agent 00-orchestrator` desde esta carpeta, luego `/new-client <descripción>` o `/migrate <ruta-o-URL>`.
- Scripts, schema, guidelines y skills son compartidos y viven en `.opencode/` (no se duplican):
  - Scripts: `node .opencode/scripts/clone-template.mjs`, `node .opencode/scripts/validate-spec.mjs`
  - Skills: los agentes leen `.opencode/skills/<nombre>/SKILL.md` directamente (rutas de referencias relativas a esa carpeta).
- En Claude Code los subagentes NO pueden hablar con el usuario ni lanzar otros subagentes: toda entrevista (grill-me) y todo gate de aprobación los hace el orquestador (hilo principal) con AskUserQuestion.
- El gate de aprobación está reforzado por un hook (`.claude/hooks/require-approval.mjs`): `02-astro-builder` no puede escribir archivos si `site-spec.json` no tiene `meta.approvedAt`.
- Los proyectos cliente son carpetas hermanas (`../<slug>/`); `.claude/settings.json` concede acceso a `../`.
- Si cambias el prompt de un agente, actualiza su par en `.opencode/agents/` (ver `docs/claude-code.md`).
