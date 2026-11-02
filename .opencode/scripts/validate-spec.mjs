import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const specPath = process.argv[2];
if (!specPath) {
  console.error('Error: missing path to site-spec.json.');
  console.error('Usage: node validate-spec.mjs <site-spec.json> [site-spec.schema.json]');
  process.exit(1);
}

const resolvedSpec = resolve(specPath);
const specDir = dirname(resolvedSpec);

const harnessSchemaPath = resolve(__dirname, '..', 'schemas', 'site-spec.schema.json');

let schemaPath;
let schemaDriftWarning = false;
if (process.argv[3]) {
  schemaPath = resolve(process.argv[3]);
} else {
  const localSchema = join(specDir, 'site-spec.schema.json');
  if (existsSync(localSchema)) {
    schemaPath = localSchema;
    if (existsSync(harnessSchemaPath)) {
      const localHash = createHash('sha256').update(readFileSync(localSchema)).digest('hex');
      const harnessHash = createHash('sha256').update(readFileSync(harnessSchemaPath)).digest('hex');
      if (localHash !== harnessHash) {
        schemaDriftWarning = true;
      }
    }
  } else {
    schemaPath = harnessSchemaPath;
  }
}

let spec;
try {
  spec = JSON.parse(readFileSync(resolvedSpec, 'utf-8'));
} catch (err) {
  console.error(`Error: could not parse site-spec.json at ${resolvedSpec}: ${err.message}`);
  process.exit(1);
}

let schema;
try {
  schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
} catch (err) {
  console.error(`Error: could not parse schema at ${schemaPath}: ${err.message}`);
  process.exit(1);
}

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const validate = ajv.compile(schema);
const valid = validate(spec);

if (!valid) {
  console.error('❌ site-spec.json is INVALID against the schema:');
  for (const err of validate.errors) {
    const path = err.instancePath || '/';
    console.error(`  - ${path} ${err.message}`);
  }
  process.exit(1);
}

console.log('✅ site-spec.json is structurally valid.');
console.log('');

const meta = spec.meta || {};
const site = spec.site || {};
const brand = spec.brand || {};
const colors = brand.colors || {};
const features = spec.features || {};
const pages = spec.pages || [];
const social = site.social || {};
const contact = site.contact || {};

const routes = pages.map(p => p.route).filter(Boolean);
const socialEntries = Object.entries(social).filter(([, v]) => v);
const socialStr = socialEntries.length > 0
  ? socialEntries.map(([k, v]) => `${k}=${v}`).join(', ')
  : '(none)';

const contactEntries = Object.entries(contact).filter(([, v]) => v);
const contactStr = contactEntries.length > 0
  ? contactEntries.map(([k, v]) => `${k}=${v}`).join(', ')
  : '(none)';

const i18n = features.i18n;
const i18nStr = i18n?.enabled
  ? (i18n.locales || []).join(', ')
  : 'no';

const approvedStr = meta.approvedAt ? meta.approvedAt : '(not approved yet)';

console.log('=== SITE SPEC SUMMARY ===');
console.log(`Client:        ${meta.clientName || '(not set)'}`);
console.log(`Domain:        ${site.domain || '(not set)'}`);
console.log(`Language:      ${site.language || 'es'}`);
console.log(`Pages:         ${routes.join(', ')}  (count: ${routes.length})`);
console.log(`Brand colors:  primary=${colors.primary || '(none)'} secondary=${colors.secondary || '(none)'} accent=${colors.accent || '(none)'} bg=${colors.background || '(none)'} text=${colors.text || '(none)'}`);
console.log(`Social:        ${socialStr}`);
console.log(`Contact:       ${contactStr}`);
console.log(`GTM:           ${features.gtm_id || '(none)'}`);
console.log(`GA4:           ${features.ga4_id || '(none)'}`);
console.log(`Contact form:  ${features.has_contact_form ? 'yes' : 'no'}`);
console.log(`Dark mode:     ${features.dark_mode ? 'yes' : 'no'}`);
console.log(`i18n:          ${i18nStr}`);
console.log(`Approved at:   ${approvedStr}`);
console.log('=========================');
console.log('');

if (schemaDriftWarning) {
  console.log('⚠️  WARNING: The local schema copy in the project differs from the harness schema.');
  console.log('   The harness schema may have been updated. Consider re-validating against the latest harness schema.');
  console.log(`   Local:   ${join(specDir, 'site-spec.schema.json')}`);
  console.log(`   Harness: ${harnessSchemaPath}`);
  console.log('');
}

console.log('=== APPROVAL REQUIRED ===');
console.log('Present the summary above to the user and ask: "¿Apruebas este site-spec.json?"');
console.log('Do NOT start the build until the user explicitly approves (says yes).');
console.log('After approval, stamp meta.approvedAt with the current ISO-8601 timestamp.');
console.log('This gate is mandatory and cannot be skipped.');

process.exit(0);
