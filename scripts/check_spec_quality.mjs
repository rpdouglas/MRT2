// Enforces the governance skill's "Check F — Spec File Quality" as a CI gate,
// so a missing template section is caught on push instead of only when
// someone remembers to run the `governance` skill by hand.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const PROJECTS_DIR = join(process.cwd(), 'docs', 'projects');
const EXEMPT_FILES = new Set(['00_TEMPLATE.md']);

// Field markers are matched loosely (bold optional, plural/qualifier-tolerant)
// because real specs in this repo vary in exact formatting — the governance
// skill treats these as equivalent, so the CI gate should too.
const REQUIRED_CHECKS = [
  { label: 'Status field', pattern: /status\s*:/i },
  { label: 'Primary Persona / Personas Involved field', pattern: /personas?\b.{0,20}:/i },
  { label: 'Objective field', pattern: /objective\s*:/i },
  { label: 'Implementation section (Phase 1, Schema, Architecture, or Implementation)', pattern: /phase 1|schema|architecture|implementation/i },
  { label: 'QA / Verification section', pattern: /qa|verification/i },
];

function getSpecFiles() {
  return readdirSync(PROJECTS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
    .filter((name) => !EXEMPT_FILES.has(name));
}

function checkSpec(filename) {
  const content = readFileSync(join(PROJECTS_DIR, filename), 'utf-8');
  return REQUIRED_CHECKS.filter((check) => !check.pattern.test(content)).map((check) => check.label);
}

function main() {
  const specFiles = getSpecFiles();
  const failures = [];

  for (const filename of specFiles) {
    const missing = checkSpec(filename);
    if (missing.length > 0) {
      failures.push({ filename, missing });
    }
  }

  if (failures.length === 0) {
    console.log(`docs:check-specs — ${specFiles.length} spec file(s) checked, all pass.`);
    process.exit(0);
  }

  console.error(`docs:check-specs — ${failures.length} of ${specFiles.length} spec file(s) missing required sections:\n`);
  for (const { filename, missing } of failures) {
    console.error(`  docs/projects/${filename}`);
    for (const label of missing) {
      console.error(`    - missing: ${label}`);
    }
  }
  console.error('\nSee docs/projects/00_TEMPLATE.md for the required structure.');
  process.exit(1);
}

main();
