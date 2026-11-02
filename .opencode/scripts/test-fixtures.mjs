import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const validateScript = resolve(__dirname, 'validate-spec.mjs');
const fixturesDir = resolve(__dirname, 'fixtures');

let passed = 0;
let failed = 0;

function runTest(name, fixture, expectValid) {
  const fixturePath = resolve(fixturesDir, fixture);
  const result = spawnSync('node', [validateScript, fixturePath], { encoding: 'utf-8' });
  const isValid = result.status === 0;

  if (isValid === expectValid) {
    console.log(`✅ ${name}: ${fixture} — ${expectValid ? 'valid (expected)' : 'invalid (expected)'}`);
    passed++;
  } else {
    console.error(`❌ ${name}: ${fixture} — got ${isValid ? 'valid' : 'invalid'}, expected ${expectValid ? 'valid' : 'invalid'}`);
    if (result.stderr) console.error(result.stderr);
    failed++;
  }
}

console.log('Running fixture tests...\n');

runTest('Valid fixture', 'sample-valid.json', true);
runTest('Invalid fixture', 'sample-invalid.json', false);

console.log(`\n${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}

console.log('\n✅ All fixture tests passed.');
