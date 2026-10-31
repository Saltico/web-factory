import { cpSync, existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const target = process.argv[2];
if (!target) {
  console.error('Error: missing target directory.');
  console.error('Usage: node clone-template.mjs <target-project-dir>');
  process.exit(1);
}

const configPath = resolve(__dirname, '..', 'config', 'template.json');
let config;
try {
  const { readFileSync } = await import('node:fs');
  config = JSON.parse(readFileSync(configPath, 'utf-8'));
} catch (err) {
  console.error(`Error: could not read config at ${configPath}: ${err.message}`);
  process.exit(1);
}

if (!config.repo || config.repo.trim() === '') {
  console.error("Template repo not configured. Set 'repo' in .opencode/config/template.json (the versioned GitHub repo URL) and the branch to consume.");
  process.exit(1);
}

const resolvedTarget = resolve(target);

if (existsSync(resolvedTarget)) {
  const stat = statSync(resolvedTarget);
  if (stat.isDirectory()) {
    const entries = readdirSync(resolvedTarget);
    if (entries.length > 0) {
      console.error('Target directory already exists and is not empty');
      process.exit(1);
    }
  }
}

const branch = config.branch || 'main';
const args = ['clone'];

if (branch) {
  args.push('--branch', branch);
}
if (config.singleBranch) {
  args.push('--single-branch');
}
if (config.depth) {
  args.push('--depth', String(config.depth));
}

args.push(config.repo, resolvedTarget);

console.log(`Cloning template repo: ${config.repo} (branch: ${branch}) -> ${resolvedTarget}`);

const result = spawnSync('git', args, { stdio: 'inherit' });

if (result.status !== 0) {
  console.error(`Error: git clone failed with exit code ${result.status}`);
  process.exit(result.status || 1);
}

const gitDir = join(resolvedTarget, '.git');
if (existsSync(gitDir)) {
  rmSync(gitDir, { recursive: true, force: true });
}

const schemaSrc = resolve(__dirname, '..', 'schemas', 'site-spec.schema.json');
const schemaDst = join(resolvedTarget, 'site-spec.schema.json');
if (existsSync(schemaSrc)) {
  cpSync(schemaSrc, schemaDst);
  console.log('Copied site-spec.schema.json into the project.');
} else {
  console.warn('Warning: harness schema not found at', schemaSrc, '- skipping schema copy.');
}

console.log('');
console.log('=== CLONE SUCCESSFUL ===');
console.log(`  Repo:   ${config.repo}`);
console.log(`  Branch: ${branch}`);
console.log(`  Target: ${resolvedTarget}`);
console.log('  Note:   site-spec.schema.json was copied into the project root.');
