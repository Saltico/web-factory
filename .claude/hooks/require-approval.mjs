#!/usr/bin/env node
// PreToolUse hook para 02-astro-builder.
// Bloquea Write/Edit/MultiEdit si el site-spec.json del proyecto cliente
// no existe o no tiene meta.approvedAt. Exit 2 = bloquear (stderr vuelve al agente).
import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';

let raw = '';
for await (const chunk of process.stdin) raw += chunk;

let input;
try {
  input = JSON.parse(raw);
} catch {
  process.exit(0); // entrada inesperada: no bloquear
}

const filePath = input?.tool_input?.file_path;
if (!filePath) process.exit(0);

const cwd = input.cwd || process.cwd();
const abs = isAbsolute(filePath) ? filePath : resolve(cwd, filePath);

// Busca el site-spec.json más cercano subiendo desde el archivo.
let dir = dirname(abs);
let specPath = null;
while (true) {
  const candidate = join(dir, 'site-spec.json');
  if (existsSync(candidate)) { specPath = candidate; break; }
  const parent = dirname(dir);
  if (parent === dir) break;
  dir = parent;
}

const block = (msg) => {
  process.stderr.write(`[gate de aprobación] ${msg}\n`);
  process.exit(2);
};

if (!specPath) {
  block(`No se encontró site-spec.json para ${abs}. El builder solo trabaja dentro de un proyecto cliente con spec aprobado.`);
}

let spec;
try {
  spec = JSON.parse(readFileSync(specPath, 'utf8'));
} catch (e) {
  block(`site-spec.json ilegible (${specPath}): ${e.message}`);
}

if (!spec?.meta?.approvedAt) {
  block(`${specPath} no tiene meta.approvedAt. Detente y reporta al orquestador: falta la aprobación explícita del usuario.`);
}

if (abs === specPath) {
  block('El builder no debe modificar site-spec.json (Single Source of Truth del architect).');
}

process.exit(0);
