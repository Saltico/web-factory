# Harness dual: OpenCode + Claude Code

El mismo pipeline corre en dos herramientas, cada una con su propia suscripción:

| | OpenCode | Claude Code |
|---|---|---|
| Arranque | `opencode` (agente por defecto `00-orchestrator`) | `claude --agent 00-orchestrator` |
| Agentes | `.opencode/agents/` | `.claude/agents/` |
| Comandos | `.opencode/command/` | `.claude/commands/` |
| MCP Hostinger | `opencode.json` | `.mcp.json` (autorizar con `/mcp`) |
| Reglas | `AGENTS.md` | `CLAUDE.md` → importa `AGENTS.md` |

**Compartido (una sola copia):** `AGENTS.md`, `.opencode/scripts/`, `.opencode/schemas/`, `.opencode/guidelines/`, `.opencode/skills/`, `.opencode/config/template.json`, `.opencode/template-contract.md`.

**Duplicado (mantener en sincronía):** los prompts de los 6 agentes y los 2 comandos. Si cambias uno, actualiza su par.

## Diferencias de Claude Code

- El orquestador es el hilo principal: los subagentes no pueden hablar con el usuario ni lanzar otros subagentes. Por eso el intake (antes `grill-me` dentro del architect) lo hace el orquestador con AskUserQuestion.
- En `/migrate` el setup del proyecto lo hace `01-architect` (el orquestador no tiene Bash).
- Gate reforzado por código: hook `PreToolUse` en `02-astro-builder` → `.claude/hooks/require-approval.mjs` bloquea escrituras si falta `meta.approvedAt` (o si intenta editar `site-spec.json`). Requiere `node` en el PATH. No cubre archivos escritos vía Bash.
- Modelos: orchestrator y migrator `opus`; architect, builder y deployer `sonnet`; seo-auditor `haiku`.
- Eject (Fase 3) también elimina `.claude/` y `CLAUDE.md` del proyecto cliente.

## Cómo repartir el uso entre ambas suscripciones

El estado del pipeline vive en archivos (`site-spec.json`, `meta.approvedAt`, historial git del proyecto cliente), no en la conversación. Eso permite cambiar de herramienta entre fases sin perder nada.

Reglas:

1. **Una herramienta por proyecto a la vez.** Nunca dos agentes escribiendo en el mismo proyecto cliente simultáneamente.
2. **Cambia de herramienta solo en los límites de fase** (spec aprobado, demo publicada, CMS publicado). Cada fase termina con un commit `fase-N: ...` que sirve de handoff.
3. **Asigna por tipo de trabajo:**
   - Claude Code: intake + spec, migraciones, primer build de un sitio nuevo, revisión de diseño con `impeccable`, bugs difíciles.
   - OpenCode: iteraciones por cambios del cliente, Fase 2 (colecciones Keystatic siguiendo la skill), auditoría SEO, deploys.
4. **Cuando una ventana de uso se agota**, termina o commitea la fase en curso y sigue en la otra herramienta con `/new-client` → retoma desde el estado del proyecto (pídele al orquestador que lea `site-spec.json` y `git log` del proyecto).
5. Puedes trabajar **dos clientes en paralelo**, uno en cada herramienta.

No conectes la suscripción de Claude a OpenCode: Anthropic no permite usar suscripciones Pro/Max en herramientas de terceros; en OpenCode solo funcionaría con API key (pago por token, aparte de la suscripción).
